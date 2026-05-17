<template>
  <label>
    {{ labels.title }}
    <div class="text-input-row">
      <input v-if="!localValue.useMarkdown" v-model="localValue.title" type="text" @input="emitUpdate" />
      <MarkdownField
        v-else
        :model-value="localValue.title"
        :rows="3"
        @update:model-value="(value) => { localValue.title = value; emitUpdate() }"
      />
      <TextSizeSelector
        :model-value="localValue.titleSize ?? defaultTextSize"
        @update:model-value="(value) => { localValue.titleSize = value; emitUpdate() }"
      />
    </div>
  </label>

  <label>
    {{ labels.eyebrow }}
    <div class="text-input-row">
      <input v-if="!localValue.useMarkdown" v-model="localValue.eyebrow" type="text" @input="emitUpdate" />
      <MarkdownField
        v-else
        :model-value="localValue.eyebrow"
        :rows="2"
        @update:model-value="(value) => { localValue.eyebrow = value; emitUpdate() }"
      />
      <TextSizeSelector
        :model-value="localValue.eyebrowSize ?? defaultTextSize"
        @update:model-value="(value) => { localValue.eyebrowSize = value; emitUpdate() }"
      />
    </div>
  </label>

  <label>
    {{ labels.description }}
    <div class="text-input-row">
      <textarea v-if="!localValue.useMarkdown" v-model="localValue.description" rows="3" @input="emitUpdate" />
      <MarkdownField
        v-else
        :model-value="localValue.description ?? ''"
        :rows="6"
        @update:model-value="(value) => { localValue.description = value; emitUpdate() }"
      />
      <TextSizeSelector
        :model-value="localValue.descriptionSize ?? defaultTextSize"
        @update:model-value="(value) => { localValue.descriptionSize = value; emitUpdate() }"
      />
    </div>
  </label>

  <label class="block-settings__toggle">
    <div class="block-settings__toggle-row">
      <input
        v-model="localValue.useMarkdown"
        type="checkbox"
        class="block-settings__toggle-input"
        @change="emitUpdate"
      />
      <span class="block-settings__toggle-switch" aria-hidden="true" />
      <span class="block-settings__toggle-text">Enable markdown</span>
    </div>
  </label>

  <label>
    {{ labels.align }}
    <select v-model="localValue.contentAlign" @change="emitUpdate">
      <option v-for="option in contentAlignOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </label>

  <label class="block-settings__toggle">
    <span>{{ labels.contentWidth }}</span>
    <div class="block-settings__toggle-row">
      <input
        :checked="(localValue.contentWidthMode ?? 'contained') !== 'full'"
        type="checkbox"
        class="block-settings__toggle-input"
        @change="onContentWidthModeToggle"
      />
      <span class="block-settings__toggle-switch" aria-hidden="true" />
      <span class="block-settings__toggle-text">
        {{ (localValue.contentWidthMode ?? 'contained') !== 'full' ? 'Contained' : 'Expanded (light padding)' }}
      </span>
    </div>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ItemContent, TextSize } from '@/types/navigation'
import TextSizeSelector from '../atoms/TextSizeSelector.vue'
import MarkdownField from '../atoms/MarkdownField.vue'
import { contentAlignOptions } from '../../composables/useSlidePropertiesForm'

const props = defineProps<{
  modelValue: ItemContent
  defaultTextSize: TextSize
  labels: {
    title: string
    eyebrow: string
    description: string
    align: string
    contentWidth: string
  }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ItemContent]
}>()

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const emitUpdate = () => emit('update:modelValue', { ...localValue.value })

const onContentWidthModeToggle = (event: Event) => {
  const checked = (event.target as HTMLInputElement).checked
  localValue.value.contentWidthMode = checked ? 'contained' : 'full'
  emitUpdate()
}
</script>
