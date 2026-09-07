<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <TitulosPages
        titulo="Reporte PDF"
        subtitulo="Catálogo de actores configurados para recibir reportes en PDF"
        icon="i-lucide-file-text"
      />

      <UButton
        label="Nuevo reporte"
        icon="i-lucide-plus"
        class="w-full justify-center sm:w-auto"
        @click="abrirAlta"
      />
    </div>

    <UCard variant="subtle">
      <TablaReportePdf ref="tablaRef" @editar="abrirEdicion" />
    </UCard>

    <NuevoReportePdf
      v-model:open="modalAbierto"
      :reporte="reporteEditando"
      @guardado="tablaRef?.refresh()"
    />
  </div>
</template>

<script lang="ts" setup>
const modalAbierto = ref(false)
const reporteEditando = ref<any>(null)
const tablaRef = ref()

function abrirAlta() {
  reporteEditando.value = null
  modalAbierto.value = true
}

function abrirEdicion(reporte: any) {
  reporteEditando.value = reporte
  modalAbierto.value = true
}
</script>
