<template>
  <section class="panel panel--hero panel--stack-cards" :class="panelClass" :style="panelStyle" :data-animate="animateKey">
    <img v-if="image" class="panel__image" :src="image" alt="" />
    <div v-if="overlayVisible" class="panel__overlay" :style="overlayStyle" />
    <div
      class="stack-cards-layout"
      :class="[
        `stack-cards-layout--text-${textSide}`,
        { 'stack-cards-layout--cards-only': cardsOnly }
      ]"
      :style="stackLayoutStyle"
    >
      <article
        v-if="!cardsOnly"
        class="content"
        :class="[
          `content--align-${contentAlignResolved}`,
          `content--width-${contentWidthModeResolved}`,
          { 'content--on-image': hasVisualBackground }
        ]"
        :style="contentStyle"
      >
        <div
          v-if="logo && logoTintEnabledResolved"
          class="slide-logo slide-logo--tint"
          :style="logoTintStyle"
        />
        <img
          v-else-if="logo"
          class="slide-logo"
          :src="logo"
          alt=""
          :style="logoStyle"
        />
        <p class="eyebrow" :style="eyebrowStyle">
          <span v-if="useMarkdown" v-html="eyebrowHtml" />
          <template v-else>{{ eyebrow }}</template>
        </p>
        <h1 :style="stackTitleStyle">
          <span v-if="useMarkdown" v-html="titleHtml" />
          <template v-else>{{ title }}</template>
        </h1>
        <p v-if="description" class="section-description" :style="descriptionStyle">
          <span v-if="useMarkdown" v-html="descriptionHtml" />
          <template v-else>{{ description }}</template>
        </p>
      </article>
      <div
        class="cards-viewport"
        :style="cardViewportStyle"
        @wheel.prevent="onWheel"
        @pointerdown="onUserInteraction"
        @touchstart.passive="onUserInteraction"
        @scroll.passive="onUserInteraction"
        @mousemove="onMouseMove"
        @mouseleave="onMouseLeave"
      >
        <StackCardContent
          v-for="(card, index) in cards"
          :key="card.id || `stack-card-${index}`"
          :card-style="getCardStyle(index, card.panelColor)"
          :title="card.title"
          :eyebrow="card.eyebrow"
          :description="card.description"
          :use-markdown="card.useMarkdown"
          :title-size="card.titleSize"
          :eyebrow-size="card.eyebrowSize"
          :description-size="card.descriptionSize"
          :content-align="card.contentAlign"
          :content-width-mode="card.contentWidthMode"
          :eyebrow-title-gap="card.eyebrowTitleGap"
          :title-description-gap="card.titleDescriptionGap"
          :title-line-height="card.titleLineHeight"
          :description-line-height="card.descriptionLineHeight"
          :eyebrow-letter-spacing="card.eyebrowLetterSpacing"
          :content-max-width="card.contentMaxWidth"
          :content-side-padding="card.contentSidePadding"
          :title-max-width="card.titleMaxWidth"
          :description-max-width="card.descriptionMaxWidth"
          :panel-color="card.panelColor"
          :image="card.image"
          :logo="card.logo"
          :logo-size="card.logoSize"
          :logo-tint-enabled="card.logoTintEnabled"
          :logo-tint-color="card.logoTintColor"
          :background-gradient="card.backgroundGradient"
          :overlay-enabled="card.overlayEnabled"
          :overlay-intensity="card.overlayIntensity"
          :direction="Direction.Down"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useSlidePanelPresentation } from '@/composables/useSlidePanelPresentation'
import { useStackCardHoverTilt } from '@/composables/useStackCardHoverTilt'
import { STACK_CARDS_DEFAULTS } from '@/constants/stackCards'
import type { SlidePanelProps } from '@/types/slidePanel'
import { Direction } from '@/types/navigation'
import StackCardContent from './StackCardContent.vue'
import { FEATURE_FLAGS } from '@/config/featureFlags'

const STEP = 0.03
const BACK_FADE_WINDOW = 0.65

const props = defineProps<SlidePanelProps>()

const {
  titleHtml,
  eyebrowHtml,
  descriptionHtml,
  contentAlignResolved,
  contentWidthModeResolved,
  titleMaxWidthResolved,
  contentStyle,
  eyebrowStyle,
  logoStyle,
  logoTintEnabledResolved,
  logoTintStyle,
  titleStyle,
  descriptionStyle,
  overlayVisible,
  hasVisualBackground,
  panelStyle,
  overlayStyle
} = useSlidePanelPresentation(props)

const progress = ref(0)
const stackTitleStyle = computed(() => ({
  ...titleStyle.value,
  width: `min(${titleMaxWidthResolved.value}px, 100%)`,
  maxWidth: `min(${titleMaxWidthResolved.value}px, 100%)`
}))
const cards = computed(() => props.stackCards?.cards ?? [])
const totalCards = computed(() => Math.max(1, cards.value.length))
const textSide = computed(() => props.stackCards?.textSide ?? STACK_CARDS_DEFAULTS.textSide)
const stackDirection = computed(
  () => props.stackCards?.stackDirection ?? STACK_CARDS_DEFAULTS.stackDirection
)
const angleY = computed(() => props.stackCards?.angleY ?? STACK_CARDS_DEFAULTS.angleY)
const angleX = computed(() => props.stackCards?.angleX ?? STACK_CARDS_DEFAULTS.angleX)
const cardGap = computed(() => props.stackCards?.cardGap ?? STACK_CARDS_DEFAULTS.cardGap)
const frontFadeWindow = computed(() => props.stackCards?.frontFadeWindow ?? STACK_CARDS_DEFAULTS.frontFadeWindow)
const cardSize = computed(() => props.stackCards?.cardSize ?? STACK_CARDS_DEFAULTS.cardSize)
const cardWidth = computed(() => props.stackCards?.cardWidth ?? STACK_CARDS_DEFAULTS.cardWidth)
const wheelSensitivity = computed(() => props.stackCards?.wheelSensitivity ?? STACK_CARDS_DEFAULTS.wheelSensitivity)
const autoPlayEnabled = computed(() => props.stackCards?.autoPlayEnabled ?? STACK_CARDS_DEFAULTS.autoPlayEnabled)
const autoPlaySpeed = computed(() => props.stackCards?.autoPlaySpeed ?? STACK_CARDS_DEFAULTS.autoPlaySpeed)
const autoPlayStoppedByInteraction = ref(false)
const cardsOnly = computed(() => props.stackCards?.cardsOnly ?? STACK_CARDS_DEFAULTS.cardsOnly)
const layoutSidePadding = computed(
  () => props.stackCards?.layoutSidePadding ?? STACK_CARDS_DEFAULTS.layoutSidePadding
)

const wrap01 = (value: number) => ((value % 1) + 1) % 1

const phase = computed(() => progress.value * totalCards.value)

const cardViewportStyle = computed(() => ({
  '--card-width-scale': String(cardWidth.value),
  '--stack-hover-rotate-y': '0deg',
  '--stack-direction-sign': stackDirection.value === 'left' ? '-1' : '1',
  '--stack-perspective-origin-x': stackDirection.value === 'left' ? '38%' : '62%'
}))
const stackLayoutStyle = computed(() => ({
  ...contentStyle.value,
  '--stack-cards-layout-side-padding': `${layoutSidePadding.value}px`
}))
const { onMouseMove, onMouseLeave } = useStackCardHoverTilt({
  enabled: FEATURE_FLAGS.enableStackCardsMouseTilt
})

const onWheel = (event: WheelEvent) => {
  onUserInteraction()
  const direction = Math.sign(event.deltaY || 1)
  progress.value = wrap01(progress.value + direction * STEP * wheelSensitivity.value)
}

const onUserInteraction = () => {
  autoPlayStoppedByInteraction.value = true
  stopAutoPlay()
}

let autoPlayRafId: number | null = null
let autoPlayLastTs = 0

const stopAutoPlay = () => {
  if (autoPlayRafId !== null) {
    cancelAnimationFrame(autoPlayRafId)
    autoPlayRafId = null
  }
  autoPlayLastTs = 0
}

const startAutoPlay = () => {
  stopAutoPlay()
  if (!autoPlayEnabled.value || autoPlayStoppedByInteraction.value || totalCards.value <= 1) return
  const secondsPerStep = Math.max(0.1, autoPlaySpeed.value)
  const velocityPerSecond = (STEP * wheelSensitivity.value) / secondsPerStep
  const tick = (ts: number) => {
    if (!autoPlayEnabled.value) return
    if (autoPlayLastTs > 0) {
      const deltaSeconds = (ts - autoPlayLastTs) / 1000
      progress.value = wrap01(progress.value + velocityPerSecond * deltaSeconds)
    }
    autoPlayLastTs = ts
    autoPlayRafId = requestAnimationFrame(tick)
  }
  autoPlayRafId = requestAnimationFrame(tick)
}

watch([autoPlayEnabled, autoPlaySpeed, wheelSensitivity, totalCards], startAutoPlay, { immediate: true })
onBeforeUnmount(stopAutoPlay)

const getCardStyle = (index: number, color?: string) => {
  const rel = (index - phase.value + totalCards.value) % totalCards.value
  const xStep = 86 * cardGap.value
  const zStep = 380 * cardGap.value
  const stackDirectionSign = stackDirection.value === 'left' ? -1 : 1
  const translateX = rel * xStep * stackDirectionSign
  const translateZ = 320 - rel * zStep
  const scale = Math.max(0.78, 1.02 - rel * 0.11) * cardSize.value
  let opacity = 1
  if (rel < frontFadeWindow.value) {
    opacity *= rel / Math.max(0.001, frontFadeWindow.value)
  }
  if (rel > totalCards.value - BACK_FADE_WINDOW) {
    opacity *= (totalCards.value - rel) / Math.max(0.001, BACK_FADE_WINDOW)
  }
  const zIndex = 200 - Math.floor(rel * 20)
  return {
    '--card-accent': color || '#7c5cff',
    opacity: String(Math.max(0, Math.min(1, opacity))),
    zIndex: String(zIndex),
    transform: `translate3d(${translateX}px, 0, ${translateZ}px) rotateY(calc((${angleY.value}deg + var(--stack-hover-rotate-y, 0deg)) * var(--stack-direction-sign, 1))) rotateX(${angleX.value}deg) scale(${scale})`
  }
}
</script>
