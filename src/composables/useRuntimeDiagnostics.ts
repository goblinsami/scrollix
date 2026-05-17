import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  DIAGNOSTICS_FPS_SAMPLE_MS,
  DIAGNOSTICS_LONG_TASK_THRESHOLD_MS,
  DIAGNOSTICS_MEMORY_SAMPLE_MS,
  DIAGNOSTICS_WARN_FPS,
  DIAGNOSTICS_WARN_LONG_TASKS_PER_MIN,
  DIAGNOSTICS_WARN_MEMORY_MB
} from '@/constants/runtimeDiagnostics'

interface MemoryStats {
  usedJsHeapMb: number | null
  totalJsHeapMb: number | null
  jsHeapLimitMb: number | null
}

const toMb = (value: number) => Math.round((value / (1024 * 1024)) * 10) / 10

export function useRuntimeDiagnostics(enabled: boolean) {
  const fps = ref<number | null>(null)
  const longTasksPerMin = ref(0)
  const maxLongTaskMs = ref(0)
  const memory = ref<MemoryStats>({
    usedJsHeapMb: null,
    totalJsHeapMb: null,
    jsHeapLimitMb: null
  })

  const status = computed<'ok' | 'warn'>(() => {
    if ((fps.value ?? 999) < DIAGNOSTICS_WARN_FPS) return 'warn'
    if (longTasksPerMin.value > DIAGNOSTICS_WARN_LONG_TASKS_PER_MIN) return 'warn'
    if ((memory.value.usedJsHeapMb ?? 0) > DIAGNOSTICS_WARN_MEMORY_MB) return 'warn'
    return 'ok'
  })

  let rafId: number | null = null
  let frameCount = 0
  let fpsWindowStart = 0
  let memoryTimer: number | null = null
  let longTaskObserver: PerformanceObserver | null = null
  let longTaskWindowStart = 0
  let longTaskCount = 0

  const sampleMemory = () => {
    const perf = performance as Performance & {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
    }
    if (!perf.memory) return
    memory.value = {
      usedJsHeapMb: toMb(perf.memory.usedJSHeapSize),
      totalJsHeapMb: toMb(perf.memory.totalJSHeapSize),
      jsHeapLimitMb: toMb(perf.memory.jsHeapSizeLimit)
    }
  }

  const updateLongTaskRate = (ts: number) => {
    if (!longTaskWindowStart) {
      longTaskWindowStart = ts
      return
    }
    const elapsedMs = ts - longTaskWindowStart
    if (elapsedMs < DIAGNOSTICS_FPS_SAMPLE_MS) return
    longTasksPerMin.value = Math.round((longTaskCount * 60000) / elapsedMs)
    longTaskCount = 0
    longTaskWindowStart = ts
  }

  const tickFps = (ts: number) => {
    if (!fpsWindowStart) fpsWindowStart = ts
    frameCount += 1
    const elapsedMs = ts - fpsWindowStart
    if (elapsedMs >= DIAGNOSTICS_FPS_SAMPLE_MS) {
      fps.value = Math.round((frameCount * 1000) / elapsedMs)
      frameCount = 0
      fpsWindowStart = ts
    }
    updateLongTaskRate(ts)
    rafId = requestAnimationFrame(tickFps)
  }

  const start = () => {
    if (!enabled || typeof window === 'undefined') return
    if (rafId === null) rafId = requestAnimationFrame(tickFps)
    if (memoryTimer === null) {
      sampleMemory()
      memoryTimer = window.setInterval(sampleMemory, DIAGNOSTICS_MEMORY_SAMPLE_MS)
    }
    if ('PerformanceObserver' in window) {
      const supported = PerformanceObserver.supportedEntryTypes || []
      if (supported.includes('longtask')) {
        longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            longTaskCount += 1
            if (entry.duration > maxLongTaskMs.value) {
              maxLongTaskMs.value = Math.round(entry.duration)
            }
          })
        })
        longTaskObserver.observe({ type: 'longtask', buffered: true })
      }
    }
  }

  const stop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    if (memoryTimer !== null) {
      window.clearInterval(memoryTimer)
      memoryTimer = null
    }
    if (longTaskObserver) {
      longTaskObserver.disconnect()
      longTaskObserver = null
    }
  }

  onMounted(start)
  onBeforeUnmount(stop)

  const thresholdInfo = {
    longTaskMs: DIAGNOSTICS_LONG_TASK_THRESHOLD_MS
  }

  return {
    fps,
    longTasksPerMin,
    maxLongTaskMs,
    memory,
    status,
    thresholdInfo
  }
}
