import { STACK_CARD_TILT_STRENGTH_DEG } from '../constants/stackCardTilt'

interface UseStackCardHoverTiltOptions {
  enabled: boolean
  maxOffsetDeg?: number
}

export function useStackCardHoverTilt(options: UseStackCardHoverTiltOptions) {
  const maxOffsetDeg = options.maxOffsetDeg ?? STACK_CARD_TILT_STRENGTH_DEG
  let rafId: number | null = null
  let pendingDeg = 0
  let targetEl: HTMLElement | null = null

  const applyPending = () => {
    rafId = null
    if (!targetEl) return
    targetEl.style.setProperty('--stack-hover-rotate-y', `${pendingDeg.toFixed(2)}deg`)
  }

  const onMouseMove = (event: MouseEvent) => {
    if (!options.enabled) return
    const target = event.currentTarget as HTMLElement | null
    if (!target) return
    targetEl = target
    const rect = target.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const normalizedX = Math.max(-1, Math.min(1, (event.clientX - centerX) / (rect.width / 2)))
    pendingDeg = normalizedX * maxOffsetDeg
    if (rafId !== null) return
    rafId = requestAnimationFrame(applyPending)
  }

  const onMouseLeave = (event: MouseEvent) => {
    if (!options.enabled) return
    const target = event.currentTarget as HTMLElement | null
    if (!target) return
    targetEl = target
    pendingDeg = 0
    if (rafId !== null) return
    rafId = requestAnimationFrame(applyPending)
  }

  return {
    onMouseMove,
    onMouseLeave
  }
}
