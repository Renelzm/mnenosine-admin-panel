import { Prisma } from '~~/app/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const z = useZod()
  const { params, body } = await event.validate({
    params: z.object({ id: z.coerce.number().int() }),
    body: useZodSchemas().bots.actualizar
  })

  try {
    return await prisma.$transaction(async (tx) => {
      const bot = await tx.bots.update({
        where: { id: params.id },
        data: body
      })

      if (body.alcance === 'todos') {
        await tx.bot_actores.deleteMany({ where: { bot_id: params.id } })
      }

      return bot
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw createError({ statusCode: 404, statusMessage: 'Bot no encontrado' })
      }
      if (error.code === 'P2002') {
        const meta = error.meta as any
        const campos: string[] = meta?.driverAdapterError?.cause?.constraint?.fields ?? []
        if (campos.includes('zona')) {
          throw createError({ statusCode: 409, statusMessage: 'Ya existe un bot con esa zona' })
        }
        throw createError({ statusCode: 409, statusMessage: 'Ya existe un bot con ese nombre' })
      }
    }
    throw error
  }
})
