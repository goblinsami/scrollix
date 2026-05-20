<template>
  <section class="scrollix-runtime-root" :data-status="loadState.status">
    <p v-if="loadState.status === 'loading'" class="scrollix-runtime-status">Loading story...</p>
    <p v-else-if="loadState.status === 'missing'" class="scrollix-runtime-status">
      Story not found.
    </p>
    <p v-else-if="loadState.status === 'error'" class="scrollix-runtime-status">
      {{ loadState.error }}
    </p>

    <SectionPanel
      v-else-if="runtimePanel"
      :title="runtimePanel.title"
      :eyebrow="runtimePanel.eyebrow"
      :description="runtimePanel.description"
      :template-type="runtimePanel.templateType"
      :stack-cards="runtimePanel.stackCards"
      :title-size="runtimePanel.titleSize"
      :description-size="runtimePanel.descriptionSize"
      :content-align="runtimePanel.contentAlign"
      :title-max-width="runtimePanel.titleMaxWidth"
      :description-max-width="runtimePanel.descriptionMaxWidth"
      :panel-class="runtimePanel.panelClass"
      :panel-color="runtimePanel.panelColor"
      :image="runtimePanel.image"
      :background-gradient="runtimePanel.backgroundGradient"
      :overlay-intensity="runtimePanel.overlayIntensity"
      :enable-ctas="false"
      :direction="runtimePanel.direction"
      animate-key="runtime"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, watch } from 'vue'
import SectionPanel from '../runtime-core/components/SectionPanel.vue'
import { mapHostedStoryToRuntimePanel } from '../schema/hostedStory'
import {
  createErrorState,
  createLoadingState,
  createMissingState,
  createReadyState,
  loadStory,
  subscribeToStory,
  type StoryLoadState
} from '../state/storyLoader'

const props = withDefaults(
  defineProps<{
    projectId: string
    supabaseUrl?: string
    supabaseAnonKey?: string
    storiesTable?: string
    schema?: string
    liveUpdates?: boolean
  }>(),
  {
    supabaseUrl: '',
    supabaseAnonKey: '',
    storiesTable: 'stories',
    schema: 'public',
    liveUpdates: false
  }
)

const loadState = reactive<StoryLoadState>(createLoadingState())
let unsubscribeLiveUpdates: (() => void) | null = null
let activeRequestId = 0

const resetLiveUpdates = () => {
  if (unsubscribeLiveUpdates) {
    unsubscribeLiveUpdates()
    unsubscribeLiveUpdates = null
  }
}

const loadHostedStory = async () => {
  const requestId = ++activeRequestId
  resetLiveUpdates()

  const projectId = props.projectId.trim()
  if (!projectId) {
    Object.assign(loadState, createMissingState())
    return
  }

  Object.assign(loadState, createLoadingState())

  try {
    const story = await loadStory(projectId, {
      supabaseUrl: props.supabaseUrl,
      supabaseAnonKey: props.supabaseAnonKey,
      storiesTable: props.storiesTable,
      schema: props.schema
    })

    if (requestId !== activeRequestId) return

    if (!story) {
      Object.assign(loadState, createMissingState())
      return
    }

    Object.assign(loadState, createReadyState(story))

    if (props.liveUpdates) {
      unsubscribeLiveUpdates = subscribeToStory(
        projectId,
        (nextStory) => {
          if (!nextStory) {
            Object.assign(loadState, createMissingState())
            return
          }
          Object.assign(loadState, createReadyState(nextStory))
        },
        {
          supabaseUrl: props.supabaseUrl,
          supabaseAnonKey: props.supabaseAnonKey,
          storiesTable: props.storiesTable,
          schema: props.schema
        }
      )
    }
  } catch (error) {
    if (requestId !== activeRequestId) return
    Object.assign(loadState, createErrorState(error))
  }
}

watch(
  () => [props.projectId, props.supabaseUrl, props.supabaseAnonKey, props.storiesTable, props.schema, props.liveUpdates],
  () => {
    void loadHostedStory()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  resetLiveUpdates()
})

const runtimePanel = computed(() => {
  if (!loadState.story) return null
  return mapHostedStoryToRuntimePanel(loadState.story)
})
</script>
