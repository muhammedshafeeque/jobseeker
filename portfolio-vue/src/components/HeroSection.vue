<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// ─── Typewriter ────────────────────────────────────────────
const roles = [
  'Senior Software Engineer',
  'Full-Stack Developer',
  'Enterprise Systems Builder',
  'npm Package Creator',
  'Open Source Contributor',
]
const displayedRole = ref('Senior Software Engineer')
let roleIdx = 0
let charIdx = roles[0].length
let isDeleting = false
let typeTimer: ReturnType<typeof setTimeout>

const typeLoop = () => {
  const full = roles[roleIdx]
  if (!isDeleting) {
    displayedRole.value = full.slice(0, charIdx + 1)
    charIdx++
    if (charIdx === full.length) {
      isDeleting = true
      typeTimer = setTimeout(typeLoop, 2200)
      return
    }
  } else {
    displayedRole.value = full.slice(0, charIdx - 1)
    charIdx--
    if (charIdx === 0) {
      isDeleting = false
      roleIdx = (roleIdx + 1) % roles.length
    }
  }
  typeTimer = setTimeout(typeLoop, isDeleting ? 48 : 82)
}

// ─── Count-up stats ────────────────────────────────────────
const statDisplays = ref(['4+', '20+', '2'])
const statsEl = ref<HTMLElement | null>(null)
let statsAnimated = false

const animateStat = (target: number, suffix: string, idx: number) => {
  const duration = 1400
  const start = performance.now()
  const tick = (now: number) => {
    const p = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - p, 4)
    statDisplays.value[idx] = Math.round(eased * target) + suffix
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// ─── Magnetic buttons ──────────────────────────────────────
const onMagMove = (e: MouseEvent) => {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width - 0.5) * 10
  const y = ((e.clientY - r.top) / r.height - 0.5) * 6
  el.style.transform = `translate(${x}px, ${y}px)`
}
const onMagLeave = (e: MouseEvent) => {
  (e.currentTarget as HTMLElement).style.transform = ''
}

const socials = [
  { label: 'GitHub',   href: 'https://github.com/muhammedshafeeque',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>` },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/muhammed-shafeeque-p-6244a7124',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>` },
  { label: 'npm',      href: 'https://www.npmjs.com/~muhammedshafeeque',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>` },
  { label: 'Medium',   href: 'https://medium.com/@shafeequekkv95',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>` },
  { label: 'Email',    href: 'mailto:shafeequekkv95@gmail.com',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>` },
]

const goTo = (href: string) =>
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

onMounted(() => {
  // Start typewriter after initial display
  typeTimer = setTimeout(typeLoop, 2000)

  // Stats count-up observer
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !statsAnimated) {
        statsAnimated = true
        setTimeout(() => animateStat(4,  '+', 0), 0)
        setTimeout(() => animateStat(20, '+', 1), 180)
        setTimeout(() => animateStat(2,  '',  2), 360)
      }
    })
  }, { threshold: 0.6 })
  if (statsEl.value) statsObserver.observe(statsEl.value)
})

onUnmounted(() => clearTimeout(typeTimer))
</script>

<template>
  <section id="home" class="relative w-full bg-white pt-16 overflow-hidden" aria-label="Introduction">

    <!-- Gradient strip top -->
    <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-500 via-sky-400 to-indigo-500" />

    <!-- Background mesh -->
    <div class="absolute inset-0 bg-hero-mesh pointer-events-none" />

    <!-- Animated blob — top right -->
    <div class="absolute -top-40 -right-40 w-[600px] h-[600px] blob-morph pointer-events-none opacity-40"
         style="background: radial-gradient(ellipse at 40% 40%, rgba(37,99,235,0.13) 0%, rgba(14,165,233,0.08) 50%, transparent 75%)" />

    <!-- Animated blob — bottom left -->
    <div class="absolute -bottom-32 -left-32 w-[480px] h-[480px] blob-morph pointer-events-none opacity-30"
         style="background: radial-gradient(ellipse at 60% 60%, rgba(99,102,241,0.12) 0%, transparent 70%);
                animation-delay: -4s" />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 py-20 lg:py-28">

        <!-- ── Left: text ── -->
        <div class="flex-1 min-w-0 text-center lg:text-left">

          <!-- Available tag -->
          <div class="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full
                      bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold
                      shadow-sm"
               style="animation: wordSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both">
            <span class="relative flex">
              <span class="w-2 h-2 rounded-full bg-emerald-500" />
              <span class="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
            </span>
            Open to new opportunities
          </div>

          <!-- Name — word-by-word reveal -->
          <div class="mb-4" style="perspective: 800px">
            <p class="text-base font-mono text-slate-400 mb-2 tracking-wide"
               style="animation: wordSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s both">
              Hello, I'm
            </p>
            <h1 class="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight">
              <span class="block overflow-hidden">
                <span class="block text-slate-900"
                      style="animation: wordSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.35s both">
                  Muhammed
                </span>
              </span>
              <span class="block overflow-hidden">
                <span class="block text-gradient-animated"
                      style="animation: wordSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.5s both">
                  Shafeeque P
                </span>
              </span>
            </h1>
          </div>

          <!-- Typewriter role -->
          <div class="mb-6 h-10 flex items-center justify-center lg:justify-start"
               style="animation: wordSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.65s both">
            <div class="inline-flex items-center gap-2.5 bg-brand-50 border border-brand-100 rounded-full px-5 py-2.5">
              <span class="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
              <span class="font-bold text-brand-700 text-sm tracking-wide font-mono min-w-[240px] text-left">
                {{ displayedRole }}<span class="animate-pulse border-r-2 border-brand-500 ml-0.5">&nbsp;</span>
              </span>
            </div>
          </div>

          <!-- Bio -->
          <div style="animation: wordSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.75s both">
            <p class="text-slate-600 text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              I build enterprise web systems and data platforms — SAP-integrated manufacturing apps,
              microservices, and graph/vector data layers. Creator of
              <a href="https://github.com/muhammedshafeeque/arango-typed" target="_blank"
                 rel="noopener noreferrer"
                 class="font-bold text-brand-600 hover:text-brand-700 underline decoration-brand-300 underline-offset-2 transition-colors">arango-typed</a>
              and
              <a href="https://github.com/muhammedshafeeque/taskflow" target="_blank"
                 rel="noopener noreferrer"
                 class="font-bold text-sky-600 hover:text-sky-700 underline decoration-sky-300 underline-offset-2 transition-colors">TaskFlow</a>.
            </p>
          </div>

          <!-- CTAs — magnetic hover -->
          <div class="flex flex-wrap gap-3 justify-center lg:justify-start mb-8"
               style="animation: wordSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.85s both">
            <a href="https://github.com/muhammedshafeeque" target="_blank" rel="noopener noreferrer"
               class="btn-primary"
               style="transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease"
               @mousemove="onMagMove" @mouseleave="onMagLeave">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              View GitHub
            </a>
            <button class="btn-outline"
                    style="transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease"
                    @click="goTo('#contact')"
                    @mousemove="onMagMove" @mouseleave="onMagLeave">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Get in touch
            </button>
          </div>

          <!-- Social icons -->
          <div class="flex gap-2 justify-center lg:justify-start"
               style="animation: wordSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.95s both">
            <a v-for="(s, i) in socials" :key="s.label" :href="s.href" :aria-label="s.label"
               target="_blank" rel="noopener noreferrer"
               class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400
                      hover:text-brand-600 hover:bg-brand-50 border border-slate-200
                      hover:border-brand-200 transition-all duration-200"
               :style="`animation: wordSlideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.95 + i * 0.08}s both`">
              <span class="[&>svg]:w-4 [&>svg]:h-4 [&>svg]:block" v-html="s.svg" />
            </a>
          </div>
        </div>

        <!-- ── Right: photo ── -->
        <div class="flex-shrink-0 relative"
             style="animation: wordSlideUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.45s both">

          <!-- Rotating decorative ring -->
          <div class="absolute -inset-4 rounded-[40px] border-2 border-dashed border-brand-200 opacity-60"
               style="animation: spinSlow 20s linear infinite" />

          <!-- Blob bg behind photo -->
          <div class="absolute -inset-6 blob-morph opacity-60"
               style="background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 50%, #ede9fe 100%);
                      animation-delay: -2s" />

          <!-- Photo — floating -->
          <div class="float-anim relative w-72 sm:w-80 lg:w-96 rounded-3xl overflow-hidden
                      border-4 border-white shadow-2xl">
            <img src="/images/hero-portrait.png"
                 alt="Muhammed Shafeeque P — Senior Software Engineer"
                 class="w-full h-auto object-cover object-top block"
                 loading="eager" fetchpriority="high" />
            <!-- Gradient overlay at bottom -->
            <div class="absolute inset-x-0 bottom-0 h-24
                        bg-gradient-to-t from-slate-900/30 to-transparent" />
          </div>

          <!-- Floating company badge (animated) -->
          <div class="absolute -bottom-5 -left-8 bg-white rounded-2xl px-4 py-3 shadow-xl border border-slate-100"
               style="animation: wordSlideUp 0.6s cubic-bezier(0.34,1.56,0.64,1) 1.1s both">
            <p class="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Currently at</p>
            <p class="text-sm font-extrabold text-slate-800 mt-0.5">Digitrel Technologies</p>
          </div>

          <!-- Floating exp badge (animated) -->
          <div class="absolute -top-4 -right-4 bg-brand-600 text-white rounded-2xl px-3 py-2.5 shadow-lg"
               style="animation: wordSlideUp 0.6s cubic-bezier(0.34,1.56,0.64,1) 1.2s both">
            <p class="text-xs font-bold font-mono">4+ yrs exp</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats bar — count-up on scroll into view -->
    <div ref="statsEl" class="w-full border-t border-slate-100 bg-slate-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-3 divide-x divide-slate-200">
          <div v-for="(stat, i) in [
                 { label: 'Years experience' },
                 { label: 'Projects shipped' },
                 { label: 'npm packages' }
               ]" :key="stat.label"
               class="py-6 flex flex-col items-center gap-1">
            <span class="text-3xl font-extrabold text-brand-600 font-mono tabular-nums"
                  style="animation: countUp 0.5s ease both"
                  :style="`animation-delay: ${i * 0.18}s`">
              {{ statDisplays[i] }}
            </span>
            <span class="text-xs text-slate-500 font-medium uppercase tracking-wide">{{ stat.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
