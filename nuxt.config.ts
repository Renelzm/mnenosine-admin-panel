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
        'lucide:user',
        'lucide:landmark',
        'lucide:tag',
        'lucide:bot',
        'lucide:pencil',
        'lucide:arrow-up-down',
        'lucide:layout-dashboard',
        'lucide:log-out',
        'lucide:file-text',
        'lucide:download',
        'lucide:monitor',
        'lucide:smartphone',
        'lucide:trash-2',
        'lucide:send',
        'lucide:mail',
        'lucide:message-circle',
        'lucide:triangle-alert'
      ]
    }
  },

  runtimeConfig: {
    n8nPdfWebhookUrl: process.env.N8N_PDF_WEBHOOK_URL || '',
    n8nEnviarReporteWebhookUrl: process.env.N8N_ENVIAR_REPORTE_WEBHOOK_URL || ''
  },

  devtools: {
    enabled: true
  },

  // No inlinear zod en el bundle SSR.
  //
  // `zod/v4/core/to-json-schema.js` declara `function process(...)` en el top level, y
  // nuxt-zod lo expone como namespace (`export * as z`), asi que no se puede tree-shakear.
  // Nitro, por su lado, prepende `import process from 'node:process'` a cada chunk de
  // entrada (plugin `import-meta`, activo cuando el preset es node). Si zod queda dentro
  // de `.output/server/chunks/virtual/entry.mjs`, las dos declaraciones de `process`
  // colisionan y el server arranca pero truena al primer render SSR con
  // "SyntaxError: Identifier 'process' has already been declared" (build OK, runtime 500).
  //
  // Solo pasa con node_modules de pnpm (el build con npm si lo externaliza solo), por eso
  // no se reproduce en cualquier entorno. Marcarlo external deja zod en
  // `.output/server/node_modules/zod` y lo carga en runtime.
  vite: {
    $server: {
      build: {
        rollupOptions: {
          external: ['zod', /^zod\//]
        }
      }
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
