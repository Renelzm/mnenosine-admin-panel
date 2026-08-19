import { Prisma } from '~~/app/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const { body } = await event.validate({ body: useZodSchemas().categoriasTema.crear })

  try {
    const categoria = await prisma.categorias_tema.create({ data: body })
    setResponseStatus(event, 201)
    return categoria
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Ya existe una categoría con ese nombre' })
    }
    throw error
  }
})
