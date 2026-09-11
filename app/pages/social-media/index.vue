<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-4">
    <TitulosPages
      titulo="Social Media"
      subtitulo="Cuentas y contenido monitoreado en redes sociales"
      icon="i-lucide-share-2"
    />

    <SeccionColapsable titulo="Páginas de Facebook" icon="i-simple-icons-facebook" icon-class="text-[#1877F2]" default-open>
      <div class="space-y-4">
        <div class="space-y-2">
          <p class="text-sm text-muted">
            Para leer los datos que se están generando se necesita la URL del post de Facebook.
          </p>
          <UButton
            label="Inyectar post de Facebook"
            icon="i-lucide-syringe"
            :ui="{ leadingIcon: 'size-7' }"
            class="!bg-[#b70b55] !text-white hover:!bg-[#CF3E7F]/90"
            to="https://n8n.argos.org.mx/form/1af3f049-849c-424b-96c4-2332e3ca6ac3"
            target="_blank"
          />
        </div>

        <USeparator class="max-w-24" />

        <div class="flex justify-end">
          <UButton label="Nueva página" icon="i-lucide-plus" @click="abrirAlta" />
        </div>

        <TablaPaginasFacebook ref="tablaRef" @editar="abrirEdicion" />
      </div>
    </SeccionColapsable>

    <SeccionColapsable titulo="YouTube" icon="i-simple-icons-youtube" icon-class="text-[#FF0000]">
      <p class="text-sm text-muted">
        Próximamente.
      </p>
    </SeccionColapsable>

    <SeccionColapsable titulo="TikTok" icon="i-simple-icons-tiktok" icon-class="text-[#0D9488]">
      <div class="space-y-2">
        <p class="text-sm text-muted">
          Para leer los datos que se están generando se necesita la URL del post de TikTok.
        </p>
        <UButton
          label="Inyectar post de TikTok"
          icon="i-lucide-syringe"
          :ui="{ leadingIcon: 'size-7' }"
          class="!bg-[#b70b55] !text-white hover:!bg-[#CF3E7F]/90"
          to="https://n8n.argos.org.mx/form/fe4576b6-2343-4662-9a78-79083557cd7e"
          target="_blank"
        />
      </div>
    </SeccionColapsable>

    <NuevaPaginaFacebook
      v-model:open="modalAbierto"
      :pagina="paginaEditando"
      @guardado="tablaRef?.refresh()"
    />
  </div>
</template>

<script lang="ts" setup>
const modalAbierto = ref(false)
const paginaEditando = ref<any>(null)
const tablaRef = ref()

function abrirAlta() {
  paginaEditando.value = null
  modalAbierto.value = true
}

function abrirEdicion(pagina: any) {
  paginaEditando.value = pagina
  modalAbierto.value = true
}
</script>
