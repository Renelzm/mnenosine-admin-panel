const TIMEOUT_MS = 180_000
const WEBHOOK_URL = 'https://n8n.argos.org.mx/webhook/82333594-37ad-4e6c-b622-6a7604d5f079'

export default defineEventHandler(async (event) => {
  const partes = await readMultipartFormData(event)
  if (!partes) {
    throw createError({ statusCode: 400, statusMessage: 'No se recibió el formulario' })
  }

  const campos: Record<string, string> = {}
  const archivos = partes.filter(parte => !!parte.filename)

  for (const parte of partes) {
    if (parte.name && !parte.filename) {
      campos[parte.name] = parte.data.toString('utf-8')
    }
  }

  const { impresos: schema } = useZodSchemas().mediosTradicionales
  const resultado = schema.safeParse(campos)
  if (!resultado.success) {
    throw createError({ statusCode: 400, statusMessage: 'Faltan datos del formulario' })
  }

  if (archivos.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Adjunta al menos un archivo' })
  }

  const formData = new FormData()
  formData.append('medio', resultado.data.medio)
  formData.append('fecha', resultado.data.fecha)
  for (const archivo of archivos) {
    formData.append('archivos', new Blob([new Uint8Array(archivo.data)], { type: archivo.type }), archivo.filename)
  }

  let respuesta: Response
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    respuesta = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    }).finally(() => clearTimeout(timeout))
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'No se pudo enviar el medio impreso, intenta de nuevo' })
  }

  if (!respuesta.ok) {
    throw createError({ statusCode: 502, statusMessage: 'No se pudo enviar el medio impreso, intenta de nuevo' })
  }

  return { ok: true }
})
