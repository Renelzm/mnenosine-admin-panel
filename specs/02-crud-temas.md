# SPEC 02 — CRUD de Temas y Categorías

> **Estado:** APROBADO
> **Depende de:** SPEC 01
> **Fecha:** 2026-08-19
> **Objetivo:** Construir el CRUD de temas (con selección de categoría principal y secundaria) y de categorias_tema, reutilizando el patrón de endpoint Nitro + Zod + tabla/modal ya establecido en el spec 01.

## Scope

**In:**

- `shared/schemas/categorias-tema.ts` y `shared/schemas/temas.ts` (Zod).
- Endpoints Nitro: `GET/POST /api/categorias-tema`, `PUT /api/categorias-tema/[id]`.
- Endpoints Nitro: `GET/POST /api/temas`, `PUT /api/temas/[id]`. El `GET` resuelve los nombres de la categoría principal y secundaria (no expone las relaciones crudas de Prisma).
- `TablaCategoriasTema.vue` y `NuevaCategoriaTema.vue` (nuevos): tabla + modal de alta/edición, solo campo `nombre`.
- `TablaTemas.vue` y `NuevoTema.vue` (reescritos): tabla con categoría/categoría secundaria resueltas, modal con dos `USelect` (principal obligatoria, secundaria opcional y distinta a la principal), switch `activo` en modo edición.
- `app/pages/temas/index.vue`: título con ícono (`i-lucide-tag`), sección de categorías (card compacta) + sección de temas (card), ambas en la misma ruta.

**Out of scope (para specs futuros):**

- Actores y Bots (specs 03, 04).
- Ruta `/categorias` separada o link propio en el navbar (decisión: categorías vive embebida en `/temas`).
- Autenticación (spec 05).
- Borrado físico de `temas` o `categorias_tema`.
- Reclasificar `RANKING`/`INAUGURACIÓN` fuera de "Otros" — es una decisión editorial que se resuelve editando esos temas desde esta misma UI una vez construida, no requiere trabajo de spec.
- Tarjeta de conteo en `HeroStadisitics.vue` y campos de auditoría (spec 06); deploy (spec 07).

## Data model

No se agregan tablas ni columnas — reutiliza `temas` y `categorias_tema` tal como están en `prisma/schema.prisma`. `categorias_tema` no tiene columna `activo` (a diferencia de `instituciones`), así que su CRUD es solo alta/edición de `nombre`, sin toggle.

```ts
// shared/schemas/categorias-tema.ts
export default {
  crear: z.object({ nombre: z.string().min(3) }),
  actualizar: z.object({ nombre: z.string().min(3) })
}
```

```ts
// shared/schemas/temas.ts
const camposComunes = {
  nombre: z.string().min(3),
  categoria_id: z.coerce.number().int(),
  categoria_secundaria_id: z.coerce.number().int().optional()
}

const distinta = (data) => !data.categoria_secundaria_id || data.categoria_secundaria_id !== data.categoria_id

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
```

Convenciones:

- `categoria_id` es opcional en la columna de Postgres (`Int?`) pero obligatorio en el schema Zod — "obligatoria en la práctica" según `PANEL_ARGOS.md`.
- El `GET /api/temas` reshapea la respuesta de Prisma a `{ id, nombre, activo, categoria_id, categoria, categoria_secundaria_id, categoria_secundaria }`, donde `categoria`/`categoria_secundaria` son los nombres ya resueltos (no los nombres largos de relación autogenerados por `db pull`).

## Implementation plan

1. Crear `shared/schemas/categorias-tema.ts`. Prueba manual: `pnpm typecheck` reconoce `useZodSchemas().categoriasTema`.
2. Crear `server/api/categorias-tema/index.get.ts` (`findMany` ordenado por `nombre`), `index.post.ts` (409 en duplicado) y `[id].put.ts` (404/409). Prueba manual: los tres casos en Postman, igual que en el spec 01.
3. Crear `shared/schemas/temas.ts` con el `refine` de categoría distinta. Prueba manual: `pnpm typecheck` reconoce `useZodSchemas().temas`; un `safeParse` con `categoria_id === categoria_secundaria_id` falla.
4. Crear `server/api/temas/index.get.ts`: `findMany` con `include` de ambas categorías, reshapeado como se describe arriba. Prueba manual: `curl http://localhost:3000/api/temas` devuelve `categoria`/`categoria_secundaria` como texto, no como objetos anidados.
5. Crear `server/api/temas/index.post.ts` (409 en duplicado de `nombre`) y `server/api/temas/[id].put.ts` (404/409, valida la categoría distinta vía el schema). Prueba manual: POST/PUT con `categoria_secundaria_id` igual a `categoria_id` responde 422 con el mensaje del `refine`.
6. Crear `TablaCategoriasTema.vue`: tabla simple (`nombre` + acción editar), igual patrón que `TablaInstituciones.vue`. Prueba manual: muestra las ~11 categorías reales.
7. Crear `NuevaCategoriaTema.vue`: modal `UModal`+`UForm` con un solo campo `nombre`, alta/edición. Prueba manual: crear/editar una categoría de prueba se refleja sin recargar.
8. Reescribir `TablaTemas.vue`: columnas nombre/categoría/categoría secundaria/activo (badge)/acciones. Prueba manual: muestra los ~96 temas reales con sus categorías resueltas.
9. Reescribir `NuevoTema.vue`: modal con `USelect` de categoría principal (poblado desde `/api/categorias-tema`, obligatorio) y `USelect` de categoría secundaria (mismo catálogo, opcional), switch `activo` en modo edición. Prueba manual: elegir la misma categoría en ambos selects muestra el error de "debe ser distinta" antes de enviar.
10. Editar `app/pages/temas/index.vue`: título con ícono `i-lucide-tag`, sección de categorías (card + botón "Nueva categoría" + `TablaCategoriasTema`) y sección de temas (card + botón "Nuevo tema" + `TablaTemas`) en la misma página. Prueba manual: flujo completo de alta/edición en ambas secciones, sin recargar la página.

## Acceptance criteria

- [ ] `GET /api/categorias-tema` y `GET /api/temas` responden 200 con datos reales de Mnemosine.
- [ ] Crear una categoría nueva la agrega a su tabla sin recargar.
- [ ] Crear un tema nuevo con categoría principal (y opcionalmente secundaria distinta) lo agrega a la tabla sin recargar.
- [ ] Elegir la misma categoría como principal y secundaria bloquea el guardado con un mensaje claro, tanto en el formulario como si se manda directo por API.
- [ ] Nombre duplicado (en categorías o en temas) responde 409 legible.
- [ ] Editar un tema existente (incluida su categoría o el toggle `activo`) persiste el cambio y se refleja en la tabla.
- [ ] No existe borrado físico de categorías ni de temas.
- [ ] La página `/temas` no requiere navegar a otra ruta para gestionar categorías.
- [ ] `pnpm lint` y `pnpm typecheck` pasan sin errores nuevos.

## Decisiones

- **Sí:** CRUD completo de `categorias_tema` en este mismo spec (alta + edición de `nombre`), sin toggle porque la tabla no tiene columna `activo`, sin borrado físico porque `temas.categoria_id`/`categoria_secundaria_id` referencian con `onDelete: NoAction`.
- **Sí:** categorías embebidas en `/temas`, sin ruta ni link de nav propios — son ~11 filas, no justifican una sección separada del panel.
- **Sí:** duplicar la lógica del `refine` de "categoría distinta" entre `crear` y `actualizar` en vez de compartir un schema base con `.and()` — evita fricción de tipos entre `ZodEffects` y el genérico de `UForm`, y son solo 3 líneas repetidas.
- **Sí:** el `GET /api/temas` reshapea la respuesta a nombres simples (`categoria`, `categoria_secundaria`) en vez de exponer los campos de relación autogenerados por `prisma db pull` (`categorias_tema_temas_categoria_idTocategorias_tema...`), que son ilegibles en el frontend.
- **No:** renombrar esas relaciones en `prisma/schema.prisma` — es un archivo introspectado desde Mnemosine; se evita editarlo fuera de `db pull` para no perder los cambios en el próximo pull.
- **Reutiliza sin volver a decidir (mismo patrón que spec 01):** edición completa + sin borrado físico + sin auth todavía + sin validación de duplicados en vivo + modal `UModal`+`UForm` con `nuxt-zod`.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `RANKING`/`INAUGURACIÓN` siguen en "Otros" sin mejor categoría | No bloquea este spec; se resuelve editando esos dos temas desde la UI una vez construida (decisión editorial pendiente, no técnica) |
| Sin autenticación, cualquiera con la URL puede crear/editar temas y categorías | Igual que en spec 01; el spec 05 lo cierra antes del deploy |

## Lo que **no** está en este spec

- CRUD de actores y bots (specs 03, 04).
- Ruta `/categorias` separada.
- Autenticación (spec 05).
- Borrado físico de temas o categorías.
- Dashboard/auditoría (spec 06) y deploy (spec 07).

Cada uno de estos, si aplica, va en su propio spec.
