import { Prisma } from '~~/app/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const z = useZod()
  const { params, body } = await event.validate({
    params: z.object({ id: z.coerce.number().int() }),
    body: useZodSchemas().reportePdf.actualizar
  })

  try {
    return await prisma.pdf_actores.update({
      where: { id: params.id },
      data: {
        ...body,
        correo: body.correo || null,
        whatsapp: body.whatsapp ? Number(body.whatsapp) : null
      }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Registro no encontrado' })
    }
    throw error
  }
})
