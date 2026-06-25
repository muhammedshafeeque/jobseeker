import { Request, Response, NextFunction } from 'express'
import { XMLParser } from 'fast-xml-parser'
import { google } from 'googleapis'
import { JobAlert } from './jobAlert.schema'
import { UserPreferences } from './userPreferences.schema'
import { GmailToken } from '../Gmail/gmail.schema'
import { JobApplication } from '../JobApplications/jobApplication.schema'
import {
  parsePortalDigestEmail,
  parseSalaryFromText,
  extractExperience,
  stripHtml,
  reparseAlertFields,
} from './jobAlert.parser'

// ── Indeed RSS ─────────────────────────────────────────────────────────────

const xmlParser = new XMLParser({ ignoreAttributes: false })

interface IndeedItem {
  title: string
  link: string
  description?: string
  pubDate?: string
  source?: string | { '#text': string }
}

function parseSalaryINR(text: string): { min?: number; max?: number } {
  return parseSalaryFromText(text)
}

// stripHtml imported from jobAlert.parser

function decodeBase64url(data: string): string {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function extractEmailContent(payload: any): { text: string; html: string } {
  if (!payload) return { text: '', html: '' }

  // Simple non-multipart — body data sits directly on payload
  if (payload.body?.data) {
    const raw = decodeBase64url(payload.body.data)
    if (payload.mimeType === 'text/html') return { text: stripHtml(raw), html: raw }
    return { text: raw, html: '' }
  }

  // Multipart — walk the parts tree collecting text/plain and text/html
  if (Array.isArray(payload.parts)) {
    let text = ''
    let html = ''
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += decodeBase64url(part.body.data)
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html += decodeBase64url(part.body.data)
      } else if (part.parts || part.body?.data) {
        // Nested multipart (e.g. multipart/alternative inside multipart/mixed)
        const nested = extractEmailContent(part)
        if (nested.text) text += nested.text
        if (nested.html) html += nested.html
      }
    }
    return { text: text || stripHtml(html), html }
  }

  return { text: '', html: '' }
}

async function fetchIndeedRss(query: string, location: string): Promise<IndeedItem[]> {
  const url = `https://in.indeed.com/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&radius=50&sort=date`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobAlertBot/1.0)' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) return []
  const xml = await res.text()
  try {
    const parsed = xmlParser.parse(xml)
    const items: IndeedItem[] = parsed?.rss?.channel?.item ?? []
    return Array.isArray(items) ? items : [items]
  } catch {
    return []
  }
}

// ── Gmail job alert parsing ────────────────────────────────────────────────

const PORTAL_SENDERS: Record<string, string> = {
  'naukri.com': 'naukri',
  'indeed.com': 'indeed',
  'jobalert.indeed.com': 'indeed',
  'linkedin.com': 'linkedin',
  'glassdoor.com': 'gmail',
  'shine.com': 'gmail',
  'monsterindia.com': 'gmail',
  'timesjobs.com': 'gmail',
  'instahyre.com': 'gmail',
  'foundit.in': 'gmail',
  'ziprecruiter.com': 'gmail',
}

function detectSource(from: string): 'naukri' | 'indeed' | 'linkedin' | 'gmail' {
  for (const [domain, source] of Object.entries(PORTAL_SENDERS)) {
    if (from.includes(domain)) return source as any
  }
  return 'gmail'
}

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
}

async function syncGmailAlerts(userId: string): Promise<number> {
  const tokenDoc = await GmailToken.findOne({ userId })
  if (!tokenDoc) return 0

  const auth = getOAuth2Client()
  auth.setCredentials({
    access_token: tokenDoc.accessToken,
    refresh_token: tokenDoc.refreshToken ?? undefined,
    expiry_date: tokenDoc.expiryDate ?? undefined,
  })

  const gmail = google.gmail({ version: 'v1', auth })

  const senders = [
    'from:naukri.com',
    'from:jobalert@naukri.com',
    'from:noreply@naukri.com',
    'from:no-reply@naukri.com',
    'from:cja.naukri.com',
    'from:mail.naukri.com',
    'from:indeed.com',
    'from:jobalert.indeed.com',
    'from:donotreply@jobalert.indeed.com',
    'from:linkedin.com',
    'from:jobs-noreply@linkedin.com',
    'from:notification@linkedin.com',
    'from:messages-noreply@linkedin.com',
    'from:shine.com',
    'from:noreply@shine.com',
    'from:monsterindia.com',
    'from:timesjobs.com',
    'from:instahyre.com',
    'from:foundit.in',
    'from:glassdoor.com',
    'from:ziprecruiter.com',
    'subject:("job alert" OR vacancies OR "jobs for you" OR "recommended jobs" OR "new jobs" OR "Apply to jobs" OR hiring OR opening)',
  ].join(' OR ')

  // in:anywhere covers inbox, promotions, updates, social, spam, sent — all folders
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: `in:anywhere (${senders}) newer_than:90d`,
    maxResults: 200,
  })

  const messages = listRes.data.messages ?? []
  let added = 0

  const isMessageProcessed = async (msgId: string) =>
    !!(await JobAlert.findOne({
      $or: [
        { externalId: `gmail:${msgId}` },
        { externalId: { $regex: `^[a-z]+-gmail:${msgId}:` } },
      ],
    }))

  for (const msg of messages) {
    if (await isMessageProcessed(msg.id!)) continue

    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id!,
      format: 'full',
    })

    const headers = detail.data.payload?.headers ?? []
    const get = (name: string) => headers.find(h => h.name === name)?.value ?? ''

    const from = get('From')
    const subject = get('Subject')
    const date = get('Date')
    const source = detectSource(from)

    if (!subject) continue

    const { text, html } = extractEmailContent(detail.data.payload)
    const postedAt = date ? new Date(date) : new Date()

    const digestJobs = parsePortalDigestEmail(source, from, subject, html, text)

    if (digestJobs.length > 0) {
      for (const job of digestJobs) {
        const externalId = `${source}-gmail:${msg.id}:${job.externalKey.slice(0, 120)}`
        const exists = await JobAlert.findOne({ userId, externalId })
        if (exists) continue

        const jobExp = extractExperience(job.snippet ?? text)
        await JobAlert.create({
          userId,
          title: job.title,
          company: job.company,
          location: job.location,
          source,
          snippet: job.snippet ?? text.slice(0, 600),
          body: text.slice(0, 20_000),
          htmlBody: html.slice(0, 500_000),
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          experienceMin: job.experienceMin ?? jobExp.min,
          experienceMax: job.experienceMax ?? jobExp.max,
          url: job.url ?? `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
          postedAt,
          externalId,
        })
        added++
      }
      continue
    }

    if (digestJobs.length === 0 && source === 'linkedin' && /looking for a new job|grow your network/i.test(subject)) {
      continue
    }

    const salary = parseSalaryINR(text || stripHtml(html))
    const exp = extractExperience(text || stripHtml(html))

    await JobAlert.create({
      userId,
      title: subject,
      source,
      snippet: text.slice(0, 600) || stripHtml(html).slice(0, 600),
      body: text.slice(0, 20_000),
      htmlBody: html.slice(0, 500_000),
      salaryMin: salary.min,
      salaryMax: salary.max,
      experienceMin: exp.min,
      experienceMax: exp.max,
      url: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
      postedAt,
      externalId: `gmail:${msg.id}`,
    })
    added++
  }

  return added
}

async function reparseExistingAlerts(userId: string): Promise<number> {
  const alerts = await JobAlert.find({ userId, htmlBody: { $exists: true, $ne: '' } })
  let updated = 0

  for (const alert of alerts) {
    const fields = reparseAlertFields(alert.source, alert.title, alert.htmlBody!, alert.body ?? '')
    if (!fields) continue

    const patch: Record<string, unknown> = {}
    if (fields.company) patch.company = fields.company
    if (fields.location) patch.location = fields.location
    if (fields.salaryMin != null) patch.salaryMin = fields.salaryMin
    if (fields.salaryMax != null) patch.salaryMax = fields.salaryMax
    if (fields.experienceMin != null) patch.experienceMin = fields.experienceMin
    if (fields.experienceMax != null) patch.experienceMax = fields.experienceMax
    if (fields.snippet) patch.snippet = fields.snippet.slice(0, 600)

    if (Object.keys(patch).length === 0) continue
    await JobAlert.updateOne({ _id: alert._id }, { $set: patch })
    updated++
  }

  return updated
}

// ── Controller ─────────────────────────────────────────────────────────────

export class JobAlertController {
  static async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const prefs = (await UserPreferences.findOne({ userId })) ?? {}
      res.json(prefs)
    } catch (e) {
      next(e)
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const { expectedCTCMin, expectedCTCMax, ...rest } = req.body

      const setFields: Record<string, unknown> = { ...rest, userId }
      const unsetFields: Record<string, string> = {}

      if (expectedCTCMin == null) unsetFields.expectedCTCMin = ''
      else setFields.expectedCTCMin = expectedCTCMin

      if (expectedCTCMax == null) unsetFields.expectedCTCMax = ''
      else setFields.expectedCTCMax = expectedCTCMax

      const update: Record<string, unknown> = { $set: setFields }
      if (Object.keys(unsetFields).length) update.$unset = unsetFields

      const prefs = await UserPreferences.findOneAndUpdate(
        { userId },
        update,
        { upsert: true, new: true, returnDocument: 'after' },
      )
      res.json(prefs)
    } catch (e) {
      next(e)
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const { source, saved, read, page = '1', limit = '20' } = req.query as Record<string, string>
      const pageNum = Math.max(1, Math.min(1000, parseInt(page) || 1))
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20))
      const ALLOWED_SOURCES = ['indeed', 'gmail', 'all']
      const filter: Record<string, any> = { userId, isDismissed: false }
      if (source && ALLOWED_SOURCES.includes(source) && source !== 'all') filter.source = source
      if (saved === 'true') filter.isSaved = true
      if (read === 'false') filter.isRead = false

      const skip = (pageNum - 1) * limitNum
      const [alerts, total] = await Promise.all([
        JobAlert.find(filter).sort({ postedAt: -1, createdAt: -1 }).skip(skip).limit(limitNum),
        JobAlert.countDocuments(filter),
      ])
      const unreadCount = await JobAlert.countDocuments({ userId, isDismissed: false, isRead: false })
      const savedCount = await JobAlert.countDocuments({ userId, isDismissed: false, isSaved: true })

      res.json({ alerts, total, unreadCount, savedCount, page: pageNum, limit: limitNum })
    } catch (e) {
      next(e)
    }
  }

  static async sync(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const prefs = await UserPreferences.findOne({ userId })
      let indeedAdded = 0
      let gmailAdded = 0

      // Indeed RSS — one request per (jobTitle × location) combination
      if (prefs && (prefs.jobTitles?.length ?? 0) > 0) {
        const locations = prefs.preferredLocations?.length ? prefs.preferredLocations : ['India']
        for (const title of prefs.jobTitles.slice(0, 3)) {
          for (const loc of locations.slice(0, 3)) {
            const items = await fetchIndeedRss(title, loc)
            for (const item of items) {
              const link = typeof item.link === 'string' ? item.link : String(item.link ?? '')
              if (!link) continue
              const existing = await JobAlert.findOne({ userId, externalId: `indeed:${link}` })
              if (existing) continue

              const rawTitle = typeof item.title === 'string' ? item.title : ''
              // Indeed title format: "Role - Company"
              const [roleRaw, companyRaw] = rawTitle.split(' - ')
              const rawHtml = typeof item.description === 'string' ? item.description : ''
              const bodyText = stripHtml(rawHtml)
              const salary = parseSalaryINR(bodyText)
              const exp = extractExperience(bodyText)

              await JobAlert.create({
                userId,
                title: roleRaw?.trim() ?? rawTitle,
                company: companyRaw?.trim(),
                location: loc,
                url: link,
                source: 'indeed',
                snippet: bodyText.slice(0, 600),
                body: bodyText,
                htmlBody: rawHtml,
                salaryMin: salary.min,
                salaryMax: salary.max,
                experienceMin: exp.min,
                experienceMax: exp.max,
                postedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                externalId: `indeed:${link}`,
              })
              indeedAdded++
            }
          }
        }
      }

      // Gmail job alert emails
      gmailAdded = await syncGmailAlerts(userId)
      const reparsed = await reparseExistingAlerts(userId)

      res.json({ added: indeedAdded + gmailAdded, reparsed, sources: { indeed: indeedAdded, gmail: gmailAdded } })
    } catch (e) {
      next(e)
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const alert = await JobAlert.findOne({ _id: req.params.id, userId })
      if (!alert) return res.status(404).json({ message: 'Not found' })
      res.json(alert)
    } catch (e) {
      next(e)
    }
  }

  static async opportunities(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const prefs = await UserPreferences.findOne({ userId })
      const { status } = req.query as { status?: string }

      const filter: Record<string, any> = { userId, isDismissed: false }
      if (status === 'applied') filter.appliedJobId = { $exists: true, $ne: null }
      if (status === 'not_applied') filter.appliedJobId = { $exists: false }

      const alerts = await JobAlert.find(filter)
        .select('-htmlBody -body') // keep response lean
        .sort({ postedAt: -1, createdAt: -1 })
        .lean()

      // Populate application status for applied alerts
      const appliedIds = alerts.filter(a => a.appliedJobId).map(a => a.appliedJobId)
      let appStatusMap: Map<string, string> = new Map()
      if (appliedIds.length > 0) {
        const apps = await JobApplication.find({ _id: { $in: appliedIds } }).select('_id status').lean()
        apps.forEach(a => appStatusMap.set(String(a._id), a.status))
      }

      const expRe = /(\d+(?:\.\d+)?)\s*(?:–|-|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i

      const enriched = alerts.map(a => {
        // Fall back to extracting experience from snippet if not stored
        let expMin = a.experienceMin
        let expMax = a.experienceMax
        if (expMin == null && a.snippet) {
          const m = a.snippet.match(expRe)
          if (m) { expMin = parseFloat(m[1]); expMax = parseFloat(m[2]) }
        }

        // Match score (0-4)
        let score = 0
        // 1. Salary fit — must meet min expected LPA when budget is known
        if (a.salaryMax != null || a.salaryMin != null) {
          const budgetLpa = a.salaryMax ?? a.salaryMin!
          if (!prefs?.expectedCTCMin || budgetLpa >= prefs.expectedCTCMin) score++
        }
        // 2. Experience fit (allow ±1 yr tolerance)
        if (expMax == null || !prefs?.experienceYears || expMax <= (prefs.experienceYears + 1)) score++
        // 3. Location fit
        const loc = (a.location ?? '').toLowerCase()
        if (!loc || (prefs?.preferredLocations ?? []).some((l: string) =>
          loc.includes(l.toLowerCase()) || l.toLowerCase().includes(loc)
        )) score++
        // 4. Title keyword fit
        const titleLow = (a.title ?? '').toLowerCase()
        const snippetLow = (a.snippet ?? '').toLowerCase()
        const titleHit = (prefs?.jobTitles ?? []).some((t: string) =>
          t.toLowerCase().split(/\s+/).some((w: string) => w.length > 2 && titleLow.includes(w))
        )
        const skillHit = (prefs?.skills ?? []).some((s: string) =>
          snippetLow.includes(s.toLowerCase()) || titleLow.includes(s.toLowerCase())
        )
        if (titleHit || skillHit) score++

        const applicationStatus = a.appliedJobId
          ? (appStatusMap.get(String(a.appliedJobId)) ?? 'draft')
          : null

        return { ...a, experienceMin: expMin, experienceMax: expMax, matchScore: score, applicationStatus }
      })

      const minExpectedLpa = prefs?.expectedCTCMin
      const filtered = enriched.filter(a => {
        const budgetLpa = a.salaryMax ?? a.salaryMin
        if (budgetLpa == null) return false
        if (minExpectedLpa != null && minExpectedLpa > 0 && budgetLpa < minExpectedLpa) return false
        return true
      })

      // Sort by matchScore desc, then date desc
      filtered.sort((a, b) => (b.matchScore - a.matchScore) || 0)

      res.json({
        opportunities: filtered,
        total: filtered.length,
        minExpectedLpa: minExpectedLpa ?? null,
      })
    } catch (e) {
      next(e)
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const alert = await JobAlert.findOneAndUpdate(
        { _id: req.params.id, userId },
        { isRead: true },
        { new: true },
      )
      if (!alert) return res.status(404).json({ message: 'Not found' })
      res.json(alert)
    } catch (e) {
      next(e)
    }
  }

  static async toggleSave(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const alert = await JobAlert.findOne({ _id: req.params.id, userId })
      if (!alert) return res.status(404).json({ message: 'Not found' })
      alert.isSaved = !alert.isSaved
      await alert.save()
      res.json(alert)
    } catch (e) {
      next(e)
    }
  }

  static async dismiss(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      await JobAlert.findOneAndUpdate({ _id: req.params.id, userId }, { isDismissed: true })
      res.json({ message: 'Dismissed' })
    } catch (e) {
      next(e)
    }
  }

  static async convertToApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const alert = await JobAlert.findOne({ _id: req.params.id, userId })
      if (!alert) return res.status(404).json({ message: 'Not found' })

      const app = await JobApplication.create({
        userId,
        company: alert.company ?? 'Unknown',
        role: alert.title,
        jd: alert.snippet ?? '',
        jobUrl: alert.url,
        location: alert.location,
        status: 'draft',
        statusHistory: [{ status: 'draft', note: `Created from ${alert.source} alert` }],
      })

      alert.appliedJobId = app._id as any
      alert.isRead = true
      await alert.save()

      res.status(201).json({ application: app, alert })
    } catch (e) {
      next(e)
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      await JobAlert.findOneAndDelete({ _id: req.params.id, userId })
      res.json({ message: 'Deleted' })
    } catch (e) {
      next(e)
    }
  }
}
