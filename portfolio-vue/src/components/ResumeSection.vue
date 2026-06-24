<script setup lang="ts">
import { ref } from 'vue'
import { generateResumePDF } from '../utils/generateResumePDF'

const downloading = ref(false)
const toast = ref<{ msg: string; type: 'success'|'error' } | null>(null)

const download = async () => {
  downloading.value = true
  try {
    (await generateResumePDF()).save('Muhammed_Shafeeque_Resume.pdf')
    toast.value = { msg: 'Resume downloaded!', type: 'success' }
  } catch { toast.value = { msg: 'Failed to generate. Please try again.', type: 'error' } }
  finally {
    downloading.value = false
    setTimeout(() => (toast.value = null), 3500)
  }
}

</script>

<template>
  <!-- Slate-50 full-width background -->
  <div class="w-full bg-slate-50">
    <section id="resume" class="py-24" aria-label="Resume">

      <!-- Floating FAB -->
      <div class="fixed bottom-8 right-6 z-40">
        <button
          class="w-12 h-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 hover:-translate-y-0.5 transition-all"
          :disabled="downloading"
          @click="download"
          title="Download PDF Resume"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
          </svg>
        </button>
      </div>

      <!-- Toast -->
      <Transition name="toast">
        <div v-if="toast"
             class="fixed bottom-24 right-6 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
             :class="toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'">
          {{ toast.msg }}
        </div>
      </Transition>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Heading -->
        <div class="text-center mb-10 reveal">
          <span class="section-tag">Document</span>
          <h2 class="section-heading mt-4">Resume</h2>
        </div>

        <!-- Download card -->
        <div class="reveal max-w-md mx-auto">
          <div class="card p-8 text-center">
            <div class="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-5">
              <svg class="w-8 h-8 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd"/>
              </svg>
            </div>
            <h3 class="text-lg font-extrabold text-slate-900 mb-2">Muhammed Shafeeque P</h3>
            <p class="text-sm text-slate-500 mb-6">Senior Software Engineer · Full-stack · Enterprise Systems</p>
            <button class="btn-primary w-full justify-center py-3.5" :disabled="downloading" @click="download">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
              </svg>
              {{ downloading ? 'Generating…' : 'Download PDF Resume' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0; transform: translateY(8px);
}
</style>
