<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-4">
    <TitulosPages
      titulo="Medios Tradicionales"
      subtitulo="Captura de medios impresos, TV y radio"
      icon="i-lucide-newspaper"
    />

    <SeccionColapsable titulo="Medios impresos" icon="i-lucide-newspaper" default-open>
      <UForm
        ref="formImpresosRef"
        :schema="schemaImpresos"
        :state="stateImpresos"
        class="space-y-4"
        @submit="enviarImpresos"
      >
        <UFormField label="Medio" name="medio" required>
          <UInput v-model="stateImpresos.medio" class="w-full" />
        </UFormField>

        <UFormField label="Fecha" name="fecha" required>
          <UInput v-model="stateImpresos.fecha" type="date" class="w-full sm:w-64" />
        </UFormField>

        <UFormField label="Archivos (PDF)">
          <UFileUpload
            v-model="archivosImpresos"
            multiple
            accept="application/pdf"
            label="Arrastra tus PDFs aquí"
            description="O haz clic para seleccionarlos"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end">
          <UButton label="Enviar" type="submit" :loading="enviandoImpresos" />
        </div>
      </UForm>
    </SeccionColapsable>

    <SeccionColapsable titulo="TV y Radio" icon="i-lucide-tv" default-open>
      <UForm
        ref="formTvRadioRef"
        :schema="schemaTvRadio"
        :state="stateTvRadio"
        class="space-y-4"
        @submit="enviarTvRadio"
      >
        <UFormField label="Tipo de medio" name="tipo_medio" required>
          <USelect v-model="stateTvRadio.tipo_medio" :items="['TV', 'Radio']" class="w-full sm:w-48" />
        </UFormField>

        <UFormField label="Medio o programa" name="medio_programa" required>
          <UInput v-model="stateTvRadio.medio_programa" class="w-full" />
        </UFormField>

        <UFormField label="Detalle de reporteros" name="detalle_reporteros">
          <UTextarea v-model="stateTvRadio.detalle_reporteros" :rows="2" class="w-full" />
        </UFormField>

        <UFormField label="Fecha de emisión" name="fecha_emision" required>
          <UInput v-model="stateTvRadio.fecha_emision" type="date" class="w-full sm:w-64" />
        </UFormField>

        <UFormField label="Archivo de texto (opcional)">
          <UFileUpload
            v-model="archivoTexto"
            accept=".txt,text/plain"
            label="Arrastra un .txt aquí"
            description="Su contenido llenará el texto de abajo"
            class="w-full"
            @change="cargarArchivoTexto"
          />
        </UFormField>

        <UFormField label="Texto" name="texto">
          <UTextarea v-model="stateTvRadio.texto" :rows="8" class="w-full" />
        </UFormField>

        <div class="flex justify-end">
          <UButton label="Enviar" type="submit" :loading="enviandoTvRadio" />
        </div>
      </UForm>
    </SeccionColapsable>
  </div>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

const toast = useToast()

const schemaImpresos = useZodSchemas().mediosTradicionales.impresos
const stateImpresos = reactive<{ medio?: string, fecha: string }>({ medio: undefined, fecha: hoy() })
const archivosImpresos = ref<File[]>([])
const enviandoImpresos = ref(false)
const formImpresosRef = ref()

async function enviarImpresos(event: FormSubmitEvent<any>) {
  if (archivosImpresos.value.length === 0) {
    toast.add({ title: 'Adjunta al menos un archivo', color: 'error' })
    return
  }

  enviandoImpresos.value = true

  try {
    const formData = new FormData()
    formData.append('medio', event.data.medio)
    formData.append('fecha', event.data.fecha)
    for (const archivo of archivosImpresos.value) {
      formData.append('archivos', archivo)
    }

    await $fetch('/api/medios-tradicionales/impresos', { method: 'POST', body: formData })

    toast.add({ title: 'Medio impreso enviado', color: 'success' })
    stateImpresos.medio = undefined
    stateImpresos.fecha = hoy()
    archivosImpresos.value = []
  } catch (error: any) {
    toast.add({ title: error?.statusMessage ?? 'No se pudo enviar el medio impreso', color: 'error' })
  } finally {
    enviandoImpresos.value = false
  }
}

const schemaTvRadio = useZodSchemas().mediosTradicionales.tvRadio
const stateTvRadio = reactive<{
  tipo_medio?: 'TV' | 'Radio'
  medio_programa?: string
  detalle_reporteros?: string
  fecha_emision: string
  texto?: string
}>({ tipo_medio: undefined, medio_programa: undefined, detalle_reporteros: undefined, fecha_emision: hoy(), texto: undefined })
const archivoTexto = ref<File | null>(null)
const enviandoTvRadio = ref(false)
const formTvRadioRef = ref()

function cargarArchivoTexto() {
  const archivo = archivoTexto.value
  if (!archivo) return

  const lector = new FileReader()
  lector.onload = () => {
    stateTvRadio.texto = String(lector.result ?? '')
  }
  lector.readAsText(archivo)
}

async function enviarTvRadio(event: FormSubmitEvent<any>) {
  enviandoTvRadio.value = true

  try {
    await $fetch('/api/medios-tradicionales/tv-radio', { method: 'POST', body: event.data })

    toast.add({ title: 'Registro enviado', color: 'success' })
    stateTvRadio.tipo_medio = undefined
    stateTvRadio.medio_programa = undefined
    stateTvRadio.detalle_reporteros = undefined
    stateTvRadio.fecha_emision = hoy()
    stateTvRadio.texto = undefined
    archivoTexto.value = null
  } catch (error: any) {
    toast.add({ title: error?.statusMessage ?? 'No se pudo enviar el registro', color: 'error' })
  } finally {
    enviandoTvRadio.value = false
  }
}
</script>
