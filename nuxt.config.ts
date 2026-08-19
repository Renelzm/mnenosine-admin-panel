// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-zod'
  ],

  nuxtZod: {
    zodVersion: 'v4'
  },

  icon: {
    provider: 'server',
    clientBundle: {
      icons: [
        'lucide:users',
        'lucide:landmark',
        'lucide:tag',
        'lucide:bot',
        'lucide:pencil'
      ]
    }
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
