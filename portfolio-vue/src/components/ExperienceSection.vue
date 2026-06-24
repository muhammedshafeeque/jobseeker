<script setup lang="ts">
import { ref, onMounted } from 'vue'

const experiences = [
  {
    title: 'Senior Software Engineer',
    company: 'Digitrel Technologies',
    period: 'July 2025 – Present',
    current: true,
    accentColor: '#2563eb',
    points: [
      'Build enterprise solutions for global beverage and soft-drink manufacturers — yard management and quality analysis systems integrated directly with SAP.',
      'Architected and led a four-member team to design and deliver Pak Quality — a SAP-integrated quality control system for a drinking can manufacturing company — from requirements through production.',
      'Architect microservices-based yard management system with scalable integration patterns.',
      'Partner with U.S.-based clients on discovery, requirements, and delivery — aligning technical design with business and compliance needs.',
      'Contribute to company R&D on AI-driven quality and automation.',
    ],
  },
  {
    title: 'Senior Software Engineer',
    company: 'Rawdata Technologies, Ernakulam',
    period: 'April 2022 – July 2025',
    current: false,
    accentColor: '#0ea5e9',
    points: [
      'Engineered Stack Runner (MEAN stack): boosted testing speed 40%, reduced troubleshooting time 25%, improved uptime 20%.',
      'Led 5-member team on Stack Runner, reducing QA and developer effort by 20%.',
      'Managed front-end team delivering InTEUtion Sales App (Angular + Bootstrap) on schedule.',
      'Developed CMNR module in 2 months against a 6-month estimate.',
      'Led BC29 Display Management System for Accenture\'s Bangalore office using MERN + Socket.io — completed in 15 days.',
      'Designed RBAC (User Role Permission) structure across 5+ applications.',
      'Built Customer Portal B2B with Bill of Lading functionality, improving InTEUtion ecosystem integration.',
    ],
  },
]

const education = [
  { degree: 'Polytechnic Diploma — Electrical & Electronics', institution: 'Gov. Polytechnic College Perinthalmanna', period: '2014 – 2017' },
]

const expWrapRef = ref<HTMLElement | null>(null)
const lineDrawn = ref(false)

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !lineDrawn.value) {
        lineDrawn.value = true
      }
    })
  }, { threshold: 0.1 })
  if (expWrapRef.value) observer.observe(expWrapRef.value)
})
</script>

<template>
  <div class="w-full bg-slate-50">
    <section id="experience" class="py-24" aria-label="Professional Experience">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Heading -->
        <div class="text-center mb-16 reveal">
          <span class="section-tag">Career Journey</span>
          <h2 class="section-heading mt-4">Professional Experience</h2>
          <p class="section-subheading mt-4 mx-auto">
            Building impactful software across enterprise platforms, manufacturing systems, and developer tooling.
          </p>
        </div>

        <div class="max-w-4xl mx-auto flex flex-col gap-8">

          <!-- ── Experience cards + line (line scoped ONLY to this wrapper) ── -->
          <div ref="expWrapRef" class="relative flex flex-col gap-8">

            <!-- Animated line — bounded by this div, stops before bottom -->
            <div class="absolute left-[18px] top-6 bottom-6 w-0.5 hidden sm:block rounded-full overflow-hidden">
              <div class="w-full bg-gradient-to-b from-brand-500 via-brand-300 to-slate-200"
                   :style="lineDrawn
                     ? 'height: 100%; transition: height 1.8s cubic-bezier(0.22,1,0.36,1) 0.4s'
                     : 'height: 0'" />
            </div>

            <article v-for="(exp, i) in experiences" :key="i"
                     class="reveal sm:pl-14 relative"
                     :style="`transition-delay:${i * 0.18}s`">

              <!-- Timeline dot with ripple rings -->
              <div class="absolute left-2.5 top-6 hidden sm:block">
                <span class="absolute inset-0 rounded-full"
                      :style="`background: ${exp.accentColor}; animation: rippleRing 2s cubic-bezier(0.4,0,0.6,1) infinite; animation-delay: ${i * 0.5}s`" />
                <span class="absolute inset-0 rounded-full"
                      :style="`background: ${exp.accentColor}; animation: rippleRing 2s cubic-bezier(0.4,0,0.6,1) infinite; animation-delay: ${i * 0.5 + 0.7}s`" />
                <span class="relative block w-3.5 h-3.5 rounded-full ring-4 ring-white shadow"
                      :style="`background: ${exp.accentColor}`" />
              </div>

              <div class="card p-6 sm:p-8 hover:-translate-y-1 transition-transform duration-300">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                  <div>
                    <h3 class="text-xl font-extrabold text-slate-900 mb-1">{{ exp.title }}</h3>
                    <p class="font-bold text-sm" :style="`color: ${exp.accentColor}`">{{ exp.company }}</p>
                  </div>
                  <span class="inline-flex items-center gap-1.5 self-start text-xs font-mono font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
                        :class="exp.current
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'">
                    <span v-if="exp.current" class="relative flex">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span class="absolute inset-0 rounded-full bg-emerald-400 animate-ping" />
                    </span>
                    {{ exp.period }}
                  </span>
                </div>

                <!-- Bullet points — no nested reveal, parent card handles it -->
                <ul class="space-y-3">
                  <li v-for="(pt, j) in exp.points" :key="j"
                      class="flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
                    <svg class="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor"
                         :style="`color: ${exp.accentColor}`">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    {{ pt }}
                  </li>
                </ul>
              </div>
            </article>
          </div>

          <!-- ── Education card — OUTSIDE line wrapper so line never reaches here ── -->
          <div class="reveal sm:pl-14 relative" style="transition-delay:0.40s">
            <!-- Sky dot (no line continues past here) -->
            <div class="absolute left-2.5 top-6 hidden sm:block">
              <span class="absolute inset-0 rounded-full bg-sky-400"
                    style="animation: rippleRing 2.4s cubic-bezier(0.4,0,0.6,1) infinite; animation-delay: 1s" />
              <span class="relative block w-3.5 h-3.5 rounded-full bg-sky-500 ring-4 ring-white shadow" />
            </div>

            <div class="card p-6 sm:p-8 hover:-translate-y-1 transition-transform duration-300">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <svg class="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L23 9 12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                  </svg>
                </div>
                <h3 class="text-xl font-extrabold text-slate-900">Education</h3>
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div v-for="edu in education" :key="edu.degree"
                     class="bg-slate-50 rounded-xl p-4 border border-slate-100
                            hover:border-sky-200 hover:bg-sky-50 transition-all duration-200">
                  <p class="font-bold text-slate-800 text-sm leading-snug mb-1">{{ edu.degree }}</p>
                  <p class="text-xs text-slate-500">{{ edu.institution }}</p>
                  <p class="text-xs text-brand-600 font-mono font-semibold mt-1.5">{{ edu.period }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  </div>
</template>
