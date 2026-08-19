import { Prisma } from '~~/app/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const { body } = await event.validate({ body: useZodSchemas().instituciones.crear })

  try {
    const institucion = await prisma.instituciones.create({ data: body })
    setResponseStatus(event, 201)
    return institucion
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Ya existe una institución con ese nombre' })
    }
    throw error
  }
})
