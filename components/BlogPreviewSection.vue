<template>
  <section id="blog" class="relative z-10 p-6 mt-4 border rounded-lg shadow-md bg-gradient-to-br from-white to-primary-50/80 backdrop-blur-md bg-opacity-60 border-primary-100">
    <div class="circle-deep-green w-60 h-60 rounded-full absolute z-[-1] bottom-4 right-0 transform translate-x-1/2"></div>
    <div class="relative z-10">
      <div class="flex items-center justify-between mb-6">
        <h2 class="inline-block px-4 py-2 text-base font-bold border rounded bg-primary-50 border-primary-200">Latest Blog Posts</h2>
        <NuxtLink to="/blog" class="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors">
          View All <i class="fas fa-arrow-right ml-1"></i>
        </NuxtLink>
      </div>
      
      <div v-if="posts && posts.length" class="grid gap-4 md:grid-cols-3">
        <article 
          v-for="post in posts.slice(0, 3)" 
          :key="post._path"
          class="p-4 border rounded-lg bg-white/80 border-primary-100 hover:shadow-md transition-all flex flex-col"
        >
          <NuxtLink :to="post._path" class="flex flex-col h-full">
            <div>
              <h3 class="text-lg font-semibold text-primary-800 mb-2 hover:text-primary-600 transition-colors">
                {{ post.title }}
              </h3>
              <p class="text-sm text-gray-600 mb-3 line-clamp-2">
                {{ post.description }}
              </p>
            </div>
            
            <div class="flex-grow"></div>
            
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span><i class="far fa-calendar mr-1"></i>{{ formatDate(post.date) }}</span>
              <span class="text-primary-600 font-medium">Read more →</span>
            </div>
          </NuxtLink>
        </article>
      </div>
      
      <div v-else class="text-center py-8 text-gray-500">
        <p>No blog posts yet. Check back soon!</p>
      </div>
    </div>
  </section>
</template>

<script setup>
const { data: posts } = await useAsyncData('blog-preview', () => 
  queryContent('/blog')
    .sort({ date: -1 })
    .limit(3)
    .find()
)

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
