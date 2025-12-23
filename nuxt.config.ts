// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  modules: [
    '@nuxt/content',
    '@nuxtjs/tailwindcss'
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Vahid Rahimzadeh - Personal Website',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'PhD student at TU Delft researching AI safety and responsible integration' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'stylesheet', href: 'https://kit.fontawesome.com/6fbcb97dd8.css', crossorigin: 'anonymous' }
      ],
      script: [
        { src: 'https://kit.fontawesome.com/6fbcb97dd8.js', crossorigin: 'anonymous' }
      ]
    }
  },

  // Static site generation for GitHub Pages
  ssr: true,
  
  // GitHub Pages configuration
  nitro: {
    preset: 'static',
    output: {
      publicDir: 'docs'
    }
  },

  content: {
    highlight: {
      theme: 'github-dark',
      preload: ['javascript', 'typescript', 'python']
    },
    markdown: {
      toc: {
        depth: 3,
        searchDepth: 3
      }
    }
  }
})
