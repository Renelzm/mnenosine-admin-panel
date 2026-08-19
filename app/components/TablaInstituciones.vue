<template>
  <UTable
    :data="data ?? []"
    :columns="columns"
    :loading="status === 'pending'"
    :ui="{ th: 'px-3 py-2', td: 'px-3 py-2' }"
  >
    <template #activa-cell="{ row }">
      <UBadge
        :color="row.original.activa ? 'success' : 'neutral'"
        variant="subtle"
      >
        {{ row.original.activa ? 'Activa' : 'Inactiva' }}
      </UBadge>
    </template>

    <template #acciones-cell="{ row }">
      <UButton
        icon="i-lucide-pencil"
        size="xs"
        color="neutral"
        variant="ghost"
        aria-label="Editar institución"
        @click="emit('editar', row.original)"
      />
    </template>
  </UTable>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

interface Institucion {
  id: number
  nombre: string
  nivel: string
  estado: string | null
  municipio: string | null
  activa: boolean | null
}

const emit = defineEmits<{
  editar: [institucion: Institucion]
}>()

const { data, refresh, status } = useFetch<Institucion[]>('/api/instituciones')

const columns: TableColumn<Institucion>[] = [
  { accessorKey: 'nombre', header: 'Nombre' },
  { accessorKey: 'nivel', header: 'Nivel' },
  { accessorKey: 'estado', header: 'Estado' },
  { accessorKey: 'municipio', header: 'Municipio' },
  { accessorKey: 'activa', header: 'Activa' },
  { id: 'acciones', header: '' }
]

defineExpose({ refresh })
</script>
