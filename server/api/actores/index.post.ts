import { Prisma } from '~~/app/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const { body } = await event.validate({ body: useZodSchemas().actores.crear })
  const { bots_curados, ...datosActor } = body

  try {
    const actor = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.actores.create({ data: datosActor })

      if (bots_curados.length) {
        await tx.bot_actores.createMany({
          data: bots_curados.map((bot_id: number) => ({ bot_id, actor_id: nuevo.id }))
        })
      }

      return nuevo
    })

    setResponseStatus(event, 201)
    return actor
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Ya existe un actor con ese nombre' })
    }
    throw error
  }
})
