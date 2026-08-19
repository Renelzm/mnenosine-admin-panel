<template>
  <UModal
    v-model:open="open"
    :title="esEdicion ? 'Editar actor' : 'Nuevo actor'"
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

        <UFormField label="Institución" name="institucion_id" required>
          <USelect v-model="state.institucion_id" :items="opcionesInstitucion" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField label="Dependencia" name="dependencia">
            <UInput v-model="state.dependencia" class="w-full" />
          </UFormField>

          <UFormField label="Puesto" name="puesto">
            <UInput v-model="state.puesto" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField label="Vigente desde" name="vigente_desde">
            <UInput v-model="state.vigente_desde" type="date" class="w-full" />
          </UFormField>

          <UFormField label="Vigente hasta" name="vigente_hasta">
            <UInput v-model="state.vigente_hasta" type="date" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField label="Circunstancia" name="circunstancia">
            <UInput v-model="state.circunstancia" class="w-full" />
          </UFormField>

          <UFormField label="Circunstancia hasta" name="circunstancia_hasta">
            <UInput v-model="state.circunstancia_hasta" type="date" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Nota" name="nota">
          <UTextarea v-model="state.nota" class="w-full" />
        </UFormField>

        <UFormField v-if="esEdicion" label="Activo" name="activo">
          <USwitch v-model="state.activo" />
        </UFormField>

        <UFormField label="Bots segmentados" name="bots_curados">
          <UCheckboxGroup
            v-model="state.bots_curados"
            :items="opcionesBotsCurado"
            value-key="value"
            label-key="label"
          />

          <p v-if="!opcionesBotsCurado.length" class="text-sm text-muted">
            No hay bots segmentados activos.
          </p>
        </UFormField>

        <UAlert
          v-if="botsTodos.length"
          color="neutral"
          variant="subtle"
          icon="i-lucide-info"
          title="Este actor también aparecerá automáticamente en:"
          :description="botsTodos.map(b => b.nombre).join(', ')"
        />

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

interface Actor {
  id: number
  nombre: string
  institucion_id: number
  dependencia: string | null
  puesto: string | null
  vigente_desde: string | null
  vigente_hasta: string | null
  circunstancia: string | null
  circunstancia_hasta: string | null
  nota: string | null
  activo: boolean | null
  bots_curados: number[]
}

interface Institucion {
  id: number
  nombre: string
  activa: boolean | null
}

interface Bot {
  id: number
  nombre: string
  alcance: string
  activo: boolean | null
}

const props = defineProps<{
  actor?: Actor | null
}>()

const emit = defineEmits<{
  guardado: []
}>()

const open = defineModel<boolean>('open', { default: false })

const esEdicion = computed(() => !!props.actor)
const schema = computed(() => esEdicion.value ? useZodSchemas().actores.actualizar : useZodSchemas().actores.crear)

const { data: instituciones, refresh: refrescarInstituciones } = useFetch<Institucion[]>('/api/instituciones')
const { data: bots, refresh: refrescarBots } = useFetch<Bot[]>('/api/bots')

const opcionesInstitucion = computed(() => {
  return (instituciones.value ?? [])
    .filter(i => i.activa || i.id === props.actor?.institucion_id)
    .map(i => ({ label: i.nombre, value: i.id }))
})

const opcionesBotsCurado = computed(() => {
  return (bots.value ?? [])
    .filter(b => b.alcance === 'curado' && b.activo)
    .map(b => ({ label: b.nombre, value: String(b.id) }))
})

const botsTodos = computed(() => {
  return (bots.value ?? []).filter(b => b.alcance === 'todos' && b.activo)
})

function aFechaInput(fecha?: string | null) {
  return fecha ? fecha.slice(0, 10) : undefined
}

const state = reactive<{
  nombre?: string
  institucion_id?: number
  dependencia?: string
  puesto?: string
  vigente_desde?: string
  vigente_hasta?: string
  circunstancia?: string
  circunstancia_hasta?: string
  nota?: string
  activo?: boolean
  bots_curados: string[]
}>({ bots_curados: [] })

const formRef = ref()
const guardando = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return

  refrescarInstituciones()
  refrescarBots()

  if (props.actor) {
    state.nombre = props.actor.nombre
    state.institucion_id = props.actor.institucion_id
    state.dependencia = props.actor.dependencia ?? undefined
    state.puesto = props.actor.puesto ?? undefined
    state.vigente_desde = aFechaInput(props.actor.vigente_desde)
    state.vigente_hasta = aFechaInput(props.actor.vigente_hasta)
    state.circunstancia = props.actor.circunstancia ?? undefined
    state.circunstancia_hasta = aFechaInput(props.actor.circunstancia_hasta)
    state.nota = props.actor.nota ?? undefined
    state.activo = props.actor.activo ?? true
    state.bots_curados = props.actor.bots_curados.map(String)
  } else {
    state.nombre = undefined
    state.institucion_id = undefined
    state.dependencia = undefined
    state.puesto = undefined
    state.vigente_desde = undefined
    state.vigente_hasta = undefined
    state.circunstancia = undefined
    state.circunstancia_hasta = undefined
    state.nota = undefined
    state.activo = undefined
    state.bots_curados = []
  }
}, { immediate: true })

async function onSubmit(event: FormSubmitEvent<any>) {
  guardando.value = true

  try {
    if (esEdicion.value && props.actor) {
      await $fetch(`/api/actores/${props.actor.id}`, { method: 'PUT', body: event.data })
    } else {
      await $fetch('/api/actores', { method: 'POST', body: event.data })
    }

    open.value = false
    emit('guardado')
  } catch (error: any) {
    formRef.value?.setErrors([{ name: 'nombre', message: error?.statusMessage ?? 'No se pudo guardar el actor' }])
  } finally {
    guardando.value = false
  }
}
</script>
