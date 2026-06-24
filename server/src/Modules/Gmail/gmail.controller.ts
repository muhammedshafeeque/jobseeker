import { Request, Response, NextFunction } from 'express'
import { google, gmail_v1 } from 'googleapis'
import { GmailToken } from './gmail.schema'
import {
  classifyEmail,
  isJobRelated,
  matchJob,
  shouldAdvanceStatus,
  ParsedEmail,
} from './gmail.parser'
import { JobApplication } from '../JobApplications/jobApplication.schema'
import { getIO } from '../../Config/socket'
import type { ApplicationStatus } from '../JobApplications/jobApplication.schema'

const getOAuth2Client = () =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )

const header = (headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string) =>
  headers?.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''

const INBOX_QUERY = [
  'newer_than:30d',
  '(',
  'subject:(interview OR invitation OR invite OR "phone screen" OR assessment OR "coding test" OR "code challenge" OR offer OR shortlisted OR "application received" OR "next steps" OR recruiter OR hiring OR schedule OR hackerrank OR codility OR "take-home")',
  'OR from:(greenhouse.io OR lever.co OR workday.com OR icims.com OR smartrecruiters.com OR ashbyhq.com OR recruitee.com OR jobvite.com OR workable.com)',
  ')',
  '-from:linkedin.com',
  '-subject:("jobs you may like" OR "recommended jobs" OR "job alert")',
].join(' ')

async function bindGmailClient(tokenDoc: InstanceType<typeof GmailToken>) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({
    access_token: tokenDoc.accessToken,
    refresh_token: tokenDoc.refreshToken ?? undefined,
    expiry_date: tokenDoc.expiryDate ?? undefined,
  })

  oauth2Client.on('tokens', async tokens => {
    const update: Record<string, unknown> = {}
    if (tokens.access_token) update.accessToken = tokens.access_token
    if (tokens.expiry_date) update.expiryDate = tokens.expiry_date
    if (tokens.refresh_token) update.refreshToken = tokens.refresh_token
    if (Object.keys(update).length) await GmailToken.updateOne({ _id: tokenDoc._id }, update)
  })

  if (tokenDoc.expiryDate && tokenDoc.expiryDate < Date.now() + 60_000) {
    await oauth2Client.getAccessToken()
  }

  return { oauth2Client, gmail: google.gmail({ version: 'v1', auth: oauth2Client }) }
}

async function fetchMessage(gmail: gmail_v1.Gmail, messageId: string): Promise<ParsedEmail | null> {
  const { data } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'metadata',
    metadataHeaders: ['From', 'Subject', 'Date'],
  })

  const received = header(data.payload?.headers, 'Date')
  return classifyEmail({
    messageId: data.id!,
    threadId: data.threadId!,
    from: header(data.payload?.headers, 'From'),
    subject: header(data.payload?.headers, 'Subject'),
    snippet: data.snippet ?? '',
    receivedAt: received ? new Date(received) : new Date(Number(data.internalDate ?? Date.now())),
  })
}

async function listInboxMessages(gmail: gmail_v1.Gmail, query: string, maxResults = 50) {
  const ids: string[] = []
  let pageToken: string | undefined

  do {
    const { data } = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: Math.min(maxResults - ids.length, 50),
      pageToken,
    })
    for (const m of data.messages ?? []) {
      if (m.id) ids.push(m.id)
    }
    pageToken = data.nextPageToken ?? undefined
  } while (pageToken && ids.length < maxResults)

  return ids
}

function applyStatusUpdate(
  app: InstanceType<typeof JobApplication>,
  status: ApplicationStatus,
  note: string,
  nextStep?: string,
) {
  if (!shouldAdvanceStatus(app.status as ApplicationStatus, status)) return false
  app.status = status
  app.statusHistory.push({ status, note, changedAt: new Date() } as any)
  if (status === 'applied' && !app.appliedAt) app.appliedAt = new Date()
  if (nextStep) app.nextStep = nextStep
  return true
}

export class GmailController {
  static authUrl(_req: Request, res: Response) {
    const oauth2Client = getOAuth2Client()
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      prompt: 'consent',
    })
    res.json({ url })
  }

  static async callback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.query as { code: string }
      const oauth2Client = getOAuth2Client()
      const { tokens } = await oauth2Client.getToken(code)
      oauth2Client.setCredentials(tokens)

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
      const profile = await gmail.users.getProfile({ userId: 'me' })
      const email = profile.data.emailAddress!

      await GmailToken.findOneAndUpdate(
        { email },
        {
          email,
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
        },
        { upsert: true, new: true },
      )

      res.redirect(`${process.env.FRONTEND_URL}/settings?gmail=connected&email=${email}`)
    } catch (e) {
      next(e)
    }
  }

  static async status(_req: Request, res: Response, next: NextFunction) {
    try {
      const token = await GmailToken.findOne()
      res.json({
        connected: !!token,
        email: token?.email ?? null,
        lastSyncAt: token?.lastSyncAt ?? null,
      })
    } catch (e) {
      next(e)
    }
  }

  static async disconnect(_req: Request, res: Response, next: NextFunction) {
    try {
      await GmailToken.deleteMany({})
      res.json({ message: 'Gmail disconnected' })
    } catch (e) {
      next(e)
    }
  }

  static async sync(_req: Request, res: Response, next: NextFunction) {
    try {
      const tokenDoc = await GmailToken.findOne()
      if (!tokenDoc) throw { status: 400, message: 'Gmail not connected' }

      const { gmail } = await bindGmailClient(tokenDoc)
      const processed = new Set(tokenDoc.processedMessageIds ?? [])
      const apps = await JobApplication.find({
        status: { $nin: ['withdrawn', 'accepted'] },
      })

      const messageIds = new Set<string>()
      const inboxIds = await listInboxMessages(gmail, INBOX_QUERY, 60)
      inboxIds.forEach(id => messageIds.add(id))

      for (const app of apps) {
        const company = app.company.replace(/"/g, '')
        const role = app.role.replace(/"/g, '')
        const query = `newer_than:60d (from:${company.split(/\s+/)[0]} OR subject:"${role}" OR subject:"${company}")`
        const related = await listInboxMessages(gmail, query, 15)
        related.forEach(id => messageIds.add(id))
      }

      let statusUpdates = 0
      let invitesFound = 0
      let newApplications = 0
      const detected: Array<{ company: string; subject: string; status: string; matched: boolean }> = []

      for (const messageId of messageIds) {
        if (processed.has(messageId)) continue

        const email = await fetchMessage(gmail, messageId)
        if (!email || !isJobRelated(email)) {
          processed.add(messageId)
          continue
        }

        invitesFound++
        const matched = matchJob(apps, email)
        const note = `Gmail: ${email.inviteType} — ${email.subject}`

        if (matched) {
          const app = apps.find(a => String(a._id) === String(matched._id))!
          if (!app.gmailThreadIds.includes(email.threadId)) {
            app.gmailThreadIds.push(email.threadId)
          }

          const status = email.suggestedStatus!
          if (applyStatusUpdate(app, status, note, email.nextStep)) statusUpdates++

          await app.save()
          getIO().emit('job:updated', app)
          detected.push({
            company: app.company,
            subject: email.subject,
            status: app.status,
            matched: true,
          })
        } else if (email.inviteType !== 'rejection') {
          const company = email.companyGuess || email.fromName || 'Unknown Company'
          const role = email.roleGuess || 'Role from email'
          const status: ApplicationStatus =
            email.inviteType === 'application_update' ? 'applied' : 'responded'

          const created = await JobApplication.create({
            company,
            role,
            jd: `Auto-detected from Gmail inbox.\n\nSubject: ${email.subject}\nFrom: ${email.from}\nDate: ${email.receivedAt.toISOString()}\n\n${email.snippet}`,
            status,
            statusHistory: [{ status, note, changedAt: new Date() }],
            gmailThreadIds: [email.threadId],
            notes: email.subject,
            nextStep: email.nextStep,
            appliedAt: status === 'applied' ? email.receivedAt : undefined,
          })

          apps.push(created)
          newApplications++
          getIO().emit('job:created', created)
          detected.push({ company, subject: email.subject, status, matched: false })
        }

        processed.add(messageId)
      }

      await GmailToken.findOneAndUpdate(
        { _id: tokenDoc._id },
        {
          processedMessageIds: [...processed].slice(-5000),
          lastSyncAt: new Date(),
        },
      )

      res.json({
        scanned: messageIds.size,
        invitesFound,
        statusUpdates,
        newApplications,
        detected,
      })
    } catch (e) {
      next(e)
    }
  }
}
