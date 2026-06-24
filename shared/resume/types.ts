export type LinkIcon = 'linkedin' | 'github' | 'npm' | 'medium' | 'web'

export interface ResumeLink {
  url: string
  icon: LinkIcon
}

export interface ResumeExperience {
  role: string
  company: string
  period: string
  points: string[]
}

export interface ResumeProject {
  name: string
  subtitle: string
  url?: string
  points: string[]
}

export interface ResumeAward {
  title: string
  org: string
  description: string
}

export interface ResumeEducation {
  degree: string
  school: string
  period: string
}

export interface ResumeData {
  header: {
    name: string
    title: string
    email: string
    phone: string
    links: ResumeLink[]
  }
  summary: string[]
  experience: ResumeExperience[]
  projects: ResumeProject[]
  coreSkills: string[]
  awards: ResumeAward[]
  certifications: string[]
  education: ResumeEducation[]
  footerNote?: string
}
