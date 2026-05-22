<template>
  <section
    ref="panelRootRef"
    class="panel panel--hero panel--stack-cards"
    :class="panelClass"
    :style="panelStyle"
    :data-animate="animateKey"
  >
    <img v-if="image" class="panel__image" :src="image" alt="" />
    <div v-if="overlayVisible" class="panel__overlay" :style="overlayStyle" />
    <div
      class="stack-cards-layout"
      :class="[
        `stack-cards-layout--text-${textSide}`,
        `stack-cards-layout--variant-${stackVariant}`,
        { 'stack-cards-layout--cards-only': cardsOnly }
      ]"
      :style="stackLayoutStyle"
      @wheel="onLayoutWheel"
    >
      <article
        v-if="!cardsOnly"
        class="content"
        :class="[
          `content--align-${contentAlignResolved}`,
          `content--width-${contentWidthModeResolved}`,
          {
            'content--on-image': hasVisualBackground,
            'content--text-content-editing': isMainTextContentEditingActive,
            'debug-container debug-container--content': showDebugContainers
          }
        ]"
        :style="stackContentStyle"
      >
        <div
          v-if="logo && logoTintEnabledResolved"
          class="slide-logo slide-logo--tint"
          :class="{ 'debug-container debug-container--logo': showDebugContainers }"
          :style="logoTintStyle"
        />
        <img
          v-else-if="logo"
          class="slide-logo"
          :class="{ 'debug-container debug-container--logo': showDebugContainers }"
          :src="logo"
          alt=""
          :style="logoStyle"
        />
        <p
          class="eyebrow"
          :class="{
            'text-content-highlight-target': isMainEyebrowHighlightActive,
            'debug-container debug-container--eyebrow': showDebugContainers
          }"
          :style="eyebrowStyle"
        >
          <span v-if="useMarkdown" v-html="eyebrowHtml" />
          <template v-else>{{ eyebrow }}</template>
        </p>
        <h1
          :class="{
            'text-content-highlight-target': isMainTitleHighlightActive,
            'debug-container debug-container--title': showDebugContainers
          }"
          :style="stackTitleStyle"
        >
          <span v-if="useMarkdown" v-html="titleHtml" />
          <template v-else>{{ title }}</template>
        </h1>
        <p
          v-if="description"
          class="section-description"
          :class="{
            'text-content-highlight-target': isMainDescriptionHighlightActive,
            'debug-container debug-container--description': showDebugContainers
          }"
          :style="descriptionStyle"
        >
          <span v-if="useMarkdown" v-html="descriptionHtml" />
          <template v-else>{{ description }}</template>
        </p>
      </article>
      <div
        ref="cardsViewportRef"
        class="cards-viewport"
        :class="{ 'cards-viewport--variant-horizontal': isHorizontalVariant }"
        :style="cardViewportStyle"
        @wheel="onWheel"
        @pointerdown="onUserInteraction"
        @touchstart="onTouchStartCards"
        @touchmove="onTouchMoveCards"
        @touchend="onTouchEndCards"
        @touchcancel="onTouchEndCards"
        @scroll.passive="onViewportScroll"
        @mousemove="onMouseMove"
        @mouseleave="onMouseLeave"
      >
        <StackCardContent
          v-for="(entry, index) in renderCards"
          :key="entry.key"
          :card-style="getCardStyle(index, entry.card.panelColor)"
          :title="entry.card.title"
          :eyebrow="entry.card.eyebrow"
          :description="entry.card.description"
          :use-markdown="entry.card.useMarkdown"
          :title-size="entry.card.titleSize"
          :eyebrow-size="entry.card.eyebrowSize"
          :description-size="entry.card.descriptionSize"
          :content-align="entry.card.contentAlign"
          :content-width-mode="entry.card.contentWidthMode"
          :eyebrow-title-gap="entry.card.eyebrowTitleGap"
          :title-description-gap="entry.card.titleDescriptionGap"
          :title-line-height="entry.card.titleLineHeight"
          :description-line-height="entry.card.descriptionLineHeight"
          :eyebrow-letter-spacing="entry.card.eyebrowLetterSpacing"
          :content-max-width="entry.card.contentMaxWidth"
          :content-side-padding="entry.card.contentSidePadding"
          :title-max-width="entry.card.titleMaxWidth"
          :description-max-width="entry.card.descriptionMaxWidth"
          :panel-color="entry.card.panelColor"
          :image="entry.card.image"
          :logo="entry.card.logo"
          :logo-size="entry.card.logoSize"
          :logo-tint-enabled="entry.card.logoTintEnabled"
          :logo-tint-color="entry.card.logoTintColor"
          :background-gradient="entry.card.backgroundGradient"
          :overlay-enabled="entry.card.overlayEnabled"
          :overlay-intensity="entry.card.overlayIntensity"
          :is-text-content-editing-active="isCardTextContentEditingActive(entry.card.id)"
          :text-content-highlight-scope="cardTextContentHighlightScope(entry.card.id)"
          :direction="Direction.Down"
        />
      </div>
    </div>
    <div v-if="showMobileCardsDebug" class="stack-cards-mobile-debug">
      <label>
        Mobile cards X: {{ Math.round(debugMobileCardsOffsetX) }}px
        <input
          v-model.number="debugMobileCardsOffsetX"
          type="range"
          min="-240"
          max="240"
          step="1"
        />
      </label>
      <label>
        Mobile rotate X: {{ debugMobileRotateX.toFixed(1) }}deg
        <input
          v-model.number="debugMobileRotateX"
          type="range"
          min="-35"
          max="35"
          step="0.5"
        />
      </label>
      <label>
        Mobile rotate Y: {{ debugMobileRotateY.toFixed(1) }}deg
        <input
          v-model.number="debugMobileRotateY"
          type="range"
          min="-35"
          max="35"
          step="0.5"
        />
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSlidePanelPresentation } from '@/composables/useSlidePanelPresentation'
import { useStackCardHoverTilt } from '@/composables/useStackCardHoverTilt'
import { STACK_CARDS_DEFAULTS } from '@/constants/stackCards'
import type { SlidePanelProps } from '@/types/slidePanel'
import { Direction, StackCardsVariant } from '@/types/navigation'
import StackCardContent from './StackCardContent.vue'
import { FEATURE_FLAGS } from '@/config/featureFlags'

const STEP = 0.03
const BACK_FADE_WINDOW = 0.65
const MOBILE_STACK_MIN_WIDTH = 430
const MOBILE_STACK_MAX_WIDTH = 760
const TABLET_STACK_MAX_WIDTH = 960

const props = defineProps<SlidePanelProps>()
const showDebugContainers = FEATURE_FLAGS.enableDebugContainers

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
const panelRootRef = ref<HTMLElement | null>(null)
const debugMobileCardsOffsetX = ref(0)
const debugMobileRotateX = ref(0)
const debugMobileRotateY = ref(0)
const cardsViewportRef = ref<HTMLElement | null>(null)
const cardsViewportWidth = ref(0)
const horizontalActiveCardIndex = ref(0)
const horizontalSequenceWidth = ref(0)
let cardsViewportResizeObserver: ResizeObserver | null = null
let cardsViewportMeasureTimer: number | null = null
let horizontalSyncReleaseRafId: number | null = null
let isSyncingHorizontalScroll = false
const stackTitleStyle = computed(() => ({
  ...titleStyle.value,
  width: `min(${titleMaxWidthResolved.value}px, 100%)`,
  maxWidth: `min(${titleMaxWidthResolved.value}px, 100%)`
}))
const cards = computed(() => props.stackCards?.cards ?? [])
const renderCards = computed(() => {
  const source = cards.value
  if (!isHorizontalVariant.value || source.length <= 1) {
    return source.map((card, index) => ({
      key: `${card.id || `stack-card-${index}`}-loop-0-${index}`,
      card
    }))
  }

  const loops = [0, 1, 2]
  return loops.flatMap((loopIndex) =>
    source.map((card, index) => ({
      key: `${card.id || `stack-card-${index}`}-loop-${loopIndex}-${index}`,
      card
    }))
  )
})
const isMainTextContentEditingActive = computed(
  () => Boolean(props.panelId) && props.activeTextContentTargetId === props.panelId
)
const isMainEyebrowHighlightActive = computed(
  () => isMainTextContentEditingActive.value && props.activeTextContentHighlightScope === 'eyebrow'
)
const isMainTitleHighlightActive = computed(
  () => isMainTextContentEditingActive.value && props.activeTextContentHighlightScope === 'title'
)
const isMainDescriptionHighlightActive = computed(
  () => isMainTextContentEditingActive.value && props.activeTextContentHighlightScope === 'description'
)
const isCardTextContentEditingActive = (cardId: string | undefined) =>
  Boolean(cardId) && props.activeTextContentTargetId === cardId
const cardTextContentHighlightScope = (cardId: string | undefined) =>
  isCardTextContentEditingActive(cardId) ? props.activeTextContentHighlightScope : 'content'
const totalCards = computed(() => Math.max(1, cards.value.length))
const stackVariant = computed(() => props.stackCards?.variant ?? STACK_CARDS_DEFAULTS.variant)
const isHorizontalVariant = computed(() => stackVariant.value === StackCardsVariant.Horizontal)
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
const cardSurfaceOpacity = computed(() => {
  const rawValue = props.stackCards?.cardSurfaceOpacity
  const fallback = STACK_CARDS_DEFAULTS.cardSurfaceOpacity
  const normalizedValue = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : fallback
  return Math.max(0, Math.min(100, normalizedValue))
})
const wheelSensitivity = computed(() => props.stackCards?.wheelSensitivity ?? STACK_CARDS_DEFAULTS.wheelSensitivity)
const mobileTouchSensitivity = computed(
  () => props.stackCards?.mobileTouchSensitivity ?? STACK_CARDS_DEFAULTS.mobileTouchSensitivity
)
const mobileTouchHorizontalEnabled = computed(
  () =>
    props.stackCards?.mobileTouchHorizontalEnabled ??
    STACK_CARDS_DEFAULTS.mobileTouchHorizontalEnabled
)
const mobileTouchVerticalEnabled = computed(
  () =>
    props.stackCards?.mobileTouchVerticalEnabled ??
    STACK_CARDS_DEFAULTS.mobileTouchVerticalEnabled
)
const autoPlayEnabled = computed(() => props.stackCards?.autoPlayEnabled ?? STACK_CARDS_DEFAULTS.autoPlayEnabled)
const autoPlaySpeed = computed(() => props.stackCards?.autoPlaySpeed ?? STACK_CARDS_DEFAULTS.autoPlaySpeed)
const autoPlayStoppedByInteraction = ref(false)
const cardsOnly = computed(() => props.stackCards?.cardsOnly ?? STACK_CARDS_DEFAULTS.cardsOnly)
const showMobileCardsDebug = computed(
  () => import.meta.env.DEV && FEATURE_FLAGS.enableStackCardsMobileDebugOverlay && !cardsOnly.value
)
const layoutSidePadding = computed(
  () => props.stackCards?.layoutSidePadding ?? STACK_CARDS_DEFAULTS.layoutSidePadding
)
const textOffsetX = computed(() => props.stackCards?.textOffsetX ?? STACK_CARDS_DEFAULTS.textOffsetX)
const textOffsetY = computed(() => props.stackCards?.textOffsetY ?? STACK_CARDS_DEFAULTS.textOffsetY)
const cardsOffsetX = computed(() => props.stackCards?.cardsOffsetX ?? STACK_CARDS_DEFAULTS.cardsOffsetX)
const cardsOffsetY = computed(() => props.stackCards?.cardsOffsetY ?? STACK_CARDS_DEFAULTS.cardsOffsetY)
const mobileTextCardsGap = computed(
  () => props.stackCards?.mobileTextCardsGap ?? STACK_CARDS_DEFAULTS.mobileTextCardsGap
)

const wrap01 = (value: number) => ((value % 1) + 1) % 1

const phase = computed(() => progress.value * totalCards.value)
const activeCardIndex = computed(() => {
  const total = totalCards.value
  if (total <= 1) return 0

  if (isHorizontalVariant.value) {
    return Math.max(0, Math.min(total - 1, horizontalActiveCardIndex.value))
  }

  const phaseValue = Number.isFinite(phase.value) ? phase.value : 0
  const wrappedPhase = ((phaseValue % total) + total) % total
  return Math.ceil(wrappedPhase) % total
})
const responsiveCardWidthScale = computed(() => {
  const width = cardsViewportWidth.value
  if (width <= 0) return cardWidth.value
  if (width <= MOBILE_STACK_MIN_WIDTH) return Math.min(cardWidth.value, 0.88)
  if (width <= MOBILE_STACK_MAX_WIDTH) return Math.min(cardWidth.value, 0.96)
  return cardWidth.value
})
const mobileStackCompression = computed(() => {
  const width = cardsViewportWidth.value
  if (width <= 0) return 1
  if (width <= MOBILE_STACK_MIN_WIDTH) return Math.max(0.56, width / MOBILE_STACK_MIN_WIDTH)
  if (width <= MOBILE_STACK_MAX_WIDTH) return Math.max(0.74, width / MOBILE_STACK_MAX_WIDTH)
  if (width <= TABLET_STACK_MAX_WIDTH) return Math.max(0.88, width / TABLET_STACK_MAX_WIDTH)
  return 1
})
const mobileXStepFactor = computed(() => {
  const width = cardsViewportWidth.value
  if (width <= 0) return 1
  if (width <= MOBILE_STACK_MIN_WIDTH) return 0.42
  if (width <= MOBILE_STACK_MAX_WIDTH) return 0.6
  if (width <= TABLET_STACK_MAX_WIDTH) return 0.82
  return 1
})
const mobilePerspectiveOriginX = computed(() => {
  if (isHorizontalVariant.value) return '50%'
  if (cardsViewportWidth.value > 0 && cardsViewportWidth.value <= TABLET_STACK_MAX_WIDTH) return '50%'
  return stackDirection.value === 'left' ? '38%' : '62%'
})

const getHorizontalScrollRange = () => {
  const viewport = cardsViewportRef.value
  if (!viewport) return 0
  return Math.max(0, viewport.scrollWidth - viewport.clientWidth)
}

const measureHorizontalSequenceWidth = () => {
  if (!isHorizontalVariant.value) return
  const viewport = cardsViewportRef.value
  if (!viewport) return
  const baseCount = cards.value.length
  const cardNodes = Array.from(viewport.querySelectorAll<HTMLElement>('.story-card'))
  if (baseCount <= 0 || cardNodes.length <= baseCount) {
    horizontalSequenceWidth.value = 0
    return
  }

  const firstLeft = cardNodes[0]?.offsetLeft ?? 0
  const nextCycleLeft = cardNodes[baseCount]?.offsetLeft ?? 0
  const measuredWidth = Math.max(0, nextCycleLeft - firstLeft)
  horizontalSequenceWidth.value = measuredWidth
}

const releaseHorizontalSyncGuard = () => {
  if (horizontalSyncReleaseRafId !== null) {
    cancelAnimationFrame(horizontalSyncReleaseRafId)
  }
  horizontalSyncReleaseRafId = requestAnimationFrame(() => {
    isSyncingHorizontalScroll = false
    horizontalSyncReleaseRafId = null
  })
}

const setHorizontalScrollLeft = (nextScrollLeft: number) => {
  const viewport = cardsViewportRef.value
  if (!viewport) return

  const range = getHorizontalScrollRange()
  const clamped = Math.max(0, Math.min(range, nextScrollLeft))
  if (Math.abs(viewport.scrollLeft - clamped) < 0.5) return

  isSyncingHorizontalScroll = true
  viewport.scrollLeft = clamped
  releaseHorizontalSyncGuard()
}

const normalizeHorizontalLoopPosition = () => {
  if (!isHorizontalVariant.value) return
  const viewport = cardsViewportRef.value
  if (!viewport) return
  const sequenceWidth = horizontalSequenceWidth.value
  if (sequenceWidth <= 0) return

  let normalizedScrollLeft = viewport.scrollLeft
  while (normalizedScrollLeft < sequenceWidth * 0.5) normalizedScrollLeft += sequenceWidth
  while (normalizedScrollLeft > sequenceWidth * 1.5) normalizedScrollLeft -= sequenceWidth

  if (Math.abs(normalizedScrollLeft - viewport.scrollLeft) < 0.5) return

  isSyncingHorizontalScroll = true
  viewport.scrollLeft = normalizedScrollLeft
  releaseHorizontalSyncGuard()
}

const syncProgressFromHorizontalScroll = () => {
  if (!isHorizontalVariant.value) return
  const viewport = cardsViewportRef.value
  if (!viewport) return
  const sequenceWidth = horizontalSequenceWidth.value
  if (sequenceWidth <= 0) {
    progress.value = 0
    return
  }

  const localOffset = viewport.scrollLeft - sequenceWidth
  const wrappedOffset = ((localOffset % sequenceWidth) + sequenceWidth) % sequenceWidth
  progress.value = Math.max(0, Math.min(1, wrappedOffset / sequenceWidth))
}

const syncHorizontalScrollFromProgress = () => {
  if (!isHorizontalVariant.value) return
  const sequenceWidth = horizontalSequenceWidth.value
  if (sequenceWidth <= 0) return
  setHorizontalScrollLeft(sequenceWidth + wrap01(progress.value) * sequenceWidth)
}

const updateHorizontalActiveCardIndex = () => {
  const viewport = cardsViewportRef.value
  if (!viewport) {
    horizontalActiveCardIndex.value = 0
    return
  }
  const cardNodes = Array.from(viewport.querySelectorAll<HTMLElement>('.story-card'))
  if (cardNodes.length === 0) {
    horizontalActiveCardIndex.value = 0
    return
  }

  const viewportRect = viewport.getBoundingClientRect()
  const viewportCenterX = viewportRect.left + viewportRect.width / 2
  let nearestIndex = 0
  let minDistance = Number.POSITIVE_INFINITY

  cardNodes.forEach((cardNode, index) => {
    const cardRect = cardNode.getBoundingClientRect()
    const cardCenterX = cardRect.left + cardRect.width / 2
    const distance = Math.abs(cardCenterX - viewportCenterX)
    if (distance < minDistance) {
      minDistance = distance
      nearestIndex = index
    }
  })

  const baseCount = Math.max(1, cards.value.length)
  horizontalActiveCardIndex.value = Math.max(
    0,
    Math.min(baseCount - 1, nearestIndex % baseCount)
  )
}

const updateCardsViewportWidth = () => {
  const viewport = cardsViewportRef.value
  if (!viewport) return
  cardsViewportWidth.value = viewport.getBoundingClientRect().width
  if (isHorizontalVariant.value) {
    measureHorizontalSequenceWidth()
    updateHorizontalActiveCardIndex()
  }
}

const emitActiveCardChange = () => {
  const panelRoot = panelRootRef.value
  if (!panelRoot) return

  const index = Math.max(0, Math.min(totalCards.value - 1, activeCardIndex.value))
  const card = cards.value[index]

  panelRoot.dispatchEvent(
    new CustomEvent('scrollix:active-card-change', {
      bubbles: true,
      composed: true,
      detail: {
        index,
        cardId: card?.id ?? null,
        total: totalCards.value
      }
    })
  )
}

const cardViewportStyle = computed(() => ({
  '--card-width-scale': String(responsiveCardWidthScale.value),
  '--stack-card-surface-opacity': String(cardSurfaceOpacity.value / 100),
  '--stack-hover-rotate-y': '0deg',
  '--stack-direction-sign': stackDirection.value === 'left' ? '-1' : '1',
  '--stack-perspective-origin-x': mobilePerspectiveOriginX.value,
  '--stack-cards-offset-x': `${cardsOffsetX.value}px`,
  '--stack-cards-offset-y': `${cardsOffsetY.value}px`,
  '--stack-debug-mobile-cards-offset-x': `${debugMobileCardsOffsetX.value}px`,
  '--stack-debug-mobile-rotate-x': `${debugMobileRotateX.value}deg`,
  '--stack-debug-mobile-rotate-y': `${debugMobileRotateY.value}deg`
}))
const stackContentStyle = computed(() => ({
  ...contentStyle.value,
  '--stack-text-offset-x': `${textOffsetX.value}px`,
  '--stack-text-offset-y': `${textOffsetY.value}px`
}))
const stackLayoutStyle = computed(() => ({
  ...contentStyle.value,
  '--stack-cards-layout-side-padding': `${layoutSidePadding.value}px`,
  '--stack-mobile-text-cards-gap': `${mobileTextCardsGap.value}px`
}))
const { onMouseMove, onMouseLeave } = useStackCardHoverTilt({
  enabled: FEATURE_FLAGS.enableStackCardsMouseTilt
})

const normalizeWheelDelta = (event: WheelEvent) => {
  const viewportWidth = cardsViewportRef.value?.clientWidth ?? 0
  const dominantDelta =
    Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
  let normalized = dominantDelta
  if (event.deltaMode === 1) normalized *= 24
  else if (event.deltaMode === 2 && viewportWidth > 0) normalized *= viewportWidth
  if (Math.abs(normalized) < 1) {
    const direction = Math.sign(dominantDelta || event.deltaY || 1) || 1
    normalized = direction * 28
  }
  return normalized
}

const applyHorizontalWheel = (event: WheelEvent) => {
  const delta = normalizeWheelDelta(event)
  setHorizontalScrollLeft(
    (cardsViewportRef.value?.scrollLeft ?? 0) + delta * wheelSensitivity.value
  )
  normalizeHorizontalLoopPosition()
  syncProgressFromHorizontalScroll()
  updateHorizontalActiveCardIndex()
}

const onWheel = (event: WheelEvent) => {
  if (isHorizontalVariant.value) {
    event.preventDefault()
    event.stopPropagation()
    onUserInteraction()
    applyHorizontalWheel(event)
    return
  }
  onUserInteraction()
  event.preventDefault()
  const direction = Math.sign(event.deltaY || 1)
  progress.value = wrap01(progress.value + direction * STEP * wheelSensitivity.value)
}

const onLayoutWheel = (event: WheelEvent) => {
  if (!isHorizontalVariant.value) return
  event.preventDefault()
  onUserInteraction()
  applyHorizontalWheel(event)
}

const onViewportScroll = () => {
  if (isHorizontalVariant.value) {
    if (!isSyncingHorizontalScroll) {
      onUserInteraction()
    }
    normalizeHorizontalLoopPosition()
    syncProgressFromHorizontalScroll()
    updateHorizontalActiveCardIndex()
    return
  }
  onUserInteraction()
}

const onUserInteraction = () => {
  autoPlayStoppedByInteraction.value = true
  stopAutoPlay()
}

const touchTracking = ref<{
  startX: number
  startY: number
  lastX: number
  lastY: number
  axis: 'pending' | 'horizontal' | 'vertical'
  isHorizontal: boolean
  pendingDelta: number
  rafId: number | null
} | null>(null)

const onTouchStartCards = (event: TouchEvent) => {
  onUserInteraction()
  if (isHorizontalVariant.value) return
  const touch = event.touches[0]
  if (!touch) return
  touchTracking.value = {
    startX: touch.clientX,
    startY: touch.clientY,
    lastX: touch.clientX,
    lastY: touch.clientY,
    axis: 'pending',
    isHorizontal: false,
    pendingDelta: 0,
    rafId: null
  }
}

const flushTouchDelta = () => {
  const state = touchTracking.value
  if (!state) return
  const deltaPrimary = state.pendingDelta
  state.pendingDelta = 0
  state.rafId = null
  if (Math.abs(deltaPrimary) < 0.5) return
  const direction = deltaPrimary < 0 ? 1 : -1
  const touchStep =
    Math.min(0.06, Math.abs(deltaPrimary) / 220) *
    wheelSensitivity.value *
    mobileTouchSensitivity.value
  progress.value = wrap01(progress.value + direction * touchStep)
}

const onTouchMoveCards = (event: TouchEvent) => {
  if (isHorizontalVariant.value) return
  const state = touchTracking.value
  const touch = event.touches[0]
  if (!state || !touch) return

  const deltaXFromStart = touch.clientX - state.startX
  const deltaYFromStart = touch.clientY - state.startY

  if (state.axis === 'pending') {
    const lockThreshold = 10
    if (Math.abs(deltaXFromStart) < lockThreshold && Math.abs(deltaYFromStart) < lockThreshold) return
    const preferredAxis = Math.abs(deltaXFromStart) >= Math.abs(deltaYFromStart) ? 'horizontal' : 'vertical'
    if (preferredAxis === 'horizontal' && !mobileTouchHorizontalEnabled.value) return
    if (preferredAxis === 'vertical' && !mobileTouchVerticalEnabled.value) return
    state.axis = preferredAxis
    state.isHorizontal = state.axis === 'horizontal'
  }

  event.preventDefault()
  const deltaPrimary =
    state.axis === 'horizontal'
      ? touch.clientX - state.lastX
      : touch.clientY - state.lastY
  state.lastX = touch.clientX
  state.lastY = touch.clientY
  state.pendingDelta += deltaPrimary
  if (state.rafId === null) {
    state.rafId = requestAnimationFrame(flushTouchDelta)
  }
}

const onTouchEndCards = () => {
  if (isHorizontalVariant.value) return
  const state = touchTracking.value
  if (state && state.rafId !== null) {
    cancelAnimationFrame(state.rafId)
    state.rafId = null
  }
  touchTracking.value = null
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
  const tick = (ts: number) => {
    if (!autoPlayEnabled.value) return
    if (autoPlayLastTs > 0) {
      const deltaSeconds = (ts - autoPlayLastTs) / 1000
      if (isHorizontalVariant.value) {
        const sequenceWidth = horizontalSequenceWidth.value
        const baseCount = Math.max(1, cards.value.length)
        if (sequenceWidth > 0) {
          const travelPerStep = sequenceWidth / baseCount
          const velocityPxPerSecond =
            (travelPerStep * wheelSensitivity.value) / secondsPerStep
          setHorizontalScrollLeft(
            (cardsViewportRef.value?.scrollLeft ?? 0) + velocityPxPerSecond * deltaSeconds
          )
          normalizeHorizontalLoopPosition()
          syncProgressFromHorizontalScroll()
          updateHorizontalActiveCardIndex()
        }
      } else {
        const velocityPerSecond = (STEP * wheelSensitivity.value) / secondsPerStep
        progress.value = wrap01(progress.value + velocityPerSecond * deltaSeconds)
      }
    }
    autoPlayLastTs = ts
    autoPlayRafId = requestAnimationFrame(tick)
  }
  autoPlayRafId = requestAnimationFrame(tick)
}

watch([autoPlayEnabled, autoPlaySpeed, wheelSensitivity, totalCards], startAutoPlay, { immediate: true })
watch(
  () => [cards.value.length, isHorizontalVariant.value, cardsViewportWidth.value] as const,
  () => {
    if (!isHorizontalVariant.value) return
    measureHorizontalSequenceWidth()
    syncHorizontalScrollFromProgress()
    normalizeHorizontalLoopPosition()
    syncProgressFromHorizontalScroll()
    updateHorizontalActiveCardIndex()
  },
  { immediate: true }
)
watch([activeCardIndex, cards], emitActiveCardChange, { immediate: true, deep: false })
onMounted(() => {
  updateCardsViewportWidth()
  if (isHorizontalVariant.value) {
    measureHorizontalSequenceWidth()
    syncHorizontalScrollFromProgress()
    normalizeHorizontalLoopPosition()
    syncProgressFromHorizontalScroll()
    updateHorizontalActiveCardIndex()
  }
  emitActiveCardChange()
  const viewport = cardsViewportRef.value
  if (viewport && typeof ResizeObserver !== 'undefined') {
    cardsViewportResizeObserver = new ResizeObserver(updateCardsViewportWidth)
    cardsViewportResizeObserver.observe(viewport)
  }
  cardsViewportMeasureTimer = window.setInterval(updateCardsViewportWidth, 220)
  window.addEventListener('resize', updateCardsViewportWidth, { passive: true })
})
onBeforeUnmount(() => {
  stopAutoPlay()
  if (horizontalSyncReleaseRafId !== null) {
    cancelAnimationFrame(horizontalSyncReleaseRafId)
    horizontalSyncReleaseRafId = null
  }
  cardsViewportResizeObserver?.disconnect()
  cardsViewportResizeObserver = null
  if (cardsViewportMeasureTimer !== null) {
    window.clearInterval(cardsViewportMeasureTimer)
    cardsViewportMeasureTimer = null
  }
  window.removeEventListener('resize', updateCardsViewportWidth)
})

const getCardStyle = (index: number, color?: string) => {
  if (isHorizontalVariant.value) {
    return {
      '--card-accent': color || '#7c5cff',
      opacity: '1',
      zIndex: '1',
      transform: 'none'
    }
  }

  const rel = (index - phase.value + totalCards.value) % totalCards.value
  const compression = mobileStackCompression.value
  const xStep = 86 * cardGap.value * compression * mobileXStepFactor.value
  const zStep = 380 * cardGap.value * (0.86 + compression * 0.14)
  const stackDirectionSign = stackDirection.value === 'left' ? -1 : 1
  const centerShiftRatio = cardsViewportWidth.value <= TABLET_STACK_MAX_WIDTH ? 0.34 : 0
  const centerShift = -stackDirectionSign * (totalCards.value - 1) * xStep * centerShiftRatio
  const translateX = rel * xStep * stackDirectionSign + centerShift
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
    transform: `translate3d(${translateX}px, 0, ${translateZ}px) rotateY(calc(((${angleY.value}deg + var(--stack-hover-rotate-y, 0deg)) * var(--stack-direction-sign, 1)) + var(--stack-debug-mobile-rotate-y, 0deg))) rotateX(calc(${angleX.value}deg + var(--stack-debug-mobile-rotate-x, 0deg))) scale(${scale})`
  }
}
</script>
