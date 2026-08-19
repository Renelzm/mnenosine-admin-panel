import { z } from 'zod'

const NIVELES = ['MUNICIPAL', 'ESTATAL', 'FEDERAL', 'AUTONOMO', 'IP', 'EDUCACION', 'OTROS'] as const

export default {
  crear: z.object({
    nombre: z.string().min(3),
    nivel: z.enum(NIVELES),
    estado: z.string().optional(),
    municipio: z.string().optional()
  }),
  actualizar: z.object({
    nombre: z.string().min(3),
    nivel: z.enum(NIVELES),
    estado: z.string().optional(),
    municipio: z.string().optional(),
    activa: z.boolean()
  })
}
