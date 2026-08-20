import { Prisma } from '~~/app/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const { body } = await event.validate({ body: useZodSchemas().bots.crear })

  try {
    const bot = await prisma.bots.create({ data: body })
    setResponseStatus(event, 201)
    return bot
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // con @prisma/adapter-pg el detalle real viene en meta.driverAdapterError.cause.constraint.fields,
      // no en meta.target (eso es del motor de query estándar de Prisma)
      const meta = error.meta as any
      const campos: string[] = meta?.driverAdapterError?.cause?.constraint?.fields ?? []
      if (campos.includes('zona')) {
        throw createError({ statusCode: 409, statusMessage: 'Ya existe un bot con esa zona' })
      }
      throw createError({ statusCode: 409, statusMessage: 'Ya existe un bot con ese nombre' })
    }
    throw error
  }
})
