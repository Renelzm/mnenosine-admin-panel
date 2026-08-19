import { Prisma } from '~~/app/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const z = useZod()
  const { params, body } = await event.validate({
    params: z.object({ id: z.coerce.number().int() }),
    body: useZodSchemas().actores.actualizar
  })
  const { bots_curados, ...datosActor } = body

  try {
    return await prisma.$transaction(async (tx) => {
      const actor = await tx.actores.update({
        where: { id: params.id },
        data: datosActor
      })

      await tx.bot_actores.deleteMany({ where: { actor_id: params.id } })

      if (bots_curados.length) {
        await tx.bot_actores.createMany({
          data: bots_curados.map((bot_id: number) => ({ bot_id, actor_id: params.id }))
        })
      }

      return actor
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw createError({ statusCode: 404, statusMessage: 'Actor no encontrado' })
      }
      if (error.code === 'P2002') {
        throw createError({ statusCode: 409, statusMessage: 'Ya existe un actor con ese nombre' })
      }
    }
    throw error
  }
})
