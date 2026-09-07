export default defineEventHandler(() => {
  return prisma.pdf_actores.findMany({ orderBy: { nombre_actor: 'asc' } })
})
