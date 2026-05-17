<template>
  <main class="embed-root">
    <p v-if="isLoading" class="embed-status">Loading story...</p>
    <p v-else-if="loadError" class="embed-status">{{ loadError }}</p>
    <StoryRenderer
      v-else
      :flow-steps="flowSteps"
      :auto-snap-enabled="autoSnapEnabled"
      :set-snap-shell-el="setSnapShellEl"
      :set-snap-stage-el="setSnapStageEl"
      :step-style="stepStyle"
      :show-watermark="embedWatermarkEnabled"
      :enable-ctas="embedEnableCtas"
    />
    <RuntimeDiagnosticsPanel :enabled="showRuntimeDiagnostics" />
  </main>
</template>

<script setup lang="ts">
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
  snapShellRef,
  snapStageRef,
  stepStyle
} = useStoryRuntime(storySchema, { logPrefix: '[flow-embed]' })

const setSnapShellEl = (element: HTMLElement | null) => {
  snapShellRef.value = element
}

const setSnapStageEl = (element: HTMLElement | null) => {
  snapStageRef.value = element
}

const showRuntimeDiagnostics = FEATURE_FLAGS.enableRuntimeDiagnostics
</script>



