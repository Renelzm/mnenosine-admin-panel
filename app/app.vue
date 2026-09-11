<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'es'
  }
})

useSeoMeta({
  title: 'Panel ARGOS',
  description: 'Catálogo de actores, instituciones, temas y bots del sistema de monitoreo de medios ARGOS.'
})
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="text-lg font-bold shrink-0">
          ARGOS
        </NuxtLink>
      </template>

      <NavbarHeader />

      <template #right>
        <UColorModeButton />
        <SesionUsuario />
      </template>

      <template #body>
        <NavbarHeader vertical />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          Panel ARGOS • © {{ new Date().getFullYear() }}
        </p>
      </template>
    </UFooter>
  </UApp>
</template>
