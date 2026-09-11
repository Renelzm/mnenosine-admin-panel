export default defineEventHandler(async () => {
  const cuentas = await prisma.fb_cuentas.findMany({
    select: { id: true, fb_profile_url: true, nombre_mostrado: true },
    orderBy: { nombre_mostrado: 'asc' }
  })

  return cuentas.map(cuenta => ({ ...cuenta, id: Number(cuenta.id) }))
})
