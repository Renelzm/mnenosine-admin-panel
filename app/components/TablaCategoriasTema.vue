<template>
  <UTable
    :data="data ?? []"
    :columns="columns"
    :loading="status === 'pending'"
    :ui="{ th: 'px-3 py-2', td: 'px-3 py-2' }"
  >
    <template #acciones-cell="{ row }">
      <UButton
        icon="i-lucide-pencil"
        size="xs"
        color="neutral"
        variant="ghost"
        aria-label="Editar categoría"
        @click="emit('editar', row.original)"
      />
    </template>
  </UTable>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

interface CategoriaTema {
  id: number
  nombre: string
}

const emit = defineEmits<{
  editar: [categoria: CategoriaTema]
}>()

const { data, refresh, status } = useFetch<CategoriaTema[]>('/api/categorias-tema')

const columns: TableColumn<CategoriaTema>[] = [
  { accessorKey: 'nombre', header: 'Nombre' },
  { id: 'acciones', header: '' }
]

defineExpose({ refresh })
</script>
