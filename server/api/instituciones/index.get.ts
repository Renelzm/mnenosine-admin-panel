import { prisma } from "~~/server/utils/prisma"

export default defineEventHandler(() => {
  return prisma.instituciones.findMany({ orderBy: { nombre: 'asc' } })
})
