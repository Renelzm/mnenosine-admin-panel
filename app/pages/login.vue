<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-sm" variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-layout-dashboard" class="size-6 text-primary" />
          <h1 class="text-lg font-semibold">
            Iniciar sesión
          </h1>
        </div>
      </template>

      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :description="error"
        />

        <UFormField label="Email" name="email" required>
          <UInput v-model="state.email" type="email" class="w-full" />
        </UFormField>

        <UFormField label="Contraseña" name="password" required>
          <UInput v-model="state.password" type="password" class="w-full" />
        </UFormField>

        <UButton label="Entrar" type="submit" block :loading="entrando" />
      </UForm>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = useZodSchemas().login

const state = reactive<{ email?: string, password?: string }>({})
const formRef = ref()
const entrando = ref(false)
const error = ref('')

const { fetch: refrescarSesion } = useUserSession()

async function onSubmit(event: FormSubmitEvent<any>) {
  entrando.value = true
  error.value = ''

  try {
    await $fetch('/api/login', { method: 'POST', body: event.data })
    await refrescarSesion()
    await navigateTo('/')
  } catch {
    error.value = 'Credenciales inválidas'
  } finally {
    entrando.value = false
  }
}
</script>
