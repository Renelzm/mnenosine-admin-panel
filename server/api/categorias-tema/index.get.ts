export default defineEventHandler(() => {
  return prisma.categorias_tema.findMany({ orderBy: { nombre: 'asc' } })
})
