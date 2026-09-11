<template>
  <UTable
    :data="data ?? []"
    :columns="columns"
    :loading="status === 'pending'"
    :ui="{ th: 'px-3 py-2', td: 'px-3 py-2' }"
  >
    <template #alcance-cell="{ row }">
      <UBadge
        :color="row.original.alcance === 'curado' ? 'info' : 'neutral'"
        variant="subtle"
      >
        {{ row.original.alcance === 'curado' ? 'Curado' : 'Todos' }}
      </UBadge>
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
        aria-label="Editar bot"
        @click="emit('editar', row.original)"
      />
    </template>
  </UTable>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

interface Bot {
  id: number
  zona: string
  nombre: string
  institucion_contratante: string | null
  medio: string | null
  activo: boolean | null
  alcance: string
  actores_mapeados: number
}

const emit = defineEmits<{
  editar: [bot: Bot]
}>()

const { data, refresh, status } = useFetch<Bot[]>('/api/bots')

const columns: TableColumn<Bot>[] = [
  { id: 'acciones', header: '' },
  { accessorKey: 'activo', header: 'Activo' },
  { accessorKey: 'zona', header: 'Zona' },
  { accessorKey: 'nombre', header: 'Nombre' },
  { accessorKey: 'alcance', header: 'Alcance' },
  { accessorKey: 'medio', header: 'Medio' },
  { accessorKey: 'institucion_contratante', header: 'Institución contratante' },
  { accessorKey: 'actores_mapeados', header: 'Total de actores mapeados' }
]

defineExpose({ refresh })
</script>
