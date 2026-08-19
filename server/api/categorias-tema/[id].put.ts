import { Prisma } from '~~/app/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const z = useZod()
  const { params, body } = await event.validate({
    params: z.object({ id: z.coerce.number().int() }),
    body: useZodSchemas().categoriasTema.actualizar
  })

  try {
    return await prisma.categorias_tema.update({
      where: { id: params.id },
      data: body
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw createError({ statusCode: 404, statusMessage: 'Categoría no encontrada' })
      }
      if (error.code === 'P2002') {
        throw createError({ statusCode: 409, statusMessage: 'Ya existe una categoría con ese nombre' })
      }
    }
    throw error
  }
})
