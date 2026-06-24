<script setup lang="ts">
import { ref, reactive } from 'vue'

const form = reactive({ name: '', email: '', phone: '', message: '' })
const submitting = ref(false)
const toast = ref<{ msg: string; type: 'success'|'error' } | null>(null)

const showToast = (msg: string, type: 'success'|'error') => {
  toast.value = { msg, type }
  setTimeout(() => (toast.value = null), 5000)
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, message: form.message }),
    })
    if (!res.ok) throw new Error('Server error')
    showToast("Message sent! I'll get back to you within 24 hours.", 'success')
    form.name = ''; form.email = ''; form.phone = ''; form.message = ''
  } catch { showToast('Something went wrong. Please try again.', 'error') }
  finally { submitting.value = false }
}

const contactItems = [
  { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`, label: 'Email', value: 'shafeequekkv95@gmail.com', href: 'mailto:shafeequekkv95@gmail.com' },
  { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>`, label: 'Phone', value: '+91 8075806497', href: 'tel:+918075806497' },
  { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`, label: 'Location', value: 'Malappuram, Kerala, India', href: null },
]

const socials = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/muhammed-shafeeque-p-6244a7124', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>` },
  { label: 'GitHub', href: 'https://github.com/muhammedshafeeque', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>` },
  { label: 'npm', href: 'https://www.npmjs.com/~muhammedshafeeque', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>` },
  { label: 'Medium', href: 'https://medium.com/@shafeequekkv95', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>` },
  { label: 'Stack Overflow', href: 'https://stackoverflow.com/users/15341945/muhammed-shafeeque-p', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 19.731H17.78v-2.137H6.111v2.137zm.259-4.852l11.481 2.396.445-2.083-11.481-2.396-.445 2.083zm1.359-5.056l10.666 4.927.891-1.917-10.666-4.927-.891 1.917zm2.745-4.717l8.682 7.3 1.36-1.616-8.682-7.3-1.36 1.616zM15.751 0l-1.62 1.22 6.682 8.91 1.619-1.22L15.752 0z"/></svg>` },
]
</script>

<template>
  <!-- White full-width background -->
  <div class="w-full bg-white">
    <section id="contact" class="py-24" aria-label="Contact">

      <!-- Toast -->
      <Transition name="toast">
        <div v-if="toast"
             class="fixed top-20 right-4 z-50 px-5 py-3.5 rounded-xl text-sm font-semibold shadow-xl max-w-sm"
             :class="toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'">
          {{ toast.msg }}
        </div>
      </Transition>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Heading -->
        <div class="text-center mb-16 reveal">
          <span class="section-tag">Contact</span>
          <h2 class="section-heading mt-4">Let's build something great</h2>
          <p class="section-subheading mt-4 mx-auto">
            Tell me about your product, team, or idea. I typically reply within 24 hours.
          </p>
        </div>

        <div class="grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto">

          <!-- Left: info -->
          <div class="lg:col-span-2 space-y-4 reveal">
            <!-- Contact items -->
            <div v-for="item in contactItems" :key="item.label"
                 class="card p-4 flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 flex-shrink-0">
                <span class="w-5 h-5" v-html="item.icon" />
              </div>
              <div>
                <p class="text-xs text-slate-400 font-mono uppercase tracking-wider mb-0.5">{{ item.label }}</p>
                <a v-if="item.href" :href="item.href"
                   class="text-sm font-semibold text-slate-700 hover:text-brand-600 transition-colors">
                  {{ item.value }}
                </a>
                <p v-else class="text-sm font-semibold text-slate-700">{{ item.value }}</p>
              </div>
            </div>

            <!-- Socials -->
            <div class="card p-5">
              <p class="text-xs text-slate-400 font-mono uppercase tracking-wider mb-3">Find me online</p>
              <div class="flex flex-wrap gap-2">
                <a v-for="s in socials" :key="s.label" :href="s.href"
                   target="_blank" rel="noopener noreferrer" :aria-label="s.label"
                   class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500
                          hover:text-brand-600 hover:bg-brand-50 border border-slate-200
                          hover:border-brand-200 transition-all">
                  <span class="w-4 h-4" v-html="s.icon" />
                </a>
              </div>
            </div>
          </div>

          <!-- Right: form -->
          <form class="lg:col-span-3 card p-6 sm:p-8 space-y-5 reveal" style="transition-delay:0.12s"
                @submit.prevent="handleSubmit">

            <div>
              <label for="contact-name" class="block text-sm font-bold text-slate-700 mb-1.5">Name</label>
              <input id="contact-name" v-model="form.name" type="text" required
                     placeholder="Your full name"
                     class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800
                            placeholder-slate-400 text-sm focus:outline-none focus:border-brand-400
                            focus:ring-2 focus:ring-brand-100 transition-all" />
            </div>

            <div>
              <label for="contact-email" class="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
              <input id="contact-email" v-model="form.email" type="email" required
                     placeholder="you@company.com"
                     class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800
                            placeholder-slate-400 text-sm focus:outline-none focus:border-brand-400
                            focus:ring-2 focus:ring-brand-100 transition-all" />
            </div>

            <div>
              <label for="contact-phone" class="block text-sm font-bold text-slate-700 mb-1.5">
                Phone
                <span class="ml-1.5 text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <div class="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50
                          focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                <span class="flex items-center gap-1.5 px-3 py-3 border-r border-slate-200 bg-slate-100
                             text-sm text-slate-500 select-none flex-shrink-0">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  +
                </span>
                <input id="contact-phone" v-model="form.phone" type="tel"
                       placeholder="91 98765 43210"
                       class="flex-1 px-4 py-3 bg-transparent text-slate-800 placeholder-slate-400
                              text-sm focus:outline-none" />
              </div>
            </div>

            <div>
              <label for="contact-msg" class="block text-sm font-bold text-slate-700 mb-1.5">Message</label>
              <textarea id="contact-msg" v-model="form.message" required rows="6"
                        placeholder="What are you working on?"
                        class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800
                               placeholder-slate-400 text-sm focus:outline-none focus:border-brand-400
                               focus:ring-2 focus:ring-brand-100 transition-all resize-none" />
            </div>

            <button type="submit"
                    class="w-full btn-primary justify-center py-3.5"
                    :disabled="submitting">
              <svg v-if="submitting" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
              {{ submitting ? 'Sending…' : 'Send message' }}
            </button>
          </form>
        </div>

      </div>
    </section>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s, transform 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
