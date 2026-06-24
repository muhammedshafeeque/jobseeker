<script setup lang="ts">
import { ref, onMounted } from 'vue'

const categories = [
  { title: 'Frontend',            icon: '🖥️', skills: ['React.js', 'Angular', 'Vue.js', 'HTML/CSS', 'TypeScript', 'Redux', 'Tailwind CSS', 'Bootstrap', 'Chakra UI', 'Material UI', 'Chart.js', 'Socket.io Client', 'Framer Motion'] },
  { title: 'Backend',             icon: '⚙️', skills: ['Node.js', 'Express.js', 'Django', 'REST APIs', 'WebSocket', 'JWT Auth', 'Multi-Tenant Architecture', 'FastAPI', 'Swagger', 'danfo.js'] },
  { title: 'Databases & ORMs',    icon: '🗄️', skills: ['MongoDB', 'Mongoose', 'ArangoDB', 'arango-typed', 'AQL', 'PostgreSQL', 'MSSQL', 'MySQL', 'Redis', 'SQL', 'TypeORM', 'Sequelize'] },
  { title: 'AI & Data',           icon: '🤖', skills: ['LangChain', 'MCP', 'Vector Search', 'Graph Databases', 'MistralAI API', 'OpenAI API', 'TensorFlow'] },
  { title: 'Languages',           icon: '💻', skills: ['JavaScript', 'TypeScript', 'Python', 'SQL', 'AQL'] },
  { title: 'DevOps & Tools',      icon: '🛠️', skills: ['Git', 'Linux', 'Nginx', 'Docker', 'CLI Development', 'GitHub', 'Bitbucket', 'Poste.io'] },
  { title: 'Cloud',               icon: '☁️', skills: ['Digital Ocean', 'Azure', 'AWS', 'Firebase'] },
  { title: 'Project Management',  icon: '📋', skills: ['Jira', 'Notion', 'Agile / Scrum', 'Plane', 'TaskFlow', 'Azure DevOps'] },
]

// When a card enters viewport, animate its tags
const visibleCats = ref<string[]>([])

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const title = (e.target as HTMLElement).dataset.catTitle
      if (e.isIntersecting && title && !visibleCats.value.includes(title)) {
        visibleCats.value.push(title)
        observer.unobserve(e.target)
      }
    })
  }, { threshold: 0.25 })

  document.querySelectorAll('[data-cat-title]').forEach((el) => observer.observe(el))
})
</script>

<template>
  <!-- Blue-50 full-width background -->
  <div class="w-full bg-brand-50">
    <section id="skills" class="py-24" aria-label="Skills and Technologies">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Heading -->
        <div class="text-center mb-16 reveal">
          <span class="section-tag">Expertise</span>
          <h2 class="section-heading mt-4">Skills & Technologies</h2>
          <p class="section-subheading mt-4 mx-auto">
            Technical breadth across the full stack — from frontend UI to graph databases and AI integrations.
          </p>
        </div>

        <!-- Skills grid -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <div v-for="(cat, i) in categories" :key="cat.title"
               :data-cat-title="cat.title"
               class="reveal card p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-300"
               :style="`transition-delay:${(i*0.07).toFixed(2)}s`">

            <div class="flex items-center gap-2.5 mb-1">
              <span class="text-xl w-9 h-9 flex items-center justify-center rounded-xl bg-brand-50 border border-brand-100 flex-shrink-0"
                    role="img" :aria-label="cat.title">{{ cat.icon }}</span>
              <h3 class="font-extrabold text-sm text-slate-800">{{ cat.title }}</h3>
            </div>

            <!-- Tags — cascade pop-in when card becomes visible -->
            <div class="flex flex-wrap gap-1.5">
              <span v-for="(s, j) in cat.skills" :key="s"
                    class="skill-tag"
                    :class="visibleCats.includes(cat.title) ? 'tag-pop' : 'opacity-0'"
                    :style="visibleCats.includes(cat.title)
                      ? `animation-delay: ${j * 0.055}s`
                      : ''">
                {{ s }}
              </span>
            </div>
          </div>
        </div>

        <!-- Languages spoken -->
        <div class="mt-14 reveal text-center" style="transition-delay:0.5s">
          <p class="text-xs font-mono text-slate-500 uppercase tracking-widest mb-5">Languages Spoken</p>
          <div class="flex flex-wrap gap-3 justify-center">
            <span class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold
                         bg-white border border-emerald-200 text-emerald-700 shadow-sm
                         hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-default">
              🇬🇧 English — Professional
            </span>
            <span class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold
                         bg-white border border-blue-200 text-blue-700 shadow-sm
                         hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-default">
              🇮🇳 Malayalam — Native
            </span>
            <span class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold
                         bg-white border border-purple-200 text-purple-700 shadow-sm
                         hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-default">
              🕌 Arabic — Read / Write
            </span>
          </div>
        </div>

      </div>
    </section>
  </div>
</template>
