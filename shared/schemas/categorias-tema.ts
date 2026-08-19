import { z } from 'zod'

export default {
  crear: z.object({
    nombre: z.string().min(3)
  }),
  actualizar: z.object({
    nombre: z.string().min(3)
  })
}
