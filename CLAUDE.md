# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This is the **ARGOS admin panel** ("AdminMnemo"): a Nuxt app that lets non-technical
staff manage the catalog (political actors, institutions, topics, bots) that ARGOS —
an n8n-based media-monitoring / political-intelligence system for Torreón and the
Región Laguna, Coahuila — currently hardcodes as plain text inside its Telegram/WhatsApp
bot prompts. It runs against **Mnemosine**, a shared Postgres instance that already has
these tables (populated by data migration, not by this app).

**Read `PANEL_ARGOS.md` first** (gitignored, local-only doc) — it's the full project
spec in Spanish: data model rationale, business rules, and a checklist of what's still
unbuilt. Treat it as design intent, not as ground truth for what's already implemented —
some decisions in it have since drifted from the code (see Discrepancies below).

The repo started from the Nuxt UI starter template and is still very close to that
scaffold: most files under `app/components/` and `app/pages/` are placeholder stubs
with Spanish TODO comments describing what they should become, not working features.
There is no `server/` directory yet — none of the Nitro API endpoints described in
`PANEL_ARGOS.md` (`server/api/actores/`, `.../instituciones/`, `.../temas/`, `.../bots/`,
`.../bot-actores/`) exist. `app/app.vue` still references a `TemplateMenu` component
from the original starter that isn't present under `app/components/` — expect this to
break until it's replaced.

### Known discrepancies between `PANEL_ARGOS.md` and current code

- Doc specifies **shadcn-vue** for UI; the app currently uses **`@nuxt/ui`** (v4) with
  Tailwind v4 (`nuxt.config.ts`, `app/app.config.ts`).
- Doc specifies auth via **`nuxt-users`** (rrd108/nuxt-users); `package.json` currently
  depends on **`nuxt-auth-utils`** instead, and neither is wired into `nuxt.config.ts` yet.
- Doc describes `bots.nombre` as the unique key; the pulled `schema.prisma` instead has
  `zona` as the unique column (`@unique(map: "bots_clave_key")`). Since the Prisma schema
  is pulled from the live DB (see below), trust the schema over the doc when they conflict.
- `app/pages/intituciones/` is a known typo for `instituciones` — listed in the doc's
  checklist as not-yet-renamed. Renaming it changes the route path.

## Commands

```bash
pnpm install       # install deps (pnpm is canonical; a package-lock.json also exists
                    # but pnpm-lock.yaml / pnpm-workspace.yaml / packageManager in
                    # package.json all point at pnpm)
pnpm dev           # dev server at http://localhost:3000
pnpm build         # production build
pnpm preview       # preview a production build locally
pnpm lint          # eslint .
pnpm typecheck     # nuxt typecheck (vue-tsc under the hood)
```

There is no test command/framework configured in this repo. CI (`.github/workflows/ci.yml`)
only runs `pnpm install`, `pnpm run lint`, and `pnpm run typecheck` on every push — no build
or test step.

Note: `eslint.config.mjs` currently has its entire body commented out (including the
`export default withNuxt(...)` line) — verify it actually produces a working flat config
before relying on `pnpm lint` to catch anything.

### Prisma

The Prisma schema is **pulled from the live Mnemosine database**, not hand-authored —
Mnemosine is the source of truth since ARGOS's n8n workflows already read/write these
tables directly.

```bash
npx prisma db pull      # re-sync prisma/schema.prisma from Mnemosine after any DB change
npx prisma generate     # regenerate the client (output path: app/generated/prisma/, gitignored)
```

`prisma.config.ts` points at `prisma/schema.prisma` and reads `DATABASE_URL` from `.env`.
Do not use `@prisma/nuxt` (deprecated per project doc) — Prisma is used as a plain
`@prisma/client` package.

## Data model (Mnemosine / Postgres)

Only a subset of tables in `prisma/schema.prisma` belong to this panel's domain; the rest
(`argostrc`, `chat`, `sinteia`, `n8n_chat_histories`, `monitoreo`, `bot_paths`) back the
n8n bot pipeline / media-monitoring side of ARGOS and aren't managed through this UI.

Panel domain tables, in dependency order:

- **`instituciones`** — the stable anchor. One row per government branch/organism
  (`nivel`: MUNICIPAL | ESTATAL | FEDERAL | AUTONOMO | IP | EDUCACION | OTROS). Rarely changes.
- **`actores`** — political actors. `dependencia`/`puesto` are deliberately free-text
  (cabinet reshuffles happen constantly; they don't justify their own catalog tables).
  `activo` is an editorial switch ("are we still monitoring this person"), independent
  from `vigente_desde`/`vigente_hasta` (their actual term dates).
- **`candidaturas`** — electoral candidacies, FK to `actores`.
- **`categorias_tema`** (10 fixed categories + "Otros") → **`temas`**, which has both a
  required `categoria_id` and an optional `categoria_secundaria_id` that must differ
  from the primary (validate this in both the Zod schema and the UI form).
- **`bots`** — catalog of bots consuming these catalogs. `alcance` is `'curado'` or
  `'todos'` and drives a real business rule (see below).
- **`bot_actores`** — join table for curation; only relevant for `alcance = 'curado'` bots.

### Business rule: `alcance` (curado vs todos)

A bot with `alcance = 'todos'` (e.g. `SINTETIA`) receives every active actor unfiltered
and has **no** rows in `bot_actores` — never let a form write curation rows for it.
A bot with `alcance = 'curado'` (e.g. `ARGOS TRC MARS`, `ARGOS LAGUNA`) only sees actors
explicitly linked via `bot_actores`. Concretely, in any actor-creation/edit form:

- The bot multi-select must only list `bots` where `alcance = 'curado' AND activo = true`.
- Show an informational (non-editable) note listing `alcance = 'todos'` bots, since the
  actor will reach them automatically regardless of the checkbox selection.
- Saving only inserts/deletes rows in `bot_actores` for the checked `alcance = 'curado'`
  bots — never touch `actores` itself for bot membership.

The reference read query for building a given bot's prompt catalog:

```sql
-- alcance = 'todos'
SELECT * FROM actores_completo WHERE activo = true;

-- alcance = 'curado'
SELECT ac.* FROM actores_completo ac
JOIN bot_actores ba ON ba.actor_id = ac.id
WHERE ba.bot_id = (SELECT id FROM bots WHERE nombre = '<bot>') AND ac.activo = true;
```

`actores_completo` and `temas_completo` are read-only Postgres views (defined in the DB,
not in `schema.prisma`) that pre-join `actores`↔`instituciones` and `temas`↔`categorias_tema`
respectively — prefer them over hand-joining when only reading.

## Deployment

Target is Coolify, on the same Oracle ARM64 VM that hosts Mnemosine, under the
`admin.argos.org.mx` subdomain (not yet set up).
