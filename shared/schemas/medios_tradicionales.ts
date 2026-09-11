import { z } from 'zod'

export default {
  impresos: z.object({
    medio: z.string().min(1),
    fecha: z.string().min(1)
  }),
  tvRadio: z.object({
    tipo_medio: z.enum(['TV', 'Radio']),
    medio_programa: z.string().min(1),
    detalle_reporteros: z.string().optional(),
    fecha_emision: z.string().min(1),
    texto: z.string().optional()
  })
}
