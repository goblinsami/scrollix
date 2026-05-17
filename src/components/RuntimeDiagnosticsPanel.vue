<template>
  <aside class="runtime-diagnostics" :class="`runtime-diagnostics--${status}`" aria-live="polite">
    <p class="runtime-diagnostics__title">Runtime Diagnostics</p>
    <p>FPS: <strong>{{ fpsLabel }}</strong></p>
    <p>Long tasks/min: <strong>{{ longTasksPerMin }}</strong></p>
    <p>Max long task: <strong>{{ maxLongTaskLabel }}</strong></p>
    <p>Heap used: <strong>{{ memoryLabel }}</strong></p>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRuntimeDiagnostics } from '@/composables/useRuntimeDiagnostics'

const props = withDefaults(defineProps<{ enabled?: boolean }>(), {
  enabled: false
})

const { fps, longTasksPerMin, maxLongTaskMs, memory, status, thresholdInfo } = useRuntimeDiagnostics(props.enabled)

const fpsLabel = computed(() => (fps.value === null ? '...' : String(fps.value)))
const maxLongTaskLabel = computed(() =>
  maxLongTaskMs.value > 0 ? `${maxLongTaskMs.value}ms` : `<${thresholdInfo.longTaskMs}ms`
)
const memoryLabel = computed(() =>
  memory.value.usedJsHeapMb === null ? 'n/a' : `${memory.value.usedJsHeapMb}MB`
)
</script>

<style scoped lang="scss">
.runtime-diagnostics {
  position: fixed;
  right: 14px;
  bottom: 14px;
  z-index: 40;
  min-width: 180px;
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(12, 16, 23, 0.8);
  color: #f8fbff;
  font-size: 0.72rem;
  line-height: 1.35;
  backdrop-filter: blur(6px);
}

.runtime-diagnostics p {
  margin: 0.1rem 0;
}

.runtime-diagnostics__title {
  margin-bottom: 0.25rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.runtime-diagnostics--warn {
  border-color: rgba(255, 168, 120, 0.75);
  box-shadow: 0 0 0 1px rgba(255, 168, 120, 0.22) inset;
}
</style>
