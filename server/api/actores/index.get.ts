export default defineEventHandler(async () => {
  const actores = await prisma.actores.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      instituciones: true,
      bot_actores: true
    }
  })

  return actores.map(actor => ({
    id: actor.id,
    nombre: actor.nombre,
    institucion_id: actor.institucion_id,
    institucion: actor.instituciones.nombre,
    institucion_nivel: actor.instituciones.nivel,
    institucion_estado: actor.instituciones.estado,
    institucion_municipio: actor.instituciones.municipio,
    dependencia: actor.dependencia,
    puesto: actor.puesto,
    vigente_desde: actor.vigente_desde,
    vigente_hasta: actor.vigente_hasta,
    circunstancia: actor.circunstancia,
    circunstancia_hasta: actor.circunstancia_hasta,
    nota: actor.nota,
    activo: actor.activo,
    bots_curados: actor.bot_actores.map(ba => ba.bot_id)
  }))
})
