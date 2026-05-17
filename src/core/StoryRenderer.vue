<template>
  <section ref="snapShellLocalRef" class="snap-shell" :class="{ 'snap-shell--auto': autoSnapEnabled }">
    <div ref="snapStageLocalRef" class="snap-stage">
      <div
        v-for="step in flowSteps"
        :key="step.panel.id"
        class="snap-step"
        :style="stepStyle(step)"
        :data-step-index="step.index"
      >
        <div v-if="showWatermark" class="story-watermark">
          <img class="story-watermark__logo" :src="watermarkLogoUrl" alt="" />
          <span>Built with Scrollix</span>
        </div>
        <button
          v-if="showEditTrigger"
          class="slide-edit-trigger"
          type="button"
          @click="$emit('edit-slide', step.index)"
        >
          Edit Slide
        </button>
        <SectionPanel
          :title="step.panel.title"
          :eyebrow="step.panel.eyebrow"
          :description="step.panel.description"
          :template-type="step.panel.templateType"
          :stack-cards="step.panel.stackCards"
          :use-markdown="step.panel.useMarkdown"
          :title-size="step.panel.titleSize"
          :eyebrow-size="step.panel.eyebrowSize"
          :description-size="step.panel.descriptionSize"
          :content-align="step.panel.contentAlign"
          :content-width-mode="step.panel.contentWidthMode"
          :eyebrow-title-gap="step.panel.eyebrowTitleGap"
          :title-description-gap="step.panel.titleDescriptionGap"
          :title-line-height="step.panel.titleLineHeight"
          :description-line-height="step.panel.descriptionLineHeight"
          :eyebrow-letter-spacing="step.panel.eyebrowLetterSpacing"
          :content-max-width="step.panel.contentMaxWidth"
          :content-side-padding="step.panel.contentSidePadding"
          :title-max-width="step.panel.titleMaxWidth"
          :description-max-width="step.panel.descriptionMaxWidth"
          :panel-class="step.panel.panelClass"
          :panel-color="step.panel.panelColor"
          :image="step.panel.image"
          :logo="step.panel.logo"
          :logo-size="step.panel.logoSize"
          :logo-tint-enabled="step.panel.logoTintEnabled"
          :logo-tint-color="step.panel.logoTintColor"
          :background-gradient="step.panel.backgroundGradient"
          :overlay-enabled="step.panel.overlayEnabled"
          :overlay-intensity="step.panel.overlayIntensity"
          :enable-ctas="enableCtas"
          :cta-text="step.panel.ctaText"
          :cta-link="step.panel.ctaLink"
          :cta="step.panel.cta"
          :direction="step.directionToNext"
          animate-key="intro"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import SectionPanel from './SectionPanel.vue'
import type { FlowBlockStep } from './useFlowBlocks'
const props = withDefaults(
  defineProps<{
    flowSteps: FlowBlockStep[]
    autoSnapEnabled: boolean
    setSnapShellEl?: (element: HTMLElement | null) => void
    setSnapStageEl?: (element: HTMLElement | null) => void
    stepStyle: (step: FlowBlockStep) => Record<string, string>
    showEditTrigger?: boolean
    showWatermark?: boolean
    enableCtas?: boolean
  }>(),
  {
    showEditTrigger: false,
    showWatermark: false,
    enableCtas: true
  }
)

defineEmits<{
  'edit-slide': [index: number]
}>()

const snapShellLocalRef = ref<HTMLElement | null>(null)
const snapStageLocalRef = ref<HTMLElement | null>(null)
const watermarkLogoUrl = `${import.meta.env.BASE_URL}favicon.png`

watch(
  () => snapShellLocalRef.value,
  (value) => {
    props.setSnapShellEl?.(value)
  },
  { immediate: true }
)

watch(
  () => snapStageLocalRef.value,
  (value) => {
    props.setSnapStageEl?.(value)
  },
  { immediate: true }
)
</script>



