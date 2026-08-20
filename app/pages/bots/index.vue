<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <TitulosPages
        titulo="Bots"
        subtitulo="Catálogo de bots que consumen los catálogos de actores y temas"
        icon="i-lucide-bot"
      />

      <UButton
        label="Nuevo bot"
        icon="i-lucide-plus"
        class="w-full justify-center sm:w-auto"
        @click="abrirAlta"
      />
    </div>

    <UCard variant="subtle">
      <TablaBots ref="tablaRef" @editar="abrirEdicion" />
    </UCard>

    <NuevoBot
      v-model:open="modalAbierto"
      :bot="botEditando"
      @guardado="tablaRef?.refresh()"
    />
  </div>
</template>

<script lang="ts" setup>
const modalAbierto = ref(false)
const botEditando = ref<any>(null)
const tablaRef = ref()

function abrirAlta() {
  botEditando.value = null
  modalAbierto.value = true
}

function abrirEdicion(bot: any) {
  botEditando.value = bot
  modalAbierto.value = true
}
</script>
