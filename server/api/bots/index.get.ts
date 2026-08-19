export default defineEventHandler(() => {
  return prisma.bots.findMany({ orderBy: { nombre: 'asc' } })
})
