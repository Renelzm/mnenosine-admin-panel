# SPEC 01 — CRUD de Instituciones

> **Estado:** Aprobado
> **Depende de:** Ninguno
> **Fecha:** 2026-08-19
> **Objetivo:** Construir el CRUD completo de instituciones (listar, crear, editar, activar/desactivar) contra datos reales de Mnemosine, y fijar el patrón de endpoint Nitro + Zod + tabla/formulario que reutilizarán los demás catálogos (temas, bots, actores).

## Por qué este spec

`PANEL_ARGOS.md` es el documento de diseño original, pero desde que se escribió el código se instalaron dependencias distintas a las que ahí se proponen: `@nuxt/ui` en vez de shadcn-vue, y `nuxt-zod` en vez de `zod` + `vee-validate` sueltos (ninguno de estos dos últimos está instalado). Este es el primer spec que toca código real, así que fija cómo se resuelven esas discrepancias para los specs 02–04 que vienen después (Temas, Bots, Actores), que reutilizan el mismo patrón.

## Scope

**In:**

- Rename `app/pages/intituciones/` → `app/pages/instituciones/` (corrige el typo).
- Registrar el módulo `nuxt-zod` en `nuxt.config.ts`.
- Esquema compartido `shared/schemas/instituciones.ts` (Zod) para crear y editar.
- Endpoints Nitro: `GET /api/instituciones` (listar), `POST /api/instituciones` (crear), `PUT /api/instituciones/[id]` (editar, incluye el toggle de `activa`).
- `TablaInstituciones.vue`: tabla real (`UTable`) con datos de Mnemosine, columna de estado activa/inactiva, acción "editar" por fila.
- `NuevaInstitucion.vue`: modal (`UModal` + `UForm`) reutilizado para alta y edición.
- `app/pages/instituciones/index.vue`: wiring de título + botón "Nueva institución" + tabla.
- `NavbarHeader.vue`: links reales (con ícono) a `/actores`, `/instituciones`, `/temas`, `/bots`.
- Limpieza mínima de `app/app.vue`: quitar el `<TemplateMenu />` inexistente y el branding del starter template de Nuxt UI.

**Out of scope (para specs futuros):**

- Todo lo de `actores`, `temas`, `bots` (specs 02–04).
- Autenticación / protección de rutas (spec 05) — los endpoints quedan abiertos por ahora.
- Borrado físico (DELETE) de instituciones.
- Tarjeta de conteo en `HeroStadisitics.vue` (spec 06).
- Campos de auditoría `actualizado_por`/`actualizado_en` (spec 06; la tabla `instituciones` ni siquiera tiene esas columnas en el schema actual).
- Validación de duplicados en vivo mientras se escribe.

## Data model

No se agregan tablas ni columnas nuevas en Postgres — reutiliza `instituciones` tal como está en `prisma/schema.prisma`. Lo único nuevo es el esquema compartido de validación:

```ts
// shared/schemas/instituciones.ts
const NIVELES = ['MUNICIPAL', 'ESTATAL', 'FEDERAL', 'AUTONOMO', 'IP', 'EDUCACION', 'OTROS'] as const
const ESTADOS = ['COAHUILA', 'DURANGO', 'NACIONAL', 'INTERNACIONAL'] as const

export default {
  crear: z.object({
    nombre: z.string().min(3),
    nivel: z.enum(NIVELES),
    estado: z.enum(ESTADOS).optional(),
    municipio: z.string().optional()
  }),
  actualizar: z.object({
    nombre: z.string().min(3),
    nivel: z.enum(NIVELES),
    estado: z.enum(ESTADOS).optional(),
    municipio: z.string().optional(),
    activa: z.boolean()
  })
}
```

Convenciones:

- `estado` vacío es válido (instituciones IP/educación no siempre tienen uno).
- `activa` solo se edita a través de `actualizar`, nunca se manda en `crear` (nace `true` por default de la BD).

## Implementation plan

1. Renombrar `app/pages/intituciones/` a `app/pages/instituciones/`. Prueba manual: `pnpm dev`, `/instituciones` sirve la página (aunque el contenido siga siendo placeholder).
2. Registrar `nuxt-zod` en `nuxt.config.ts` (`modules`, `nuxtZod: { zodVersion: 'v4' }`). Prueba manual: `pnpm typecheck` no truena y no aparece el warning de `zodVersion` al correr `pnpm dev`.
3. Crear `shared/schemas/instituciones.ts` con los esquemas `crear` y `actualizar` de arriba. Prueba manual: `pnpm typecheck` reconoce `useZodSchemas().instituciones`.
4. Crear `server/api/instituciones/index.get.ts`: `prisma.instituciones.findMany({ orderBy: { nombre: 'asc' } })`. Prueba manual: `curl http://localhost:3000/api/instituciones` devuelve JSON con las ~64 instituciones reales.
5. Crear `server/api/instituciones/index.post.ts`: valida con `event.validate({ body: schemas.crear })`, inserta con Prisma, captura el error de unicidad de Postgres (`P2002`) y responde 409 con "Ya existe una institución con ese nombre". Prueba manual: POST con nombre repetido → 409; POST válido → 201 y fila nueva en BD.
6. Crear `server/api/instituciones/[id].put.ts`: valida con `schemas.actualizar`, `prisma.instituciones.update`, 404 si el id no existe, 409 en duplicado de nombre. Prueba manual: PUT a un id real cambia el registro; PUT a un id inexistente → 404.
7. Reescribir `TablaInstituciones.vue`: `useFetch('/api/instituciones')`, `UTable` con columnas nombre/nivel/estado/municipio/activa (badge), botón de editar por fila que emite un evento con la fila. Prueba manual: la tabla en `/instituciones` muestra datos reales.
8. Reescribir `NuevaInstitucion.vue` como `UModal` con `UForm` (prop `schema` = `schemas.crear` o `schemas.actualizar` según modo; prop opcional `institucion` para modo edición). Al guardar hace POST o PUT según corresponda y cierra el modal. Prueba manual: crear una institución de prueba y verla aparecer en la tabla sin recargar.
9. Editar `app/pages/instituciones/index.vue`: el botón "Nueva institución" abre el modal en modo alta; el evento "editar" de la tabla abre el mismo modal en modo edición. Prueba manual: flujo completo alta → editar → toggle activa desde la UI.
10. Editar `NavbarHeader.vue`: links con ícono a las 4 rutas existentes. Prueba manual: navegación visual desde cualquier página.
11. Limpiar `app/app.vue`: quitar `<TemplateMenu />`, el título/branding de "Nuxt Starter Template", dejar el shell `UApp/UHeader/UMain/UFooter` mínimo. Prueba manual: no aparece el warning "Failed to resolve component: TemplateMenu" en la consola del navegador.

## Acceptance criteria

- [ ] `pnpm dev` levanta sin errores y `/instituciones` reemplaza a `/intituciones` (la ruta vieja ya no existe).
- [ ] `GET /api/instituciones` responde 200 con las instituciones reales de Mnemosine.
- [ ] Crear una institución con nombre nuevo desde el modal la agrega a la tabla sin recargar la página.
- [ ] Crear una institución con un `nombre` ya existente muestra un error 409 legible en el formulario, no una excepción sin manejar.
- [ ] Editar nivel/estado/municipio de una institución existente persiste el cambio y se refleja en la tabla.
- [ ] El switch de `activa`/inactiva cambia el estado en BD y en la tabla.
- [ ] No existe ningún botón ni endpoint de borrado físico de instituciones.
- [ ] La barra de navegación tiene links funcionales a `/actores`, `/instituciones`, `/temas`, `/bots`.
- [ ] La consola del navegador no muestra advertencias de "Failed to resolve component: TemplateMenu".
- [ ] `pnpm lint` y `pnpm typecheck` pasan sin errores nuevos.

## Decisiones

- **Sí:** `nuxt-zod` (`event.validate()` + `useZodSchemas()`) en vez de `zod` + `vee-validate` sueltos. Ya está instalado, y `UForm` de `@nuxt/ui` v4 acepta un schema de Zod directo — no hace falta vee-validate para tener validación de formulario reactiva.
- **No:** instalar `vee-validate`/`@vee-validate/zod` como pedía `PANEL_ARGOS.md`. Serían dos formas de validar el mismo dato (una en el módulo, otra en el form) sin necesidad real.
- **Sí:** un solo componente `NuevaInstitucion.vue` para alta y edición (prop `institucion?`), en vez de duplicar el formulario. Mantiene el nombre que ya usa `PANEL_ARGOS.md`.
- **No:** borrado físico. `actores.institucion_id` no tiene cascada (`onDelete: NoAction`); el patrón de `activa` como switch editorial ya existe en el diseño original.
- **Sí:** dejar los endpoints sin protección de auth por ahora. El panel no está desplegado públicamente todavía; el spec 05 cierra esto antes del deploy (spec 07).
- **No:** validar duplicados de `nombre` en vivo mientras se escribe. Un POST/PUT con 409 claro alcanza para el volumen de datos actual (~64 filas) y evita llamadas de red extra en cada tecla.
- **Sí:** limpiar `app.vue` (quitar `TemplateMenu` inexistente y branding del starter) dentro de este spec, aunque no sea "instituciones" en sentido estricto — es el primer spec que corre la app de verdad y ese error/branding aparece en cada página del panel.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Sin autenticación, cualquiera con la URL puede crear/editar instituciones | Aceptado temporalmente (ver Decisiones); el spec 05 lo cierra antes de exponer el panel fuera de localhost |
| `nuxt-zod` sin `zodVersion` fijo loguea un warning en cada arranque | Se fija explícito `zodVersion: 'v4'` en el paso 2 del plan |
| El Prisma Client generado en `app/generated/prisma/` podría no reflejar la BD si `instituciones` cambia en Mnemosine mientras tanto | No aplica a este spec (no se toca el schema); si hiciera falta, correr `npx prisma db pull && npx prisma generate` primero |

## Lo que **no** está en este spec

- CRUD de actores, temas o bots (specs 02, 03, 04).
- Autenticación (spec 05).
- Borrado físico de instituciones.
- Tarjeta de conteo en `HeroStadisitics.vue` y campos de auditoría (spec 06).
- Deploy en Coolify (spec 07).

Cada uno de estos, si aplica, va en su propio spec.
