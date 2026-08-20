<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-3">
      <UInput
        v-model="busqueda"
        icon="i-lucide-search"
        placeholder="Buscar por nombre..."
        class="max-w-sm"
      />

      <USelect
        v-model="filtroInstitucion"
        :items="opcionesInstitucion"
        placeholder="Institución"
        class="w-80"
        :ui="{
          value: 'whitespace-normal',
          content: 'w-(--reka-select-trigger-width) max-w-none',
          itemLabel: 'whitespace-normal'
        }"
      />

      <USelect
        v-model="filtroEstado"
        :items="opcionesEstado"
        placeholder="Estado"
        class="w-40"
      />

      <USelect
        v-model="filtroMunicipio"
        :items="opcionesMunicipio"
        placeholder="Municipio"
        class="w-40"
      />

      <USelect
        v-model="filtroBot"
        :items="opcionesBot"
        placeholder="Bot segmentado"
        class="w-48"
      />

      <UButton
        v-if="hayFiltrosActivos"
        label="Limpiar filtros"
        color="neutral"
        variant="ghost"
        @click="limpiarFiltros"
      />
    </div>

    <div class="overflow-x-auto">
      <UTable
        v-model:sorting="sorting"
        :data="filtrados"
        :columns="columns"
        :loading="status === 'pending' || statusBots === 'pending'"
        :ui="{ th: 'px-3 py-2 whitespace-nowrap', td: 'px-3 py-2 align-top' }"
      >
        <template #institucion-cell="{ row }">
          <span class="block min-w-48 whitespace-normal break-words">{{ row.original.institucion }}</span>
        </template>

        <template #dependencia-cell="{ row }">
          <span class="block min-w-32 whitespace-normal break-words">{{ row.original.dependencia ?? '—' }}</span>
        </template>

        <template #vigente_desde-cell="{ row }">
          {{ formatearFecha(row.original.vigente_desde) }}
        </template>

        <template #vigente_hasta-cell="{ row }">
          {{ formatearFecha(row.original.vigente_hasta) }}
        </template>

        <template #circunstancia-cell="{ row }">
          <span class="block min-w-32 whitespace-normal break-words">{{ row.original.circunstancia ?? '—' }}</span>
        </template>

        <template #circunstancia_hasta-cell="{ row }">
          {{ formatearFecha(row.original.circunstancia_hasta) }}
        </template>

        <template #nota-cell="{ row }">
          <span class="block min-w-64 whitespace-normal break-words text-sm text-muted">{{ row.original.nota ?? '—' }}</span>
        </template>

        <template #bots-cell="{ row }">
          <span class="block min-w-40 whitespace-normal break-words">{{ nombresBots(row.original.bots_curados) }}</span>
        </template>

        <template #activo-cell="{ row }">
          <UBadge
            :color="row.original.activo ? 'success' : 'neutral'"
            variant="subtle"
          >
            {{ row.original.activo ? 'Activo' : 'Inactivo' }}
          </UBadge>
        </template>

        <template #acciones-cell="{ row }">
          <UButton
            icon="i-lucide-pencil"
            size="xs"
            color="neutral"
            variant="ghost"
            aria-label="Editar actor"
            @click="emit('editar', row.original)"
          />
        </template>
      </UTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { SortingState } from '@tanstack/vue-table'

interface Actor {
  id: number
  nombre: string
  institucion_id: number
  institucion: string
  institucion_nivel: string
  institucion_estado: string | null
  institucion_municipio: string | null
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

interface Bot {
  id: number
  nombre: string
  alcance: string
  activo: boolean | null
}

const emit = defineEmits<{
  editar: [actor: Actor]
}>()

const { data, refresh, status } = useFetch<Actor[]>('/api/actores')
const { data: bots, status: statusBots } = useFetch<Bot[]>('/api/bots')

const sorting = ref<SortingState>([])

function encabezadoOrdenable(etiqueta: string) {
  return ({ column }: { column: any }) => {
    const orden = column.getIsSorted()
    return h(resolveComponent('UButton'), {
      label: etiqueta,
      color: 'neutral',
      variant: 'ghost',
      class: '-mx-2.5 px-2.5',
      icon: orden === 'asc' ? 'i-lucide-arrow-up' : orden === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
      onClick: () => column.toggleSorting(orden === 'asc')
    })
  }
}

const busqueda = ref('')
const filtroInstitucion = ref<string>()
const filtroEstado = ref<string>()
const filtroMunicipio = ref<string>()
const filtroBot = ref<string>()

const opcionesInstitucion = computed(() => {
  const nombres = new Set((data.value ?? []).map(a => a.institucion))
  return [...nombres].sort()
})

const opcionesEstado = computed(() => {
  const estados = new Set((data.value ?? []).map(a => a.institucion_estado).filter((e): e is string => !!e))
  return [...estados].sort()
})

const opcionesMunicipio = computed(() => {
  const municipios = new Set((data.value ?? []).map(a => a.institucion_municipio).filter((m): m is string => !!m))
  return [...municipios].sort()
})

const opcionesBot = computed(() => {
  return (bots.value ?? [])
    .filter(bot => bot.alcance === 'curado')
    .map(bot => ({ label: bot.nombre, value: String(bot.id) }))
})

const hayFiltrosActivos = computed(() =>
  !!busqueda.value || !!filtroInstitucion.value || !!filtroEstado.value || !!filtroMunicipio.value || !!filtroBot.value
)

function limpiarFiltros() {
  busqueda.value = ''
  filtroInstitucion.value = undefined
  filtroEstado.value = undefined
  filtroMunicipio.value = undefined
  filtroBot.value = undefined
}

function formatearFecha(fecha: string | null) {
  return fecha ? fecha.slice(0, 10) : '—'
}

function nombresBots(idsBots: number[]) {
  if (!idsBots.length) return '—'
  const catalogo = bots.value ?? []
  return idsBots
    .map(id => catalogo.find(bot => bot.id === id)?.nombre ?? `#${id}`)
    .join(', ')
}

const filtrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  const botId = filtroBot.value ? Number(filtroBot.value) : undefined

  return (data.value ?? []).filter((actor) => {
    if (texto && !actor.nombre.toLowerCase().includes(texto)) return false
    if (filtroInstitucion.value && actor.institucion !== filtroInstitucion.value) return false
    if (filtroEstado.value && actor.institucion_estado !== filtroEstado.value) return false
    if (filtroMunicipio.value && actor.institucion_municipio !== filtroMunicipio.value) return false
    if (botId && !actor.bots_curados.includes(botId)) return false
    return true
  })
})

const columns: TableColumn<Actor>[] = [
  {
    id: 'acciones',
    header: '',
    meta: {
      class: {
        th: 'sticky left-0 z-10 bg-elevated',
        td: 'sticky left-0 z-10 bg-elevated'
      }
    }
  },
  { accessorKey: 'activo', header: encabezadoOrdenable('Activo') },
  { id: 'bots', header: 'Bots' },
  { accessorKey: 'nombre', header: encabezadoOrdenable('Nombre') },
  { accessorKey: 'institucion', header: encabezadoOrdenable('Institución') },
  { accessorKey: 'dependencia', header: encabezadoOrdenable('Dependencia') },
  { accessorKey: 'puesto', header: encabezadoOrdenable('Puesto') },
  { accessorKey: 'nota', header: encabezadoOrdenable('Nota') },
  { accessorKey: 'vigente_desde', header: encabezadoOrdenable('Vigente desde') },
  { accessorKey: 'vigente_hasta', header: encabezadoOrdenable('Vigente hasta') },
  { accessorKey: 'circunstancia', header: encabezadoOrdenable('Circunstancia') },
  { accessorKey: 'circunstancia_hasta', header: encabezadoOrdenable('Circunstancia hasta') }
]

defineExpose({ refresh })
</script>
