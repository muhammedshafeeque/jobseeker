export interface ParsedPortalJob {
  title: string
  company?: string
  location?: string
  url?: string
  salaryMin?: number
  salaryMax?: number
  experienceMin?: number
  experienceMax?: number
  snippet?: string
  externalKey: string
}

export type PortalSource = 'indeed' | 'naukri' | 'linkedin' | 'gmail'

const SKIP_ANCHOR =
  /unsubscribe|privacy|logo|view all|manage alert|home page|terms of|click here|learn more|download app|help center|notification settings|email preferences|view in browser|naukri home|indeed home|linkedin home|shine home|foundit/i

const JOB_TITLE_HINT =
  /developer|engineer|manager|analyst|designer|architect|lead|consultant|specialist|intern|devops|full.?stack|front.?end|back.?end|mobile|data|software|qa|tester|product|project|hr|recruiter|opening|vacancy|hiring/i

const LOCATION_HINT =
  /kochi|kerala|bangalore|bengaluru|hyderabad|chennai|mumbai|pune|delhi|ncr|gurgaon|noida|remote|infopark|india|karnataka|tamil nadu|maharashtra/i

export const stripHtml = (html: string): string =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

export function extractExperience(text: string): { min?: number; max?: number } {
  const t = text.slice(0, 3000) // only scan the beginning
  // "3-5 years of experience", "3–5 yrs exp"
  const range = t.match(/(\d+(?:\.\d+)?)\s*(?:–|-|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)[\s,]*(?:of\s+)?(?:experience|exp\.?)/i)
  if (range) return { min: parseFloat(range[1]), max: parseFloat(range[2]) }
  // "minimum 3 years", "at least 2 years"
  const minOnly = t.match(/(?:minimum|min\.?|at\s*least|atleast)\s*[:\s]*(\d+)\s*(?:years?|yrs?)/i)
  if (minOnly) return { min: parseFloat(minOnly[1]) }
  // "3+ years"
  const plus = t.match(/(\d+)\s*\+\s*(?:years?|yrs?)[\s,]*(?:of\s+)?(?:experience|exp\.?)/i)
  if (plus) return { min: parseFloat(plus[1]) }
  // "Experience: 3 years" or "3 years experience"
  const loose = t.match(/(\d+)\s*(?:years?|yrs?)[\s,]+(?:of\s+)?(?:experience|exp\.?)|(?:experience|exp\.?)[:\s]+(\d+)\s*(?:years?|yrs?)/i)
  if (loose) return { min: parseFloat(loose[1] ?? loose[2]) }
  // "Fresher" or "0-1 year"
  if (/\bfresher\b|\bentry[- ]level\b/i.test(t)) return { min: 0, max: 1 }
  return {}
}

const SALARY_LINE = /₹|LPA|\blac\b|\blakh\b|a month|a year|per month|per year/i
const SKIP_LINE = /easily apply|quick apply|apply now|view job|^\d+\s*day|\d+\s*hour|contract role|full.?time|part.?time|hybrid|on.?site|urgent hire/i

function parseIndianAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, ''))
}

function splitTitleCompanyLine(line: string): string[] {
  const domainSplit = line.match(/^(.{8,140}?)([a-z0-9][a-z0-9-]*\.(?:com|ai|in|io|co|org|net))\s*$/i)
  if (domainSplit) return [domainSplit[1].trim(), domainSplit[2].trim()]
  return [line]
}

const NEXT_JOB_TITLE =
  /\b(?:developer|engineer|manager|analyst|designer|architect|lead|consultant|specialist|intern|devops|tester|recruiter|opening|vacancy|hiring)\b/i

export function htmlFragmentToLines(html: string): string[] {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/a>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/td>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .split('\n')
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .flatMap(splitTitleCompanyLine)
}

export function extractLocation(text: string): string | undefined {
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.length < 4 || trimmed.length > 80) continue
    if (!/,/.test(trimmed)) continue
    if (!LOCATION_HINT.test(trimmed)) continue
    if (SALARY_LINE.test(trimmed) || SKIP_LINE.test(trimmed)) continue
    if (JOB_TITLE_HINT.test(trimmed) && trimmed.length > 40) continue

    const cityState = trimmed.match(
      /((?:[A-Za-z][A-Za-z0-9\s.'-]{1,25},\s*){1,3}(?:Kerala|Karnataka|Tamil Nadu|Maharashtra|Telangana|Andhra Pradesh|Gujarat|Rajasthan|West Bengal|Uttar Pradesh|Delhi|NCR|India)(?:,\s*India)?)\s*$/i,
    )
    if (cityState) return cityState[1].trim()
    if (trimmed.split(',').length >= 2) return trimmed
  }

  const flat = text.replace(/\s+/g, ' ')
  const m = flat.match(
    /\b((?:[A-Za-z][A-Za-z0-9\s.'-]{1,25},\s*){1,3}(?:Kochi|Kerala|Bangalore|Bengaluru|Hyderabad|Chennai|Mumbai|Pune|Delhi|Gurgaon|Noida|Infopark|Remote|India)(?:,\s*India)?)\b/i,
  )
  return m?.[1]?.trim()
}

export function parseSalaryFromText(text: string): { min?: number; max?: number } {
  const lpaMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:–|-|to)\s*(\d+(?:\.\d+)?)\s*LPA/i)
  if (lpaMatch) return { min: parseFloat(lpaMatch[1]), max: parseFloat(lpaMatch[2]) }
  const singleLpa = text.match(/(\d+(?:\.\d+)?)\s*LPA/i)
  if (singleLpa) return { min: parseFloat(singleLpa[1]) }

  const lacWord = text.match(/(\d+(?:\.\d+)?)\s*(?:–|-|to)\s*(\d+(?:\.\d+)?)\s*(?:lac|lakh)/i)
  if (lacWord) return { min: parseFloat(lacWord[1]), max: parseFloat(lacWord[2]) }

  const yearRupee = text.match(
    /₹\s*([\d,]+(?:\.\d+)?)\s*(?:–|-|to)\s*₹\s*([\d,]+(?:\.\d+)?)\s*(?:a year|\/year|per year)/i,
  )
  if (yearRupee) {
    const min = parseIndianAmount(yearRupee[1]) / 100_000
    const max = parseIndianAmount(yearRupee[2]) / 100_000
    return { min: Math.round(min * 10) / 10, max: Math.round(max * 10) / 10 }
  }

  const monthMatch = text.match(
    /₹\s*([\d,]+(?:\.\d+)?)\s*(?:–|-|to)\s*₹\s*([\d,]+(?:\.\d+)?)\s*(?:a month|\/month|per month)/i,
  )
  if (monthMatch) {
    const min = parseIndianAmount(monthMatch[1])
    const max = parseIndianAmount(monthMatch[2])
    return { min: Math.round((min * 12) / 100_000), max: Math.round((max * 12) / 100_000) }
  }

  const lakhMatch = text.match(/₹\s*([\d,]+(?:\.\d+)?)\s*(?:–|-|to)\s*₹\s*([\d,]+(?:\.\d+)?)\s*(?:lac|lakh)/i)
  if (lakhMatch) {
    const min = parseIndianAmount(lakhMatch[1]) / 100_000
    const max = parseIndianAmount(lakhMatch[2]) / 100_000
    return { min: Math.round(min * 10) / 10, max: Math.round(max * 10) / 10 }
  }

  return {}
}

interface LinkRule {
  id: string
  hrefRe: RegExp
  isJobUrl: (url: string) => boolean
  canonicalUrl?: (url: string) => string
  externalKey: (url: string) => string
}

const PORTAL_RULES: LinkRule[] = [
  {
    id: 'indeed',
    hrefRe: /href="(https?:\/\/[^"]*indeed\.com[^"]*)"/gi,
    isJobUrl: u => /viewjob|pagead\/clk|rc\/clk|jk=/i.test(u),
    canonicalUrl: u => {
      const jk = u.match(/[?&]jk=([a-zA-Z0-9]+)/)?.[1]
      return jk ? `https://in.indeed.com/viewjob?jk=${jk}` : u
    },
    externalKey: u => u.match(/[?&]jk=([a-zA-Z0-9]+)/)?.[1] ?? u.split('?')[0],
  },
  {
    id: 'naukri',
    hrefRe: /href="(https?:\/\/[^"]*naukri\.com[^"]*)"/gi,
    isJobUrl: u =>
      /job-listings|job-details|mini-job|hiring-for|apply|jobId|job-id|src=jobalert|job\/\d/i.test(u) &&
      !/unsubscribe|privacy|logo|home|login|register|recruiters/i.test(u),
    externalKey: u => {
      const id = u.match(/jobId[=/-](\d+)|job-listings-[^"?]+|job-details\/[^"?]+/i)?.[0]
      return id ?? u.split('?')[0]
    },
  },
  {
    id: 'linkedin',
    hrefRe: /href="(https?:\/\/[^"]*linkedin\.com[^"]*)"/gi,
    isJobUrl: u => /\/jobs\/view\/|\/comm\/jobs\/view\/|currentJobId=/i.test(u),
    canonicalUrl: u => {
      const id = u.match(/jobs\/view\/(\d+)|currentJobId=(\d+)/i)
      const jobId = id?.[1] ?? id?.[2]
      return jobId ? `https://www.linkedin.com/jobs/view/${jobId}` : u
    },
    externalKey: u => u.match(/jobs\/view\/(\d+)|currentJobId=(\d+)/i)?.[1] ?? u.split('?')[0],
  },
  {
    id: 'shine',
    hrefRe: /href="(https?:\/\/[^"]*shine\.com[^"]*)"/gi,
    isJobUrl: u => /\/job\/|\/jobs\/|job-search/i.test(u) && !/unsubscribe|login/i.test(u),
    externalKey: u => u.split('?')[0],
  },
  {
    id: 'monster',
    hrefRe: /href="(https?:\/\/[^"]*monsterindia\.com[^"]*)"/gi,
    isJobUrl: u => /\/job\//i.test(u),
    externalKey: u => u.split('?')[0],
  },
  {
    id: 'timesjobs',
    hrefRe: /href="(https?:\/\/[^"]*timesjobs\.com[^"]*)"/gi,
    isJobUrl: u => /job|opening|candidate/i.test(u) && !/unsubscribe/i.test(u),
    externalKey: u => u.split('?')[0],
  },
  {
    id: 'instahyre',
    hrefRe: /href="(https?:\/\/[^"]*instahyre\.com[^"]*)"/gi,
    isJobUrl: u => /\/jobs\/|opportunity|opening/i.test(u),
    externalKey: u => u.split('?')[0],
  },
  {
    id: 'foundit',
    hrefRe: /href="(https?:\/\/[^"]*(?:foundit\.in|monsterindia\.com)[^"]*)"/gi,
    isJobUrl: u => /\/job\//i.test(u),
    externalKey: u => u.split('?')[0],
  },
  {
    id: 'glassdoor',
    hrefRe: /href="(https?:\/\/[^"]*glassdoor\.[^"]*)"/gi,
    isJobUrl: u => /job-listing|\/Job\//i.test(u),
    externalKey: u => u.split('?')[0],
  },
  {
    id: 'ziprecruiter',
    hrefRe: /href="(https?:\/\/[^"]*ziprecruiter\.[^"]*)"/gi,
    isJobUrl: u => /\/job\//i.test(u),
    externalKey: u => u.split('?')[0],
  },
]

const enrichFromWindow = (anchorText: string, htmlFragment: string) => {
  const lines = htmlFragmentToLines(htmlFragment)
  const titleIdx = lines.findIndex(
    l => l === anchorText || l.includes(anchorText) || anchorText.includes(l.slice(0, Math.min(l.length, 24))),
  )
  const start = titleIdx >= 0 ? titleIdx : 0
  const nextJobIdx = lines.findIndex(
    (l, i) =>
      i > start &&
      l !== anchorText &&
      !anchorText.includes(l) &&
      !l.includes(anchorText.slice(0, 20)) &&
      l.length > 12 &&
      l.length < 120 &&
      NEXT_JOB_TITLE.test(l) &&
      !SALARY_LINE.test(l) &&
      !SKIP_LINE.test(l),
  )
  const jobLines = lines.slice(start, nextJobIdx > start ? nextJobIdx : Math.min(start + 8, lines.length))
  const windowText = jobLines.join('\n')
  const salary = parseSalaryFromText(windowText)
  const experience = extractExperience(windowText)

  let company: string | undefined
  let location: string | undefined
  let snippet = ''

  for (let i = 1; i < jobLines.length; i++) {
    const line = jobLines[i]
    if (line === anchorText || anchorText.includes(line)) continue
    if (SALARY_LINE.test(line) || SKIP_LINE.test(line)) continue
    if (!location && /,/.test(line) && LOCATION_HINT.test(line) && line.length <= 80) {
      location = extractLocation(line) ?? line
      continue
    }
    if (!company && line.length >= 2 && line.length <= 80) {
      if (line.startsWith('(') || /\(\d/.test(line)) continue
      if (/,/.test(line) && LOCATION_HINT.test(line)) continue
      company = line.replace(/\s*:\s*Contract.*/i, '').split(/\s*[-–|]\s*/)[0].trim()
    }
  }

  if (!location) location = extractLocation(windowText)

  const applyIdx = jobLines.findIndex(l => /easily apply|quick apply|apply now/i.test(l))
  if (applyIdx >= 0) {
    snippet = jobLines
      .slice(applyIdx + 1, applyIdx + 3)
      .filter(l => !SKIP_LINE.test(l) && !SALARY_LINE.test(l) && l !== company && l !== location)
      .join(' ')
      .slice(0, 400)
  } else {
    snippet = jobLines
      .slice(1, 5)
      .filter(l => l !== company && l !== location && !SALARY_LINE.test(l) && !SKIP_LINE.test(l))
      .join(' ')
      .slice(0, 400)
  }

  return { company, location, salary, experience, snippet }
}

function extractJobsWithRule(html: string, rule: LinkRule): ParsedPortalJob[] {
  const jobs: ParsedPortalJob[] = []
  const seen = new Set<string>()

  const linkBlockRe = new RegExp(
    `<a[^>]+href="(https?:\\/\\/[^"]*)"[^>]*>([\\s\\S]*?)<\\/a>`,
    'gi',
  )

  let match: RegExpExecArray | null
  while ((match = linkBlockRe.exec(html)) !== null) {
    const url = match[1].replace(/&amp;/g, '&')
    const domainOk =
      (rule.id === 'indeed' && url.includes('indeed.com')) ||
      (rule.id === 'naukri' && url.includes('naukri.com')) ||
      (rule.id === 'linkedin' && url.includes('linkedin.com')) ||
      (rule.id === 'shine' && url.includes('shine.com')) ||
      (rule.id === 'monster' && url.includes('monsterindia.com')) ||
      (rule.id === 'timesjobs' && url.includes('timesjobs.com')) ||
      (rule.id === 'instahyre' && url.includes('instahyre.com')) ||
      (rule.id === 'foundit' && (url.includes('foundit.in') || url.includes('monsterindia.com'))) ||
      (rule.id === 'glassdoor' && url.includes('glassdoor.')) ||
      (rule.id === 'ziprecruiter' && url.includes('ziprecruiter.'))

    if (!domainOk || !rule.isJobUrl(url)) continue

    const anchorText = stripHtml(match[2])
    if (!anchorText || anchorText.length < 4 || anchorText.length > 150) continue
    if (SKIP_ANCHOR.test(anchorText) || SKIP_ANCHOR.test(url)) continue
    if (!JOB_TITLE_HINT.test(anchorText) && !JOB_TITLE_HINT.test(url)) continue

    const key = `${rule.id}:${rule.externalKey(url)}`
    if (seen.has(key)) continue
    seen.add(key)

    const window = html.slice(match.index, match.index + 2800)
    const meta = enrichFromWindow(anchorText, window)

    jobs.push({
      title: anchorText,
      company: meta.company,
      location: meta.location,
      url: rule.canonicalUrl ? rule.canonicalUrl(url) : url,
      snippet: meta.snippet,
      externalKey: rule.externalKey(url),
      salaryMin: meta.salary.min,
      salaryMax: meta.salary.max,
      experienceMin: meta.experience.min,
      experienceMax: meta.experience.max,
    })
  }

  return jobs
}

function extractJobsFromTextBlocks(text: string, prefix = ''): ParsedPortalJob[] {
  const jobs: ParsedPortalJob[] = []
  const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(b => b.length > 25)

  for (const block of blocks) {
    if (SKIP_ANCHOR.test(block)) continue
    if (!JOB_TITLE_HINT.test(block)) continue
    if (!/₹|LPA|lac|apply|ago|month|yoe|opening|vacancy|hiring|walk-in/i.test(block)) continue

    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) continue

    const title = lines.find(
      l => l.length > 4 && l.length < 120 && JOB_TITLE_HINT.test(l) && !/₹|LPA|apply|ago|month/i.test(l),
    )
    if (!title) continue

    const companyLine = lines.find(
      (l, i) => i > 0 && l !== title && l.length < 100 && !/₹|apply|ago|month|lac/i.test(l),
    )
    const location = extractLocation(block) ?? lines.find(l => LOCATION_HINT.test(l))
    const salary = parseSalaryFromText(block)
    const experience = extractExperience(block)
    const key = `${prefix}${title}:${companyLine ?? ''}`.toLowerCase()
    if (jobs.some(j => j.externalKey === key)) continue

    jobs.push({
      title,
      company: companyLine?.split(/[-–|,]/)[0]?.trim(),
      location: location ?? companyLine?.split(/[-–|]/).slice(1).join(' ').trim(),
      snippet: block.slice(0, 400),
      externalKey: key,
      salaryMin: salary.min,
      salaryMax: salary.max,
      experienceMin: experience.min,
      experienceMax: experience.max,
    })
  }

  return jobs
}

const isJobDigestSubject = (subject: string) =>
  /vacanc|job alert|jobs for you|recommended job|matching job|new job|apply to|hiring|opening|walk-?in|hot job|top job|curated job|job recommendation/i.test(
    subject,
  )

const isLinkedInNoise = (subject: string, html: string) =>
  /looking for a new job|grow your network|people you may know|add skills|profile views|invitation to connect/i.test(
    subject,
  ) && !/\/jobs\/view\//i.test(html)

function parseWithRules(html: string, text: string, ruleIds: string[]): ParsedPortalJob[] {
  const rules = PORTAL_RULES.filter(r => ruleIds.includes(r.id))
  const fromHtml = rules.flatMap(r => extractJobsWithRule(html, r))
  if (fromHtml.length >= 1) return dedupeJobs(fromHtml)
  return extractJobsFromTextBlocks(text, `${ruleIds[0]}:`)
}

function dedupeJobs(jobs: ParsedPortalJob[]): ParsedPortalJob[] {
  const seen = new Set<string>()
  return jobs.filter(j => {
    const k = j.externalKey.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export function parseIndeedDigestEmail(
  html: string,
  text: string,
  subject: string,
  from: string,
): ParsedPortalJob[] {
  if (
    !from.includes('indeed') &&
    !isJobDigestSubject(subject) &&
    !/indeed\.com\/viewjob/i.test(html)
  ) {
    return []
  }
  return parseWithRules(html, text, ['indeed'])
}

export function parseNaukriDigestEmail(
  html: string,
  text: string,
  subject: string,
  from: string,
): ParsedPortalJob[] {
  if (!from.includes('naukri') && !isJobDigestSubject(subject) && !/naukri\.com/i.test(html)) return []
  return parseWithRules(html, text, ['naukri'])
}

export function parseLinkedInDigestEmail(
  html: string,
  text: string,
  subject: string,
  from: string,
): ParsedPortalJob[] {
  if (!from.includes('linkedin')) return []
  if (isLinkedInNoise(subject, html)) return []
  if (!isJobDigestSubject(subject) && !/\/jobs\/view\//i.test(html)) return []
  return parseWithRules(html, text, ['linkedin'])
}

export function parseOtherPortalsDigestEmail(
  html: string,
  text: string,
  subject: string,
  from: string,
): ParsedPortalJob[] {
  const ruleIds: string[] = []
  if (from.includes('shine.com') || html.includes('shine.com')) ruleIds.push('shine')
  if (from.includes('monsterindia') || html.includes('monsterindia')) ruleIds.push('monster', 'foundit')
  if (from.includes('timesjobs') || html.includes('timesjobs')) ruleIds.push('timesjobs')
  if (from.includes('instahyre') || html.includes('instahyre')) ruleIds.push('instahyre')
  if (from.includes('foundit.in') || html.includes('foundit.in')) ruleIds.push('foundit')
  if (from.includes('glassdoor') || html.includes('glassdoor')) ruleIds.push('glassdoor')
  if (from.includes('ziprecruiter') || html.includes('ziprecruiter')) ruleIds.push('ziprecruiter')

  if (ruleIds.length === 0 && isJobDigestSubject(subject)) {
    return extractJobsFromTextBlocks(text)
  }
  if (ruleIds.length === 0) return []

  return parseWithRules(html, text, [...new Set(ruleIds)])
}

export function parsePortalDigestEmail(
  source: PortalSource,
  from: string,
  subject: string,
  html: string,
  text: string,
): ParsedPortalJob[] {
  let jobs: ParsedPortalJob[] = []

  if (source === 'indeed' || from.includes('indeed')) {
    jobs = parseIndeedDigestEmail(html, text, subject, from)
  } else if (source === 'naukri' || from.includes('naukri')) {
    jobs = parseNaukriDigestEmail(html, text, subject, from)
  } else if (source === 'linkedin' || from.includes('linkedin')) {
    jobs = parseLinkedInDigestEmail(html, text, subject, from)
  }

  if (jobs.length === 0) {
    jobs = parseOtherPortalsDigestEmail(html, text, subject, from)
  }

  if (jobs.length === 0 && isJobDigestSubject(subject)) {
    jobs = extractJobsFromTextBlocks(text)
  }

  return dedupeJobs(jobs)
}

export function reparseAlertFields(
  source: string,
  title: string,
  htmlBody: string,
  body: string,
): Partial<ParsedPortalJob> | null {
  const jobs = parsePortalDigestEmail(
    (source === 'indeed' || source === 'naukri' || source === 'linkedin' ? source : 'gmail') as PortalSource,
    '',
    title,
    htmlBody,
    body,
  )

  const norm = (s?: string) => (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
  const titleNorm = norm(title)
  const match =
    jobs.find(j => norm(j.title) === titleNorm) ??
    jobs.find(j => titleNorm.includes(norm(j.title)) || norm(j.title).includes(titleNorm))

  if (match) return match

  const idx = htmlBody.toLowerCase().indexOf(title.toLowerCase().slice(0, Math.min(title.length, 32)))
  if (idx < 0) return null

  const window = htmlBody.slice(Math.max(0, idx - 100), idx + 2800)
  const lines = htmlFragmentToLines(window)
  const meta = enrichFromWindow(title, window)
  if (!meta.location && !meta.salary.min && !meta.company && lines.length < 2) return null

  return {
    title,
    company: meta.company,
    location: meta.location,
    salaryMin: meta.salary.min,
    salaryMax: meta.salary.max,
    experienceMin: meta.experience.min,
    experienceMax: meta.experience.max,
    snippet: meta.snippet,
  }
}
