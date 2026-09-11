<template>
  <UModal
    v-model:open="open"
    :title="esEdicion ? 'Editar página de Facebook' : 'Nueva página de Facebook'"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="URL de Facebook" name="fb_profile_url" required>
          <UInput v-model="state.fb_profile_url" placeholder="https://www.facebook.com/..." class="w-full" />
        </UFormField>

        <UFormField label="Nombre mostrado" name="nombre_mostrado" required>
          <UInput v-model="state.nombre_mostrado" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton label="Cancelar" color="neutral" variant="ghost" @click="open = false" />
          <UButton label="Guardar" type="submit" :loading="guardando" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'

interface PaginaFacebook {
  id: number
  fb_profile_url: string | null
  nombre_mostrado: string | null
}

const props = defineProps<{
  pagina?: PaginaFacebook | null
}>()

const emit = defineEmits<{
  guardado: []
}>()

const open = defineModel<boolean>('open', { default: false })

const esEdicion = computed(() => !!props.pagina)
const schema = computed(() => esEdicion.value ? useZodSchemas().fbCuentas.actualizar : useZodSchemas().fbCuentas.crear)

const state = reactive<{
  fb_profile_url?: string
  nombre_mostrado?: string
}>({})

const formRef = ref()
const guardando = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return
  state.fb_profile_url = props.pagina?.fb_profile_url ?? undefined
  state.nombre_mostrado = props.pagina?.nombre_mostrado ?? undefined
}, { immediate: true })

async function onSubmit(event: FormSubmitEvent<any>) {
  guardando.value = true

  try {
    if (esEdicion.value && props.pagina) {
      await $fetch(`/api/fb_cuentas/${props.pagina.id}`, { method: 'PUT', body: event.data })
    } else {
      await $fetch('/api/fb_cuentas', { method: 'POST', body: event.data })
    }

    open.value = false
    emit('guardado')
  } catch (error: any) {
    formRef.value?.setErrors([{ name: 'fb_profile_url', message: error?.statusMessage ?? 'No se pudo guardar la página' }])
  } finally {
    guardando.value = false
  }
}
</script>
