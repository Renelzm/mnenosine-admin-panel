<template>
  <UModal
    v-model:open="open"
    title="Enviar reporte al cliente"
    :ui="{ content: 'sm:max-w-md' }"
  >
    <template #body>
      <div v-if="reporte" class="space-y-4">
        <div class="flex items-center gap-3 rounded-lg bg-primary-50 p-4 dark:bg-primary-950/40">
          <UIcon name="i-lucide-user" class="size-8 shrink-0 text-primary" />
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wide text-muted">
              Se le notificará a
            </p>
            <p class="truncate text-lg font-semibold">
              {{ reporte.cliente_propsecto }}
            </p>
          </div>
        </div>

        <p class="text-sm text-muted">
          Reporte del actor <span class="font-medium text-default">{{ reporte.nombre_actor }}</span>
        </p>

        <div class="space-y-2">
          <div
            v-if="reporte.whatsapp"
            class="flex items-center gap-3 rounded-md border border-default px-3 py-2"
          >
            <UIcon name="i-lucide-message-circle" class="size-5 shrink-0 text-success" />
            <p class="text-sm">
              <span class="text-muted">Se enviará un WhatsApp al </span>
              <span class="font-semibold">{{ reporte.whatsapp }}</span>
            </p>
          </div>

          <div
            v-if="reporte.correo"
            class="flex items-center gap-3 rounded-md border border-default px-3 py-2"
          >
            <UIcon name="i-lucide-mail" class="size-5 shrink-0 text-info" />
            <p class="text-sm">
              <span class="text-muted">Se enviará un correo a </span>
              <span class="font-semibold">{{ reporte.correo }}</span>
            </p>
          </div>
        </div>

        <UAlert
          v-if="reporte.whatsapp || reporte.correo"
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="Esta acción envía el mensaje de inmediato"
          description="Confirma que los datos de contacto sean correctos antes de continuar."
        />
        <UAlert
          v-else
          color="error"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="Este registro no tiene WhatsApp ni correo"
          description="El envío no llegará a ningún destinatario hasta que se capture al menos un dato de contacto."
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" @click="open = false" />
        <UButton
          label="Sí, enviar reporte"
          icon="i-lucide-send"
          :loading="enviando"
          @click="confirmar"
        />
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
interface ReportePdf {
  id: number
  cliente_propsecto: string
  nombre_actor: string
  correo: string | null
  whatsapp: string | number | null
}

const props = defineProps<{
  reporte?: ReportePdf | null
}>()

const emit = defineEmits<{
  enviado: []
}>()

const open = defineModel<boolean>('open', { default: false })

const toast = useToast()
const enviando = ref(false)

async function confirmar() {
  if (!props.reporte) return

  enviando.value = true

  try {
    await $fetch(`/api/reporte_pdf/${props.reporte.id}/enviar`, { method: 'POST' })
    toast.add({ title: 'Reporte enviado', color: 'success' })
    open.value = false
    emit('enviado')
  } catch {
    toast.add({ title: 'No se pudo enviar el reporte, intenta de nuevo', color: 'error' })
  } finally {
    enviando.value = false
  }
}
</script>
