<template>
  <nav class="flex items-center gap-1 overflow-x-auto">
    <UButton
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      :icon="link.icon"
      :label="link.label"
      color="neutral"
      :variant="route.path.startsWith(link.to) ? 'soft' : 'ghost'"
      class="shrink-0"
    />
  </nav>
</template>

<script lang="ts" setup>
const route = useRoute()

const links = [
  { to: '/actores', label: 'Actores', icon: 'i-lucide-users' },
  { to: '/instituciones', label: 'Instituciones', icon: 'i-lucide-landmark' },
  { to: '/temas', label: 'Temas', icon: 'i-lucide-tag' },
  { to: '/bots', label: 'Bots', icon: 'i-lucide-bot' },
  { to: '/reporte_pdf', label: 'Reporte PDF', icon: 'i-lucide-file-text' }
]
</script>
