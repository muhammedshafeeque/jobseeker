<script setup lang="ts">
interface Project {
  title: string
  subtitle: string
  description: string
  tech: string[]
  github?: string
  live?: string
  playstore?: string
  accentColor: string
  badge?: string
  metric?: string
}

const featured: Project[] = [
  {
    title: 'arango-typed',
    subtitle: 'npm Package',
    description: 'TypeScript-first ORM/ODM/OGM for ArangoDB with Mongoose-like API. Production-ready with full type safety end-to-end, multi-tenancy, graph OGM, vector search with LangChain integration, and chainable AQL query builder. Zero manual AQL required. Published on npm with comprehensive docs.',
    tech: ['TypeScript', 'ArangoDB', 'Node.js', 'LangChain', 'Vector Search', 'OGM', 'Multi-tenancy'],
    github: 'https://github.com/muhammedshafeeque/arango-typed',
    live: 'https://www.npmjs.com/package/arango-typed',
    accentColor: 'brand',
    badge: 'npm Package',
  },
  {
    title: 'TaskFlow',
    subtitle: 'Project Management Platform',
    description: 'Modern Jira-like project management platform actively used in production by Digitrel Technologies, Ivorix Technologies, and other organizations. Features drag-and-drop Kanban boards, sprint planning, Gantt charts, QA test cycles, rich-text collaboration via TipTap, real-time notifications via Socket.io, Microsoft SSO, role-based permissions, audit logs, and customer portal.',
    tech: ['Node.js', 'Express', 'TypeScript', 'MongoDB', 'React 19', 'Tailwind CSS 4', 'Socket.io', 'TipTap', 'JWT'],
    github: 'https://github.com/muhammedshafeeque/taskflow',
    accentColor: 'sky',
    badge: 'Production SaaS',
  },
]

const production: Project[] = [
  {
    title: 'Super20',
    subtitle: 'E-Learning Platform',
    description: 'Full-featured e-learning platform built for a PSC (Public Service Commission) coaching institute. Scaled to 700+ concurrent users with live classes, video lessons, mock tests, performance analytics, student management, and batch management. Available on Android via Google Play Store.',
    tech: ['React Native', 'Node.js', 'MongoDB', 'Socket.io', 'Firebase', 'Express', 'Redux', 'FFmpeg'],
    playstore: 'https://play.google.com/store/search?q=super20&c=apps',
    accentColor: 'emerald',
    badge: 'Mobile App',
    metric: '700+ concurrent users',
  },
  {
    title: 'TM Vegetable App',
    subtitle: 'Supply Chain Management',
    description: 'End-to-end vegetable supply chain and order management application connecting suppliers, distributors, and buyers. Features real-time inventory tracking, order placement and fulfillment, dynamic pricing, delivery scheduling, and financial reporting for daily wholesale operations.',
    tech: ['React Native', 'Node.js', 'MongoDB', 'Express', 'REST API', 'Push Notifications'],
    accentColor: 'lime',
    badge: 'Mobile App',
  },
  {
    title: 'InTEUtion ERP',
    subtitle: 'NVOCC Shipping ERP',
    description: 'Enterprise ERP system for an NVOCC (Non-Vessel Operating Common Carrier) shipping business. Led major modules end-to-end — including CMNR (Container Maintenance & Repair System) delivered in 2 months vs a 6-month estimate — alongside Bill of Lading, customer portal B2B, RBAC across 5+ apps, and InTEUtion Sales App (Angular + Bootstrap). Served global freight and logistics operations.',
    tech: ['Angular', 'Python', 'Django', 'PostgreSQL', 'Bootstrap', 'REST API', 'RBAC'],
    accentColor: 'orange',
    badge: 'Enterprise ERP',
  },
  {
    title: 'InTEUtion Mobile',
    subtitle: 'Shipping ERP Mobile Interface',
    description: 'Mobile companion app for the InTEUtion ERP platform, designed for senior management and field staff. Provides executives with real-time visibility into container operations, shipment status, approval workflows, and KPI dashboards — extending full ERP capabilities to mobile.',
    tech: ['React Native', 'Redux', 'REST API', 'Push Notifications', 'JWT'],
    accentColor: 'indigo',
    badge: 'Mobile App',
  },
  {
    title: 'Stack Runner',
    subtitle: 'Automated Testing Platform',
    description: 'Automated testing and QA platform built to validate the entire InTEUtion ERP ecosystem. Led a 5-member team — boosted testing efficiency 40%, reduced troubleshooting time 25%, and improved system uptime 20%. Provides test orchestration, environment management, real-time reporting, and CI/CD integration.',
    tech: ['MongoDB', 'Express', 'React', 'Node.js', 'Socket.io', 'Jest', 'CI/CD'],
    accentColor: 'violet',
    badge: 'DevOps Tool',
    metric: '40% faster QA cycles',
  },
  {
    title: 'Pak Quality',
    subtitle: 'Manufacturing Quality Control',
    description: 'Quality testing and control system for a drinking can manufacturing company, directly integrated with the client\'s SAP system. Manages inspection workflows, defect tracking, batch-level quality reports, real-time production line monitoring, and compliance documentation — with live data sync to and from SAP for seamless factory operations.',
    tech: ['React', 'Node.js', 'Express', 'MSSQL', 'TypeORM', 'TypeScript', 'SAP Integration'],
    accentColor: 'rose',
    badge: 'Enterprise App',
  },
]

const ghIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`

const accentMap: Record<string, { bar: string; badge: string; link: string }> = {
  brand:   { bar: 'from-brand-600 via-brand-400 to-sky-400',     badge: 'bg-brand-50 text-brand-700',   link: 'hover:text-brand-600' },
  sky:     { bar: 'from-sky-500 via-cyan-400 to-indigo-400',     badge: 'bg-sky-50 text-sky-700',       link: 'hover:text-sky-600' },
  emerald: { bar: 'from-emerald-500 via-teal-400 to-green-400',  badge: 'bg-emerald-50 text-emerald-700', link: 'hover:text-emerald-600' },
  lime:    { bar: 'from-lime-500 via-green-400 to-emerald-400',  badge: 'bg-lime-50 text-lime-700',     link: 'hover:text-lime-700' },
  orange:  { bar: 'from-orange-500 via-amber-400 to-yellow-400', badge: 'bg-orange-50 text-orange-700', link: 'hover:text-orange-600' },
  indigo:  { bar: 'from-indigo-500 via-blue-400 to-violet-400',  badge: 'bg-indigo-50 text-indigo-700', link: 'hover:text-indigo-600' },
  violet:  { bar: 'from-violet-500 via-purple-400 to-indigo-400', badge: 'bg-violet-50 text-violet-700', link: 'hover:text-violet-600' },
  rose:    { bar: 'from-rose-500 via-pink-400 to-red-400',       badge: 'bg-rose-50 text-rose-700',     link: 'hover:text-rose-600' },
}

// ─── 3-D tilt ──────────────────────────────────────────────
const onTiltMove = (e: MouseEvent) => {
  const card = e.currentTarget as HTMLElement
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const cx = rect.width / 2
  const cy = rect.height / 2
  const rotX = ((y - cy) / cy) * -7
  const rotY = ((x - cx) / cx) * 7
  card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px)`
  card.style.transition = 'transform 0.08s linear'
}

const onTiltLeave = (e: MouseEvent) => {
  const card = e.currentTarget as HTMLElement
  card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)'
  card.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
}
</script>

<template>
  <!-- White full-width background -->
  <div class="w-full bg-white">
    <section id="projects" class="py-24" aria-label="Projects">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Heading -->
        <div class="text-center mb-16 reveal">
          <span class="section-tag">Portfolio</span>
          <h2 class="section-heading mt-4">Projects</h2>
          <p class="section-subheading mt-4 mx-auto">
            Open-source packages, production SaaS platforms, and client-delivered applications.
          </p>
        </div>

        <!-- ── Open Source / npm ─────────────────────────────────── -->
        <p class="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mb-4 reveal">
          Open Source &amp; npm
        </p>
        <div class="grid lg:grid-cols-2 gap-6 mb-14">
          <article v-for="(p, i) in featured" :key="p.title"
                   class="reveal card-shimmer card p-0 flex flex-col overflow-hidden tilt-card"
                   :style="`transition-delay:${i*0.1}s`"
                   @mousemove="onTiltMove"
                   @mouseleave="onTiltLeave">

            <!-- Animated gradient bar -->
            <div class="h-1.5 w-full bg-gradient-to-r"
                 :class="accentMap[p.accentColor].bar"
                 style="background-size: 200% 100%; animation: gradientFlow 3s ease infinite" />

            <div class="flex flex-col gap-5 p-6 sm:p-8 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-xl font-extrabold text-slate-900 font-mono">{{ p.title }}</h3>
                  <span class="inline-flex items-center mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        :class="accentMap[p.accentColor].badge">
                    {{ p.badge }}
                  </span>
                </div>
                <a v-if="p.github" :href="p.github" target="_blank" rel="noopener noreferrer"
                   aria-label="View on GitHub"
                   class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400
                          hover:text-brand-600 hover:bg-brand-50 border border-slate-200
                          hover:border-brand-200 transition-all flex-shrink-0">
                  <span class="w-4 h-4" v-html="ghIcon" />
                </a>
              </div>

              <p class="text-sm text-slate-600 leading-relaxed flex-1">{{ p.description }}</p>

              <div class="flex flex-wrap gap-1.5">
                <span v-for="(t, j) in p.tech" :key="t"
                      class="skill-tag tag-pop"
                      :style="`animation-delay: ${j * 0.06 + 0.2}s`">
                  {{ t }}
                </span>
              </div>

              <div class="flex items-center gap-5 pt-4 border-t border-slate-100">
                <a v-if="p.github" :href="p.github" target="_blank" rel="noopener noreferrer"
                   class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors">
                  <span class="w-3.5 h-3.5" v-html="ghIcon" /> GitHub
                </a>
                <a v-if="p.live" :href="p.live" target="_blank" rel="noopener noreferrer"
                   class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors"
                   :class="accentMap[p.accentColor].link">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                  npm / Docs
                </a>
              </div>
            </div>
          </article>
        </div>

        <!-- ── Client & Production Work ──────────────────────────── -->
        <p class="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mb-4 reveal" style="transition-delay:0.1s">
          Client &amp; Production Work
        </p>
        <div class="grid sm:grid-cols-2 gap-6">
          <article v-for="(p, i) in production" :key="p.title"
                   class="reveal card-shimmer card p-0 flex flex-col overflow-hidden tilt-card"
                   :style="`transition-delay:${(i * 0.12).toFixed(2)}s`"
                   @mousemove="onTiltMove"
                   @mouseleave="onTiltLeave">

            <!-- Animated gradient bar -->
            <div class="h-1.5 w-full bg-gradient-to-r"
                 :class="accentMap[p.accentColor].bar"
                 style="background-size: 200% 100%; animation: gradientFlow 3s ease infinite" />

            <div class="flex flex-col gap-4 p-6 flex-1">
              <!-- Header -->
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-lg font-extrabold text-slate-900 font-mono">{{ p.title }}</h3>
                  <p class="text-xs text-slate-500 mt-0.5">{{ p.subtitle }}</p>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                      :class="accentMap[p.accentColor].badge">
                  {{ p.badge }}
                </span>
              </div>

              <!-- Metric badge if present -->
              <div v-if="p.metric"
                   class="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full
                          bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <span class="relative flex">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span class="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                </span>
                {{ p.metric }}
              </div>

              <p class="text-sm text-slate-600 leading-relaxed flex-1">{{ p.description }}</p>

              <!-- Tech tags -->
              <div class="flex flex-wrap gap-1.5">
                <span v-for="(t, j) in p.tech" :key="t"
                      class="skill-tag tag-pop"
                      :style="`animation-delay: ${j * 0.05 + 0.15}s`">
                  {{ t }}
                </span>
              </div>

              <!-- Links -->
              <div class="flex items-center gap-4 pt-4 border-t border-slate-100">
                <a v-if="p.playstore" :href="p.playstore" target="_blank" rel="noopener noreferrer"
                   class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors"
                   :class="accentMap[p.accentColor].link">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.18 23.75a1.5 1.5 0 01-.68-.16A1.5 1.5 0 011.5 22.25V1.75A1.5 1.5 0 012.5.41l13.5 10.25a1.5 1.5 0 010 2.34L2.5 23.25a1.5 1.5 0 01-.32.5zM3 2.75v18.5L14.75 12 3 2.75z"/>
                    <path d="M21 12.25a1.49 1.49 0 01-.75-.2l-4.5-2.67a.75.75 0 01.75-1.3l4.5 2.67A1.49 1.49 0 0121 12.25z"/>
                  </svg>
                  Play Store
                </a>
                <a v-if="p.live" :href="p.live" target="_blank" rel="noopener noreferrer"
                   class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors"
                   :class="accentMap[p.accentColor].link">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                  View Live
                </a>
                <span v-if="!p.playstore && !p.live && !p.github"
                      class="text-xs text-slate-400 italic">Private / Client Project</span>
              </div>
            </div>
          </article>
        </div>

      </div>
    </section>
  </div>
</template>
