<template>
  <UModal
    v-model:open="open"
    :title="esEdicion ? 'Editar tema' : 'Nuevo tema'"
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

        <UFormField label="Categoría" name="categoria_id" required>
          <USelect v-model="state.categoria_id" :items="opcionesCategoria" class="w-full" />
        </UFormField>

        <UFormField label="Categoría secundaria" name="categoria_secundaria_id">
          <USelect v-model="state.categoria_secundaria_id" :items="opcionesCategoriaSecundaria" class="w-full" />
        </UFormField>

        <UFormField v-if="esEdicion" label="Activo" name="activo">
          <USwitch v-model="state.activo" />
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

interface Tema {
  id: number
  nombre: string
  activo: boolean | null
  categoria_id: number | null
  categoria_secundaria_id: number | null
}

const props = defineProps<{
  tema?: Tema | null
}>()

const emit = defineEmits<{
  guardado: []
}>()

const open = defineModel<boolean>('open', { default: false })

const esEdicion = computed(() => !!props.tema)
const schema = computed(() => esEdicion.value ? useZodSchemas().temas.actualizar : useZodSchemas().temas.crear)

const { data: categorias, refresh: refrescarCategorias } = useFetch<{ id: number, nombre: string }[]>('/api/categorias-tema')

const opcionesCategoria = computed(() => (categorias.value ?? []).map(c => ({ label: c.nombre, value: c.id })))
const opcionesCategoriaSecundaria = computed(() => [{ label: 'Ninguna', value: 0 }, ...opcionesCategoria.value])

const state = reactive<{
  nombre?: string
  categoria_id?: number
  categoria_secundaria_id?: number
  activo?: boolean
}>({})

const formRef = ref()
const guardando = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return

  refrescarCategorias()

  if (props.tema) {
    state.nombre = props.tema.nombre
    state.categoria_id = props.tema.categoria_id ?? undefined
    state.categoria_secundaria_id = props.tema.categoria_secundaria_id ?? 0
    state.activo = props.tema.activo ?? true
  } else {
    state.nombre = undefined
    state.categoria_id = undefined
    state.categoria_secundaria_id = 0
    state.activo = undefined
  }
}, { immediate: true })

async function onSubmit(event: FormSubmitEvent<any>) {
  guardando.value = true

  const body = {
    ...event.data,
    categoria_secundaria_id: event.data.categoria_secundaria_id || undefined
  }

  try {
    if (esEdicion.value && props.tema) {
      await $fetch(`/api/temas/${props.tema.id}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/temas', { method: 'POST', body })
    }

    open.value = false
    emit('guardado')
  } catch (error: any) {
    formRef.value?.setErrors([{ name: 'nombre', message: error?.statusMessage ?? 'No se pudo guardar el tema' }])
  } finally {
    guardando.value = false
  }
}
</script>
