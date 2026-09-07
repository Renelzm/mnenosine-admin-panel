import { z } from 'zod'

const correoOpcional = z
  .string()
  .trim()
  .email('Correo inválido')
  .optional()
  .or(z.literal(''))

const whatsappOpcional = z
  .string()
  .trim()
  .regex(/^\d{10}$/, 'El WhatsApp debe tener 10 dígitos')
  .optional()
  .or(z.literal(''))

const camposComunes = {
  cliente_propsecto: z.string().min(1),
  descripcion: z.string().optional(),
  nombre_actor: z.string().min(1),
  instruccion_reporte: z.string().optional(),
  tipo_reporte: z.string().optional(),
  caducidad: z.coerce.date().optional(),
  correo: correoOpcional,
  whatsapp: whatsappOpcional
}

export default {
  crear: z.object(camposComunes),
  actualizar: z.object({ ...camposComunes, activo: z.boolean() })
}
