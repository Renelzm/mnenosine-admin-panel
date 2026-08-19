<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <TitulosPages
        titulo="Actores"
        subtitulo="Catálogo de actores políticos monitoreados"
        icon="i-lucide-users"
      />

      <UButton
        label="Nuevo actor"
        icon="i-lucide-plus"
        class="w-full justify-center sm:w-auto"
        @click="abrirAlta"
      />
    </div>

    <UCard variant="subtle">
      <TablaActores ref="tablaRef" @editar="abrirEdicion" />
    </UCard>

    <NuevoActor
      v-model:open="modalAbierto"
      :actor="actorEditando"
      @guardado="tablaRef?.refresh()"
    />
  </div>
</template>

<script lang="ts" setup>
const modalAbierto = ref(false)
const actorEditando = ref<any>(null)
const tablaRef = ref()

function abrirAlta() {
  actorEditando.value = null
  modalAbierto.value = true
}

function abrirEdicion(actor: any) {
  actorEditando.value = actor
  modalAbierto.value = true
}
</script>
