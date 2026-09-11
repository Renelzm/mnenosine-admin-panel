<template>
  <UModal
    v-model:open="open"
    :title="esEdicion ? 'Editar reporte' : 'Nuevo reporte'"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Cliente prospecto" name="cliente_propsecto" required>
          <UInput v-model="state.cliente_propsecto" class="w-full" />
        </UFormField>

        <UFormField label="Descripción" name="descripcion">
          <UTextarea v-model="state.descripcion" :rows="3" class="w-full" />
        </UFormField>

        <UFormField label="Nombre del actor" name="nombre_actor" required>
          <UInput v-model="state.nombre_actor" class="w-full" />
        </UFormField>

        <UFormField label="Tipo de reporte" name="tipo_reporte">
          <USelect v-model="state.tipo_reporte" :items="TIPOS_REPORTE" placeholder="general" class="w-full" />
        </UFormField>

        <UFormField label="Instrucción del reporte" name="instruccion_reporte">
          <UTextarea v-model="state.instruccion_reporte" :rows="8" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField label="Correo" name="correo">
            <UInput v-model="state.correo" type="email" class="w-full" />
          </UFormField>

          <UFormField label="WhatsApp" name="whatsapp" hint="10 dígitos">
            <UInput v-model="state.whatsapp" type="tel" maxlength="10" placeholder="8711234567" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Caducidad" name="caducidad">
          <UInput v-model="state.caducidad" type="date" class="w-full" />
        </UFormField>

        <UFormField v-if="esEdicion" label="Activo" name="activo">
          <USwitch v-model="state.activo" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton label="Cancelar" color="neutral" variant="ghost" @click="open = false" />
          <UButton label="Guardar" type="submit" :loading="guardando" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'

const TIPOS_REPORTE = ['general', 'facebook', 'prueba']

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

const props = defineProps<{
  reporte?: ReportePdf | null
}>()

const emit = defineEmits<{
  guardado: []
}>()

const open = defineModel<boolean>('open', { default: false })

const esEdicion = computed(() => !!props.reporte)
const schema = computed(() => esEdicion.value ? useZodSchemas().reportePdf.actualizar : useZodSchemas().reportePdf.crear)

function aFechaInput(fecha?: string | null) {
  return fecha ? fecha.slice(0, 10) : undefined
}

const state = reactive<{
  cliente_propsecto?: string
  descripcion?: string
  nombre_actor?: string
  instruccion_reporte?: string
  tipo_reporte?: string
  caducidad?: string
  correo?: string
  whatsapp?: string
  activo?: boolean
}>({})

const formRef = ref()
const guardando = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return

  if (props.reporte) {
    state.cliente_propsecto = props.reporte.cliente_propsecto
    state.descripcion = props.reporte.descripcion ?? undefined
    state.nombre_actor = props.reporte.nombre_actor
    state.instruccion_reporte = props.reporte.instruccion_reporte ?? undefined
    state.tipo_reporte = props.reporte.tipo_reporte ?? undefined
    state.caducidad = aFechaInput(props.reporte.caducidad)
    state.correo = props.reporte.correo ?? undefined
    state.whatsapp = props.reporte.whatsapp != null ? String(props.reporte.whatsapp) : undefined
    state.activo = props.reporte.activo ?? true
  } else {
    state.cliente_propsecto = undefined
    state.descripcion = undefined
    state.nombre_actor = undefined
    state.instruccion_reporte = undefined
    state.tipo_reporte = undefined
    state.caducidad = undefined
    state.correo = undefined
    state.whatsapp = undefined
    state.activo = undefined
  }
}, { immediate: true })

async function onSubmit(event: FormSubmitEvent<any>) {
  guardando.value = true

  try {
    if (esEdicion.value && props.reporte) {
      await $fetch(`/api/reporte_pdf/${props.reporte.id}`, { method: 'PUT', body: event.data })
    } else {
      await $fetch('/api/reporte_pdf', { method: 'POST', body: event.data })
    }

    open.value = false
    emit('guardado')
  } catch (error: any) {
    const issues = error?.data?.issues?.body as { path: (string | number)[], message: string }[] | undefined

    if (issues?.length) {
      formRef.value?.setErrors(issues.map(issue => ({ name: issue.path.join('.'), message: issue.message })))
    } else {
      formRef.value?.setErrors([{ name: 'cliente_propsecto', message: error?.statusMessage ?? 'No se pudo guardar el reporte' }])
    }
  } finally {
    guardando.value = false
  }
}
</script>
