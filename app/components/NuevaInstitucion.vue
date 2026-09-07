<template>
  <UModal
    v-model:open="open"
    :title="esEdicion ? 'Editar institución' : 'Nueva institución'"
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

        <UFormField label="Nivel" name="nivel" required>
          <USelect v-model="state.nivel" :items="NIVELES" class="w-full" />
        </UFormField>

        <UFormField label="Estado" name="estado">
          <UInput v-model="state.estado" class="w-full" />
        </UFormField>

        <UFormField label="Municipio" name="municipio">
          <UInput v-model="state.municipio" class="w-full" />
        </UFormField>

        <UFormField v-if="esEdicion" label="Activa" name="activa">
          <USwitch v-model="state.activa" />
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

interface Institucion {
  id: number
  nombre: string
  nivel: string
  estado: string | null
  municipio: string | null
  activa: boolean | null
}

const NIVELES = ['MUNICIPAL', 'ESTATAL', 'FEDERAL', 'AUTONOMO', 'IP', 'EDUCACION', 'PARTIDO POLITICO', 'OTROS'] as const

const props = defineProps<{
  institucion?: Institucion | null
}>()

const emit = defineEmits<{
  guardado: []
}>()

const open = defineModel<boolean>('open', { default: false })

const esEdicion = computed(() => !!props.institucion)
const schema = computed(() => esEdicion.value ? useZodSchemas().instituciones.actualizar : useZodSchemas().instituciones.crear)

const state = reactive<{
  nombre?: string
  nivel?: typeof NIVELES[number]
  estado?: string
  municipio?: string
  activa?: boolean
}>({})

const formRef = ref()
const guardando = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return

  if (props.institucion) {
    state.nombre = props.institucion.nombre
    state.nivel = props.institucion.nivel as typeof NIVELES[number]
    state.estado = props.institucion.estado ?? undefined
    state.municipio = props.institucion.municipio ?? undefined
    state.activa = props.institucion.activa ?? true
  } else {
    state.nombre = undefined
    state.nivel = undefined
    state.estado = undefined
    state.municipio = undefined
    state.activa = undefined
  }
}, { immediate: true })

async function onSubmit(event: FormSubmitEvent<any>) {
  guardando.value = true

  try {
    if (esEdicion.value && props.institucion) {
      await $fetch(`/api/instituciones/${props.institucion.id}`, { method: 'PUT', body: event.data })
    } else {
      await $fetch('/api/instituciones', { method: 'POST', body: event.data })
    }

    open.value = false
    emit('guardado')
  } catch (error: any) {
    formRef.value?.setErrors([{ name: 'nombre', message: error?.statusMessage ?? 'No se pudo guardar la institución' }])
  } finally {
    guardando.value = false
  }
}
</script>
