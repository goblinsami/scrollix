import { computed, ref, watch, type Ref } from 'vue'
import { PUBLIC_APP_URL } from '@/config/app'
import { deleteStory, getStories, getStoryById, publishStory, saveStory, updateStory } from '@/services/stories'
import type { ContentSchema, Panel } from '@/types/navigation'
import type { StoryListItem } from '@/types/stories'
import { copyTextToClipboard } from '@/utils/clipboard'
import { debugLog } from '@/utils/logger'
import { buildStoryTimestampName, resolveStoryName } from '@/utils/storyName'

interface UseEditorStoryActionsOptions {
  routeStoryId: Ref<string>
  storySchema: Ref<ContentSchema | null>
  user: Readonly<Ref<AuthUserLike | null>>
  canSave: Ref<boolean>
  canPublish: Ref<boolean>
  canCreateMoreStories: Ref<boolean>
  showWatermark: Ref<boolean>
  autoSnapEnabled: Ref<boolean>
  loopEnabled: Ref<boolean>
  snapEase: Ref<string>
  transitionSpeed: Ref<number>
  autoPlayEnabled: Ref<boolean>
  autoPlaySpeed: Ref<number>
  panelsState: Ref<Panel[]>
  storyCountRef?: Ref<number>
}

interface AuthUserLike {
  id: string
  email?: string | null
}

const clonePanels = (panels: Panel[]): Panel[] => panels.map((panel) => ({ ...panel }))

export function useEditorStoryActions(options: UseEditorStoryActionsOptions) {
  const currentStoryId = ref<string | null>(null)
  const publishedStoryId = ref<string | null>(null)
  const storyName = ref('')
  const storyNameFallback = ref(buildStoryTimestampName())

  const isSavingStory = ref(false)
  const isPublishingStory = ref(false)
  const isLoadingStories = ref(false)
  const isOpeningStory = ref(false)
  const isDeletingStory = ref(false)
  const deletingStoryId = ref<string | null>(null)
  const myStories = ref<StoryListItem[]>([])
  const shareFeedback = ref('')
  let storiesLoadRequestId = 0

  const buildCurrentStoryContent = (): ContentSchema => ({
    autoSnapEnabled: options.autoSnapEnabled.value,
    loopEnabled: options.loopEnabled.value,
    enableLoop: options.loopEnabled.value,
    snapEase: options.snapEase.value,
    transitionSpeed: options.transitionSpeed.value,
    autoPlayEnabled: options.autoPlayEnabled.value,
    autoPlaySpeed: options.autoPlaySpeed.value,
    watermarkEnabled: options.showWatermark.value,
    panels: clonePanels(options.panelsState.value)
  })

  const buildStoryTitle = () => resolveStoryName(storyName.value)

  const publicStoryUrl = computed(() => {
    if (!publishedStoryId.value) return ''
    return `${PUBLIC_APP_URL}/embed/${publishedStoryId.value}`
  })

  const iframeEmbedCode = computed(() => {
    if (!publicStoryUrl.value) return ''
    return `<iframe src="${publicStoryUrl.value}" width="100%" height="900" style="border:none;overflow:hidden;"></iframe>`
  })

  const copyText = async (value: string, label: string) => {
    if (!value) return
    try {
      await copyTextToClipboard(value)
      debugLog(`[share] Copied ${label}`)
      shareFeedback.value = `${label} copied`
    } catch (error) {
      console.error(`[share] Failed to copy ${label}`, error)
      shareFeedback.value = `Failed to copy ${label}`
    }
  }

  const copyPublicLink = async () => {
    await copyText(publicStoryUrl.value, 'public link')
  }

  const openPublicLink = () => {
    const url = publicStoryUrl.value
    if (!url) return

    const popup = window.open(url, '_blank', 'noopener,noreferrer')
    if (!popup) {
      window.location.assign(url)
    }
  }

  const copyEmbedCode = async () => {
    await copyText(iframeEmbedCode.value, 'iframe embed code')
  }

  const refreshMyStories = async () => {
    const requestId = ++storiesLoadRequestId
    if (!options.user.value) {
      myStories.value = []
      if (options.storyCountRef) options.storyCountRef.value = 0
      isLoadingStories.value = false
      return
    }

    isLoadingStories.value = true
    try {
      debugLog('[stories] loading stories list', { userId: options.user.value.id })
      const stories = await getStories(options.user.value.id)
      if (requestId !== storiesLoadRequestId) return
      myStories.value = stories
      if (options.storyCountRef) options.storyCountRef.value = myStories.value.length
    } catch (error) {
      if (requestId !== storiesLoadRequestId) return
      console.error('[stories] failed loading stories list', error)
      myStories.value = []
      if (options.storyCountRef) options.storyCountRef.value = 0
    } finally {
      if (requestId !== storiesLoadRequestId) return
      isLoadingStories.value = false
    }
  }

  const handleSaveStory = async () => {
    if (!options.canSave.value) {
      console.warn('[permissions] Save is disabled for current role.')
      return
    }
    if (!currentStoryId.value && !options.canCreateMoreStories.value) {
      console.warn('[permissions] Story limit reached. Upgrade to create more stories.')
      return
    }
    if (!options.user.value) return
    if (isSavingStory.value) return

    isSavingStory.value = true
    try {
      const content = buildCurrentStoryContent()
      const title = buildStoryTitle()
      const savedStory = currentStoryId.value
        ? await updateStory({
          storyId: currentStoryId.value,
          userId: options.user.value.id,
          title,
          content
        })
        : await saveStory({
          userId: options.user.value.id,
          title,
          content
        })

      debugLog('[stories] Save completed', {
        id: savedStory.id,
        title: savedStory.title
      })
      storyName.value = savedStory.title
      storyNameFallback.value = buildStoryTimestampName(savedStory.updated_at)
      currentStoryId.value = savedStory.id
      await refreshMyStories()
    } catch (error) {
      console.error('[stories] Save failed in editor', error)
    } finally {
      isSavingStory.value = false
    }
  }

  const handlePublishStory = async () => {
    if (!options.canPublish.value) {
      console.warn('[permissions] Publish is disabled for current role.')
      return
    }
    if (!currentStoryId.value && !options.canCreateMoreStories.value) {
      console.warn('[permissions] Story limit reached. Upgrade to publish more stories.')
      return
    }
    if (!options.user.value) return
    if (isPublishingStory.value) return

    isPublishingStory.value = true
    try {
      let storyId = currentStoryId.value
      if (!storyId) {
        const content = buildCurrentStoryContent()
        const title = buildStoryTitle()
        const createdStory = await saveStory({
          userId: options.user.value.id,
          title,
          content
        })
        storyId = createdStory.id
        currentStoryId.value = createdStory.id
        debugLog('[stories] publish:auto-created-story', { storyId })
      }

      if (!storyId) {
        throw new Error('Unable to resolve story id for publish flow.')
      }

      const publishedStory = await publishStory({
        storyId,
        userId: options.user.value.id
      })

      publishedStoryId.value = publishedStory.id
      storyName.value = publishedStory.title
      storyNameFallback.value = buildStoryTimestampName(publishedStory.updated_at)
      debugLog('[stories] publish:completed', { id: publishedStory.id })
      await refreshMyStories()
    } catch (error) {
      console.error('[stories] publish:failed', error)
    } finally {
      isPublishingStory.value = false
    }
  }

  const handleOpenStory = async (storyId: string) => {
    if (!options.user.value) {
      console.warn('[stories] Open cancelled: user is not authenticated.')
      return
    }
    if (isOpeningStory.value) return

    isOpeningStory.value = true
    try {
      debugLog('[stories] opening story', { storyId })
      const story = await getStoryById(storyId)
      options.storySchema.value = {
        ...story.content_json,
        panels: clonePanels(story.content_json.panels)
      }
      storyName.value = story.title ?? ''
      storyNameFallback.value = buildStoryTimestampName(story.updated_at)
      currentStoryId.value = story.id
      publishedStoryId.value = story.published ? story.id : null
      debugLog('[stories] opened story', { id: story.id, title: story.title })
    } catch (error) {
      console.error('[stories] failed opening story', error)
    } finally {
      isOpeningStory.value = false
    }
  }

  const handleDeleteStory = async (storyId: string) => {
    if (!options.user.value) {
      console.warn('[stories] Delete cancelled: user is not authenticated.')
      return
    }
    if (!storyId.trim()) return
    if (isDeletingStory.value) return

    const shouldDelete = window.confirm('Delete this story? This action cannot be undone.')
    if (!shouldDelete) return

    isDeletingStory.value = true
    deletingStoryId.value = storyId
    try {
      await deleteStory({
        storyId,
        userId: options.user.value.id
      })

      if (currentStoryId.value === storyId) {
        currentStoryId.value = null
        publishedStoryId.value = null
        storyName.value = ''
        storyNameFallback.value = buildStoryTimestampName()
      }

      myStories.value = myStories.value.filter((story) => story.id !== storyId)
      if (options.storyCountRef) options.storyCountRef.value = myStories.value.length
      await refreshMyStories()
    } catch (error) {
      console.error('[stories] failed deleting story', error)
      const message = error instanceof Error ? error.message : 'Failed deleting story.'
      window.alert(`[stories] ${message}`)
    } finally {
      isDeletingStory.value = false
      deletingStoryId.value = null
    }
  }

  watch(
    () => options.routeStoryId.value,
    () => {
      currentStoryId.value = null
      publishedStoryId.value = null
      storyName.value = ''
      storyNameFallback.value = buildStoryTimestampName()
    }
  )

  watch(
    () => options.user.value?.id ?? null,
    async (nextUserId) => {
      if (!nextUserId) {
        myStories.value = []
        if (options.storyCountRef) options.storyCountRef.value = 0
        currentStoryId.value = null
        publishedStoryId.value = null
        isDeletingStory.value = false
        deletingStoryId.value = null
        storyName.value = ''
        storyNameFallback.value = buildStoryTimestampName()
        return
      }
      await refreshMyStories()
    },
    { immediate: true }
  )

  return {
    currentStoryId,
    publishedStoryId,
    storyName,
    storyNameFallback,
    isSavingStory,
    isPublishingStory,
    isLoadingStories,
    isOpeningStory,
    isDeletingStory,
    deletingStoryId,
    myStories,
    shareFeedback,
    publicStoryUrl,
    iframeEmbedCode,
    handleSaveStory,
    handlePublishStory,
    handleOpenStory,
    handleDeleteStory,
    copyPublicLink,
    openPublicLink,
    copyEmbedCode
  }
}
