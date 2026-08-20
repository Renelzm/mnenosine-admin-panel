# SPEC 03 — CRUD de Actores

> **Estado:** IMPLEMENTADO
> **Depende de:** SPEC 01
> **Fecha:** 2026-08-19
> **Objetivo:** Construir el CRUD completo de actores (alta, edición, activar/desactivar) con selector de institución y curaduría de bots vía `bot_actores`, agregando una constraint `UNIQUE` real en `actores.nombre` en Mnemosine y un endpoint mínimo de lectura de `bots` que reutilizará el spec 04.

## Scope

**In:**

- `ALTER TABLE actores ADD CONSTRAINT actores_nombre_key UNIQUE (nombre)` en Mnemosine (con confirmación explícita antes de ejecutarlo — ver Riesgos), seguido de `npx prisma db pull` + `npx prisma generate` para sincronizar `schema.prisma`.
- `shared/schemas/actores.ts` (Zod) para crear y editar.
- Endpoints Nitro: `GET/POST /api/actores`, `PUT /api/actores/[id]`. El `GET` resuelve el nombre de la institución y la lista de `bot_id` curados por actor (no expone las relaciones crudas de Prisma).
- `server/api/bots/index.get.ts` (nuevo, solo lectura): `findMany` de `bots` ordenado por `nombre`. Es la base que el spec 04 extenderá con `index.post.ts`/`[id].put.ts` — este spec no construye alta/edición de bots.
- `TablaActores.vue` (reescrito): tabla con columnas nombre/institución/puesto/circunstancia/activo (badge)/acciones, con buscador de texto por nombre y filtros adicionales (todos client-side) por institución, por estado/municipio (derivados de las instituciones ya cargadas) y por bot curado.
- `NuevoActor.vue` (reescrito): modal con formulario completo (nombre, institución, dependencia, puesto, vigente_desde/hasta, circunstancia/circunstancia_hasta, nota, switch `activo` en edición) + botonero multi-select de bots `alcance='curado' AND activo=true` + nota informativa (no editable) de los bots `alcance='todos' AND activo=true`.
- `app/pages/actores/index.vue`: título con ícono (`i-lucide-users`), botón "Nuevo actor" + tabla, todo en la misma ruta.

**Out of scope (para specs futuros):**

- CRUD de bots (alta/edición/activar) — spec 04. Este spec solo agrega el `GET /api/bots` que ese CRUD también usará.
- CRUD de `candidaturas` — spec propio a futuro, sin número asignado todavía. La tabla existe (42 candidaturas reales) pero no se toca en este spec.
- Autenticación (spec 05).
- Borrado físico de actores o de filas `bot_actores` fuera del flujo normal de edición (deseleccionar un bot en el form sí borra su fila `bot_actores`, pero no hay un botón de "eliminar actor").
- La columna legacy `actores.bots` (`String[]`, hoy vacía en las 213 filas reales) — no se lee, no se escribe, no se elimina del schema. Se documenta como muerta, nada más.
- Tarjeta de conteo en `HeroStadisitics.vue` y campos de auditoría (spec 06); deploy (spec 07).

## Data model

`actores` y `bot_actores` ya existen en `prisma/schema.prisma` (ver Mnemosine). El único cambio de esquema de este spec es agregar la constraint de unicidad:

```sql
-- Ejecutar directo contra Mnemosine, una sola vez, con confirmación explícita del usuario:
ALTER TABLE actores ADD CONSTRAINT actores_nombre_key UNIQUE (nombre);
```

Verificado antes de escribir este spec: los 213 actores reales no tienen ningún `nombre` duplicado hoy, así que la constraint se puede agregar sin conflicto. Después de correrla, `npx prisma db pull` reflejará `nombre String @unique` en el modelo `actores` y `npx prisma generate` regenera el client.

```ts
// shared/schemas/actores.ts
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
```

Convenciones:

- `bots_curados` no es una columna de `actores` — es la lista de `bot_id` que el endpoint usa para sincronizar filas en `bot_actores` dentro de una transacción Prisma (`$transaction`). Nunca se escribe nada en `actores.bots`.
- El `GET /api/actores` reshapea la respuesta a `{ id, nombre, institucion_id, institucion, institucion_nivel, institucion_estado, institucion_municipio, dependencia, puesto, vigente_desde, vigente_hasta, circunstancia, circunstancia_hasta, nota, activo, bots_curados }`, donde `institucion*` son los campos ya resueltos de la institución relacionada (para poder filtrar la tabla por estado/municipio sin otra llamada) y `bots_curados` es `number[]` (los `bot_id` de sus filas en `bot_actores`). Mismo patrón de reshape que `GET /api/temas` en el spec 02 — no se usan las vistas `actores_completo`/`temas_completo` porque no están modeladas en `schema.prisma` (Prisma no introspecta vistas sin el preview feature `views`, que no está activado).
- Los filtros de `TablaActores.vue` (institución, estado, municipio, bot curado) son 100% client-side sobre los datos ya traídos por `GET /api/actores` (más `GET /api/bots` para poblar el select de bot) — no generan llamadas de red adicionales. Las opciones de estado/municipio se derivan (`Set` de valores únicos) de los `institucion_estado`/`institucion_municipio` presentes en la respuesta, no de un catálogo aparte. El filtro de bot solo lista bots `alcance='curado'` (los `alcance='todos'` aplican a todos los actores por definición, filtrar por ellos no aporta nada).
- `GET /api/bots` devuelve todas las filas de `bots` sin filtrar; el filtro por `alcance`/`activo` para armar las dos listas (curado seleccionable vs. todos informativo) se hace en `NuevoActor.vue`, igual que `NuevoTema.vue` filtra categorías en el cliente.
- `activo` solo se edita a través de `actualizar`, nunca se manda en `crear` (nace `true` por default de la BD, mismo patrón que `instituciones.activa`).

## Implementation plan

1. Confirmar con el usuario y ejecutar `ALTER TABLE actores ADD CONSTRAINT actores_nombre_key UNIQUE (nombre)` contra Mnemosine, luego `npx prisma db pull && npx prisma generate`. Prueba manual: `schema.prisma` muestra `nombre String @unique` en `model actores`.
2. Crear `shared/schemas/actores.ts`. Prueba manual: `pnpm typecheck` reconoce `useZodSchemas().actores`.
3. Crear `server/api/bots/index.get.ts` (`findMany` ordenado por `nombre`). Prueba manual: `curl http://localhost:3000/api/bots` devuelve los 3 bots reales (ARGOS TRC MARS, ARGOS LAGUNA, SINTETIA) con su `alcance`/`activo`.
4. Crear `server/api/actores/index.get.ts`: `findMany` con `include` de `instituciones` y `bot_actores`, reshapeado como se describe arriba (incluye `institucion_nivel`/`institucion_estado`/`institucion_municipio`). Prueba manual: `curl http://localhost:3000/api/actores` devuelve 213 filas con `institucion` como texto, sus campos de ubicación y `bots_curados` como array de ids.
5. Crear `server/api/actores/index.post.ts`: valida con `actores.crear`, crea el actor y sus filas `bot_actores` en una transacción, captura `P2002` → 409 "Ya existe un actor con ese nombre". Prueba manual: POST con nombre repetido → 409; POST válido con `bots_curados` → 201 y filas nuevas en `bot_actores`.
6. Crear `server/api/actores/[id].put.ts`: valida con `actores.actualizar`, actualiza el actor, borra las filas `bot_actores` existentes del actor y re-inserta las de `bots_curados` (todo en una transacción), 404/409. Prueba manual: PUT que quita y agrega bots refleja el diff correcto en `bot_actores`.
7. Reescribir `TablaActores.vue`: `useFetch('/api/actores')` + `useFetch('/api/bots')`, buscador de texto por `nombre` y selects de filtro por institución, estado, municipio y bot curado (todos client-side, combinables entre sí con AND), columnas nombre/institución/puesto/circunstancia/activo (badge)/acciones. Prueba manual: muestra los 213 actores reales; cada filtro reduce la tabla correctamente y se pueden combinar.
8. Reescribir `NuevoActor.vue`: formulario completo + `USelect` de institución (poblado desde `/api/instituciones`, filtrado a `activa=true` más la ya asignada si se está editando) + botonero multi-select de bots curados (poblado desde `/api/bots` filtrado a `alcance='curado' AND activo`) + nota informativa no editable de bots `alcance='todos' AND activo`. Prueba manual: crear/editar un actor de prueba con institución y bots se refleja sin recargar; la nota de bots "todos" aparece y no es interactiva.
9. Editar `app/pages/actores/index.vue`: título con ícono `i-lucide-users`, botón "Nuevo actor" + `TablaActores`. Prueba manual: flujo completo alta → editar → toggle `activo` → editar curaduría de bots, todo sin recargar.

## Acceptance criteria

- [x] La constraint `UNIQUE` en `actores.nombre` existe en Mnemosine y `schema.prisma` la refleja tras el `db pull`.
- [x] `GET /api/actores` responde 200 con los actores reales (213 al momento de escribir este spec), institución resuelta por nombre y `bots_curados` por actor.
- [x] `GET /api/bots` responde 200 con los bots reales existentes.
- [x] Crear un actor nuevo con institución y bots curados seleccionados lo agrega a la tabla sin recargar, y crea las filas correspondientes en `bot_actores`.
- [x] Crear un actor con `nombre` duplicado responde 409 legible (usando la constraint real de Postgres, no solo una validación de la app).
- [x] El formulario muestra una nota informativa (no editable) de los bots `alcance='todos'` activos (etiquetado en la UI como "bot segmentado"/"bots segmentados").
- [x] Editar un actor (institución, fechas, nota, `activo` y bots curados) persiste el cambio y actualiza `bot_actores` correctamente: agrega los bots nuevos, quita los deseleccionados.
- [x] El select de institución en alta solo lista instituciones `activa=true`; en edición también muestra la institución ya asignada aunque esté inactiva.
- [x] La tabla de actores tiene un buscador por nombre y filtros por institución, estado, municipio y bot curado, todos client-side sin llamadas de red adicionales, combinables entre sí. Además (ampliación post-implementación): todas las columnas de datos tienen headers ordenables con un clic.
- [x] No existe borrado físico de actores, y las filas de `bot_actores` solo cambian como resultado de editar el actor (nunca hay un botón de "eliminar").
- [x] `pnpm lint` y `pnpm typecheck` pasan sin errores nuevos (los ya documentados como preexistentes en los specs 01/02 no cuentan).

## Decisiones

- **Sí:** `bot_actores` es la fuente de verdad para la curaduría de bots por actor. Verificado con datos reales: 96 filas en `bot_actores` vs. 0 actores con algo en la columna legacy `actores.bots`.
- **No:** tocar ni leer `actores.bots`. Es una columna del schema pulleado que no tiene ningún dato real ni lógica de negocio documentada — se deja intacta.
- **Sí:** agregar una constraint `UNIQUE` real en `actores.nombre` en Mnemosine (`ALTER TABLE` + `db pull` + `generate`), a diferencia de los specs 01/02 que no tocaron el esquema. Se verificó primero que los 213 actores reales no tienen duplicados, así que no requiere limpieza de datos previa. Es la primera vez que este panel modifica el esquema de una BD compartida con n8n — ver Riesgos.
- **No:** CRUD de `candidaturas` en este spec. No tiene número asignado en el roadmap 02-04 original y es una entidad con su propio ciclo (procesos electorales); queda como spec futuro pendiente de definir.
- **Sí:** incluir la curaduría de bots (multi-select + nota informativa) en este spec, no en el spec 04. Solo necesita lectura de `bots` (que ya tiene datos reales), y es la regla de negocio central del formulario de actor documentada en `CLAUDE.md`/`PANEL_ARGOS.md`.
- **Sí:** incluir los 4 campos de fecha (`vigente_desde`, `vigente_hasta`, `circunstancia`, `circunstancia_hasta`) y `nota` como editables desde ahora — son parte del dato real del actor, no un extra.
- **Sí:** buscador de texto en `TablaActores.vue` (213 filas, más del doble que instituciones o temas). Filtro client-side simple, sin llamadas de red adicionales.
- **Sí (ampliado durante la implementación):** además del buscador por nombre, `TablaActores.vue` suma filtros por institución, estado, municipio (derivados de las instituciones ya cargadas, sin catálogo aparte) y bot curado — decisión tomada a mitad de implementación del paso 7 porque 213 filas sin más forma de acotar resultaba poco usable. El `GET /api/actores` se amplía para incluir `institucion_nivel`/`institucion_estado`/`institucion_municipio` (no solo `institucion`) para soportarlo sin llamadas extra.
- **Sí (ampliado durante la implementación):** `TablaActores.vue` muestra todas las columnas de datos del actor (dependencia, ambos rangos de fechas, circunstancia, nota, bots resueltos por nombre), con headers ordenables con un clic (sorting nativo de TanStack Table vía `UTable`), en vez del set reducido de columnas planeado originalmente.
- **Sí:** en la UI, "bot alcance='curado'" se etiqueta como "bot segmentado"/"bots segmentados" (placeholder del filtro, label del checkbox group). Es solo texto visible — el valor real en la BD (`bots.alcance = 'curado'`) y los nombres de campos/variables internos (`bots_curados`) no cambian.
- **No (fuera de alcance, recordado durante la implementación):** tarjeta de conteo de totales (actores/temas/instituciones) en `HeroStadisitics.vue` — ya estaba reservada para el spec 06 desde los specs 01/02; se mantiene ahí.
- **Sí (ajuste posterior al cierre, durante el spec 04):** la columna "acciones" (botón editar) de `TablaActores.vue` se movió al principio de la tabla y se hizo `sticky left-0` — con 12 columnas de datos, el botón quedaba fuera de vista al hacer scroll horizontal.
- **Reutiliza sin volver a decidir (mismo patrón que specs 01/02):** un solo componente para alta y edición (prop `actor?`), sin borrado físico, sin auth todavía, sin validación de duplicados en vivo mientras se escribe, modal `UModal`+`UForm` con `nuxt-zod`, reshape del `GET` en vez de exponer relaciones crudas de Prisma.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El `ALTER TABLE` corre contra Mnemosine, una BD compartida con los workflows de n8n que también insertan actores | Se verificó que hoy no hay duplicados; se ejecuta con confirmación explícita del usuario antes de correrlo, e idealmente en una ventana de baja actividad de los bots |
| Si algún flujo de n8n llega a insertar un actor con `nombre` repetido después de agregar la constraint, ese INSERT fallará en vez de crear un duplicado silencioso | Es el comportamiento buscado (evitar duplicados), pero implica que quien mantiene los workflows de n8n debe estar consciente del cambio |
| `bot_actores` no tiene columna de fecha/auditoría — no se puede saber cuándo se curó un actor a un bot | Aceptado; los campos de auditoría son un tema del spec 06 |
| Sin autenticación, cualquiera con la URL puede crear/editar actores y su curaduría de bots | Igual que specs 01/02; el spec 05 lo cierra antes del deploy |

## Lo que **no** está en este spec

- CRUD de bots (spec 04) — solo se agrega el `GET /api/bots` que ese spec reutilizará.
- CRUD de `candidaturas` (spec futuro sin número asignado).
- Autenticación (spec 05).
- Borrado físico de actores.
- Dashboard/auditoría (spec 06) y deploy (spec 07).

Cada uno de estos, si aplica, va en su propio spec.
