import { z } from 'zod'

const ALCANCES = ['curado', 'todos'] as const

const camposComunes = {
  nombre: z.string().min(3),
  zona: z.string().min(1),
  alcance: z.enum(ALCANCES),
  institucion_contratante: z.string().optional(),
  medio: z.string().optional()
}

export default {
  crear: z.object(camposComunes),
  actualizar: z.object({ ...camposComunes, activo: z.boolean() })
}
