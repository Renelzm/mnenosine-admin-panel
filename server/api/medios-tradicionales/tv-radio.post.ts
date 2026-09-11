const TIMEOUT_MS = 30_000
const WEBHOOK_URL = 'https://n8n.argos.org.mx/webhook/f7a9725f-21c7-40c7-bfac-56067950a485'

export default defineEventHandler(async (event) => {
  const { body } = await event.validate({ body: useZodSchemas().mediosTradicionales.tvRadio })

  let respuesta: Response
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    respuesta = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    }).finally(() => clearTimeout(timeout))
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'No se pudo enviar el registro, intenta de nuevo' })
  }

  if (!respuesta.ok) {
    throw createError({ statusCode: 502, statusMessage: 'No se pudo enviar el registro, intenta de nuevo' })
  }

  return { ok: true }
})
