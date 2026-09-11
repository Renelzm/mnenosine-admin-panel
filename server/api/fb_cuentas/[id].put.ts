import { Prisma } from '~~/app/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const z = useZod()
  const { params, body } = await event.validate({
    params: z.object({ id: z.coerce.number().int() }),
    body: useZodSchemas().fbCuentas.actualizar
  })

  try {
    const cuenta = await prisma.fb_cuentas.update({
      where: { id: BigInt(params.id) },
      data: body,
      select: { id: true, fb_profile_url: true, nombre_mostrado: true }
    })
    return { ...cuenta, id: Number(cuenta.id) }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw createError({ statusCode: 404, statusMessage: 'Página no encontrada' })
      }
      if (error.code === 'P2002') {
        throw createError({ statusCode: 409, statusMessage: 'Ya existe una página con esa URL de Facebook' })
      }
    }
    throw error
  }
})
