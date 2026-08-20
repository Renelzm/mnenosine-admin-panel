export default defineEventHandler(async () => {
  const [bots, actoresActivos] = await Promise.all([
    prisma.bots.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { bot_actores: true } }
      }
    }),
    prisma.actores.count({ where: { activo: true } })
  ])

  return bots.map(bot => ({
    id: bot.id,
    zona: bot.zona,
    nombre: bot.nombre,
    institucion_contratante: bot.institucion_contratante,
    medio: bot.medio,
    activo: bot.activo,
    alcance: bot.alcance,
    actores_mapeados: bot.alcance === 'todos' ? actoresActivos : bot._count.bot_actores
  }))
})
