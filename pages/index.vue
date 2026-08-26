<template>
  <div class="container mx-auto p-4 pt-[5rem] md:pt-4 flex flex-col md:flex-row">
    <!-- Mobile Menu Toggle -->
    <div class="fixed top-0 left-0 z-40 self-stretch w-full px-2 py-4 bg-white border shadow-lg border-primary-50 md:hidden flex items-center justify-between">
      <div class="z-50 ml-4 hamburger cursor-pointer" @click="toggleSidebar">
        <i class="fas fa-bars fa-2x"></i>
      </div>
      <a href="/CV_Vahid_Rahimzadeh_Jun_2026.pdf" class="inline-block px-3 py-1.5 text-sm text-white transition duration-300 rounded bg-primary-600 hover:bg-primary-700 mr-4">
        Download CV
      </a>
    </div>

    <!-- Sidebar -->
    <Sidebar :isOpen="sidebarOpen" :activeSection="activeSection" @close="closeSidebar" />

    <!-- Main Content -->
    <section class="mt-4 md:w-3/4 md:ml-4 md:mt-0">
      <!-- About Section -->
      <header class="relative p-6 rounded-b-lg shadow-md bg-gradient-to-br from-white to-primary-50/50 backdrop-blur-md bg-opacity-70 z-10 border border-primary-100" id="about">
        <div class="absolute right-0 h-40 transform -translate-x-1/2 rounded-full circle-deep-green w-60 -bottom-20"></div>
        <div class="absolute left-0 w-40 h-40 transform -translate-x-1/2 rounded-full circle-deep-green -bottom-10"></div>
        <div class="relative z-10">
          <div class="mx-auto">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-4 text-xl align-middle">
                <a href="https://telegram.me/vavredev" class="text-gray-600 hover:text-gray-800">
                  <i class="fab fa-telegram"></i>
                </a>
                <a href="https://www.linkedin.com/in/vavre/" class="text-gray-600 hover:text-gray-800">
                  <i class="fab fa-linkedin"></i>
                </a>
                <a href="https://x.com/vavredev" class="text-gray-600 hover:text-gray-800">
                  <i class="fab fa-twitter"></i>
                </a>
                <span class="text-sm text-gray-600 align-middle">
                  Last Update: Dec 2025
                </span>
              </div>
              <a href="/CV_Vahid_Rahimzadeh_Jun_2026.pdf" class="inline-block px-4 py-2 text-white transition duration-300 rounded bg-primary-600 hover:bg-primary-700">
                Download CV
              </a>
            </div>
            <div class="text-gray-700">
              <p><i class="mr-2 fas fa-envelope"></i>vahyd@live.com</p>
            </div>
            <p class="mt-6 leading-relaxed text-gray-800">
              I am a First-year PhD Candidate at the <a href="https://www.tudelft.nl/en/tpm" class="font-semibold insist">Faculty of Technology, Policy and Management (TPM), TU Delft</a>, supervised by <a href="https://zsavvas.github.io/" class="font-semibold insist">Dr. Savvas Zannettou</a> and <a class="font-semibold insist" href="https://zhauniarovich.com/">Dr. Yury Zhauniarovich</a>.
            </p>
            <p class="mt-4 leading-relaxed text-gray-800">
              My research focuses on <span class="font-semibold insist">safety in human&ndash;AI interaction</span>, particularly Conversational AI Systems. I study how people interact with, perceive, and are affected by these systems, as well as the behavior of Conversational AI Systems themselves, with the goal of understanding and making these interactions safer.
            </p>
            <p class="mt-4 leading-relaxed text-gray-800">
              Grounded in a rigorous engineering background and professional experience as an AI/Software Engineer, I approach research with a builder's mindset.
            </p>
            <p class="mt-4 leading-relaxed text-gray-800">
              My work has been published at ACL, EMNLP, NAACL, and AAAI ICWSM. I also regularly serve the research community as an Area Chair, Session Chair, and Reviewer for conferences including ACL, EMNLP, NeurIPS, AAAI, and ECIR.
            </p>
            <p class="mt-4 leading-relaxed text-gray-800">
              On a personal note, I enjoy classic literature, especially Persian and Russian literature, and I was once a Dota 2 Immortal&mdash;a title I wear with mixed pride. Please don't hesitate to reach out if you see something interesting here :D I'm always open to new possibilities and experiences.
            </p>
          </div>
        </div>
      </header>

      <!-- News Section -->
      <NewsSection />

      <!-- Blog Preview Section -->
      <BlogPreviewSection />

      <!-- Education Section -->
      <EducationSection />

      <!-- Publications Section -->
      <PublicationsSection />

      <!-- Experiences Section -->
      <ExperiencesSection />

      <!-- Services Section -->
      <ServicesSection />

      <!-- Honors Section -->
      <HonorsSection />

      <!-- Skills Section -->
      <SkillsSection />

      <!-- Likes Section -->
      <LikesSection />
    </section>
  </div>
</template>

<script setup>
const sidebarOpen = ref(false)
const activeSection = ref('about')

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

// Track active section on scroll
const updateActiveSection = () => {
  const sections = ['about', 'news', 'blog', 'education', 'publications', 'experiences', 'services', 'honors', 'skills', 'interests']
  const scrollPosition = window.scrollY + 100
  
  for (const sectionId of sections) {
    const section = document.getElementById(sectionId)
    if (section) {
      const sectionTop = section.offsetTop
      const sectionBottom = sectionTop + section.offsetHeight
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        activeSection.value = sectionId
        break
      }
    }
  }
}

// Close sidebar when clicking outside
onMounted(() => {
  // Add scroll listener
  window.addEventListener('scroll', updateActiveSection)
  updateActiveSection()
  
  document.addEventListener('click', (event) => {
    if (sidebarOpen.value) {
      const sidebar = document.querySelector('.sticky-sidebar')
      const menuToggle = document.querySelector('.hamburger')
      
      if (sidebar && menuToggle) {
        const isClickInsideSidebar = sidebar.contains(event.target)
        const isClickInsideMenuToggle = menuToggle.contains(event.target)
        
        if (!isClickInsideSidebar && !isClickInsideMenuToggle) {
          closeSidebar()
        }
      }
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveSection)
})
</script>
