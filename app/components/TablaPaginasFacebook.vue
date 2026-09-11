<template>
  <UTable
    :data="data ?? []"
    :columns="columns"
    :loading="status === 'pending'"
    :ui="{ th: 'px-3 py-2', td: 'px-3 py-2' }"
  >
    <template #fb_profile_url-cell="{ row }">
      <a
        :href="row.original.fb_profile_url ?? undefined"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary hover:underline break-all"
      >
        {{ row.original.fb_profile_url }}
      </a>
    </template>

    <template #acciones-cell="{ row }">
      <UButton
        icon="i-lucide-pencil"
        size="xs"
        color="neutral"
        variant="ghost"
        aria-label="Editar página"
        @click="emit('editar', row.original)"
      />
    </template>
  </UTable>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

interface PaginaFacebook {
  id: number
  fb_profile_url: string | null
  nombre_mostrado: string | null
}

const emit = defineEmits<{
  editar: [pagina: PaginaFacebook]
}>()

const { data, refresh, status } = useFetch<PaginaFacebook[]>('/api/fb_cuentas')

const columns: TableColumn<PaginaFacebook>[] = [
  { id: 'acciones', header: '' },
  { accessorKey: 'fb_profile_url', header: 'URL de Facebook' },
  { accessorKey: 'nombre_mostrado', header: 'Nombre mostrado' }
]

defineExpose({ refresh })
</script>
