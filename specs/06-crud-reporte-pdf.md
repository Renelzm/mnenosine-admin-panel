# SPEC 06 — CRUD de Reporte PDF

> **Estado:** Aprobado
> **Depende de:** SPEC 04
> **Fecha:** 2026-09-06
> **Objetivo:** Construir el CRUD de `pdf_actores` (catálogo de actores configurados para recibir reportes en PDF por correo/whatsapp) en la ruta `/reporte_pdf`, con un botón de descarga por fila que llama, vía proxy del propio backend, a un webhook de n8n todavía por construir.

## Scope

**In:**

- `npx prisma db pull` + `npx prisma generate` para introspectar `pdf_actores` (la tabla **ya existe** en Mnemosine, creada fuera de este proyecto — no se ejecuta ningún DDL en este spec).
- `shared/schemas/reporte_pdf.ts` (Zod) para crear y editar.
- `server/api/reporte_pdf/index.get.ts`: lista todas las filas, ordenadas por `nombre_actor` asc.
- `server/api/reporte_pdf/index.post.ts`: crea una fila.
- `server/api/reporte_pdf/[id].put.ts`: actualiza una fila.
- `server/api/reporte_pdf/[id]/descargar.get.ts` (nuevo): hace `POST { id }` al webhook de n8n (URL en `runtimeConfig.n8nPdfWebhookUrl`, variable de entorno `N8N_PDF_WEBHOOK_URL`) y responde con el PDF (stream) al navegador. Si la variable no está configurada, o el webhook falla/no responde, devuelve un error controlado.
- `nuxt.config.ts`: agrega `runtimeConfig.n8nPdfWebhookUrl` (server-only) y los íconos nuevos (`lucide:file-text`, `lucide:download`) al `clientBundle`.
- `.env`: agrega `N8N_PDF_WEBHOOK_URL=` (vacío, documentado como pendiente hasta que exista el flujo real en n8n).
- `TablaReportePdf.vue` (nuevo): tabla con columnas, **en este orden**: cliente prospecto / descripción (truncada, `title` con el texto completo) / nombre del actor / tipo de reporte / instrucción del reporte (truncada, `title` con el texto completo) / correo / whatsapp / caducidad / activo (badge) / acciones (editar + descargar).
- `NuevoReportePdf.vue` (nuevo): modal con formulario, **en este orden**: cliente prospecto (requerido), descripción, nombre_actor, tipo de reporte, instrucción del reporte en `UTextarea` grande, caducidad, correo, whatsapp, switch activo en edición.
- `app/pages/reporte_pdf/index.vue`: título con ícono (`i-lucide-file-text`), botón "Nuevo reporte" + tabla, misma estructura de página que `/bots`.
- `NavbarHeader.vue`: agrega el link "Reporte PDF" al nav.

**Out of scope (para specs futuros o para n8n, fuera de este repo):**

- Construir el flujo de n8n que genera el PDF — es un proceso externo; este spec solo deja el proxy y la variable de entorno listos para cuando exista.
- Envío automático/programado del reporte por correo o whatsapp (cron, recordatorios) — hoy la descarga es manual, por click.
- Relacionar `nombre_actor` con la tabla `actores` (FK, autocompletar, o cualquier validación cruzada) — se deja como texto libre, igual que campos análogos en `bots`.
- Cualquier automatismo sobre `caducidad` (desactivar el registro automáticamente, bloquear la descarga si ya venció, notificaciones de vencimiento) — el campo es puramente informativo en este spec.
- Autenticación — ya la cubre el middleware global del spec 05 sin cambios adicionales.
- Borrado físico de filas.

## Data model

`pdf_actores` ya existe en Mnemosine (no se crea ni se modifica su esquema en este spec):

```
id                 serial PK
created_at         timestamp NOT NULL default now()
nombre_actor       varchar(255) NOT NULL
instruccion_reporte text NULL
caducidad          date NULL
activo             bool NULL default true
correo             varchar(255) NULL
whatsapp           numeric NULL
tipo_reporte       varchar(255) NULL default 'general'
cliente_propsecto  varchar(255) NOT NULL
descripcion        text NULL
```

`cliente_propsecto` y `descripcion` se agregaron a la tabla real en Mnemosine ya avanzada la implementación de este spec (columnas 11 y 12, fuera de este repo). El nombre de columna trae un typo real en la base de datos (`propsecto`, no `prospecto`) — se respeta tal cual en el código (Prisma la introspecta así), pero la etiqueta visible en la UI se escribe correctamente ("Cliente prospecto"). Aunque son las últimas columnas físicas de la tabla, en el formulario y la tabla del panel se muestran **al principio** (antes de `nombre_actor`), por pedido explícito del usuario.

`npx prisma db pull` la introspecta como `model pdf_actores` en `schema.prisma`; revisar el tipo generado para `whatsapp` (probablemente `Decimal`) antes de escribir el Zod schema, para coercer correctamente.

```ts
// shared/schemas/reporte_pdf.ts
const camposComunes = {
  cliente_propsecto: z.string().min(1),
  descripcion: z.string().optional(),
  nombre_actor: z.string().min(1),
  instruccion_reporte: z.string().optional(),
  tipo_reporte: z.string().optional(),
  caducidad: z.coerce.date().optional(),
  correo: z.string().email().optional(),
  whatsapp: z.coerce.number().int().optional()
}

export default {
  crear: z.object(camposComunes),
  actualizar: z.object({ ...camposComunes, activo: z.boolean() })
}
```

Convenciones:

- `cliente_propsecto` es `varchar(255) NOT NULL` sin default — requerido en `crear` y `actualizar` (`z.string().min(1)`), igual de obligatorio que `nombre_actor`.
- `descripcion` es `text` opcional, sin restricciones adicionales.
- `instruccion_reporte` es `text` (sin límite de longitud), porque funciona como parte del prompt que arma el reporte para el bot — puede ser largo. El formulario lo muestra en un `UTextarea` con varias filas visibles (no un `UInput` de una sola línea), para que se pueda escribir/leer cómodo al capturar instrucciones largas.
- `correo` y `whatsapp` son ambos opcionales, sin regla de "al menos uno" — se puede guardar una fila sin ningún canal de envío si hace falta.
- `tipo_reporte` es texto libre (no hay `CHECK` constraint en Postgres para este campo, a diferencia de `bots.alcance`); si se omite, la DB aplica su default `'general'`.
- `caducidad` sigue el mismo patrón ya usado en `actores` (`vigente_desde`/`vigente_hasta`): `<UInput type="date">` en el form + `z.coerce.date().optional()` en el schema + un helper de formato fecha→string para precargar el input en edición.
- `activo` solo se edita a través de `actualizar`, nunca se manda en `crear` (nace `true` por default de la BD), mismo patrón que instituciones/temas/actores/bots.
- No hay manejo de duplicados (`P2002`) porque no existe ninguna constraint `UNIQUE` sobre `nombre_actor` ni ningún otro campo de esta tabla.

### Contrato del proxy de descarga

`GET /api/reporte_pdf/[id]/descargar`:

1. Valida `id` (numérico) y confirma que la fila existe en `pdf_actores` (404 si no).
2. Lee `runtimeConfig.n8nPdfWebhookUrl`. Si está vacío → 503 `"El servicio de generación de PDF todavía no está configurado"`.
3. Si está configurado, hace `POST` a esa URL con body `{ id }` (el webhook de n8n consulta `pdf_actores` por su cuenta con ese id).
4. Si la llamada falla, tarda demasiado, o no responde 200 → 502 `"No se pudo generar el PDF, intenta de nuevo"`.
5. Si responde 200, reenvía el binario al navegador con `Content-Type: application/pdf` y `Content-Disposition: attachment; filename="reporte_<id>.pdf"`.

En el frontend, el botón "Descargar" de `TablaReportePdf.vue` llama a ese endpoint con `$fetch(..., { responseType: 'blob' })` (no un link directo `<a href>`), crea un object URL temporal y dispara la descarga vía un `<a>` sintético — así puede mostrar estado de carga en el botón y, si falla, un toast de error genérico sin exponer el detalle técnico que devuelva n8n.

## Implementation plan

1. Ejecutar `npx prisma db pull && npx prisma generate`. Prueba manual: `schema.prisma` muestra `model pdf_actores` con los 8 campos documentados arriba.
2. Crear `shared/schemas/reporte_pdf.ts`. Prueba manual: `pnpm typecheck` reconoce `useZodSchemas().reportePdf` (o el nombre de export que use el resto de `shared/schemas`, revisar convención exacta de registro).
3. Agregar `runtimeConfig.n8nPdfWebhookUrl` a `nuxt.config.ts` y `N8N_PDF_WEBHOOK_URL=` a `.env`. Prueba manual: `pnpm dev` arranca sin error; `useRuntimeConfig().n8nPdfWebhookUrl` es accesible desde un server route.
4. Crear `server/api/reporte_pdf/index.get.ts`, `index.post.ts` y `[id].put.ts` siguiendo el patrón de `server/api/bots/*`. Prueba manual: `curl` a los tres confirma alta/edición/listado correctos, 404 en `PUT` a un id inexistente.
5. Crear `server/api/reporte_pdf/[id]/descargar.get.ts` con el contrato de arriba. Prueba manual: sin `N8N_PDF_WEBHOOK_URL` configurada → 503; con la variable apuntando a una URL que no responde → 502; ambos casos no tiran 500 sin manejar.
6. Crear `TablaReportePdf.vue` (columnas + botón editar + botón descargar con estado de carga) y `NuevoReportePdf.vue` (formulario completo). Prueba manual: alta/edición se reflejan sin recargar; clic en "Descargar" con el webhook sin configurar muestra el toast de error genérico y el botón vuelve a su estado normal.
7. Crear `app/pages/reporte_pdf/index.vue` y agregar el link en `NavbarHeader.vue`. Prueba manual: navegar a `/reporte_pdf` desde el nav muestra la página completa; sin sesión, redirige a `/login` (cubierto automáticamente por el middleware global del spec 05, sin cambios en ese archivo).

## Acceptance criteria

- [ ] `schema.prisma` refleja `model pdf_actores` tras el `db pull`.
- [ ] `GET /api/reporte_pdf` responde 200 con las filas existentes.
- [ ] Crear una fila nueva se agrega a la tabla sin recargar, con `tipo_reporte` default `'general'` si se deja vacío.
- [ ] Editar una fila (incluyendo `activo`) persiste el cambio y se refleja en la tabla sin recargar.
- [ ] Guardar sin `correo` ni `whatsapp` no produce error de validación.
- [ ] Guardar sin `cliente_propsecto` produce error de validación (campo requerido); `descripcion` es opcional.
- [ ] `cliente_propsecto` y `descripcion` aparecen como las dos primeras columnas de la tabla y los dos primeros campos del formulario.
- [ ] El botón "Descargar" sin `N8N_PDF_WEBHOOK_URL` configurada muestra un toast de error genérico, sin romper la página ni dejar el botón en estado de carga permanente.
- [ ] No existe borrado físico de filas.
- [ ] El link "Reporte PDF" aparece en el nav y la ruta `/reporte_pdf` está protegida por el middleware de sesión existente (spec 05), igual que el resto del panel.
- [ ] `pnpm lint` y `pnpm typecheck` pasan sin errores nuevos (los ya documentados como preexistentes en specs anteriores no cuentan).

## Decisiones

- **Sí:** este spec es solo el CRUD del catálogo + el proxy de descarga; la generación real del PDF la construye el usuario después en n8n, fuera de este repo. El proxy queda listo y probado en su modo de error controlado mientras tanto.
- **Sí:** el botón "Descargar" pasa por nuestro propio backend (`server/api/reporte_pdf/[id]/descargar.get.ts`) en vez de apuntar directo a n8n desde el navegador — mantiene la descarga protegida por la sesión del panel (spec 05) y no expone la URL del webhook al cliente.
- **Sí:** el payload hacia n8n es solo `{ id }` — n8n consulta `pdf_actores` por su cuenta; evita duplicar datos en el request y mantiene un solo punto de verdad (la tabla) para lo que efectivamente se envía a generar.
- **Sí:** errores del webhook (no configurado, no responde, responde error) se muestran como un toast genérico ("No se pudo generar el PDF, intenta de nuevo"), sin exponer el detalle técnico que devuelva n8n.
- **No:** `nombre_actor` como FK o select contra la tabla `actores` — se deja como texto libre porque la columna real es `varchar`, no `actor_id`, igual que campos análogos en `bots` (`medio`, `institucion_contratante`).
- **No:** ningún automatismo sobre `caducidad` (auto-desactivar, bloquear descarga, notificar vencimiento) — se pidió que fuera solo informativa; un spec futuro puede agregar esa lógica si hace falta.
- **No:** exigir `correo` o `whatsapp` — ambos quedan opcionales sin validación cruzada.
- **Sí:** `instruccion_reporte` es `text` en vez de `varchar(255)` (aclarado por el usuario durante la implementación) porque es parte del prompt que arma el reporte para el bot — se necesita espacio para instrucciones largas. En `TablaReportePdf.vue` se muestra truncado (con `title` con el texto completo al pasar el mouse) para no romper el ancho de la tabla; el texto completo se edita en el `UTextarea` del modal.
- **Sí (agregado durante la implementación):** `cliente_propsecto` (requerido) y `descripcion` (opcional) se agregaron a la tabla real ya avanzado este spec. Aunque son físicamente las últimas columnas de `pdf_actores`, se muestran al principio del formulario y de la tabla porque el usuario pidió explícitamente que fueran lo primero que se ve/captura, sin importar su posición física en la base de datos.
- **Reutiliza sin volver a decidir (mismo patrón que specs 01-04):** un solo componente para alta y edición (prop opcional), sin borrado físico, `UModal`+`UForm` con `nuxt-zod`, patrón de fecha (`type="date"` + `z.coerce.date()`) ya usado en `actores`.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El webhook de n8n no existe todavía — el botón "Descargar" no podrá generar un PDF real hasta que ese flujo se construya | Aceptado; el proxy queda con manejo de error explícito (503 sin configurar, 502 si falla) para que la UI no se rompa mientras tanto |
| Si el webhook de n8n tarda mucho en responder (generación de PDF puede no ser instantánea), la request del proxy podría hacer timeout | Documentar un timeout explícito en el `fetch` hacia n8n (a definir cuando exista la URL real) y mostrar el mismo toast de error genérico en ese caso |
| Sin relación a `actores`, es posible escribir `nombre_actor` con errores de dedo que no coincidan con ningún actor real del catálogo | Aceptado por ahora, mismo trade-off que otros campos de texto libre en `bots`; un spec futuro podría convertirlo en select si se vuelve un problema recurrente |
| `whatsapp` es `numeric` en la DB; un número de teléfono con formato inesperado (espacios, `+`, guiones) podría fallar la coerción a `Decimal`/`number` de Prisma | Validar en el Zod schema tras revisar el tipo real que genera `db pull`; si hace falta, normalizar el input (solo dígitos) antes de mandarlo a Prisma |
| El `db pull` de este spec trajo tablas nuevas ajenas a este panel (`fb_analisis`, `fb_analisis_agregado`, `fb_posts`, `fb_cuentas`, `fb_comentarios`, `fb_comentaristas`, `fb_reacciones`, `argospdf`) de una feature de monitoreo de Facebook. Tres de ellas (`fb_analisis`, `fb_analisis_agregado`, `fb_posts`) declaran `actor_id` como `BigInt`, pero referencian `actores.id` que es `Int` — un choque de tipos real en Mnemosine que hace fallar `npx prisma generate` para todo el schema, no solo para `pdf_actores` | Se removieron del `schema.prisma` las 3 relaciones `@relation` rotas (y sus back-relations en `actores`) sin tocar la base de datos — deja los campos `actor_id` como escalares sueltos. **Cualquier futuro `db pull` va a reintroducir esas relaciones rotas y hay que quitarlas de nuevo** hasta que se corrija el tipo de columna en Mnemosine (fuera del scope de este spec) |

## Lo que **no** está en este spec

- El flujo de n8n que genera el PDF.
- Envío automático/programado por correo o whatsapp.
- Relación `nombre_actor` ↔ `actores`.
- Automatismos sobre `caducidad`.
- Autenticación (ya cubierta por el spec 05).

Cada uno de estos, si aplica, va en su propio spec.
