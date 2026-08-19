<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <TitulosPages
        titulo="Instituciones"
        subtitulo="Catálogo de instituciones registradas en Mnemosine"
        icon="i-lucide-landmark"
      />

      <UButton
        label="Nueva institución"
        icon="i-lucide-plus"
        class="w-full justify-center sm:w-auto"
        @click="abrirAlta"
      />
    </div>

    <UCard variant="subtle">
      <TablaInstituciones ref="tablaRef" @editar="abrirEdicion" />
    </UCard>

    <NuevaInstitucion
      v-model:open="modalAbierto"
      :institucion="institucionEditando"
      @guardado="tablaRef?.refresh()"
    />
  </div>
</template>

<script lang="ts" setup>
const modalAbierto = ref(false)
const institucionEditando = ref<any>(null)
const tablaRef = ref()

function abrirAlta() {
  institucionEditando.value = null
  modalAbierto.value = true
}

function abrirEdicion(institucion: any) {
  institucionEditando.value = institucion
  modalAbierto.value = true
}
</script>
