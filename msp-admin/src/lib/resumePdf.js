import api from './api'

export function buildJobDescription({ title, company, location, salaryMin, salaryMax, snippet, experienceMin, experienceMax } = {}) {
  return [
    title && `Role: ${title}`,
    company && `Company: ${company}`,
    location && `Location: ${location}`,
    salaryMax != null && `Budget: ₹${salaryMin != null ? `${salaryMin}–${salaryMax}` : salaryMax} LPA`,
    experienceMax != null && `Experience: ${experienceMin != null ? `${experienceMin}–${experienceMax}` : `up to ${experienceMax}`} years`,
    snippet && `Description: ${snippet}`,
  ].filter(Boolean).join('\n')
}

export async function downloadResumePdf({ resume, jd, company, role, filename } = {}) {
  const { data } = await api.post(
    '/cv/pdf',
    { resume, jd, company, role },
    { responseType: 'blob' },
  )
  const name = filename || (company && role ? `Resume_${company}_${role}.pdf` : 'Muhammed_Shafeeque_Resume.pdf')
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = name.replace(/\s+/g, '_')
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadCoverLetterPdf({ jd, company, role, filename } = {}) {
  const { data } = await api.post(
    '/cv/cover-letter/pdf',
    { jd, company, role },
    { responseType: 'blob' },
  )
  const name = filename || (company && role ? `Cover_Letter_${company}_${role}.pdf` : 'Cover_Letter.pdf')
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = name.replace(/\s+/g, '_')
  a.click()
  URL.revokeObjectURL(url)
}
