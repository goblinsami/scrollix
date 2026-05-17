<template>
  <div
    v-if="open"
    class="block-settings-overlay"
    :class="`block-settings-overlay--${side}`"
    @click.self="$emit('close')"
  >
    <div class="block-settings">
      <div class="block-settings__header">
        <h4>Slide Properties</h4>
        <button
          type="button"
          class="ui-btn block-settings__side-toggle"
          :title="`Move panel to ${side === 'left' ? 'right' : 'left'} side`"
          @click="$emit('toggle-side')"
        >
          {{ side === 'left' ? 'Right' : 'Left' }}
        </button>
      </div>

      <ItemContentEditor
        v-if="draft"
        :model-value="draft"
        :default-text-size="DEFAULT_TEXT_SIZE"
        :enable-ctas="enableCtas"
        :can-upload-images="canUploadImages"
        :show-template-selector="true"
        :enable-stack-cards="true"
        id-prefix="slide-main"
        :text-content-labels="mainContentLabels"
        @update:model-value="onDraftUpdate"
      />

      <div class="block-settings__actions">
        <button class="ui-btn ui-btn--danger" @click="deleteAndClose">Delete Slide</button>
        <button class="ui-btn" @click="cancelAndClose">Cancel</button>
        <button class="ui-btn" @click="saveAndClose">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, toRef, watch } from 'vue'
import { TextSize, type Panel } from '../../../types/navigation'
import ItemContentEditor from './ItemContentEditor.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    panel: Panel | null
    side?: 'left' | 'right'
    canUploadImages?: boolean
    enableCtas?: boolean
  }>(),
  {
    side: 'left',
    canUploadImages: true,
    enableCtas: true
  }
)

const emit = defineEmits<{
  close: []
  save: [panel: Panel]
  delete: []
  'toggle-side': []
}>()

const DEFAULT_TEXT_SIZE = TextSize.Medium
const draft = reactive<Panel>({
  id: '',
  title: '',
  eyebrow: '',
  panelClass: ''
})
const original = reactive<Panel>({
  id: '',
  title: '',
  eyebrow: '',
  panelClass: ''
})

watch(
  () => props.panel,
  (panel) => {
    if (!panel) return
    Object.assign(draft, panel)
    Object.assign(original, panel)
  },
  { immediate: true }
)

const mainContentLabels = {
  title: 'Name',
  eyebrow: 'Eyebrow',
  description: 'Description',
  align: 'Text Align',
  contentWidth: 'Content Width'
} as const

const onDraftUpdate = (value: Partial<Panel> & Record<string, unknown>) => {
  Object.assign(draft, value)
  emit('save', { ...draft })
}

const saveAndClose = () => {
  emit('save', { ...draft })
  emit('close')
}

const cancelAndClose = () => {
  emit('save', { ...original })
  emit('close')
}

const deleteAndClose = () => {
  emit('delete')
  emit('close')
}

void toRef
</script>
