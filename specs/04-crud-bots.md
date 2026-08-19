# SPEC 04 — CRUD de Bots

> **Estado:** APROBADO
> **Depende de:** SPEC 03
> **Fecha:** 2026-08-19
> **Objetivo:** Construir el CRUD completo de bots (alta, edición, activar/desactivar, cambiar alcance) extendiendo el `GET /api/bots` ya creado en el spec 03, agregando una constraint `UNIQUE` real en `bots.nombre` en Mnemosine y limpieza automática de `bot_actores` al cambiar `alcance` a `'todos'`.

## Scope

**In:**

- `ALTER TABLE bots ADD CONSTRAINT bots_nombre_key UNIQUE (nombre)` en Mnemosine (con confirmación explícita antes de ejecutarlo — ver Riesgos), seguido de `npx prisma db pull` + `npx prisma generate`.
- `shared/schemas/bots.ts` (Zod) para crear y editar.
- `server/api/bots/index.get.ts` (extiende el creado en el spec 03): agrega el conteo de actores curados por bot.
- `server/api/bots/index.post.ts` (nuevo): captura duplicado tanto de `nombre` como de `zona` (ambos con `UNIQUE` real) y responde 409 distinguiendo cuál campo.
- `server/api/bots/[id].put.ts` (nuevo): actualiza el bot; si el `alcance` guardado es `'todos'`, borra las filas de `bot_actores` de ese `bot_id` en la misma transacción.
- `TablaBots.vue` (nuevo): tabla con columnas zona/nombre/alcance (badge)/medio/institución contratante/activo (badge)/actores curados (conteo)/acciones.
- `NuevoBot.vue` (nuevo): modal con formulario (nombre, zona, `alcance` como select curado/todos, institución contratante, medio como texto libre, switch `activo` en edición).
- `app/pages/bots/index.vue`: título con ícono (`i-lucide-bot`), botón "Nuevo bot" + tabla, todo en la misma ruta.

**Out of scope (para specs futuros):**

- Autenticación (spec 05).
- Borrado físico de bots.
- Reasignación masiva de curaduría entre bots (mover todos los actores curados de un bot a otro) — no se pidió; se resuelve actor por actor desde el spec 03 si hace falta.
- Tarjeta de conteo en `HeroStadisitics.vue` y campos de auditoría (spec 06); deploy (spec 07).

## Data model

`bots` y `bot_actores` ya existen en `prisma/schema.prisma`. El único cambio de esquema de este spec es agregar la constraint de unicidad en `nombre` (`zona` ya la tiene, ver discrepancia documentada en `CLAUDE.md`):

```sql
-- Ejecutar directo contra Mnemosine, una sola vez, con confirmación explícita del usuario:
ALTER TABLE bots ADD CONSTRAINT bots_nombre_key UNIQUE (nombre);
```

Verificado antes de escribir este spec: los 2 bots reales (`ARGOS LAGUNA`, `SINTETIA`) no tienen `nombre` duplicado. La query de referencia documentada en `CLAUDE.md` para armar el catálogo de un bot busca por `nombre` (`WHERE nombre = '<bot>'`) — sin esta constraint, un duplicado futuro rompería esa búsqueda de forma silenciosa. Después de correrla, `npx prisma db pull` reflejará `nombre String @unique` en el modelo `bots` y `npx prisma generate` regenera el client.

```ts
// shared/schemas/bots.ts
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
```

Convenciones:

- `ALCANCES` coincide exactamente con el `CHECK` constraint real de Postgres (`bots_alcance_check`) — si algún día ese constraint cambia en Mnemosine, este enum debe actualizarse a mano (no se introspecta automáticamente).
- El `PUT /api/bots/[id]` borra las filas de `bot_actores` para ese `bot_id` cuando el body trae `alcance: 'todos'`, sin importar cuál era el alcance anterior — operación idempotente (no falla si ya no había filas). Es la regla de negocio ya documentada en `CLAUDE.md`: los bots `alcance='todos'` nunca leen `bot_actores`.
- El `GET /api/bots` se reshapea para incluir `actores_curados` (conteo de filas en `bot_actores` para ese `bot_id`), sin exponer las filas crudas de la relación.
- En duplicados, el POST/PUT distingue el campo real vía `error.meta?.target` de Prisma (`nombre` vs `zona`) para devolver un mensaje 409 específico en vez de uno genérico.
- `activo` solo se edita a través de `actualizar`, nunca se manda en `crear` (nace `true` por default de la BD, mismo patrón que instituciones/temas/actores).

## Implementation plan

1. Confirmar con el usuario y ejecutar `ALTER TABLE bots ADD CONSTRAINT bots_nombre_key UNIQUE (nombre)` contra Mnemosine, luego `npx prisma db pull && npx prisma generate`. Prueba manual: `schema.prisma` muestra `nombre String @unique` en `model bots`.
2. Crear `shared/schemas/bots.ts`. Prueba manual: `pnpm typecheck` reconoce `useZodSchemas().bots`.
3. Extender `server/api/bots/index.get.ts` para incluir `actores_curados` (conteo). Prueba manual: `curl http://localhost:3000/api/bots` devuelve los bots reales con su conteo de curados.
4. Crear `server/api/bots/index.post.ts`: valida con `bots.crear`, crea, captura `P2002` distinguiendo `nombre`/`zona` vía `error.meta?.target` → 409 específico. Prueba manual: POST con `nombre` repetido → 409 "Ya existe un bot con ese nombre"; con `zona` repetida → 409 "Ya existe un bot con esa zona"; válido → 201.
5. Crear `server/api/bots/[id].put.ts`: valida con `bots.actualizar`, actualiza el bot y, si `alcance === 'todos'`, borra `bot_actores` de ese `bot_id` en la misma transacción, 404/409. Prueba manual: cambiar `ARGOS LAGUNA` (curado, con actores curados) a `alcance='todos'` dejа `bot_actores` en 0 filas para ese bot — **usar un bot de prueba, no el real, para no romper la curaduría vigente** (ver Riesgos).
6. Crear `TablaBots.vue`: columnas zona/nombre/alcance (badge)/medio/institución contratante/activo (badge)/actores curados/acciones. Prueba manual: muestra los bots reales con su conteo correcto.
7. Crear `NuevoBot.vue`: formulario con nombre, zona, `alcance` (`USelect` curado/todos), institución contratante, medio (texto libre), switch `activo` en edición. Prueba manual: crear/editar un bot de prueba se refleja sin recargar; cambiar su alcance a `todos` limpia sus curados.
8. Editar `app/pages/bots/index.vue`: título con ícono `i-lucide-bot`, botón "Nuevo bot" + `TablaBots`. Prueba manual: flujo completo alta → editar → toggle `activo` → cambiar `alcance`, todo sin recargar.

## Acceptance criteria

- [ ] La constraint `UNIQUE` en `bots.nombre` existe en Mnemosine y `schema.prisma` la refleja tras el `db pull`.
- [ ] `GET /api/bots` responde 200 con los bots reales, incluyendo `actores_curados` (conteo) por bot.
- [ ] Crear un bot nuevo se agrega a la tabla sin recargar.
- [ ] Crear un bot con `nombre` duplicado responde 409 legible; crear uno con `zona` duplicada también responde 409 legible, distinguiendo el campo.
- [ ] Cambiar el `alcance` de un bot `curado` (con actores curados) a `todos` borra sus filas en `bot_actores` y el conteo baja a 0.
- [ ] Editar un bot (zona, medio, institución contratante, `activo`) persiste el cambio y se refleja en la tabla sin recargar.
- [ ] No existe borrado físico de bots.
- [ ] `pnpm lint` y `pnpm typecheck` pasan sin errores nuevos (los ya documentados como preexistentes en los specs 01-03 no cuentan).

## Decisiones

- **Sí:** agregar constraint `UNIQUE` real en `bots.nombre` (mismo patrón que `actores.nombre` en el spec 03). La query de referencia de `CLAUDE.md` busca bots por `nombre`; sin la constraint, un duplicado futuro rompería esa búsqueda de forma silenciosa. Verificado que hoy no hay duplicados entre los 2 bots reales.
- **Sí:** limpiar `bot_actores` automáticamente al cambiar `alcance` a `'todos'` — evita datos muertos y es consistente con la regla de negocio ya documentada (los bots `todos` nunca leen esa tabla). Es una operación irreversible sin historial (ver Riesgos).
- **No:** bloquear el cambio de alcance ni pedir confirmación adicional en la UI más allá del submit normal del formulario — se consideró, pero se descartó por simplicidad; el spec 06 (auditoría) podría agregar un registro de este tipo de cambios más adelante.
- **Sí:** `medio` como texto libre, no un select fijo de Telegram/WhatsApp — coherente con `PANEL_ARGOS.md`, que lo describe como "referencial, sin catálogo".
- **Sí:** columna de conteo de actores curados en `TablaBots.vue`, calculada en el mismo `GET /api/bots` sin llamada de red extra.
- **No:** reasignación masiva de curaduría entre bots en este spec — no se pidió; se resuelve actor por actor desde el spec 03.
- **Reutiliza sin volver a decidir (mismo patrón que specs 01-03):** un solo componente para alta y edición (prop `bot?`), sin borrado físico, sin auth todavía, sin validación de duplicados en vivo mientras se escribe, modal `UModal`+`UForm` con `nuxt-zod`.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El `ALTER TABLE` corre contra Mnemosine, compartida con los workflows de n8n | Se verificó que hoy no hay duplicados; se ejecuta con confirmación explícita del usuario antes de correrlo, igual que en el spec 03 |
| Si algún flujo de n8n inserta un bot con `nombre` repetido después de agregar la constraint, ese INSERT fallará | Comportamiento buscado; mismo riesgo aceptado que en `actores` |
| Limpiar `bot_actores` al cambiar `alcance` a `todos` es irreversible y no queda registro de qué actores estaban curados antes | Aceptado por ahora; la auditoría de este tipo de cambios es un tema del spec 06. Al probar este paso durante la implementación, usar un bot de prueba y no `ARGOS LAGUNA` (que hoy tiene curaduría real en producción) |
| Sin autenticación, cualquiera con la URL puede crear/editar bots y disparar la limpieza de curaduría | Igual que specs 01-03; el spec 05 lo cierra antes del deploy |

## Lo que **no** está en este spec

- Autenticación (spec 05).
- Borrado físico de bots.
- Reasignación masiva de curaduría entre bots.
- Dashboard/auditoría (spec 06) y deploy (spec 07).

Cada uno de estos, si aplica, va en su propio spec.
