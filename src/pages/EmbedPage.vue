<template>
  <main class="embed-root">
    <p v-if="loadError" class="embed-status">{{ loadError }}</p>
    <template v-else>
      <StoryRenderer
        :flow-steps="flowSteps"
        :auto-snap-enabled="autoSnapEnabled"
        :set-snap-shell-el="setSnapShellEl"
        :set-snap-stage-el="setSnapStageEl"
        :step-style="stepStyle"
        :show-watermark="embedWatermarkEnabled"
        :enable-ctas="embedEnableCtas"
      />
      <div v-if="showRuntimeLoader" class="embed-loader" role="status" aria-label="Loading story runtime">
        <span class="embed-loader__spinner" />
      </div>
    </template>
    <RuntimeDiagnosticsPanel v-if="showRuntimeDiagnostics" />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import '../styles/embed.scss'
import RuntimeDiagnosticsPanel from '@/components/RuntimeDiagnosticsPanel.vue'
import StoryRenderer from '../core/StoryRenderer.vue'
import { useStoryRuntime } from '../core/useStoryRuntime'
import { useEmbedStoryLoader } from '@/features/embed/composables/useEmbedStoryLoader'
import { FEATURE_FLAGS } from '@/config/featureFlags'

const {
  storySchema,
  isLoading,
  loadError,
  embedWatermarkEnabled,
  embedEnableCtas
} = useEmbedStoryLoader()

const {
  autoSnapEnabled,
  flowSteps,
  isInitializing: isRuntimeInitializing,
  snapShellRef,
  snapStageRef,
  stepStyle
} = useStoryRuntime(storySchema, { logPrefix: '[flow-embed]' })

const showRuntimeLoader = computed(() => !loadError.value && (isLoading.value || isRuntimeInitializing.value))

const setSnapShellEl = (element: HTMLElement | null) => {
  snapShellRef.value = element
}

const setSnapStageEl = (element: HTMLElement | null) => {
  snapStageRef.value = element
}

const showRuntimeDiagnostics = FEATURE_FLAGS.enableRuntimeDiagnostics
</script>



