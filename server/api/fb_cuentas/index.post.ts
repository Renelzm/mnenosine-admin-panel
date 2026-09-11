import { Prisma } from '~~/app/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const { body } = await event.validate({ body: useZodSchemas().fbCuentas.crear })

  try {
    const cuenta = await prisma.fb_cuentas.create({
      data: body,
      select: { id: true, fb_profile_url: true, nombre_mostrado: true }
    })
    setResponseStatus(event, 201)
    return { ...cuenta, id: Number(cuenta.id) }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Ya existe una página con esa URL de Facebook' })
    }
    throw error
  }
})
