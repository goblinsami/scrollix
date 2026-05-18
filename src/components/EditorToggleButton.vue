<template>
  <button
    class="editor-toggle-button"
    :class="{ 'editor-toggle-button--open': isOpen }"
    type="button"
    :aria-label="isOpen ? 'Hide editor' : 'Show editor'"
    :title="isOpen ? 'Hide editor' : 'Show editor'"
    @click="$emit('toggle')"
  >
    <img class="editor-toggle-button__logo" :src="logoUrl" alt="" />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
  logoUrl: string
}>()

defineEmits<{
  toggle: []
}>()
</script>
