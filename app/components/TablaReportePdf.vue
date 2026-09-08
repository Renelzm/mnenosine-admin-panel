<template>
  <UTable
    :data="data ?? []"
    :columns="columns"
    :loading="status === 'pending'"
    :ui="{ th: 'px-3 py-2', td: 'px-3 py-2' }"
  >
    <template #descripcion-cell="{ row }">
      <span
        v-if="row.original.descripcion"
        class="block max-w-64 truncate"
        :title="row.original.descripcion"
      >
        {{ row.original.descripcion }}
      </span>
    </template>

    <template #instruccion_reporte-cell="{ row }">
      <span
        v-if="row.original.instruccion_reporte"
        class="block max-w-64 truncate"
        :title="row.original.instruccion_reporte"
      >
        {{ row.original.instruccion_reporte }}
      </span>
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
      <div class="flex gap-1">
        <UButton
          icon="i-lucide-pencil"
          size="xs"
          color="neutral"
          variant="ghost"
          aria-label="Editar reporte"
          @click="emit('editar', row.original)"
        />
        <UButton
          icon="i-lucide-monitor"
          size="xs"
          color="neutral"
          variant="ghost"
          aria-label="Descargar PDF para escritorio"
          :loading="estaDescargando(row.original, 'escritorio')"
          @click="descargar(row.original, 'escritorio')"
        />
        <UButton
          icon="i-lucide-smartphone"
          size="xs"
          color="neutral"
          variant="ghost"
          aria-label="Descargar PDF para celular"
          :loading="estaDescargando(row.original, 'movil')"
          @click="descargar(row.original, 'movil')"
        />
        <UButton
          icon="i-lucide-trash-2"
          size="xs"
          color="error"
          variant="ghost"
          aria-label="Eliminar reporte"
          :loading="borrandoId === row.original.id"
          @click="confirmarBorrado(row.original)"
        />
        <UButton
          icon="i-lucide-send"
          size="xs"
          color="primary"
          variant="ghost"
          aria-label="Enviar reporte al cliente"
          @click="abrirConfirmarEnvio(row.original)"
        />
      </div>
    </template>
  </UTable>

  <ConfirmarEnvioReporte v-model:open="modalEnviarAbierto" :reporte="reporteEnviando" />
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

interface ReportePdf {
  id: number
  cliente_propsecto: string
  descripcion: string | null
  nombre_actor: string
  instruccion_reporte: string | null
  tipo_reporte: string | null
  caducidad: string | null
  correo: string | null
  whatsapp: string | number | null
  activo: boolean | null
}

const emit = defineEmits<{
  editar: [reporte: ReportePdf]
}>()

const { data, refresh, status } = useFetch<ReportePdf[]>('/api/reporte_pdf')

type TipoDescarga = 'escritorio' | 'movil'

const toast = useToast()
const descargando = ref<{ id: number, tipo: TipoDescarga } | null>(null)
const borrandoId = ref<number | null>(null)
const modalEnviarAbierto = ref(false)
const reporteEnviando = ref<ReportePdf | null>(null)

const columns: TableColumn<ReportePdf>[] = [
  { accessorKey: 'cliente_propsecto', header: 'Cliente prospecto' },
  { accessorKey: 'descripcion', header: 'Descripción' },
  { accessorKey: 'nombre_actor', header: 'Nombre del actor' },
  { accessorKey: 'tipo_reporte', header: 'Tipo de reporte' },
  { accessorKey: 'instruccion_reporte', header: 'Instrucción' },
  { accessorKey: 'correo', header: 'Correo' },
  { accessorKey: 'whatsapp', header: 'WhatsApp' },
  { accessorKey: 'caducidad', header: 'Caducidad' },
  { accessorKey: 'activo', header: 'Activo' },
  { id: 'acciones', header: '' }
]

function estaDescargando(reporte: ReportePdf, tipo: TipoDescarga) {
  return descargando.value?.id === reporte.id && descargando.value?.tipo === tipo
}

async function descargar(reporte: ReportePdf, tipo: TipoDescarga) {
  descargando.value = { id: reporte.id, tipo }

  try {
    const blob = await $fetch<Blob>(`/api/reporte_pdf/${reporte.id}/descargar`, { query: { tipo }, responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `reporte_${reporte.id}.pdf`
    enlace.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.add({ title: 'No se pudo generar el PDF, intenta de nuevo', color: 'error' })
  } finally {
    descargando.value = null
  }
}

function confirmarBorrado(reporte: ReportePdf) {
  // eslint-disable-next-line no-alert
  if (!confirm(`¿Eliminar el reporte de "${reporte.cliente_propsecto}"? Esta acción no se puede deshacer.`)) return
  borrar(reporte)
}

function abrirConfirmarEnvio(reporte: ReportePdf) {
  reporteEnviando.value = reporte
  modalEnviarAbierto.value = true
}

async function borrar(reporte: ReportePdf) {
  borrandoId.value = reporte.id

  try {
    await $fetch(`/api/reporte_pdf/${reporte.id}`, { method: 'DELETE' })
    toast.add({ title: 'Reporte eliminado', color: 'success' })
    refresh()
  } catch {
    toast.add({ title: 'No se pudo eliminar el reporte, intenta de nuevo', color: 'error' })
  } finally {
    borrandoId.value = null
  }
}

defineExpose({ refresh })
</script>
