import { z } from 'zod'

const camposComunes = {
  nombre: z.string().min(3),
  categoria_id: z.coerce.number().int(),
  categoria_secundaria_id: z.coerce.number().int().optional()
}

function distinta(data: { categoria_id: number, categoria_secundaria_id?: number }) {
  return !data.categoria_secundaria_id || data.categoria_secundaria_id !== data.categoria_id
}

export default {
  crear: z.object(camposComunes).refine(distinta, {
    message: 'La categoría secundaria debe ser distinta a la principal',
    path: ['categoria_secundaria_id']
  }),
  actualizar: z.object({ ...camposComunes, activo: z.boolean() }).refine(distinta, {
    message: 'La categoría secundaria debe ser distinta a la principal',
    path: ['categoria_secundaria_id']
  })
}
