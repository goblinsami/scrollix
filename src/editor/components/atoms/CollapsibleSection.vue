<template>
  <section class="text-style-panel" :class="{ 'text-style-panel--open': open }">
    <div
      class="text-style-panel__summary"
      :class="{ 'text-style-panel__summary--open': open }"
      role="button"
      tabindex="0"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="panelId"
      @click="$emit('toggle')"
      @keydown.enter.prevent="$emit('toggle')"
      @keydown.space.prevent="$emit('toggle')"
    >
      <span class="text-style-panel__title">{{ title }}</span>
      <span
        class="text-style-panel__chevron"
        :class="{ 'text-style-panel__chevron--open': open }"
        aria-hidden="true"
      >
        ▸
      </span>
    </div>
    <div
      v-show="open"
      :id="panelId"
      :class="bodyClass"
    >
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string
    open: boolean
    panelId: string
    bodyClass?: string
  }>(),
  {
    bodyClass: 'text-style-panel__body'
  }
)

void props
</script>
