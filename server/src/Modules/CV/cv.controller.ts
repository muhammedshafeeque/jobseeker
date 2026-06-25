import { Request, Response, NextFunction } from 'express'
import Groq from 'groq-sdk'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import { CV } from './cv.schema'
import { CVTemplate } from '../CVTemplates/cvTemplate.schema'
import { generateResumePDF } from '../../../../shared/resume/generateResumePDF'
import { generateCoverLetterPDF } from '../../../../shared/resume/generateCoverLetterPDF'
import type { ResumeData } from '../../../../shared/resume/types'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const TAILOR_SYSTEM = `You tailor a resume JSON to match a job description.

STRICT RULES:
1. Return ONLY valid JSON — no markdown fences, no commentary
2. Use the EXACT same JSON schema as the input resume
3. Do NOT change header (name, email, phone, links), education, certifications, awards, or footerNote
4. Do NOT add, invent, or exaggerate any experience, skill, project, or metric
5. ONLY reorder bullet points and skill lines to prioritise JD relevance
6. ONLY rephrase existing bullets using JD keywords where they naturally fit
7. You may shorten summary paragraphs by selecting existing facts — never add new facts
8. Keep all company names, job titles, dates, and periods exactly as provided

Return the full resume JSON object.`

const COVER_LETTER_SYSTEM = `You write professional job application cover letters.

STRICT RULES:
1. Return ONLY the cover letter body as plain text — no markdown, no subject line, no signature
2. 250–350 words across 3–4 short paragraphs
3. Use ONLY facts from the candidate resume — never invent employers, projects, dates, or metrics
4. Address the specific role and company when provided
5. Professional, confident tone; avoid clichés and filler
6. Separate paragraphs with a single blank line`

const RESUME_PARSE_SYSTEM = `You extract structured resume data from raw CV text.

Return ONLY valid JSON with exactly this schema:
{
  "header": { "name": string, "title": string, "email": string, "phone": string, "links": [{"icon": "linkedin"|"github"|"npm"|"medium"|"web", "url": string}] },
  "summary": string[],
  "experience": [{ "role": string, "company": string, "period": string, "points": string[] }],
  "projects": [{ "name": string, "subtitle": string, "url": string, "points": string[] }],
  "coreSkills": string[],
  "education": [{ "degree": string, "school": string, "period": string }],
  "certifications": string[],
  "awards": [{ "title": string, "org": string, "description": string }],
  "footerNote": string
}

RULES:
1. Return ONLY valid JSON — no markdown fences, no commentary
2. Extract exactly what is in the CV — do not invent or add content
3. For missing sections use empty arrays [] or empty string ""
4. Split bullet points into individual array items in "points"
5. coreSkills lines should be category format: "Category: Skill A, Skill B"
6. Detect LinkedIn/GitHub/portfolio URLs and assign the correct icon value`

const parseResumeJson = (raw: string): Partial<ResumeData> => {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(cleaned) as Partial<ResumeData>
}

const getUserCV = async (userId: string) => {
  const cv = await CV.findOne({ userId }).sort({ createdAt: -1 })
  if (!cv) throw { status: 404, message: 'No CV profile found. Please set up your CV first.' }
  if (!cv.profileData) throw { status: 400, message: 'CV profile data is incomplete. Please fill in your profile.' }
  return cv.profileData as ResumeData
}

const extractText = async (buffer: Buffer, mimetype: string, fileName = ''): Promise<string> => {
  const ext = fileName.toLowerCase().split('.').pop() ?? ''
  const isPdf = mimetype === 'application/pdf' || ext === 'pdf'
  const isDoc =
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword' ||
    ext === 'docx' ||
    ext === 'doc'

  if (isPdf) {
    const parser = new PDFParse({ data: buffer })
    try {
      const result = await parser.getText()
      return result.text
    } finally {
      await parser.destroy()
    }
  }
  if (isDoc) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }
  throw { status: 400, message: 'Unsupported file type. Upload PDF or DOCX.' }
}

export class CVController {
  static async saveProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const profileData = req.body as ResumeData
      if (!profileData?.header?.name) {
        throw { status: 400, message: 'profileData with header.name is required' }
      }
      const cv = await CV.findOneAndUpdate(
        { userId },
        { userId, profileData, updatedAt: new Date() },
        { upsert: true, new: true },
      )
      res.json({ _id: cv._id, message: 'CV profile saved' })
    } catch (e) {
      next(e)
    }
  }

  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      if (!req.file) throw { status: 400, message: 'No file uploaded' }
      const rawText = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname)

      let profileData: ResumeData | undefined
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 4096,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: RESUME_PARSE_SYSTEM },
            { role: 'user', content: `Extract structured resume data from this CV:\n\n${rawText.slice(0, 12000)}` },
          ],
        })
        const raw = completion.choices[0]?.message?.content ?? '{}'
        const parsed = parseResumeJson(raw) as ResumeData
        if (parsed?.header?.name) profileData = parsed
      } catch {
        // AI parsing failed — raw text still saved
      }

      const update: Record<string, unknown> = {
        userId,
        rawText,
        fileName: req.file.originalname,
        updatedAt: new Date(),
      }
      if (profileData) update.profileData = profileData

      await CV.findOneAndUpdate({ userId }, update, { upsert: true, new: true })

      res.status(201).json({
        message: profileData ? 'CV parsed successfully' : 'CV text extracted — please fill in your profile manually',
        fileName: req.file.originalname,
        profileData: profileData ?? null,
      })
    } catch (e) {
      next(e)
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const cv = await CV.findOne({ userId }).sort({ createdAt: -1 })
      if (!cv) return res.status(404).json({ message: 'No CV found' })
      res.json(cv)
    } catch (e) {
      next(e)
    }
  }

  static async resumePdf(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const data = await getUserCV(userId)
      const doc = await generateResumePDF(data)
      const buffer = Buffer.from(doc.output('arraybuffer'))
      const name = (data.header.name ?? 'Resume').replace(/\s+/g, '_')
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${name}_Resume.pdf"`)
      res.send(buffer)
    } catch (e) {
      next(e)
    }
  }

  static async tailor(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const { jd } = req.body
      if (!jd) throw { status: 400, message: 'Job description is required' }

      const base = await getUserCV(userId)

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4096,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: TAILOR_SYSTEM },
          {
            role: 'user',
            content: `BASE RESUME JSON:\n${JSON.stringify(base, null, 2)}\n\n---\nJOB DESCRIPTION:\n${jd}`,
          },
        ],
      })

      const raw = completion.choices[0]?.message?.content ?? '{}'
      const tailored = { ...base, ...parseResumeJson(raw), header: base.header }
      res.json({ tailored })
    } catch (e) {
      next(e)
    }
  }

  static async tailorPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const { jd, resume, company, role } = req.body as {
        jd?: string
        resume?: ResumeData
        company?: string
        role?: string
      }

      const base = await getUserCV(userId)
      let data = resume ?? base

      if (jd && !resume) {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 4096,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: TAILOR_SYSTEM },
            {
              role: 'user',
              content: `BASE RESUME JSON:\n${JSON.stringify(base, null, 2)}\n\n---\nJOB DESCRIPTION:\n${jd}`,
            },
          ],
        })
        const raw = completion.choices[0]?.message?.content ?? '{}'
        data = { ...base, ...parseResumeJson(raw), header: base.header }
      }

      const doc = await generateResumePDF(data)
      const buffer = Buffer.from(doc.output('arraybuffer'))
      const slug = [company, role].filter(Boolean).join('_').replace(/\s+/g, '_') || 'Tailored'
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="Resume_${slug}.pdf"`)
      res.send(buffer)
    } catch (e) {
      next(e)
    }
  }

  static async coverLetterPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const { jd, company, role } = req.body as { jd?: string; company?: string; role?: string }
      if (!jd?.trim()) throw { status: 400, message: 'Job description is required' }

      const base = await getUserCV(userId)

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1200,
        messages: [
          { role: 'system', content: COVER_LETTER_SYSTEM },
          {
            role: 'user',
            content: `CANDIDATE RESUME:\n${JSON.stringify(base, null, 2)}\n\n---\nCOMPANY: ${company ?? 'the company'}\nROLE: ${role ?? 'the position'}\n\nJOB DETAILS:\n${jd}`,
          },
        ],
      })

      const body = (completion.choices[0]?.message?.content ?? '').trim()
      if (!body) throw { status: 502, message: 'Cover letter generation failed' }

      const { header } = base
      const doc = generateCoverLetterPDF({
        name: header.name,
        email: header.email,
        phone: header.phone,
        company: company?.trim(),
        role: role?.trim(),
        body,
      })
      const buffer = Buffer.from(doc.output('arraybuffer'))
      const slug = [company, role].filter(Boolean).join('_').replace(/\s+/g, '_') || 'Cover_Letter'
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="Cover_Letter_${slug}.pdf"`)
      res.send(buffer)
    } catch (e) {
      next(e)
    }
  }

  static async listTemplates(_req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await CVTemplate.find({}, { data: 0 }).sort({ name: 1 })
      res.json(templates)
    } catch (e) {
      next(e)
    }
  }

  static async getTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await CVTemplate.findById(req.params.id)
      if (!template) return res.status(404).json({ message: 'Template not found' })
      res.json(template)
    } catch (e) {
      next(e)
    }
  }
}
