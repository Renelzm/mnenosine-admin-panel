const RUTAS_PUBLICAS = ['/api/login']

export default defineEventHandler(async (event) => {
  const rawPath = event.path ?? '/'
  const queryIndex = rawPath.indexOf('?')
  const path = queryIndex === -1 ? rawPath : rawPath.slice(0, queryIndex)

  if (!path.startsWith('/api/')) return
  if (path.startsWith('/api/_nuxt_icon/')) return
  if (RUTAS_PUBLICAS.includes(path)) return

  await requireUserSession(event)
})
