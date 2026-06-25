import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import type { ResumeData } from './types'
import { CANONICAL_RESUME } from './resumeData'
import { iconMap } from './icons'

type RGBColor = [number, number, number]

const A4_HEIGHT_MM = 297
const PAGE_MARGIN_TOP = 14
const PAGE_MARGIN_BOTTOM = 14
const Y_MAX = A4_HEIGHT_MM - PAGE_MARGIN_BOTTOM
const LH_SUMMARY = 4.0
const LH_BODY = 4.8
const LH_SECTION_TITLE_GAP = 5
const GAP_AFTER_BULLET = 1.5

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    textWithLink: (text: string, x: number, y: number, options: any) => number
    getTextWidth: (text: string) => number
    link: (x: number, y: number, w: number, h: number, options: any) => void
  }
}

function ensureSpace(doc: jsPDF, y: number, needMm: number): number {
  if (y + needMm > Y_MAX) {
    doc.addPage()
    return PAGE_MARGIN_TOP
  }
  return y
}

function addIconLink(doc: jsPDF, dataUrl: string, x: number, yTop: number, sizeMm: number, url: string) {
  doc.addImage(dataUrl, 'PNG', x, yTop, sizeMm, sizeMm)
  doc.link(x, yTop, sizeMm, sizeMm, { url })
}

function addSection(doc: jsPDF, title: string, y: number, color: RGBColor) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...color)
  doc.text(title, 20, y)
}

function addExperience(
  doc: jsPDF,
  exp: { role: string; company: string; period: string; points: string[] },
  y: number,
  color: RGBColor,
): number {
  y = ensureSpace(doc, y, 22)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...color)
  doc.text(exp.role, 20, y)

  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`${exp.company} | ${exp.period}`, 20, y)

  y += 5
  exp.points.forEach(point => {
    const lines = doc.splitTextToSize(point, 168)
    const blockH = lines.length * LH_BODY + 2 + GAP_AFTER_BULLET
    y = ensureSpace(doc, y, blockH)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('•', 20, y)
    lines.forEach((line: string) => {
      doc.text(line, 25, y)
      y += LH_BODY
    })
    y += GAP_AFTER_BULLET
  })

  return y
}

function addEducation(
  doc: jsPDF,
  edu: { degree: string; school: string; period: string },
  y: number,
  color: RGBColor,
): number {
  const maxW = 170
  const lineH = LH_BODY
  const degreeLines = doc.splitTextToSize(edu.degree, maxW)
  const schoolLines = doc.splitTextToSize(`${edu.school} | ${edu.period}`, maxW)
  const blockH = degreeLines.length * lineH + schoolLines.length * lineH + 6
  y = ensureSpace(doc, y, blockH)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...color)
  degreeLines.forEach((line: string) => {
    doc.text(line, 20, y)
    y += lineH
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  schoolLines.forEach((line: string) => {
    doc.text(line, 20, y)
    y += lineH
  })
  y += 5
  return y
}

async function fetchNpmStats(): Promise<{ weekly: number; total: number }> {
  const today = new Date().toISOString().slice(0, 10)
  const [weeklyRes, totalRes] = await Promise.all([
    fetch('https://api.npmjs.org/downloads/point/last-week/arango-typed'),
    fetch(`https://api.npmjs.org/downloads/point/2015-01-10:${today}/arango-typed`),
  ])
  const weekly = weeklyRes.ok ? ((await weeklyRes.json()) as { downloads: number }).downloads : 0
  const total = totalRes.ok ? ((await totalRes.json()) as { downloads: number }).downloads : 0
  return { weekly, total }
}

function withNpmStats(data: ResumeData, npmStats: { weekly: number; total: number }): ResumeData {
  if (npmStats.total <= 0) return data
  return {
    ...data,
    projects: data.projects.map(p => {
      if (p.name !== 'arango-typed') return p
      const stats = `${npmStats.total.toLocaleString()} total downloads · ${npmStats.weekly.toLocaleString()} this week on npm.`
      return {
        ...p,
        points: p.points.map((pt, i) =>
          i === 0 ? pt.replace('Published on npm.', stats) : pt,
        ),
      }
    }),
  }
}

export const generateResumePDF = async (data: ResumeData = CANONICAL_RESUME): Promise<jsPDF> => {
  const npmStats = await fetchNpmStats().catch(() => ({ weekly: 0, total: 0 }))
  const resume = withNpmStats(data, npmStats)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const primary: RGBColor = [15, 15, 15]
  const secondary: RGBColor = [80, 80, 80]

  let y = PAGE_MARGIN_TOP
  const { header } = resume

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...primary)
  doc.text(header.name, 20, y)

  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(...secondary)
  doc.text(header.title, 20, y)

  y += 5
  const yText = y
  let cx = 20
  doc.setFontSize(10)
  doc.textWithLink(header.email, cx, yText, { url: `mailto:${header.email}` })
  cx += doc.getTextWidth(header.email)
  const sep = '   ·   '
  doc.text(sep, cx, yText)
  cx += doc.getTextWidth(sep)
  doc.textWithLink(header.phone, cx, yText, { url: `tel:${header.phone.replace(/\s/g, '')}` })

  const icon = 4
  const gap = 3
  const rowWidth = header.links.length * icon + (header.links.length - 1) * gap
  const pageRight = 190
  let iconX = pageRight - rowWidth
  const yIconTop = yText - 3.5
  header.links.forEach((link, i) => {
    addIconLink(doc, iconMap[link.icon], iconX, yIconTop, icon, link.url)
    iconX += icon + (i < header.links.length - 1 ? gap : 0)
  })

  y = yText + 4
  y += 3
  doc.setDrawColor(...primary)
  doc.setLineWidth(0.5)
  doc.line(20, y, 190, y)

  y += 4
  y = ensureSpace(doc, y, 40)
  addSection(doc, 'PROFESSIONAL SUMMARY', y, primary)
  y += LH_SECTION_TITLE_GAP
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...secondary)

  resume.summary.forEach((paragraph, idx) => {
    const lines = doc.splitTextToSize(paragraph, 172)
    y = ensureSpace(doc, y, Math.min(lines.length * LH_SUMMARY + 4, Y_MAX - PAGE_MARGIN_TOP))
    doc.text(lines, 20, y)
    y += lines.length * LH_SUMMARY + (idx < resume.summary.length - 1 ? 4 : 3)
  })

  y += 4
  y = ensureSpace(doc, y, 35)
  addSection(doc, 'WORK EXPERIENCE', y, primary)
  y += LH_SECTION_TITLE_GAP

  resume.experience.forEach((exp, idx) => {
    y = addExperience(doc, exp, y, secondary)
    if (idx < resume.experience.length - 1) y += 2
  })

  y += 4
  y = ensureSpace(doc, y, 30)
  addSection(doc, 'KEY PROJECTS', y, primary)
  y += LH_SECTION_TITLE_GAP

  resume.projects.forEach(proj => {
    y = ensureSpace(doc, y, 28)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...secondary)
    doc.text(proj.name, 20, y)
    y += 4.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    const subLines = doc.splitTextToSize(proj.subtitle, 168)
    doc.text(subLines, 20, y)
    y += subLines.length * 3.5 + 1.5
    doc.setFontSize(10)
    doc.setTextColor(...secondary)
    proj.points.forEach(pt => {
      const lines = doc.splitTextToSize(pt, 168)
      const blockH = lines.length * LH_BODY + GAP_AFTER_BULLET
      y = ensureSpace(doc, y, blockH)
      doc.text('•', 20, y)
      doc.text(lines, 25, y)
      y += lines.length * LH_BODY + GAP_AFTER_BULLET
    })
    y += 2
  })

  y += 4
  y = ensureSpace(doc, y, 40)
  addSection(doc, 'CORE COMPETENCIES', y, primary)
  y += LH_SECTION_TITLE_GAP
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...secondary)

  resume.coreSkills.forEach(skill => {
    const lines = doc.splitTextToSize(skill, 168)
    y = ensureSpace(doc, y, lines.length * LH_BODY + 0.5)
    doc.text('•', 20, y)
    doc.text(lines, 25, y)
    y += lines.length * LH_BODY
  })
  y += 2

  y = ensureSpace(doc, y, 42)
  addSection(doc, 'AWARDS & RECOGNITION', y, primary)
  y += LH_SECTION_TITLE_GAP

  resume.awards.forEach(award => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...primary)
    doc.text(award.title, 20, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...secondary)
    doc.text(award.org, 20, y)
    y += 5
    const descLines = doc.splitTextToSize(award.description, 168)
    y = ensureSpace(doc, y, descLines.length * LH_BODY + 4)
    doc.text(descLines, 20, y)
    y += descLines.length * LH_BODY + 5
  })

  y = ensureSpace(doc, y, 28)
  addSection(doc, 'CERTIFICATIONS', y, primary)
  y += LH_SECTION_TITLE_GAP
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...secondary)
  resume.certifications.forEach(cert => {
    doc.text('•', 20, y)
    doc.text(cert, 25, y)
    y += 4 + 3
  })

  y = ensureSpace(doc, y, 36)
  addSection(doc, 'EDUCATION', y, primary)
  y += LH_SECTION_TITLE_GAP

  resume.education.forEach(edu => {
    y = addEducation(doc, edu, y, secondary)
  })

  if (resume.footerNote) {
    y = ensureSpace(doc, y, 18)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9.5)
    doc.setTextColor(120, 120, 120)
    const noteLines = doc.splitTextToSize(resume.footerNote, 170)
    doc.text(noteLines, 20, y)
  }

  return doc
}

export { CANONICAL_RESUME } from './resumeData'
export type { ResumeData } from './types'
