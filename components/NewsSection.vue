<template>
  <section id="news" class="relative z-10 p-6 mt-4 border rounded-lg shadow-md bg-gradient-to-br from-white to-primary-50/80 backdrop-blur-md bg-opacity-60 border-primary-100">
    <div class="circle-deep-green w-60 h-60 rounded-full absolute z-[-1] bottom-4 left-0 transform -translate-x-1/2"></div>
    <div class="circle-deep-green w-60 h-60 rounded-full absolute z-[-1] top-1/2 right-0 transform translate-x-1/4"></div>
    <div class="relative z-10">
      <h2 class="inline-block px-4 py-2 mb-6 text-base font-bold border rounded bg-primary-50 border-primary-200">News</h2>
      
      <ul class="space-y-3 list-disc list-inside">
        <li v-for="(item, index) in paginatedNews" :key="index">
          <span class="font-semibold">{{ item.date }}:</span> <span v-html="item.content"></span>
        </li>
      </ul>

      <!-- Pagination Controls -->
      <div class="flex items-center justify-center gap-2 mt-6" v-if="totalPages > 1">
        <!-- Previous Button -->
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="px-3 py-1 text-sm font-medium border rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-100 hover:border-primary-300"
          :class="currentPage === 1 ? 'bg-gray-100 border-gray-300 text-gray-400' : 'bg-white border-primary-200 text-primary-700'"
        >
          Previous
        </button>

        <!-- Page Numbers -->
        <button
          v-for="page in displayedPages"
          :key="page"
          @click="currentPage = page"
          class="px-3 py-1 text-sm font-medium border rounded transition-colors"
          :class="currentPage === page 
            ? 'bg-primary-600 border-primary-600 text-white' 
            : 'bg-white border-primary-200 text-primary-700 hover:bg-primary-100 hover:border-primary-300'"
        >
          {{ page }}
        </button>

        <!-- Next Button -->
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="px-3 py-1 text-sm font-medium border rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-100 hover:border-primary-300"
          :class="currentPage === totalPages ? 'bg-gray-100 border-gray-300 text-gray-400' : 'bg-white border-primary-200 text-primary-700'"
        >
          Next
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

const currentPage = ref(1)
const itemsPerPage = 8

const newsItems = [
  { date: 'Nov 2025', content: 'Achieved IELTS Academic score of 8.5/9.0' },
  { date: 'Oct 2025', content: 'Started my PhD at TU Delft' },
  { date: 'Sep 2025', content: 'New resource paper, <a class="insist" href="https://www.arxiv.org/abs/2506.07606">PolitiSky24</a> accepted to <b>EMNLP 2025, Findings</b>' },
  { date: 'Aug 2025', content: 'Defended my M.Sc thesis with <b>distinction</b>' },
  { date: 'May 2025', content: 'Our work on <a class="insist" href="https://arxiv.org/abs/2505.06184">User Profiling in Social Networks with LLMs</a> accepted to <b>MisD@ICWSM 2025</b>' },
  { date: 'Apr 2025', content: '<a class="insist" href="https://aclanthology.org/2025.naacl-long.631/">PerCul</a> was presented in Frontiers 2025 symposium at TeIAS and won the honorable mention award' },
  { date: 'Mar 2025', content: 'Acted as official reviewer for <b>ACL 2025</b>' },
  { date: 'Jan 2025', content: 'Shortlisted in <b>ELLIS and Mila 2025</b>' },
  { date: 'Jan 2025', content: 'Selected as Head TA and TA for Advanced Data Mining, Large Language Models and Advanced NLP courses in University of Tehran and Cardiff University' },
  { date: 'Dec 2024', content: 'Our work, <a class="insist" href="https://aclanthology.org/2025.naacl-long.631/">PerCul</a> accepted <b>to NAACL 2025</b> Main Conference' },
  { date: 'October 2024', content: 'Got a position as Part-time researcher in Tehran Institute for Advanced Studies' },
]

const totalPages = computed(() => Math.ceil(newsItems.length / itemsPerPage))

const paginatedNews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return newsItems.slice(start, end)
})

const displayedPages = computed(() => {
  const pages = []
  const maxPagesToShow = 5
  
  if (totalPages.value <= maxPagesToShow) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)
    
    // Calculate range around current page
    let start = Math.max(2, currentPage.value - 1)
    let end = Math.min(totalPages.value - 1, currentPage.value + 1)
    
    // Add ellipsis or pages after first
    if (start > 2) {
      pages.push('...')
    }
    
    // Add middle pages
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages.value) {
        pages.push(i)
      }
    }
    
    // Add ellipsis or pages before last
    if (end < totalPages.value - 1) {
      pages.push('...')
    }
    
    // Always show last page
    if (totalPages.value > 1) {
      pages.push(totalPages.value)
    }
  }
  
  return pages
})
</script>
