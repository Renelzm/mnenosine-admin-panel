import { z } from 'zod'

const camposComunes = {
  nombre: z.string().min(3),
  institucion_id: z.coerce.number().int(),
  dependencia: z.string().optional(),
  puesto: z.string().optional(),
  vigente_desde: z.coerce.date().optional(),
  vigente_hasta: z.coerce.date().optional(),
  circunstancia: z.string().optional(),
  circunstancia_hasta: z.coerce.date().optional(),
  nota: z.string().optional(),
  bots_curados: z.array(z.coerce.number().int()).default([])
}

export default {
  crear: z.object(camposComunes),
  actualizar: z.object({ ...camposComunes, activo: z.boolean() })
}
