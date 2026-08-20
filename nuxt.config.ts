// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-zod',
    'nuxt-auth-utils'
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
        'lucide:pencil',
        'lucide:arrow-up-down',
        'lucide:layout-dashboard',
        'lucide:log-out'
      ]
    }
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

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
