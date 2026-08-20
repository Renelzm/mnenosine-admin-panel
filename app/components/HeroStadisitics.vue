<template>
  <div class="space-y-6">
    <NuxtLink
      to="/actores"
      class="block transition-transform hover:-translate-y-0.5"
    >
      <UCard variant="subtle" :ui="{ body: 'flex items-center gap-3 py-3' }">
        <div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
          <UIcon name="i-lucide-triangle-alert" class="size-5" />
        </div>
        <div>
          <p class="text-lg font-bold text-highlighted">
            {{ pendientesDeRevision }}
          </p>
          <p class="text-sm text-muted">
            Actores pendientes de revisión: falta dependencia y/o puesto
          </p>
        </div>
      </UCard>
    </NuxtLink>

    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <NuxtLink
        v-for="tarjeta in tarjetas"
        :key="tarjeta.href"
        :to="tarjeta.href"
        class="flex flex-col items-center gap-2 text-center transition-transform hover:-translate-y-0.5"
      >
        <div
          class="flex size-28 flex-col items-center justify-center gap-1 rounded-full bg-muted"
          :class="CLASES_COLOR[tarjeta.color]"
        >
          <UIcon :name="tarjeta.icon" class="size-6" />
          <span class="text-xl font-bold">{{ tarjeta.valor }}</span>
        </div>
        <span class="text-sm text-muted">{{ tarjeta.label }}</span>
      </NuxtLink>
    </div>

    <UCard v-if="bots?.length" variant="subtle">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">
            Bots y actores mapeados
          </h3>
          <UButton
            to="/bots"
            label="Ver bots"
            icon="i-lucide-bot"
            size="xs"
            color="neutral"
            variant="ghost"
          />
        </div>
      </template>

      <ul class="divide-y divide-default">
        <li v-for="bot in bots" :key="bot.id" class="flex items-center justify-between gap-3 py-2">
          <div class="flex items-center gap-2">
            <UBadge :color="bot.alcance === 'curado' ? 'info' : 'neutral'" variant="subtle">
              {{ bot.alcance === 'curado' ? 'Curado' : 'Todos' }}
            </UBadge>
            <span class="font-medium">{{ bot.nombre }}</span>
            <UBadge v-if="!bot.activo" color="neutral" variant="subtle">
              Inactivo
            </UBadge>
          </div>
          <span class="text-sm text-muted">{{ bot.actores_mapeados }} actores mapeados</span>
        </li>
      </ul>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
interface Institucion {
  activa: boolean | null
}

interface Actor {
  activo: boolean | null
  dependencia: string | null
  puesto: string | null
  circunstancia: string | null
  circunstancia_hasta: string | null
}

interface Tema {
  activo: boolean | null
}

interface Bot {
  id: number
  nombre: string
  alcance: string
  activo: boolean | null
  actores_mapeados: number
}

// clases completas y literales a propósito: Tailwind no genera CSS para nombres de clase armados
// dinámicamente con interpolación (ej. `text-${color}`), solo detecta strings completos en el código.
// El fondo del círculo es el mismo (bg-muted) para todas las tarjetas; solo el color de ícono/número cambia.
const CLASES_COLOR: Record<string, string> = {
  actores: 'text-pink-700 dark:text-pink-400',
  instituciones: 'text-amber-600 dark:text-amber-400',
  temas: 'text-teal-700 dark:text-teal-400',
  bots: 'text-gray-800 dark:text-gray-300'
}

const { data: instituciones } = useFetch<Institucion[]>('/api/instituciones')
const { data: actores } = useFetch<Actor[]>('/api/actores')
const { data: temas } = useFetch<Tema[]>('/api/temas')
const { data: bots } = useFetch<Bot[]>('/api/bots')

function circunstanciaVigente(actor: Actor) {
  if (!actor.circunstancia) return false
  if (!actor.circunstancia_hasta) return true
  return new Date(actor.circunstancia_hasta) >= new Date()
}

function pendienteDeRevision(actor: Actor) {
  const faltaDato = !actor.dependencia || !actor.puesto
  return faltaDato && !circunstanciaVigente(actor)
}

const pendientesDeRevision = computed(() => (actores.value ?? []).filter(pendienteDeRevision).length)

const tarjetas = computed(() => [
  {
    href: '/actores',
    icon: 'i-lucide-users',
    color: 'actores',
    label: 'Actores activos',
    valor: (actores.value ?? []).filter(a => a.activo).length
  },
  {
    href: '/instituciones',
    icon: 'i-lucide-landmark',
    color: 'instituciones',
    label: 'Instituciones activas',
    valor: (instituciones.value ?? []).filter(i => i.activa).length
  },
  {
    href: '/temas',
    icon: 'i-lucide-tag',
    color: 'temas',
    label: 'Temas activos',
    valor: (temas.value ?? []).filter(t => t.activo).length
  },
  {
    href: '/bots',
    icon: 'i-lucide-bot',
    color: 'bots',
    label: 'Bots activos',
    valor: (bots.value ?? []).filter(b => b.activo).length
  }
])
</script>
