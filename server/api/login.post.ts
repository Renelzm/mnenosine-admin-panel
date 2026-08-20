export default defineEventHandler(async (event) => {
  const { body } = await event.validate({ body: useZodSchemas().login })

  const admin = await prisma.admins.findUnique({ where: { email: body.email } })

  const credencialesInvalidas = () =>
    createError({ statusCode: 401, statusMessage: 'Credenciales inválidas' })

  if (!admin || !admin.activo) {
    throw credencialesInvalidas()
  }

  const passwordValido = await verifyPassword(admin.password_hash, body.password)
  if (!passwordValido) {
    throw credencialesInvalidas()
  }

  await setUserSession(event, {
    user: {
      id: admin.id,
      nombre: admin.nombre,
      email: admin.email
    }
  })

  return { id: admin.id, nombre: admin.nombre, email: admin.email }
})
