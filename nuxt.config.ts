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

  // Zod define `function process()` en v4/core/to-json-schema.js. Con pnpm, Vite no
  // externaliza zod y lo inlinea en el bundle SSR, donde choca con el
  // `import process from 'node:process'` que unenv inyecta al inicio de entry.mjs
  // ("SyntaxError: Identifier 'process' has already been declared" en produccion).
  // Externalizarlo lo deja en .output/server/node_modules y evita la colision.
  vite: {
    ssr: {
      external: ['zod']
    }
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
