# SPEC 05 — Autenticación

> **Estado:** IMPLEMENTADO
> **Depende de:** SPEC 01
> **Fecha:** 2026-08-19
> **Objetivo:** Proteger todas las páginas y endpoints del panel con autenticación de sesión (`nuxt-auth-utils`) contra una nueva tabla `admins` en Mnemosine, agregando login/logout y mostrando el admin activo en `NavbarHeader.vue`, sin CRUD de usuarios todavía.

## Scope

**In:**

- `CREATE TABLE admins (...)` en Mnemosine (con confirmación explícita antes de ejecutarlo — ver Riesgos), seguido de `npx prisma db pull` + `npx prisma generate`.
- Registrar `nuxt-auth-utils` en `nuxt.config.ts` (ya está en `package.json`, sin configurar) y `NUXT_SESSION_PASSWORD` en `.env` (variable nueva, generada localmente, no se commitea).
- `shared/schemas/login.ts` (Zod) para el formulario de login.
- `server/api/login.post.ts`: valida credenciales contra `admins`, verifica `activo=true`, crea la sesión con `nuxt-auth-utils`.
- `server/api/logout.post.ts`: limpia la sesión.
- `server/middleware/auth.ts` (nuevo, global de servidor): exige sesión para todo `/api/*`, excepto `/api/login` y `/api/_nuxt_icon/*` (usado por el fix de íconos del spec 02, no debe requerir sesión).
- `app/middleware/auth.global.ts` (nuevo, ruta global de Nuxt): exige sesión para toda página del panel, excepto `/login`; redirige a `/login` si no hay sesión.
- `app/pages/login.vue` (nuevo): formulario de login (`UCard` + `UForm`, email + password).
- `NavbarHeader.vue`: agrega el nombre del admin logueado + botón "Cerrar sesión" a la derecha del nav.

**Out of scope (para specs futuros):**

- CRUD de administradores (alta/edición/activar cuentas desde la UI) — las cuentas se insertan directo por SQL en este spec. Un spec futuro puede agregar la gestión completa si hace falta.
- Flujo de "olvidé mi contraseña" / reseteo por email — no hay servicio de email configurado en el proyecto.
- RBAC / roles y permisos diferenciados entre administradores — todos los admins tienen el mismo acceso completo.
- Redirigir automáticamente fuera de `/login` si ya hay sesión activa — no se pidió.
- Deploy en Coolify (spec 07) — este spec deja el panel protegido, pero el deploy en sí sigue siendo el spec 07.

## Data model

Se agrega una tabla nueva en Mnemosine (no existía ninguna tabla de usuarios para este panel — `nuxt-auth-utils`, a diferencia de `nuxt-users`, no trae su propia tabla):

```sql
-- Ejecutar directo contra Mnemosine, una sola vez, con confirmación explícita del usuario:
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  activo BOOLEAN DEFAULT true
);
```

Después de crearla, `npx prisma db pull` la introspecta como `model admins` en `schema.prisma` y `npx prisma generate` regenera el client.

```ts
// shared/schemas/login.ts
export default z.object({
  email: z.string().email(),
  password: z.string().min(8)
})
```

Convenciones:

- El hash de `password_hash` se genera con el `hashPassword`/`verifyPassword` que trae `nuxt-auth-utils` (evita agregar una dependencia extra de hashing cuando ya hay una instalada para esto).
- `POST /api/login` responde el mismo error genérico ("Credenciales inválidas") tanto si el email no existe, la contraseña no coincide, o el admin tiene `activo=false` — no se distingue el motivo exacto en la respuesta, para no filtrar qué cuentas existen.
- La sesión (`setUserSession`) solo guarda `{ id, nombre, email }` del admin — nunca `password_hash`.
- `server/middleware/auth.ts` corre para todo `/api/*` **excepto** `/api/login` y `/api/_nuxt_icon/*` (esta última ruta la usa internamente el módulo de íconos para resolver íconos no bundleados estáticamente; bloquearla rompe la carga de íconos, incluso en la propia página de login).
- `app/middleware/auth.global.ts` corre para toda página **excepto** `/login`.

## Implementation plan

1. Confirmar con el usuario y ejecutar `CREATE TABLE admins (...)` contra Mnemosine, luego `npx prisma db pull && npx prisma generate`. Agregar `NUXT_SESSION_PASSWORD` (string aleatorio ≥32 caracteres) a `.env` y registrar `nuxt-auth-utils` en `nuxt.config.ts` (`modules`). Prueba manual: `schema.prisma` muestra `model admins`; `pnpm dev` arranca sin warning de `NUXT_SESSION_PASSWORD` faltante.
2. Crear `shared/schemas/login.ts`. Prueba manual: `pnpm typecheck` reconoce `useZodSchemas().login`.
3. Crear `server/api/login.post.ts` y `server/api/logout.post.ts`. Prueba manual: insertar un admin de prueba directo por SQL (con su `password_hash` generado vía un script que use `hashPassword`), hacer `POST /api/login` con esas credenciales → sesión creada (cookie presente); con credenciales inválidas → error genérico sin sesión; `POST /api/logout` limpia la sesión.
4. Crear `server/middleware/auth.ts`. Prueba manual: sin sesión, `curl /api/instituciones` → 401; con la cookie de sesión → 200; `curl /api/_nuxt_icon/lucide.json?icons=bot` sin sesión → sigue respondiendo 200 (no bloqueado).
5. Crear `app/middleware/auth.global.ts`. Prueba manual: sin sesión, visitar `/` o `/actores` en el navegador redirige a `/login`; `/login` es visitable sin sesión.
6. Crear `app/pages/login.vue`. Prueba manual: login con credenciales válidas redirige a `/` y las páginas del panel ya no redirigen a `/login`.
7. Editar `NavbarHeader.vue`: nombre del admin + botón "Cerrar sesión". Prueba manual: el nombre correcto aparece tras login; "Cerrar sesión" limpia la sesión y redirige a `/login`.

## Acceptance criteria

- [x] La tabla `admins` existe en Mnemosine y `schema.prisma` la refleja tras el `db pull`.
- [x] Login con credenciales válidas de un admin `activo=true` crea sesión y redirige a `/`.
- [x] Login con credenciales inválidas, o de un admin `activo=false`, responde un error genérico sin crear sesión (el mismo `if (!admin || !admin.activo)` cubre ambos casos con idéntica respuesta).
- [x] Sin sesión, cualquier página del panel (`/`, `/instituciones`, `/temas`, `/actores`, `/bots`) redirige a `/login`.
- [x] Sin sesión, cualquier `/api/*` (excepto `/api/login` y `/api/_nuxt_icon/*`) responde 401.
- [x] Con sesión activa, todas las páginas y endpoints existentes (instituciones/temas/actores/bots) siguen funcionando exactamente igual que antes de este spec.
- [x] El nav muestra el nombre del admin logueado y un botón "Cerrar sesión" que limpia la sesión y redirige a `/login` (ampliación durante la implementación: se movió de `NavbarHeader.vue` a un componente nuevo `SesionUsuario.vue` en el slot `#right` de `UHeader`, para que quedara en la esquina derecha real de la pantalla en vez de apretado junto a los links de navegación).
- [x] `pnpm lint` y `pnpm typecheck` pasan sin errores nuevos (los ya documentados como preexistentes en los specs 01-04 no cuentan).

## Decisiones

- **Sí:** tabla `admins` nueva en Mnemosine, sin CRUD en este spec — las cuentas se insertan por SQL directo. Soporta que sea más de una persona del staff sin construir gestión completa de usuarios todavía (eso queda como spec futuro si hace falta).
- **Sí:** proteger absolutamente todo — páginas y `/api/*`, incluyendo los `GET` — por tratarse de datos sensibles de monitoreo político. Único par de excepciones: `/api/login` (para poder loguearse) y `/api/_nuxt_icon/*` (fallback interno de íconos, ya en uso desde el fix del spec 02).
- **Sí:** `NavbarHeader.vue` muestra nombre del admin + botón de cerrar sesión, mismo patrón visual que el resto del panel.
- **No:** flujo de "olvidé mi contraseña" — no hay servicio de email configurado en el proyecto; un reseteo se hace por SQL directo mientras tanto.
- **No:** redirigir automáticamente fuera de `/login` si ya hay sesión activa — no se pidió; visitar `/login` logueado simplemente muestra el formulario de nuevo sin efecto.
- **No:** RBAC o roles diferenciados — todos los admins tienen el mismo nivel de acceso; no hay necesidad documentada de diferenciarlos todavía.
- **Reutiliza:** `nuxt-auth-utils` (ya estaba en `package.json`, discrepancia ya documentada en `CLAUDE.md` desde el spec 01 sobre `nuxt-users`), `UCard`+`UForm` para el login, mismo patrón visual del resto del panel.
- **Sí (encontrado durante la implementación):** `useUserSession()` trae su propio endpoint interno automático (`/api/_auth/session`, GET/DELETE) para sincronizar el estado reactivo del cliente. El botón de logout usa `clear()` del composable (que pega a ese endpoint interno) en vez de nuestro `POST /api/logout` custom, porque sincroniza `loggedIn`/`user` sin necesitar recargar la página. `server/api/logout.post.ts` se deja igual (funciona por sí solo si algo externo lo necesita), pero la UI no lo usa directamente.
- **Sí (encontrado durante la implementación):** la augmentación de tipos de `User` (`declare module '#auth-utils'`) vive en `shared/types/auth.d.ts`, no en `types/auth.d.ts` en la raíz — el `tsconfig` que genera Nuxt no incluye una carpeta `types/` en la raíz, pero sí `shared/**/*.d.ts`.
- **Sí (encontrado durante la implementación):** se quita `routeRules: { '/': { prerender: true } }` de `nuxt.config.ts` (agregado en el spec 01). Una ruta prerenderizada se sirve como HTML estático generado en build, sin pasar por el middleware de servidor en cada request — dejarlo habría permitido que `/` quedara sin proteger en un build de producción, justo la ruta que este spec protege. Además `/` ya no es estática: `HeroStadisitics.vue` muestra conteos que cambian.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `CREATE TABLE admins` es otro cambio de esquema en Mnemosine (como las constraints `UNIQUE` de los specs 03/04) | Se ejecuta con confirmación explícita del usuario; es una tabla nueva, no modifica ninguna existente, así que no hay riesgo de romper datos ya usados por n8n |
| Sin CRUD ni reseteo de contraseña: si un admin la olvida, hay que actualizarla directo por SQL | Aceptado por ahora; se resuelve con un spec de gestión de usuarios si el equipo crece |
| Si el middleware de servidor no excluye `/api/_nuxt_icon/*` correctamente, se rompe la carga de íconos (incluso en la pantalla de login) | Se prueba explícitamente en el paso 4 del plan antes de dar por buena la implementación |
| `NUXT_SESSION_PASSWORD` débil o commiteado por accidente comprometería todas las sesiones | Se genera localmente (≥32 caracteres aleatorios) y se documenta que vive solo en `.env`/variables de entorno del deploy, nunca en el repo |

## Lo que **no** está en este spec

- CRUD de administradores.
- Flujo de "olvidé mi contraseña".
- RBAC / roles diferenciados.
- Deploy en Coolify (spec 07).

Cada uno de estos, si aplica, va en su propio spec.
