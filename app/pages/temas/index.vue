<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6">
    <TitulosPages
      titulo="Temas"
      subtitulo="Catálogo de temas y categorías para el monitoreo de medios"
      icon="i-lucide-tag"
    />

    <section class="space-y-4">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-lg font-semibold">
          Categorías
        </h2>

        <UButton
          label="Nueva categoría"
          icon="i-lucide-plus"
          class="w-full justify-center sm:w-auto"
          @click="abrirAltaCategoria"
        />
      </div>

      <UCard variant="subtle">
        <TablaCategoriasTema ref="tablaCategoriasRef" @editar="abrirEdicionCategoria" />
      </UCard>
    </section>

    <section class="space-y-4">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-lg font-semibold">
          Temas
        </h2>

        <UButton
          label="Nuevo tema"
          icon="i-lucide-plus"
          class="w-full justify-center sm:w-auto"
          @click="abrirAltaTema"
        />
      </div>

      <UCard variant="subtle">
        <TablaTemas ref="tablaTemasRef" @editar="abrirEdicionTema" />
      </UCard>
    </section>

    <NuevaCategoriaTema
      v-model:open="modalCategoriaAbierto"
      :categoria="categoriaEditando"
      @guardado="tablaCategoriasRef?.refresh()"
    />

    <NuevoTema
      v-model:open="modalTemaAbierto"
      :tema="temaEditando"
      @guardado="tablaTemasRef?.refresh()"
    />
  </div>
</template>

<script lang="ts" setup>
const modalCategoriaAbierto = ref(false)
const categoriaEditando = ref<any>(null)
const tablaCategoriasRef = ref()

const modalTemaAbierto = ref(false)
const temaEditando = ref<any>(null)
const tablaTemasRef = ref()

function abrirAltaCategoria() {
  categoriaEditando.value = null
  modalCategoriaAbierto.value = true
}

function abrirEdicionCategoria(categoria: any) {
  categoriaEditando.value = categoria
  modalCategoriaAbierto.value = true
}

function abrirAltaTema() {
  temaEditando.value = null
  modalTemaAbierto.value = true
}

function abrirEdicionTema(tema: any) {
  temaEditando.value = tema
  modalTemaAbierto.value = true
}

</script>
