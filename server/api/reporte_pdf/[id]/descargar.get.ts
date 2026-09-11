const TIMEOUT_MS = 180_000 // algunos reportes tardan hasta ~1min40s en generarse

export default defineEventHandler(async (event) => {
  const z = useZod()
  const { params, query } = await event.validate({
    params: z.object({ id: z.coerce.number().int() }),
    query: z.object({ tipo: z.enum(['escritorio', 'movil']) })
  })

  const fila = await prisma.pdf_actores.findUnique({ where: { id: params.id } })
  if (!fila) {
    throw createError({ statusCode: 404, statusMessage: 'Registro no encontrado' })
  }

  const { n8nPdfWebhookUrl } = useRuntimeConfig(event)
  if (!n8nPdfWebhookUrl) {
    throw createError({ statusCode: 503, statusMessage: 'El servicio de generación de PDF todavía no está configurado' })
  }

  let respuesta: Response
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    respuesta = await fetch(n8nPdfWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: params.id, tipo: query.tipo }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeout))
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'No se pudo generar el PDF, intenta de nuevo' })
  }

  if (!respuesta.ok) {
    throw createError({ statusCode: 502, statusMessage: 'No se pudo generar el PDF, intenta de nuevo' })
  }

  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="reporte_${params.id}.pdf"`
  })

  return Buffer.from(await respuesta.arrayBuffer())
})
