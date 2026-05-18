<template>
  <div class="stack-card-editor">
    <ItemContentTextEditor
      :model-value="localCard"
      :default-text-size="defaultTextSize"
      :labels="labels"
      @update:model-value="onContentUpdate"
    />
    <label>
      Card {{ index + 1 }} color
      <div class="logo-row__tint">
        <input v-model="localCard.panelColor" type="color" @input="emitUpdate" />
        <input v-model="localCard.panelColor" type="text" @input="emitUpdate" />
      </div>
    </label>
    <label>
      Card {{ index + 1 }} content width
      <div class="text-style-panel__range">
        <input v-model.number="localCard.contentMaxWidth" type="range" :min="textStyleRanges.contentMaxWidth.min" :max="textStyleRanges.contentMaxWidth.max" :step="textStyleRanges.contentMaxWidth.step" @input="emitUpdate" />
        <span>{{ formatNumber(localCard.contentMaxWidth, 0) }}px</span>
      </div>
    </label>
    <label>
      Card {{ index + 1 }} title width
      <div class="text-style-panel__range">
        <input v-model.number="localCard.titleMaxWidth" type="range" :min="textStyleRanges.titleMaxWidth.min" :max="textStyleRanges.titleMaxWidth.max" :step="textStyleRanges.titleMaxWidth.step" @input="emitUpdate" />
        <span>{{ formatNumber(localCard.titleMaxWidth, 0) }}px</span>
      </div>
    </label>
    <label>
      Card {{ index + 1 }} description width
      <div class="text-style-panel__range">
        <input v-model.number="localCard.descriptionMaxWidth" type="range" :min="textStyleRanges.descriptionMaxWidth.min" :max="textStyleRanges.descriptionMaxWidth.max" :step="textStyleRanges.descriptionMaxWidth.step" @input="emitUpdate" />
        <span>{{ formatNumber(localCard.descriptionMaxWidth, 0) }}px</span>
      </div>
    </label>
    <label>
      Card {{ index + 1 }} image
      <input v-model="localCard.image" type="text" placeholder="https://..." @input="emitUpdate" />
    </label>
    <label class="block-settings__toggle">
      <div class="block-settings__toggle-row">
        <input v-model="localCard.overlayEnabled" type="checkbox" class="block-settings__toggle-input" :disabled="!localCard.image" @change="emitUpdate" />
        <span class="block-settings__toggle-switch" aria-hidden="true" />
        <span class="block-settings__toggle-text">
          {{ localCard.image ? 'Show overlay' : 'Add image to enable' }}
        </span>
      </div>
    </label>
    <label>
      Card {{ index + 1 }} overlay intensity
      <div class="text-style-panel__range">
        <input
          v-model.number="localCard.overlayIntensity"
          type="range"
          :min="PANEL_OVERLAY_OPACITY_LIMITS.min"
          :max="PANEL_OVERLAY_OPACITY_LIMITS.max"
          :step="PANEL_OVERLAY_OPACITY_LIMITS.step"
          :disabled="!localCard.image || !localCard.overlayEnabled"
          @input="emitUpdate"
        />
        <span>{{ formatNumber(localCard.overlayIntensity, 0) }}%</span>
      </div>
    </label>
    <label>
      Card {{ index + 1 }} logo
      <input v-model="localCard.logo" type="text" placeholder="https://..." @input="emitUpdate" />
    </label>
    <label>
      Card {{ index + 1 }} logo size
      <TextSizeSelector :model-value="localCard.logoSize ?? defaultTextSize" @update:model-value="(value) => { localCard.logoSize = value; emitUpdate() }" />
    </label>
    <label class="block-settings__toggle">
      <div class="block-settings__toggle-row">
        <input v-model="localCard.logoTintEnabled" type="checkbox" class="block-settings__toggle-input" :disabled="!localCard.logo" @change="emitUpdate" />
        <span class="block-settings__toggle-switch" aria-hidden="true" />
        <span class="block-settings__toggle-text">Tint logo</span>
      </div>
    </label>
    <label>
      Card {{ index + 1 }} logo tint
      <div class="logo-row__tint">
        <input v-model="localCard.logoTintColor" type="color" :disabled="!localCard.logo || !localCard.logoTintEnabled" @input="emitUpdate" />
        <input v-model="localCard.logoTintColor" type="text" :disabled="!localCard.logo || !localCard.logoTintEnabled" @input="emitUpdate" />
      </div>
    </label>
    <button type="button" class="ui-btn ui-btn--danger" :disabled="isOnlyCard" @click="$emit('remove')">
      Remove card
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ItemContent, StackCardItem, TextSize } from '@/types/navigation'
import { PANEL_OVERLAY_OPACITY_LIMITS } from '@/constants/slideStyle'
import TextSizeSelector from '../atoms/TextSizeSelector.vue'
import ItemContentTextEditor from './ItemContentTextEditor.vue'

const props = defineProps<{
  modelValue: StackCardItem
  index: number
  isOnlyCard: boolean
  defaultTextSize: TextSize
  textStyleRanges: {
    contentMaxWidth: { min: number; max: number; step: number }
    titleMaxWidth: { min: number; max: number; step: number }
    descriptionMaxWidth: { min: number; max: number; step: number }
  }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: StackCardItem]
  remove: []
}>()

const localCard = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const emitUpdate = () => emit('update:modelValue', { ...localCard.value })
const formatNumber = (value: number | undefined, digits: number) => Number(value ?? 0).toFixed(digits)
const labels = computed(() => ({
  eyebrow: `Card ${props.index + 1} eyebrow`,
  title: `Card ${props.index + 1} title`,
  description: `Card ${props.index + 1} description`,
  align: `Card ${props.index + 1} text align`,
  contentWidth: 'Card content width'
}))

const onContentUpdate = (value: ItemContent) => {
  localCard.value = { ...localCard.value, ...value }
  emitUpdate()
}
</script>
