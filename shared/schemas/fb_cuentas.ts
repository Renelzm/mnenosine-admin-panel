import { z } from 'zod'

export default {
  crear: z.object({
    fb_profile_url: z.string().min(1),
    nombre_mostrado: z.string().min(1)
  }),
  actualizar: z.object({
    fb_profile_url: z.string().min(1),
    nombre_mostrado: z.string().min(1)
  })
}
