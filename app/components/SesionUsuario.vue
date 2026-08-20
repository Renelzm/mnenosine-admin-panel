<template>
  <div v-if="user" class="flex shrink-0 items-center gap-2">
    <span class="hidden text-sm text-muted sm:inline">{{ user.nombre }}</span>
    <UButton
      label="Cerrar sesión"
      icon="i-lucide-log-out"
      color="neutral"
      variant="ghost"
      @click="cerrarSesion"
    />
  </div>
</template>

<script lang="ts" setup>
const { user, clear } = useUserSession()

async function cerrarSesion() {
  await clear()
  await navigateTo('/login')
}
</script>
