import type { ApplicationStatus } from '../JobApplications/jobApplication.schema'

export type InviteType =
  | 'interview'
  | 'phone_screen'
  | 'code_test'
  | 'offer'
  | 'rejection'
  | 'application_update'
  | 'recruiter_reply'
  | 'noise'

export interface ParsedEmail {
  messageId: string
  threadId: string
  from: string
  fromEmail: string
  fromDomain: string
  fromName: string
  subject: string
  snippet: string
  receivedAt: Date
  inviteType: InviteType
  suggestedStatus: ApplicationStatus | null
  nextStep: string
  companyGuess: string
  roleGuess: string
}

const STATUS_RANK: Record<ApplicationStatus, number> = {
  draft: 0,
  applied: 1,
  responded: 2,
  phone_screen: 3,
  code_test: 4,
  interview_1: 5,
  interview_2: 6,
  interview_3: 7,
  offer: 8,
  accepted: 9,
  rejected: -1,
  withdrawn: -1,
}

const ATS_DOMAINS = [
  'greenhouse.io',
  'lever.co',
  'workday.com',
  'myworkdayjobs.com',
  'icims.com',
  'smartrecruiters.com',
  'ashbyhq.com',
  'recruitee.com',
  'breezy.hr',
  'jobvite.com',
  'workable.com',
  'oraclecloud.com',
  'taleo.net',
  'eightfold.ai',
  'successfactors.com',
]

const NOISE_PATTERNS = [
  /recommended jobs/i,
  /jobs you may like/i,
  /new jobs for you/i,
  /job alert/i,
  /newsletter/i,
  /unsubscribe/i,
  /promotional/i,
  /marketing@/i,
  /noreply@linkedin/i,
  /invitations@linkedin/i,
]

const REJECTION_PATTERNS = [
  /unfortunately/i,
  /not moving forward/i,
  /regret to inform/i,
  /other candidates/i,
  /will not be proceeding/i,
  /decided to pursue other/i,
  /not selected/i,
  /position has been filled/i,
  /unable to offer you/i,
  /we('ve| have) decided not/i,
]

const parseFrom = (raw: string) => {
  const match = raw.match(/^(?:"?([^"<]*)"?\s)?<?([^>\s]+@[^>\s]+)>?$/)
  const fromName = (match?.[1] ?? raw).trim()
  const fromEmail = (match?.[2] ?? raw).trim().toLowerCase()
  const domain = fromEmail.includes('@') ? fromEmail.split('@')[1] : ''
  return { fromName, fromEmail, fromDomain: domain }
}

const domainToCompany = (domain: string) => {
  const base = domain
    .replace(/\.(com|co|io|net|org|in|uk|ai)$/i, '')
    .split('.')
    .pop() ?? domain
  return base.charAt(0).toUpperCase() + base.slice(1)
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const extractRoleFromSubject = (subject: string) => {
  const patterns = [
    /(?:for|position|role|opening|opportunity)[:\s-]+(.+?)(?:\s+at\b|\s+with\b|$)/i,
    /interview(?:\s+for)?[:\s-]+(.+?)(?:\s+at\b|\s+with\b|$)/i,
    /application for[:\s-]+(.+?)(?:\s+at\b|$)/i,
  ]
  for (const p of patterns) {
    const m = subject.match(p)
    if (m?.[1] && m[1].length > 3 && m[1].length < 80) return m[1].trim()
  }
  return ''
}

export const classifyEmail = (input: {
  messageId: string
  threadId: string
  from: string
  subject: string
  snippet: string
  receivedAt: Date
}): ParsedEmail => {
  const { fromName, fromEmail, fromDomain } = parseFrom(input.from)
  const text = `${input.subject} ${input.snippet}`.toLowerCase()
  const companyGuess = domainToCompany(fromDomain)
  const roleGuess = extractRoleFromSubject(input.subject)

  let inviteType: InviteType = 'noise'
  let suggestedStatus: ApplicationStatus | null = null
  let nextStep = input.subject

  const isAts = ATS_DOMAINS.some(d => fromDomain.includes(d))
  const isNoise = NOISE_PATTERNS.some(p => p.test(text) || p.test(input.from))

  if (!isNoise && (isAts || REJECTION_PATTERNS.some(p => p.test(text)))) {
    if (REJECTION_PATTERNS.some(p => p.test(text))) {
      inviteType = 'rejection'
      suggestedStatus = 'rejected'
      nextStep = 'Rejection received'
    }
  }

  if (inviteType === 'noise' && !isNoise) {
    if (/offer letter|job offer|pleased to offer|extend an offer|offer of employment/i.test(text)) {
      inviteType = 'offer'
      suggestedStatus = 'offer'
      nextStep = 'Review offer letter'
    } else if (/hackerrank|codility|coding (test|challenge|assessment)|take[- ]home|technical assessment|code challenge|leetcode|codesignal/i.test(text)) {
      inviteType = 'code_test'
      suggestedStatus = 'code_test'
      nextStep = 'Complete coding assessment'
    } else if (/phone screen|screening call|introductory call|recruiter call|initial call/i.test(text)) {
      inviteType = 'phone_screen'
      suggestedStatus = 'phone_screen'
      nextStep = 'Prepare for phone screen'
    } else if (/interview|schedule.*call|calendar invite|video call|teams meeting|zoom meeting|google meet/i.test(text)) {
      inviteType = 'interview'
      if (/third|round 3|3rd/i.test(text)) suggestedStatus = 'interview_3'
      else if (/second|round 2|2nd|follow[- ]up interview/i.test(text)) suggestedStatus = 'interview_2'
      else suggestedStatus = 'interview_1'
      nextStep = 'Prepare for interview'
    } else if (/application received|thank you for applying|we received your application|successfully submitted/i.test(text)) {
      inviteType = 'application_update'
      suggestedStatus = 'responded'
      nextStep = 'Application acknowledged'
    } else if (/shortlisted|next steps|move forward|pleased to inform|would like to speak|recruiter|hiring manager|talent team/i.test(text)) {
      inviteType = 'recruiter_reply'
      suggestedStatus = 'responded'
      nextStep = 'Follow up with recruiter'
    } else if (isAts) {
      inviteType = 'recruiter_reply'
      suggestedStatus = 'responded'
      nextStep = input.subject
    }
  }

  return {
    messageId: input.messageId,
    threadId: input.threadId,
    from: input.from,
    fromEmail,
    fromDomain,
    fromName,
    subject: input.subject,
    snippet: input.snippet,
    receivedAt: input.receivedAt,
    inviteType,
    suggestedStatus,
    nextStep,
    companyGuess,
    roleGuess,
  }
}

export const isJobRelated = (email: ParsedEmail) =>
  email.inviteType !== 'noise' && email.suggestedStatus !== null

export const shouldAdvanceStatus = (current: ApplicationStatus, next: ApplicationStatus) => {
  if (next === 'rejected' || next === 'withdrawn') return true
  if (current === 'rejected' || current === 'withdrawn' || current === 'accepted') return false
  return STATUS_RANK[next] > STATUS_RANK[current]
}

export const matchJob = (
  apps: Array<{ _id: unknown; company: string; role: string; gmailThreadIds: string[] }>,
  email: ParsedEmail,
) => {
  const byThread = apps.find(a => a.gmailThreadIds.includes(email.threadId))
  if (byThread) return byThread

  const companyNorm = normalize(email.companyGuess)
  const subjectNorm = normalize(email.subject)

  let best: (typeof apps)[0] | null = null
  let bestScore = 0

  for (const app of apps) {
    let score = 0
    const appCompany = normalize(app.company)
    const appRole = normalize(app.role)

    if (appCompany && (subjectNorm.includes(appCompany) || companyNorm.includes(appCompany) || appCompany.includes(companyNorm))) {
      score += 3
    }
    if (appRole && subjectNorm.includes(appRole)) score += 2
    if (email.fromDomain && appCompany.replace(/\s/g, '') && email.fromDomain.includes(appCompany.replace(/\s/g, ''))) {
      score += 2
    }
    if (score > bestScore) {
      bestScore = score
      best = app
    }
  }

  return bestScore >= 3 ? best : null
}
