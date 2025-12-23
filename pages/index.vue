<template>
  <div class="container mx-auto p-4 pt-[5rem] md:pt-4 flex flex-col md:flex-row">
    <!-- Mobile Menu Toggle -->
    <div class="fixed top-0 left-0 z-40 self-stretch w-full px-2 py-4 bg-white border shadow-lg border-primary-50 md:hidden flex items-center justify-between">
      <div class="z-50 ml-4 hamburger cursor-pointer" @click="toggleSidebar">
        <i class="fas fa-bars fa-2x"></i>
      </div>
      <a href="/CV_Vahid_Rahimzadeh_Dec_2025.pdf" class="inline-block px-3 py-1.5 text-sm text-white transition duration-300 rounded bg-primary-600 hover:bg-primary-700 mr-4">
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
              <a href="/CV_Vahid_Rahimzadeh_Dec_2025.pdf" class="inline-block px-4 py-2 text-white transition duration-300 rounded bg-primary-600 hover:bg-primary-700">
                Download CV
              </a>
            </div>
            <div class="text-gray-700">
              <p><i class="mr-2 fas fa-envelope"></i>vahyd@live.com</p>
            </div>
            <p class="mt-6 leading-relaxed text-gray-800">
              I am a first-year PhD student at <a href="https://www.tudelft.nl/en/tpm" class="font-semibold insist">TU Delft</a>, where I am supervised by <a href="https://zsavvas.github.io/" class="font-semibold insist">Savvas Zannettou</a> and <a class="font-semibold insist" href="https://zhauniarovich.com/">Yury Zhauniarovich</a>. My research focuses on the safe and responsible integration of AI in digital environments, positioned at the intersection of Natural Language Processing, Information Retrieval, and Computational Social Science.
            </p>
            <p class="mt-4 leading-relaxed text-gray-800">
              My journey is driven by a joy for exploring diverse fields and a passion for building new things. It's a path that has given me the privilege of leading research and industry teams, launching successful products, and teaching/managing large university courses. These varied experiences are the foundation of my interdisciplinary work and my aspiration to build a <span class="font-semibold insist">"Distributed Scientific Persona"</span> —firmly anchored in computer science but deeply enriched by the social sciences and humanities. I'm always excited to connect with others who share a passion for learning and collaboration, so please don't hesitate to get in touch if you see anything interesting here :D
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
