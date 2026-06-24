import type { ResumeData } from './types'

export const CANONICAL_RESUME: ResumeData = {
  header: {
    name: 'MUHAMMED SHAFEEQUE P',
    title: 'Senior Software Engineer',
    email: 'shafeequekkv95@gmail.com',
    phone: '+91 8075806497',
    links: [
      { url: 'https://www.linkedin.com/in/muhammed-shafeeque-p-6244a7124', icon: 'linkedin' },
      { url: 'https://github.com/muhammedshafeeque', icon: 'github' },
      { url: 'https://www.npmjs.com/~muhammedshafeeque', icon: 'npm' },
      { url: 'https://medium.com/@shafeequekkv95', icon: 'medium' },
      { url: 'https://muhammed-shafeeque.web.app', icon: 'web' },
    ],
  },
  summary: [
    'Senior Software Engineer who ships production systems under pressure — architected and delivered Pak Quality, a SAP-integrated quality control platform for a global beverage manufacturer; published arango-typed, a TypeScript ORM/ODM/OGM for ArangoDB, on npm; and built TaskFlow, a project management SaaS now in production at three companies. Runner-Up at TEXATHON Hackathon 2024 (Kochi).',
    'Self-taught engineer with 3+ years of professional experience leading teams of five, cutting module delivery timelines from 6 months to 2, and from 15+ weeks to 15 days. Deep expertise across enterprise SAP integrations, graph/vector databases, AI toolchains (LangChain, MistralAI), and the JavaScript/TypeScript ecosystem.',
  ],
  experience: [
    {
      role: 'Senior Software Engineer',
      company: 'Digitrel Technologies',
      period: 'July 2025 – Present',
      points: [
        'Build enterprise solutions for global beverage manufacturers — SAP-integrated yard management and quality analysis systems handling real-time production data across multiple client facilities.',
        'Architected and led a four-member team to ship Pak Quality — SAP-integrated quality control system processing 10,000+ daily inspection records across 8+ production lines — from requirements to production.',
        'Designing multi-tenant microservices yard management system; each tenant maps to an independent client facility with isolated data and SAP sync pipelines.',
        'Partner with U.S.-based clients on discovery, requirements, and delivery — aligning technical design with business and compliance needs.',
        'Contribute to company R&D on AI-driven quality and automation.',
      ],
    },
    {
      role: 'Senior Software Engineer',
      company: 'Rawdata Technologies, Ernakulam',
      period: 'April 2022 – July 2025',
      points: [
        'Engineered Stack Runner (MEAN stack): orchestrated 200+ automated test scenarios/day, boosted testing speed 40%, reduced troubleshooting time 25%, improved uptime 20%.',
        'Led 5-member team on Stack Runner, reducing QA and developer effort by 20%; mentored juniors and defined engineering practices.',
        'Managed front-end team delivering InTEUtion Sales App (Angular + Bootstrap) serving 100+ enterprise users, on schedule.',
        'Developed CMNR module in 2 months against a 6-month estimate; handles repair workflows for 10,000+ containers/year.',
        "Led BC29 Display Management System for Accenture's Bangalore office (500+ employees) using MERN + Socket.io — completed in 15 days.",
        'Designed RBAC (User Role Permission) structure across 5+ applications, controlling access for 100+ users across client organisations.',
        'Built Customer Portal B2B with Bill of Lading functionality, improving InTEUtion ecosystem integration for 50+ freight clients.',
      ],
    },
  ],
  projects: [
    {
      name: 'arango-typed',
      subtitle: 'npm Package · github.com/muhammedshafeeque/arango-typed',
      url: 'https://www.npmjs.com/package/arango-typed',
      points: [
        'TypeScript-first ORM/ODM/OGM for ArangoDB — Mongoose-like API with full end-to-end type safety. Published on npm.',
        'Supports multi-tenancy, graph OGM, vector search with LangChain integration, and chainable AQL query builder.',
      ],
    },
    {
      name: 'TaskFlow',
      subtitle: 'Solo-Built Production SaaS · Project Management Platform',
      points: [
        'Designed, built, and shipped end-to-end as a solo project — now used in production by 3+ companies (Digitrel Technologies, Ivorix Technologies, and others) managing 50+ active projects.',
        'Feature-complete Jira alternative: drag-and-drop Kanban, sprint planning, Gantt charts, QA test cycles, rich-text collaboration (TipTap), real-time notifications (Socket.io), Microsoft SSO, RBAC, audit logs, and customer portal.',
      ],
    },
  ],
  coreSkills: [
    'Enterprise & Integration: SAP integration, ERP-connected web apps, microservices, manufacturing and quality workflows',
    'Full-Stack Development: MERN/MEAN Stack, React.js, Angular, Vue.js, Node.js, Express.js, TypeScript, React Native',
    'Databases: ArangoDB (arango-typed creator), MongoDB, PostgreSQL, MSSQL, MySQL, Redis, AQL',
    'Languages: TypeScript, JavaScript, Python, SQL, AQL',
    'Cloud & DevOps: Azure, AWS, Digital Ocean, Docker, Nginx, Firebase, CI/CD',
    'AI/ML: LangChain, Vector Search, Graph Databases, MistralAI, OpenAI API, AI-driven quality R&D',
    'Leadership: Team Management, Agile/Scrum, Code Reviews, Mentoring',
  ],
  awards: [
    {
      title: 'Runner Up – TEXATHON Hackathon 2024',
      org: 'Kochi',
      description:
        'Secured second place by developing an innovative technical solution under time constraints, demonstrating technical expertise and effective collaboration.',
    },
    {
      title: 'Employee of the Month – April 2025',
      org: 'Rawdata Technologies',
      description:
        'Recognized for outstanding performance, leadership, and contributions to Stack Runner and InTEUtion ecosystem development.',
    },
  ],
  certifications: ['Basic Cyber Security – Udemy'],
  education: [
    {
      degree: 'Polytechnic Diploma in Electrical and Electronics Engineering',
      school: 'Government Polytechnic College Perinthalmanna',
      period: '2014 – 2017',
    },
  ],
  footerNote:
    'Self-taught software engineer — expertise demonstrated through published open-source packages (arango-typed on npm), a production SaaS (TaskFlow) used by 3+ companies, 3+ years of enterprise delivery, and competitive recognition (TEXATHON Runner-Up 2024).',
}

export const mergeResumeData = (base: ResumeData, tailored: Partial<ResumeData>): ResumeData => ({
  ...base,
  ...tailored,
  header: base.header,
  education: tailored.education ?? base.education,
  certifications: tailored.certifications ?? base.certifications,
  awards: tailored.awards ?? base.awards,
  footerNote: tailored.footerNote ?? base.footerNote,
})
