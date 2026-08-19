export default defineEventHandler(async () => {
  const temas = await prisma.temas.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      categorias_tema_temas_categoria_idTocategorias_tema: true,
      categorias_tema_temas_categoria_secundaria_idTocategorias_tema: true
    }
  })

  return temas.map(tema => ({
    id: tema.id,
    nombre: tema.nombre,
    activo: tema.activo,
    categoria_id: tema.categoria_id,
    categoria: tema.categorias_tema_temas_categoria_idTocategorias_tema?.nombre ?? null,
    categoria_secundaria_id: tema.categoria_secundaria_id,
    categoria_secundaria: tema.categorias_tema_temas_categoria_secundaria_idTocategorias_tema?.nombre ?? null
  }))
})
