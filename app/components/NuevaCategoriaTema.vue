<template>
  <UModal
    v-model:open="open"
    :title="esEdicion ? 'Editar categoría' : 'Nueva categoría'"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Nombre" name="nombre" required>
          <UInput v-model="state.nombre" class="w-full" />
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

interface CategoriaTema {
  id: number
  nombre: string
}

const props = defineProps<{
  categoria?: CategoriaTema | null
}>()

const emit = defineEmits<{
  guardado: []
}>()

const open = defineModel<boolean>('open', { default: false })

const esEdicion = computed(() => !!props.categoria)
const schema = computed(() => esEdicion.value ? useZodSchemas().categoriasTema.actualizar : useZodSchemas().categoriasTema.crear)

const state = reactive<{ nombre?: string }>({})

const formRef = ref()
const guardando = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return
  state.nombre = props.categoria?.nombre
}, { immediate: true })

async function onSubmit(event: FormSubmitEvent<any>) {
  guardando.value = true

  try {
    if (esEdicion.value && props.categoria) {
      await $fetch(`/api/categorias-tema/${props.categoria.id}`, { method: 'PUT', body: event.data })
    } else {
      await $fetch('/api/categorias-tema', { method: 'POST', body: event.data })
    }

    open.value = false
    emit('guardado')
  } catch (error: any) {
    formRef.value?.setErrors([{ name: 'nombre', message: error?.statusMessage ?? 'No se pudo guardar la categoría' }])
  } finally {
    guardando.value = false
  }
}
</script>
