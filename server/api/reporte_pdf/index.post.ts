export default defineEventHandler(async (event) => {
  const { body } = await event.validate({ body: useZodSchemas().reportePdf.crear })

  const fila = await prisma.pdf_actores.create({
    data: {
      ...body,
      correo: body.correo || null,
      whatsapp: body.whatsapp ? Number(body.whatsapp) : null
    }
  })
  setResponseStatus(event, 201)
  return fila
})
