<template>
  <div 
    :class="['z-40 flex flex-col items-stretch p-4 rounded-lg shadow-md sticky-sidebar md:sticky md:top-0 text-primary-900 h-screen md:h-auto', { 'open': isOpen }]"
  >
    <div>
      <img src="/profile-image.png" alt="Profile Picture" class="w-32 h-32 mx-auto mb-4 rounded-full">
      <h1 class="mb-2 text-xl font-semibold text-center">Vahid Rahimzadeh</h1>
      <div class="flex justify-center mb-4 space-x-2">
        <a href="https://telegram.me/vavredev" class="text-primary-500">
          <i class="text-2xl fab fa-telegram"></i>
        </a>
        <a href="https://www.linkedin.com/in/vavre/" class="text-primary-700">
          <i class="text-2xl fab fa-linkedin"></i>
        </a>
        <a href="https://x.com/vavredev" class="text-primary-400">
          <i class="text-2xl fab fa-twitter"></i>
        </a>
      </div>
      <p class="mb-4 text-center">
        <a href="mailto:vahyd@live.com" class="transition duration-300 text-primary-700 hover:text-primary-900">
          vahyd@live.com
        </a>
      </p>
    </div>
    
    <div class="flex-grow"></div>
    
    <nav class="my-4">
      <ul class="relative space-y-2 text-center">
        <li><a href="#about" :class="['block p-2 rounded hover:bg-primary-100', { 'active-link': activeSection === 'about' }]" @click="$emit('close')">About Me</a></li>
        <li><a href="#news" :class="['block p-2 rounded hover:bg-primary-100', { 'active-link': activeSection === 'news' }]" @click="$emit('close')">News</a></li>
        <li><a href="#blog" :class="['block p-2 rounded hover:bg-primary-100', { 'active-link': activeSection === 'blog' }]" @click="$emit('close')">Blog</a></li>
        <li><a href="#education" :class="['block p-2 rounded hover:bg-primary-100', { 'active-link': activeSection === 'education' }]" @click="$emit('close')">Education</a></li>
        <li><a href="#publications" :class="['block p-2 rounded hover:bg-primary-100', { 'active-link': activeSection === 'publications' }]" @click="$emit('close')">Publications</a></li>
        <li><a href="#experiences" :class="['block p-2 rounded hover:bg-primary-100', { 'active-link': activeSection === 'experiences' }]" @click="$emit('close')">Experiences</a></li>
        <li><a href="#services" :class="['block p-2 rounded hover:bg-primary-100', { 'active-link': activeSection === 'services' }]" @click="$emit('close')">Services</a></li>
        <li><a href="#honors" :class="['block p-2 rounded hover:bg-primary-100', { 'active-link': activeSection === 'honors' }]" @click="$emit('close')">Honors and Awards</a></li>
        <li><a href="#skills" :class="['block p-2 rounded hover:bg-primary-100', { 'active-link': activeSection === 'skills' }]" @click="$emit('close')">Skills</a></li>
        <li><a href="#interests" :class="['block p-2 rounded hover:bg-primary-100', { 'active-link': activeSection === 'interests' }]" @click="$emit('close')">Interests</a></li>
      </ul>
    </nav>
    
    <div class="flex-grow"></div>
    
    <!-- Copyright -->
    <div class="pt-4 border-t border-primary-200 text-center text-xs text-gray-600">
      <p>&copy; 2025 Vahid Rahimzadeh</p>
      <p>All rights reserved</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  activeSection: String
})

defineEmits(['close'])
</script>
