<template>
  <UDropdownMenu v-if="user" :items="items" size="sm" :content="{ align: 'end' }">
    <UButton
      color="neutral"
      variant="ghost"
      class="rounded-full p-0"
      aria-label="Cuenta"
    >
      <UAvatar :text="inicial" size="sm" />
    </UButton>
  </UDropdownMenu>
</template>

<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'

const { user, clear } = useUserSession()

const inicial = computed(() => user.value?.nombre?.trim().charAt(0).toUpperCase() ?? '?')

async function cerrarSesion() {
  await clear()
  await navigateTo('/login')
}

const items = computed<DropdownMenuItem[][]>(() => [
  [
    { label: user.value?.nombre ?? '', type: 'label' },
    { label: user.value?.email ?? '', type: 'label' }
  ],
  [
    { label: 'Cerrar sesión', icon: 'i-lucide-log-out', color: 'error', onSelect: cerrarSesion }
  ]
])
</script>
