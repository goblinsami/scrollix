import { nextTick, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { SlidePathStep } from './useSlidePath'
import type { SnapEaseOption } from '../constants/snapEase'
import { normalizeTransitionSpeed } from '../constants/transitionSpeed'
import { normalizeAutoPlaySpeed } from '../constants/autoPlaySpeed'
import { normalizeStepIndex } from '../utils/stepIndex'
import { debugLog } from '../utils/logger'

gsap.registerPlugin(ScrollTrigger)

const WHEEL_INTENT_THRESHOLD = 9
const TOUCH_INTENT_THRESHOLD = 18
const INPUT_COOLDOWN_MS = 220
const AUTOPLAY_RETRY_WHILE_TRANSITIONING_MS = 50
const AUTOPLAY_RESUME_AFTER_MANUAL_INPUT_MS = 2000

interface UseSlideSnapNavigationOptions {
  flowSteps: Ref<SlidePathStep[]>
  autoSnapEnabled: Ref<boolean>
  loopEnabled: Ref<boolean>
  snapEase: Ref<SnapEaseOption>
  transitionSpeed: Ref<number>
  autoPlayEnabled: Ref<boolean>
  autoPlaySpeed: Ref<number>
  enabled: Ref<boolean>
  logPrefix?: string
}

export function useSlideSnapNavigation(options: UseSlideSnapNavigationOptions) {
  const logPrefix = options.logPrefix ?? '[flow-snap]'
  const snapShellRef = ref<HTMLElement | null>(null)
  const snapStageRef = ref<HTMLElement | null>(null)
  const activeStepIndex = ref(0)
  const isTransitioning = ref(false)
  const isInitializing = ref(true)

  let disposeInteractionHandlers: (() => void) | null = null
  let disposeResizeHandler: (() => void) | null = null
  let manualScrollTrigger: ScrollTrigger | null = null
  let manualTimeline: gsap.core.Timeline | null = null
  let touchStartY: number | null = null
  let touchCommitted = false
  let lastInputAt = 0
  let resizeDebounce: number | null = null
  let autoPlayTimer: number | null = null
  let autoPlayNextAt = 0
  let activeInitRequestId = 0

  const normalizeIndex = (value: number, total: number) => normalizeStepIndex(value, total, options.loopEnabled.value)

  const isIgnoredTarget = (target: EventTarget | null) => {
    const element = target instanceof Element ? target : null
    if (!element) return false
    return Boolean(
      element.closest(
        '.flow-modal, .flow-canvas, .block-settings, .user-bar, .editor-hover-toggle, input, textarea, select, button, [contenteditable="true"]'
      )
    )
  }

  const getStagePoint = (step: SlidePathStep) => ({
    x: -step.x * window.innerWidth,
    y: -step.y * window.innerHeight
  })

  const stepStyle = (step: SlidePathStep) => ({
    transform: `translate3d(${step.x * 100}vw, ${step.y * 100}vh, 0)`
  })

  const getTransitionSpeed = () => normalizeTransitionSpeed(options.transitionSpeed.value)

  const getAutoSnapDuration = () => {
    // Interpret speed as transition time in seconds:
    // higher value => slower transition.
    return getTransitionSpeed()
  }

  const getManualSnapDurations = () => {
    const speed = getTransitionSpeed()
    const minDuration = Math.max(0.08, speed * 0.35)
    const maxDuration = Math.max(minDuration + 0.05, speed * 0.85)
    return {
      min: minDuration,
      max: maxDuration
    }
  }
  const getAutoPlaySpeed = () => normalizeAutoPlaySpeed(options.autoPlaySpeed.value)

  const jumpToStep = (index: number) => {
    const stage = snapStageRef.value
    const total = options.flowSteps.value.length
    if (!stage || !total) return

    const nextIndex = normalizeIndex(index, total)
    const target = getStagePoint(options.flowSteps.value[nextIndex])
    gsap.set(stage, { x: target.x, y: target.y })
    activeStepIndex.value = nextIndex

    debugLog(`${logPrefix} jump`, {
      index: nextIndex,
      x: target.x,
      y: target.y
    })
  }

  const goToStep = (index: number, source: string) => {
    const stage = snapStageRef.value
    const steps = options.flowSteps.value
    if (!stage || !steps.length) return
    if (isTransitioning.value) {
      debugLog(`${logPrefix} skip (transitioning)`, { source, activeStepIndex: activeStepIndex.value, next: index })
      return
    }

    const normalizedIndex = normalizeIndex(index, steps.length)
    const wrapped = normalizedIndex !== index
    if (wrapped) {
      debugLog(`${logPrefix} wrap`, {
        requested: index,
        normalized: normalizedIndex,
        total: steps.length
      })
    }

    if (normalizedIndex === activeStepIndex.value) {
      debugLog(`${logPrefix} skip (same step)`, { source, step: normalizedIndex })
      return
    }

    const from = steps[activeStepIndex.value]
    const to = steps[normalizedIndex]
    const target = getStagePoint(to)

    isTransitioning.value = true
    debugLog(`${logPrefix} transition:start`, {
      source,
      from: {
        index: from.index,
        panelId: from.panel.id,
        x: from.x,
        y: from.y
      },
      to: {
        index: to.index,
        panelId: to.panel.id,
        x: to.x,
        y: to.y
      },
      target
    })

    gsap.to(stage, {
      x: target.x,
      y: target.y,
      duration: getAutoSnapDuration(),
      ease: options.snapEase.value,
      overwrite: 'auto',
      onComplete: () => {
        activeStepIndex.value = normalizedIndex
        isTransitioning.value = false
        debugLog(`${logPrefix} transition:end`, {
          step: normalizedIndex,
          panelId: to.panel.id
        })
      },
      onInterrupt: () => {
        isTransitioning.value = false
        debugLog(`${logPrefix} transition:interrupt`)
      }
    })
  }

  const clearAutoPlayTimer = () => {
    if (autoPlayTimer !== null) {
      window.clearTimeout(autoPlayTimer)
      autoPlayTimer = null
    }
  }

  const scheduleAutoPlayTick = () => {
    clearAutoPlayTimer()
    if (!options.autoSnapEnabled.value || !options.autoPlayEnabled.value) return
    if (options.flowSteps.value.length <= 1) return

    const now = Date.now()
    const delay = Math.max(0, autoPlayNextAt - now)
    autoPlayTimer = window.setTimeout(() => {
      if (isTransitioning.value) {
        autoPlayTimer = window.setTimeout(scheduleAutoPlayTick, AUTOPLAY_RETRY_WHILE_TRANSITIONING_MS)
        return
      }
      goToStep(activeStepIndex.value + 1, 'autoplay')
      autoPlayNextAt += Math.round(getAutoPlaySpeed() * 1000)
      scheduleAutoPlayTick()
    }, delay)
  }

  const setupAutoPlay = (resumeDelayMs = 0) => {
    clearAutoPlayTimer()
    if (!options.autoSnapEnabled.value || !options.autoPlayEnabled.value) return
    if (options.flowSteps.value.length <= 1) return

    const intervalMs = Math.round(getAutoPlaySpeed() * 1000)
    autoPlayNextAt = Date.now() + Math.max(0, resumeDelayMs) + intervalMs
    scheduleAutoPlayTick()

    debugLog(`${logPrefix} autoplay:start`, {
      speed: getAutoPlaySpeed(),
      intervalMs,
      resumeDelayMs
    })
  }

  const focusStep = (index: number) => {
    const steps = options.flowSteps.value
    if (!steps.length) return

    const normalizedIndex = normalizeIndex(index, steps.length)
    if (options.autoSnapEnabled.value) {
      goToStep(normalizedIndex, 'external')
      return
    }

    if (!manualScrollTrigger) return

    const label = `step-${normalizedIndex + 1}`
    const targetScroll = manualScrollTrigger.labelToScroll(label)
    if (typeof targetScroll !== 'number' || Number.isNaN(targetScroll)) return

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    })
    activeStepIndex.value = normalizedIndex

    debugLog(`${logPrefix} focusStep`, {
      index: normalizedIndex,
      label,
      targetScroll
    })
  }

  const shouldAcceptInput = () => {
    const now = Date.now()
    if (now - lastInputAt < INPUT_COOLDOWN_MS) {
      debugLog(`${logPrefix} input:cooldown`, { elapsed: now - lastInputAt })
      return false
    }
    lastInputAt = now
    return true
  }

  const setupAutoSnapInteractions = () => {
    if (!options.autoSnapEnabled.value) return

    const wheelHandler = (event: WheelEvent) => {
      if (isIgnoredTarget(event.target)) return
      if (Math.abs(event.deltaY) < WHEEL_INTENT_THRESHOLD) return
      event.preventDefault()
      debugLog(`${logPrefix} wheel`, {
        deltaY: event.deltaY,
        activeStepIndex: activeStepIndex.value
      })

      if (!shouldAcceptInput()) return
      goToStep(activeStepIndex.value + (event.deltaY > 0 ? 1 : -1), 'wheel')
      setupAutoPlay(AUTOPLAY_RESUME_AFTER_MANUAL_INPUT_MS)
    }

    const touchStartHandler = (event: TouchEvent) => {
      if (isIgnoredTarget(event.target)) return
      touchStartY = event.changedTouches[0]?.clientY ?? null
      touchCommitted = false
      debugLog(`${logPrefix} touchstart`, { touchStartY })
    }

    const touchMoveHandler = (event: TouchEvent) => {
      if (isIgnoredTarget(event.target)) return
      if (touchStartY === null || touchCommitted) return

      const currentY = event.changedTouches[0]?.clientY
      if (typeof currentY !== 'number') return
      const deltaY = touchStartY - currentY
      if (Math.abs(deltaY) < TOUCH_INTENT_THRESHOLD) return

      event.preventDefault()
      touchCommitted = true
      debugLog(`${logPrefix} touchmove`, {
        deltaY,
        activeStepIndex: activeStepIndex.value
      })

      if (!shouldAcceptInput()) return
      goToStep(activeStepIndex.value + (deltaY > 0 ? 1 : -1), 'touch')
      setupAutoPlay(AUTOPLAY_RESUME_AFTER_MANUAL_INPUT_MS)
    }

    const touchEndHandler = () => {
      touchStartY = null
      touchCommitted = false
      debugLog(`${logPrefix} touchend`)
    }

    const keydownHandler = (event: KeyboardEvent) => {
      if (isIgnoredTarget(event.target)) return

      const key = event.key
      const forward = key === 'ArrowDown' || key === 'ArrowRight' || key === 'PageDown' || key === ' '
      const backward = key === 'ArrowUp' || key === 'ArrowLeft' || key === 'PageUp'
      if (!forward && !backward) return

      event.preventDefault()
      debugLog(`${logPrefix} keydown`, {
        key,
        activeStepIndex: activeStepIndex.value
      })

      if (!shouldAcceptInput()) return
      goToStep(activeStepIndex.value + (forward ? 1 : -1), 'keyboard')
      setupAutoPlay(AUTOPLAY_RESUME_AFTER_MANUAL_INPUT_MS)
    }

    window.addEventListener('wheel', wheelHandler, { passive: false })
    window.addEventListener('touchstart', touchStartHandler, { passive: true })
    window.addEventListener('touchmove', touchMoveHandler, { passive: false })
    window.addEventListener('touchend', touchEndHandler, { passive: true })
    window.addEventListener('keydown', keydownHandler)

    disposeInteractionHandlers = () => {
      window.removeEventListener('wheel', wheelHandler)
      window.removeEventListener('touchstart', touchStartHandler)
      window.removeEventListener('touchmove', touchMoveHandler)
      window.removeEventListener('touchend', touchEndHandler)
      window.removeEventListener('keydown', keydownHandler)
    }
  }

  const destroyNavigation = () => {
    if (disposeInteractionHandlers) {
      disposeInteractionHandlers()
      disposeInteractionHandlers = null
    }
    manualScrollTrigger?.kill()
    manualScrollTrigger = null
    manualTimeline?.kill()
    manualTimeline = null
    if (snapStageRef.value) {
      gsap.killTweensOf(snapStageRef.value)
    }
    if (resizeDebounce !== null) {
      window.clearTimeout(resizeDebounce)
      resizeDebounce = null
    }
    document.body.classList.remove('snap-mode')
    clearAutoPlayTimer()
    touchStartY = null
    touchCommitted = false
    isTransitioning.value = false
  }

  const initNavigation = async () => {
    const requestId = ++activeInitRequestId
    isInitializing.value = true

    try {
      await nextTick()
      destroyNavigation()

      if (!options.enabled.value || !options.flowSteps.value.length) return

      debugLog(`${logPrefix} init`, {
        autoSnapEnabled: options.autoSnapEnabled.value,
        loopEnabled: options.loopEnabled.value,
        snapEase: options.snapEase.value,
        transitionSpeed: getTransitionSpeed(),
        totalSteps: options.flowSteps.value.length,
        steps: options.flowSteps.value.map((step) => ({
          index: step.index,
          panelId: step.panel.id,
          x: step.x,
          y: step.y,
          directionToNext: step.directionToNext
        }))
      })

      const total = options.flowSteps.value.length
      activeStepIndex.value = normalizeIndex(activeStepIndex.value, total)
      jumpToStep(activeStepIndex.value)

      if (options.autoSnapEnabled.value) {
        document.body.classList.add('snap-mode')
        setupAutoSnapInteractions()
        setupAutoPlay()
        return
      }

      const stage = snapStageRef.value
      const shell = snapShellRef.value
      if (!stage || !shell) return

      const timeline = gsap.timeline({ defaults: { ease: 'none' } })
      manualTimeline = timeline
      timeline.addLabel('step-1', 0)

      for (let i = 1; i < options.flowSteps.value.length; i += 1) {
        const target = getStagePoint(options.flowSteps.value[i])
        timeline.to(
          stage,
          {
            x: target.x,
            y: target.y,
            duration: 1
          },
          i - 1
        )
        timeline.addLabel(`step-${i + 1}`, i)
      }

      const segments = Math.max(1, options.flowSteps.value.length - 1)
      const manualSnapDuration = getManualSnapDurations()
      manualScrollTrigger = ScrollTrigger.create({
        animation: timeline,
        trigger: shell,
        start: 'top top',
        end: () => `+=${segments * window.innerHeight}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const totalSteps = options.flowSteps.value.length
          if (!totalSteps) return
          const rawIndex = Math.round(self.progress * (totalSteps - 1))
          const nextIndex = normalizeIndex(rawIndex, totalSteps)
          if (nextIndex !== activeStepIndex.value) {
            activeStepIndex.value = nextIndex
            debugLog(`${logPrefix} manual:update`, {
              progress: self.progress,
              step: nextIndex
            })
          }
        },
        snap: {
          snapTo: 'labelsDirectional',
          inertia: false,
          duration: manualSnapDuration,
          delay: 0.06,
          ease: options.snapEase.value
        }
      })
    } finally {
      if (requestId === activeInitRequestId) {
        isInitializing.value = false
      }
    }
  }

  const handleResize = () => {
    if (resizeDebounce !== null) window.clearTimeout(resizeDebounce)
    resizeDebounce = window.setTimeout(() => {
      void initNavigation()
      resizeDebounce = null
    }, 120)
  }

  onMounted(() => {
    void initNavigation()
    window.addEventListener('resize', handleResize)
    disposeResizeHandler = () => window.removeEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    destroyNavigation()
    if (disposeResizeHandler) {
      disposeResizeHandler()
      disposeResizeHandler = null
    }
  })

  watch(
    () => options.flowSteps.value,
    async () => {
      await initNavigation()
    },
    { deep: true }
  )

  watch(
    () => options.autoSnapEnabled.value,
    async (nextAutoSnapEnabled, prevAutoSnapEnabled) => {
      if (!options.enabled.value || nextAutoSnapEnabled === prevAutoSnapEnabled) return
      debugLog(`${logPrefix} autosnap:update`, { autoSnapEnabled: nextAutoSnapEnabled })
      await initNavigation()
    }
  )

  watch(
    () => options.snapEase.value,
    async (nextEase, prevEase) => {
      if (!options.enabled.value || nextEase === prevEase) return
      debugLog(`${logPrefix} ease:update`, { snapEase: nextEase })
      if (!options.autoSnapEnabled.value) await initNavigation()
    }
  )

  watch(
    () => options.loopEnabled.value,
    async (nextLoopEnabled, prevLoopEnabled) => {
      if (!options.enabled.value || nextLoopEnabled === prevLoopEnabled) return
      debugLog(`${logPrefix} loop:update`, { loopEnabled: nextLoopEnabled })
      await initNavigation()
    }
  )

  watch(
    () => options.transitionSpeed.value,
    async (nextSpeed, prevSpeed) => {
      if (!options.enabled.value) return
      const normalizedNext = normalizeTransitionSpeed(nextSpeed)
      const normalizedPrev = normalizeTransitionSpeed(prevSpeed)
      if (normalizedNext === normalizedPrev) return
      debugLog(`${logPrefix} speed:update`, { transitionSpeed: normalizedNext })
      if (!options.autoSnapEnabled.value) await initNavigation()
    }
  )

  watch(
    () => options.autoPlayEnabled.value,
    (nextEnabled, prevEnabled) => {
      if (!options.enabled.value || nextEnabled === prevEnabled) return
      debugLog(`${logPrefix} autoplay:enabled:update`, { autoPlayEnabled: nextEnabled })
      setupAutoPlay()
    }
  )

  watch(
    () => options.autoPlaySpeed.value,
    (nextSpeed, prevSpeed) => {
      if (!options.enabled.value) return
      const normalizedNext = normalizeAutoPlaySpeed(nextSpeed)
      const normalizedPrev = normalizeAutoPlaySpeed(prevSpeed)
      if (normalizedNext === normalizedPrev) return
      debugLog(`${logPrefix} autoplay:speed:update`, { autoPlaySpeed: normalizedNext })
      setupAutoPlay()
    }
  )

  return {
    activeStepIndex,
    isInitializing,
    snapShellRef,
    snapStageRef,
    stepStyle,
    focusStep
  }
}

