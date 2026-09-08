const TIMEOUT_MS = 30_000

export default defineEventHandler(async (event) => {
  const z = useZod()
  const { params } = await event.validate({
    params: z.object({ id: z.coerce.number().int() })
  })

  const fila = await prisma.pdf_actores.findUnique({ where: { id: params.id } })
  if (!fila) {
    throw createError({ statusCode: 404, statusMessage: 'Registro no encontrado' })
  }

  const { n8nEnviarReporteWebhookUrl } = useRuntimeConfig(event)
  if (!n8nEnviarReporteWebhookUrl) {
    throw createError({ statusCode: 503, statusMessage: 'El servicio de envío de reportes todavía no está configurado' })
  }

  let respuesta: Response
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    respuesta = await fetch(n8nEnviarReporteWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: params.id }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeout))
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'No se pudo enviar el reporte, intenta de nuevo' })
  }

  if (!respuesta.ok) {
    throw createError({ statusCode: 502, statusMessage: 'No se pudo enviar el reporte, intenta de nuevo' })
  }

  return { ok: true }
})
