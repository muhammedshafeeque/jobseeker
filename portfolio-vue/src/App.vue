<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppNavbar from './components/AppNavbar.vue'
import HeroSection from './components/HeroSection.vue'
import ExperienceSection from './components/ExperienceSection.vue'
import ProjectsSection from './components/ProjectsSection.vue'
import SkillsSection from './components/SkillsSection.vue'
import ResumeSection from './components/ResumeSection.vue'
import ContactSection from './components/ContactSection.vue'
import AppFooter from './components/AppFooter.vue'

const scrollProgress = ref(0)

const onScroll = () => {
  const total = document.documentElement.scrollHeight - window.innerHeight
  scrollProgress.value = total > 0 ? (window.scrollY / total) * 100 : 0
}

onMounted(() => {
  // Scroll progress
  window.addEventListener('scroll', onScroll, { passive: true })

  // Reveal animation observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') })
    },
    { threshold: 0.08 }
  )
  document.querySelectorAll('.reveal, .reveal-left').forEach((el) => observer.observe(el))
})

onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Scroll progress indicator -->
    <div
      class="fixed top-0 left-0 z-[60] h-[3px] pointer-events-none"
      style="background: linear-gradient(to right, #2563eb, #38bdf8, #6366f1); transition: width 0.1s linear;"
      :style="{ width: scrollProgress + '%' }"
    />

    <AppNavbar />
    <main>
      <HeroSection />
      <ExperienceSection />
      <ProjectsSection />
      <SkillsSection />
      <ResumeSection />
      <ContactSection />
    </main>
    <AppFooter />
  </div>
</template>
