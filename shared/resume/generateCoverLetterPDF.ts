import { jsPDF } from 'jspdf'

export interface CoverLetterPDFInput {
  name: string
  email: string
  phone: string
  company?: string
  role?: string
  body: string
}

export function generateCoverLetterPDF(params: CoverLetterPDFInput): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 20
  const maxWidth = 210 - margin * 2
  let y = 25

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(params.name, margin, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`${params.email} · ${params.phone}`, margin, y)
  y += 10

  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  doc.text(dateStr, margin, y)
  y += 10

  if (params.company) {
    doc.text(params.company, margin, y)
    y += 6
  }
  if (params.role) {
    doc.text(`Re: ${params.role}`, margin, y)
    y += 10
  }

  doc.setFontSize(11)
  const paragraphs = params.body
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)

  for (const para of paragraphs) {
    const lines = doc.splitTextToSize(para, maxWidth) as string[]
    for (const line of lines) {
      if (y > 280) {
        doc.addPage()
        y = 25
      }
      doc.text(line, margin, y)
      y += 5.5
    }
    y += 4
  }

  y += 6
  if (y > 275) {
    doc.addPage()
    y = 25
  }
  doc.setFont('helvetica', 'bold')
  doc.text('Sincerely,', margin, y)
  doc.text(params.name, margin, y + 6)

  return doc
}
