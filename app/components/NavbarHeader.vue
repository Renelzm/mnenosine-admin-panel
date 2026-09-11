<template>
  <nav
    class="flex gap-1"
    :class="vertical ? 'flex-col items-stretch' : 'items-center overflow-x-auto'"
  >
    <UButton
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      :icon="link.icon"
      :label="link.label"
      color="neutral"
      :variant="route.path.startsWith(link.to) ? 'soft' : 'ghost'"
      :block="vertical"
      :class="vertical ? 'justify-start' : 'shrink-0'"
    />
  </nav>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ vertical?: boolean }>(), { vertical: false })

const route = useRoute()

const links = [
  { to: '/actores', label: 'Actores', icon: 'i-lucide-users' },
  { to: '/instituciones', label: 'Instituciones', icon: 'i-lucide-landmark' },
  { to: '/temas', label: 'Temas', icon: 'i-lucide-tag' },
  { to: '/bots', label: 'Bots', icon: 'i-lucide-bot' },
  { to: '/reporte_pdf', label: 'Reporte PDF', icon: 'i-lucide-file-text' }
]
</script>
