<template>
  <UModal
    v-model:open="open"
    :title="esEdicion ? 'Editar bot' : 'Nuevo bot'"
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

        <UFormField label="Zona" name="zona" required>
          <UInput v-model="state.zona" class="w-full" />
        </UFormField>

        <UFormField label="Alcance" name="alcance" required>
          <USelect v-model="state.alcance" :items="opcionesAlcance" class="w-full" />
        </UFormField>

        <UFormField label="Institución contratante" name="institucion_contratante">
          <UInput v-model="state.institucion_contratante" class="w-full" />
        </UFormField>

        <UFormField label="Medio" name="medio">
          <UInput v-model="state.medio" class="w-full" />
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

interface Bot {
  id: number
  zona: string
  nombre: string
  institucion_contratante: string | null
  medio: string | null
  activo: boolean | null
  alcance: string
}

const props = defineProps<{
  bot?: Bot | null
}>()

const emit = defineEmits<{
  guardado: []
}>()

const open = defineModel<boolean>('open', { default: false })

const esEdicion = computed(() => !!props.bot)
const schema = computed(() => esEdicion.value ? useZodSchemas().bots.actualizar : useZodSchemas().bots.crear)

const opcionesAlcance = [
  { label: 'Curado', value: 'curado' },
  { label: 'Todos', value: 'todos' }
]

const state = reactive<{
  nombre?: string
  zona?: string
  alcance?: string
  institucion_contratante?: string
  medio?: string
  activo?: boolean
}>({})

const formRef = ref()
const guardando = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return

  if (props.bot) {
    state.nombre = props.bot.nombre
    state.zona = props.bot.zona
    state.alcance = props.bot.alcance
    state.institucion_contratante = props.bot.institucion_contratante ?? undefined
    state.medio = props.bot.medio ?? undefined
    state.activo = props.bot.activo ?? true
  } else {
    state.nombre = undefined
    state.zona = undefined
    state.alcance = 'curado'
    state.institucion_contratante = undefined
    state.medio = undefined
    state.activo = undefined
  }
}, { immediate: true })

async function onSubmit(event: FormSubmitEvent<any>) {
  guardando.value = true

  try {
    if (esEdicion.value && props.bot) {
      await $fetch(`/api/bots/${props.bot.id}`, { method: 'PUT', body: event.data })
    } else {
      await $fetch('/api/bots', { method: 'POST', body: event.data })
    }

    open.value = false
    emit('guardado')
  } catch (error: any) {
    formRef.value?.setErrors([{ name: 'nombre', message: error?.statusMessage ?? 'No se pudo guardar el bot' }])
  } finally {
    guardando.value = false
  }
}
</script>
