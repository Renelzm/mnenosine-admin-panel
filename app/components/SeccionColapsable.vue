<template>
  <UCard variant="subtle" :ui="{ body: 'p-0 sm:p-0' }">
    <UCollapsible v-model:open="abierto">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-2 p-4 sm:p-6 text-left"
      >
        <div class="flex items-center gap-2">
          <div v-if="icon" class="flex items-center justify-center rounded-md" :class="iconWrapperClass">
            <UIcon :name="icon" :class="iconClass ?? 'size-5 text-primary'" />
          </div>
          <span class="font-semibold">{{ titulo }}</span>
        </div>
        <UIcon
          name="i-lucide-chevron-down"
          class="size-5 shrink-0 transition-transform duration-200"
          :class="{ 'rotate-180': abierto }"
        />
      </button>

      <template #content>
        <div class="border-t border-default p-4 sm:p-6">
          <slot />
        </div>
      </template>
    </UCollapsible>
  </UCard>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
  titulo: string
  icon?: string
  iconClass?: string
  iconWrapperClass?: string
  defaultOpen?: boolean
}>(), { defaultOpen: false })

const abierto = ref(props.defaultOpen)
</script>
