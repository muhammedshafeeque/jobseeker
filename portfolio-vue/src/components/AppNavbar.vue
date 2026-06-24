<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { generateResumePDF } from '../utils/generateResumePDF'

const scrolled = ref(false)
const mobileOpen = ref(false)

const navLinks = [
  { label: 'Home',       href: '#home' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects',   href: '#projects' },
  { label: 'Skills',     href: '#skills' },
  { label: 'Resume',     href: '#resume' },
  { label: 'Contact',    href: '#contact' },
]

const handleScroll = () => { scrolled.value = window.scrollY > 20 }
onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

const go = (href: string) => {
  mobileOpen.value = false
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const downloadResume = async () => {
  try { (await generateResumePDF()).save('Muhammed_Shafeeque_Resume.pdf') } catch {}
  mobileOpen.value = false
}
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="scrolled
      ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm'
      : 'bg-white/80 backdrop-blur-sm'"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">

        <!-- Logo -->
        <a href="#home" @click.prevent="go('#home')"
           class="text-xl font-extrabold tracking-tight text-gradient font-mono">
          MSP
        </a>

        <!-- Desktop links -->
        <div class="hidden md:flex items-center gap-0.5">
          <a
            v-for="l in navLinks" :key="l.label"
            :href="l.href"
            class="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-600
                   hover:text-brand-600 hover:bg-brand-50 transition-all duration-150"
            @click.prevent="go(l.href)"
          >{{ l.label }}</a>

          <button class="ml-4 btn-primary text-xs py-2 px-4" @click="downloadResume">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
            </svg>
            Resume
          </button>
        </div>

        <!-- Hamburger -->
        <button
          class="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          @click="mobileOpen = !mobileOpen" aria-label="Toggle menu"
        >
          <span class="w-5 h-0.5 bg-slate-700 transition-all duration-300"
                :class="mobileOpen ? 'rotate-45 translate-y-2' : ''" />
          <span class="w-5 h-0.5 bg-slate-700 transition-all duration-300"
                :class="mobileOpen ? 'opacity-0' : ''" />
          <span class="w-5 h-0.5 bg-slate-700 transition-all duration-300"
                :class="mobileOpen ? '-rotate-45 -translate-y-2' : ''" />
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition name="slide-down">
      <div v-if="mobileOpen"
           class="md:hidden bg-white border-t border-slate-100 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
          <a
            v-for="l in navLinks" :key="l.label"
            :href="l.href"
            class="px-4 py-3 rounded-xl text-sm font-semibold text-slate-700
                   hover:text-brand-600 hover:bg-brand-50 transition-all"
            @click.prevent="go(l.href)"
          >{{ l.label }}</a>
          <button class="mt-2 btn-primary justify-center" @click="downloadResume">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
            </svg>
            Download Resume
          </button>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0; transform: translateY(-6px);
}
</style>
