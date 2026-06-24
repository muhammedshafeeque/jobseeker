import { Request, Response, NextFunction } from 'express'
import Groq from 'groq-sdk'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import { CV } from './cv.schema'
import { CANONICAL_RESUME, mergeResumeData } from '../../../../shared/resume/resumeData'
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

const parseResumeJson = (raw: string): Partial<ResumeData> => {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(cleaned) as Partial<ResumeData>
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
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw { status: 400, message: 'No file uploaded' }
      const rawText = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname)
      await CV.deleteMany({})
      const cv = await CV.create({ rawText, fileName: req.file.originalname })
      res.status(201).json({ _id: cv._id, fileName: cv.fileName, uploadedAt: cv.uploadedAt })
    } catch (e) {
      next(e)
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const cv = await CV.findOne().sort({ createdAt: -1 })
      if (!cv) return res.status(404).json({ message: 'No CV uploaded yet' })
      res.json(cv)
    } catch (e) {
      next(e)
    }
  }

  static async resumePdf(_req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await generateResumePDF(CANONICAL_RESUME)
      const buffer = Buffer.from(doc.output('arraybuffer'))
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename="Muhammed_Shafeeque_Resume.pdf"')
      res.send(buffer)
    } catch (e) {
      next(e)
    }
  }

  static async tailor(req: Request, res: Response, next: NextFunction) {
    try {
      const { jd } = req.body
      if (!jd) throw { status: 400, message: 'Job description is required' }

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4096,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: TAILOR_SYSTEM },
          {
            role: 'user',
            content: `BASE RESUME JSON:\n${JSON.stringify(CANONICAL_RESUME, null, 2)}\n\n---\nJOB DESCRIPTION:\n${jd}`,
          },
        ],
      })

      const raw = completion.choices[0]?.message?.content ?? '{}'
      const tailored = mergeResumeData(CANONICAL_RESUME, parseResumeJson(raw))
      res.json({ tailored })
    } catch (e) {
      next(e)
    }
  }

  static async tailorPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { jd, resume, company, role } = req.body as {
        jd?: string
        resume?: ResumeData
        company?: string
        role?: string
      }

      let data = resume ?? CANONICAL_RESUME

      if (jd && !resume) {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 4096,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: TAILOR_SYSTEM },
            {
              role: 'user',
              content: `BASE RESUME JSON:\n${JSON.stringify(CANONICAL_RESUME, null, 2)}\n\n---\nJOB DESCRIPTION:\n${jd}`,
            },
          ],
        })
        const raw = completion.choices[0]?.message?.content ?? '{}'
        data = mergeResumeData(CANONICAL_RESUME, parseResumeJson(raw))
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
      const { jd, company, role } = req.body as { jd?: string; company?: string; role?: string }
      if (!jd?.trim()) throw { status: 400, message: 'Job description is required' }

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1200,
        messages: [
          { role: 'system', content: COVER_LETTER_SYSTEM },
          {
            role: 'user',
            content: `CANDIDATE RESUME:\n${JSON.stringify(CANONICAL_RESUME, null, 2)}\n\n---\nCOMPANY: ${company ?? 'the company'}\nROLE: ${role ?? 'the position'}\n\nJOB DETAILS:\n${jd}`,
          },
        ],
      })

      const body = (completion.choices[0]?.message?.content ?? '').trim()
      if (!body) throw { status: 502, message: 'Cover letter generation failed' }

      const { header } = CANONICAL_RESUME
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
}
