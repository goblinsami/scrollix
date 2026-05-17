<template>
  <main class="sandbox">
    <EditorTopBar
      :is-mobile-bar-open="isMobileBarOpen"
      :is-flow-editor-open="isFlowEditorOpen"
      :editor-toggle-logo-url="editorToggleLogoUrl"
      :permissions-loading="permissionsLoading"
      :user-email="user?.email ?? null"
      :is-authenticated="isAuthenticated"
      :role="role"
      :show-upgrade-prompts="showUpgradePrompts"
      :story-usage-text="storyUsageText"
      :is-saving-story="isSavingStory"
      :is-publishing-story="isPublishingStory"
      :can-save="canSave"
      :can-publish="canPublish"
      :published-story-id="publishedStoryId"
      :is-loading-stories="isLoadingStories"
      :is-opening-story="isOpeningStory"
      :my-stories="myStories"
      @toggle-mobile-menu="toggleMobileMenu"
      @edit-current-slide="handleEditCurrentSlide"
      @toggle-editor="handleToggleEditor"
      @login="handleLogin"
      @logout="handleLogout"
      @save-story="handleSaveStory"
      @publish-story="handlePublishStory"
      @copy-public-link="copyPublicLink"
      @copy-embed-code="copyEmbedCode"
      @open-story="handleOpenStory"
    />

    <div class="editor-hover-toggle">
      <EditorToggleButton :is-open="isFlowEditorOpen" :logo-url="editorToggleLogoUrl" @toggle="handleToggleEditor" />
    </div>

    <FlowEditor
      ref="flowEditorRef"
      :panels="panelsState"
      :enable-ctas="storyEnableCtas"
      :auto-snap-enabled="autoSnapEnabled"
      :snap-ease="snapEase"
      :transition-speed="transitionSpeed"
      :auto-play-enabled="autoPlayEnabled"
      :auto-play-speed="autoPlaySpeed"
      :loop-enabled="loopEnabled"
      :ease-options="SNAP_EASE_OPTIONS"
      :available-stories="availableStories"
      :can-upload-images="canUploadImages"
      @update:panels="handlePanelsUpdate"
      @update:auto-snap-enabled="handleAutoSnapEnabledUpdate"
      @update:snap-ease="handleSnapEaseUpdate"
      @update:transition-speed="handleTransitionSpeedUpdate"
      @update:auto-play-enabled="handleAutoPlayEnabledUpdate"
      @update:auto-play-speed="handleAutoPlaySpeedUpdate"
      @update:loop-enabled="handleLoopEnabledUpdate"
      @focus-step="focusStep"
    />

    <StoryRenderer
      :flow-steps="flowSteps"
      :auto-snap-enabled="autoSnapEnabled"
      :set-snap-shell-el="setSnapShellEl"
      :set-snap-stage-el="setSnapStageEl"
      :step-style="stepStyle"
      :show-edit-trigger="false"
      :show-watermark="showWatermark"
      :enable-ctas="storyEnableCtas"
      @edit-slide="openSlideEditor"
    />

    <RuntimeDiagnosticsPanel :enabled="showRuntimeDiagnostics" />
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import '../styles/editor.scss'
import EditorToggleButton from '@/components/EditorToggleButton.vue'
import RuntimeDiagnosticsPanel from '@/components/RuntimeDiagnosticsPanel.vue'
import StoryRenderer from '@/core/StoryRenderer.vue'
import { useStoryRuntime } from '@/core/useStoryRuntime'
import FlowEditor from '@/editor/components/flow-creator/FlowEditor.vue'
import { useAuth } from '@/composables/useAuth'
import { usePermissions } from '@/composables/usePermissions'
import { SNAP_EASE_OPTIONS } from '@/constants/snapEase'
import EditorTopBar from '@/features/editor/components/EditorTopBar.vue'
import { useEditorInteractionState } from '@/features/editor/composables/useEditorInteractionState'
import { useEditorStoryActions } from '@/features/editor/composables/useEditorStoryActions'
import { useEditorStorySource } from '@/features/editor/composables/useEditorStorySource'
import { FEATURE_FLAGS } from '@/config/featureFlags'

const { routeStoryId, storySchema, availableStories } = useEditorStorySource()

const {
  activeStepIndex: runtimeActiveStepIndex,
  autoSnapEnabled,
  autoPlayEnabled,
  autoPlaySpeed,
  flowSteps,
  loopEnabled,
  panelsState,
  snapEase,
  transitionSpeed,
  snapShellRef,
  snapStageRef,
  stepStyle,
  focusStep,
  handlePanelsUpdate,
  handleSnapEaseUpdate,
  handleAutoSnapEnabledUpdate,
  handleTransitionSpeedUpdate,
  handleAutoPlayEnabledUpdate,
  handleAutoPlaySpeedUpdate,
  handleLoopEnabledUpdate
} = useStoryRuntime(storySchema, { logPrefix: '[flow-edit]' })

const { user, signInWithGoogle, signOut } = useAuth()

const storyCount = ref(0)
const {
  role,
  loading: permissionsLoading,
  canSave,
  canPublish,
  canUploadImages,
  canCreateMoreStories,
  maxStories,
  showUpgradePrompts,
  showWatermark
} = usePermissions(storyCount)

const {
  publishedStoryId,
  isSavingStory,
  isPublishingStory,
  isLoadingStories,
  isOpeningStory,
  myStories,
  handleSaveStory,
  handlePublishStory,
  handleOpenStory,
  copyPublicLink,
  copyEmbedCode
} = useEditorStoryActions({
  routeStoryId,
  storySchema,
  user,
  canSave,
  canPublish,
  canCreateMoreStories,
  showWatermark,
  autoSnapEnabled,
  loopEnabled,
  snapEase,
  transitionSpeed,
  autoPlayEnabled,
  autoPlaySpeed,
  panelsState,
  storyCountRef: storyCount
})

const {
  flowEditorRef,
  isFlowEditorOpen,
  isMobileBarOpen,
  openSlideEditor,
  handleEditCurrentSlide,
  handleToggleEditor,
  toggleMobileMenu
} = useEditorInteractionState({
  runtimeActiveStepIndex,
  panelsState
})

const editorToggleLogoUrl = `${import.meta.env.BASE_URL}favicon.png`
const isAuthenticated = computed(() => Boolean(user.value))

const storyUsageText = computed(() => {
  if (!Number.isFinite(maxStories.value)) return `${storyCount.value} stories used`
  return `${storyCount.value} / ${maxStories.value} stories used`
})

const storyEnableCtas = computed(() => storySchema.value?.enableCtas ?? true)
const showRuntimeDiagnostics = import.meta.env.DEV && FEATURE_FLAGS.enableRuntimeDiagnostics

const handleLogin = async () => {
  try {
    await signInWithGoogle()
  } catch (error) {
    console.warn('[auth] Google login failed', error)
  }
}

const handleLogout = async () => {
  try {
    await signOut()
  } catch (error) {
    console.warn('[auth] Logout failed', error)
  }
}

const setSnapShellEl = (element: HTMLElement | null) => {
  snapShellRef.value = element
}

const setSnapStageEl = (element: HTMLElement | null) => {
  snapStageRef.value = element
}

void flowEditorRef
</script>
