import type { ResumeData } from '../../../../shared/resume/types'

export const SEED_TEMPLATES: Array<{
  name: string
  description: string
  category: string
  data: ResumeData
}> = [
  {
    name: 'Standard',
    description: 'Balanced layout with all sections — best starting point',
    category: 'Layout',
    data: {
      header: {
        name: 'Your Name',
        title: 'Your Job Title',
        email: 'your.email@example.com',
        phone: '+00 000 000 0000',
        links: [
          { url: 'https://linkedin.com/in/yourprofile', icon: 'linkedin' },
          { url: 'https://github.com/yourprofile', icon: 'github' },
        ],
      },
      summary: [
        'Experienced professional with X+ years delivering results in [your field]. Replace this with a concise overview of your background and key strengths.',
        'Strong track record of [key achievement]. Passionate about [area of interest].',
      ],
      experience: [
        {
          role: 'Senior Role Title',
          company: 'Company Name',
          period: 'Jan 2022 – Present',
          points: [
            'Led [initiative], resulting in [measurable outcome].',
            'Designed and delivered [project] used by [scope or users].',
            'Collaborated with cross-functional teams to [goal].',
          ],
        },
        {
          role: 'Previous Role Title',
          company: 'Previous Company',
          period: 'Jun 2019 – Dec 2021',
          points: [
            'Built [system or product], improving [metric] by X%.',
            'Managed [process or team] and delivered [outcome].',
            'Introduced [tool or practice] that reduced [problem] by X%.',
          ],
        },
      ],
      projects: [
        {
          name: 'Project Name',
          subtitle: 'Brief description or link',
          url: '',
          points: [
            'Describe what you built and the technology or approach used.',
            'Highlight adoption, impact, or recognition.',
          ],
        },
      ],
      coreSkills: [
        'Category 1: Skill A, Skill B, Skill C',
        'Category 2: Skill D, Skill E, Skill F',
        'Category 3: Tool X, Tool Y, Tool Z',
      ],
      awards: [],
      certifications: ['Certification Name – Issuing Body', 'Another Certification'],
      education: [
        {
          degree: 'Degree Name',
          school: 'University / Institution',
          period: '2015 – 2019',
        },
      ],
      footerNote: '',
    },
  },
  {
    name: 'Skills-First',
    description: 'Emphasises skills and technical expertise up front',
    category: 'Layout',
    data: {
      header: {
        name: 'Your Name',
        title: 'Your Specialisation',
        email: 'your.email@example.com',
        phone: '+00 000 000 0000',
        links: [
          { url: 'https://linkedin.com/in/yourprofile', icon: 'linkedin' },
          { url: 'https://github.com/yourprofile', icon: 'github' },
          { url: 'https://yourportfolio.com', icon: 'web' },
        ],
      },
      summary: [
        'Specialist in [domain] with deep expertise in [core skills]. Replace with your own summary focusing on what you are best at.',
      ],
      experience: [
        {
          role: 'Role Title',
          company: 'Company Name',
          period: 'Jan 2021 – Present',
          points: [
            'Applied [skill/technology] to solve [problem], achieving [result].',
            'Owned [area of responsibility] end-to-end.',
            'Mentored team members on [topic].',
          ],
        },
        {
          role: 'Earlier Role',
          company: 'Previous Company',
          period: 'Jan 2018 – Dec 2020',
          points: [
            'Delivered [project] using [approach].',
            'Reduced [problem] by X% through [solution].',
          ],
        },
      ],
      projects: [
        {
          name: 'Open-Source / Side Project',
          subtitle: 'Technology stack or link',
          url: '',
          points: [
            'Built [what it does] using [tech].',
            '[Stars, users, or adoption metric].',
          ],
        },
      ],
      coreSkills: [
        'Primary Skills: Add your most important skills here',
        'Secondary Skills: Supporting technologies and tools',
        'Soft Skills: Leadership, Communication, Problem-solving',
        'Platforms & Tools: List key platforms you work with',
      ],
      awards: [],
      certifications: [],
      education: [
        {
          degree: 'Your Degree',
          school: 'Your Institution',
          period: '2014 – 2018',
        },
      ],
      footerNote: 'Self-driven professional — expertise demonstrated through [open-source / portfolio / independent work].',
    },
  },
  {
    name: 'Minimal',
    description: 'Clean and concise — highlights the essentials only',
    category: 'Layout',
    data: {
      header: {
        name: 'Your Name',
        title: 'Your Title',
        email: 'your.email@example.com',
        phone: '+00 000 000 0000',
        links: [
          { url: 'https://linkedin.com/in/yourprofile', icon: 'linkedin' },
        ],
      },
      summary: [
        'Results-focused professional with experience in [field]. Replace with two or three sentences that capture your value proposition.',
      ],
      experience: [
        {
          role: 'Current Role',
          company: 'Employer',
          period: 'Jan 2022 – Present',
          points: [
            'Key achievement with measurable result.',
            'Another notable contribution or responsibility.',
            'Impact on team, product, or business.',
          ],
        },
        {
          role: 'Previous Role',
          company: 'Previous Employer',
          period: '2019 – 2021',
          points: [
            'Highlight from this role.',
            'What you delivered or improved.',
          ],
        },
      ],
      projects: [],
      coreSkills: [
        'Core: Your primary skill areas',
        'Tools: Key tools and platforms',
      ],
      awards: [],
      certifications: [],
      education: [
        {
          degree: 'Degree',
          school: 'Institution',
          period: '2015 – 2019',
        },
      ],
      footerNote: '',
    },
  },
]
