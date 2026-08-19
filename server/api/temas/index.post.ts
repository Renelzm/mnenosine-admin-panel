import { Prisma } from '~~/app/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const { body } = await event.validate({ body: useZodSchemas().temas.crear })

  try {
    const tema = await prisma.temas.create({ data: body })
    setResponseStatus(event, 201)
    return tema
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Ya existe un tema con ese nombre' })
    }
    throw error
  }
})
