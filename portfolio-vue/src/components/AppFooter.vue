<script setup lang="ts">
const year = new Date().getFullYear()

const links = [
  { label: 'GitHub',   href: 'https://github.com/muhammedshafeeque',   icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>` },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/muhammed-shafeeque-p-6244a7124', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>` },
  { label: 'npm',      href: 'https://www.npmjs.com/~muhammedshafeeque', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>` },
  { label: 'Medium',   href: 'https://medium.com/@shafeequekkv95', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>` },
]

const navLinks = ['Home','Experience','Projects','Skills','Resume','Contact']
</script>

<template>
  <!-- Dark footer for visual closure -->
  <footer class="w-full bg-slate-900 text-white">

    <!-- Top CTA band -->
    <div class="w-full bg-brand-600">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Have a project in mind?
        </h2>
        <p class="text-brand-100 mb-6 text-base">
          Let's talk about how I can help build it.
        </p>
        <a href="mailto:shafeequekkv95@gmail.com"
           class="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-brand-700
                  bg-white hover:bg-brand-50 transition-all shadow-lg shadow-brand-700/30 hover:-translate-y-0.5">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          shafeequekkv95@gmail.com
        </a>
      </div>
    </div>

    <!-- Main footer -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid sm:grid-cols-3 gap-10">

        <!-- Brand -->
        <div>
          <p class="text-2xl font-extrabold text-gradient font-mono tracking-tight mb-3">MSP</p>
          <p class="text-sm text-slate-400 leading-relaxed">
            Muhammed Shafeeque P — Senior Software Engineer. Building enterprise systems, graph data layers, and developer tooling from Kerala, India.
          </p>
        </div>

        <!-- Quick links -->
        <div>
          <p class="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 mb-4">Quick Links</p>
          <nav class="flex flex-col gap-2">
            <a v-for="l in navLinks" :key="l"
               :href="`#${l.toLowerCase()}`"
               class="text-sm text-slate-400 hover:text-white transition-colors">
              {{ l }}
            </a>
          </nav>
        </div>

        <!-- Social + contact -->
        <div>
          <p class="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 mb-4">Connect</p>
          <div class="flex flex-wrap gap-2 mb-5">
            <a v-for="l in links" :key="l.label" :href="l.href"
               target="_blank" rel="noopener noreferrer" :aria-label="l.label"
               class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500
                      hover:text-white hover:bg-white/10 border border-slate-700 hover:border-white/20 transition-all">
              <span class="w-4 h-4" v-html="l.icon" />
            </a>
          </div>
          <p class="text-xs text-slate-500">📍 Malappuram, Kerala, India</p>
          <p class="text-xs text-slate-500 mt-1">📞 +91 8075806497</p>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-xs text-slate-600">© {{ year }} Muhammed Shafeeque P. All rights reserved.</p>
        <p class="text-xs text-slate-700">Built with Vue 3 · Tailwind CSS · TypeScript · Firebase</p>
      </div>
    </div>

  </footer>
</template>
