<template>
  <UTable
    :data="data ?? []"
    :columns="columns"
    :loading="status === 'pending'"
    :ui="{ th: 'px-3 py-2', td: 'px-3 py-2' }"
  >
    <template #categoria_secundaria-cell="{ row }">
      {{ row.original.categoria_secundaria ?? '—' }}
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
        aria-label="Editar tema"
        @click="emit('editar', row.original)"
      />
    </template>
  </UTable>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

interface Tema {
  id: number
  nombre: string
  activo: boolean | null
  categoria_id: number | null
  categoria: string | null
  categoria_secundaria_id: number | null
  categoria_secundaria: string | null
}

const emit = defineEmits<{
  editar: [tema: Tema]
}>()

const { data, refresh, status } = useFetch<Tema[]>('/api/temas')

const columns: TableColumn<Tema>[] = [
  { id: 'acciones', header: '' },
  { accessorKey: 'activo', header: 'Activo' },
  { accessorKey: 'nombre', header: 'Nombre' },
  { accessorKey: 'categoria', header: 'Categoría' },
  { accessorKey: 'categoria_secundaria', header: 'Categoría secundaria' }
]

defineExpose({ refresh })
</script>
