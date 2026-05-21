<template>
  <header class="user-bar">
    <button
      class="user-bar__burger"
      type="button"
      :aria-expanded="isMobileBarOpen"
      aria-controls="user-bar-content"
      @click="$emit('toggleMobileMenu')"
    >
      ☰
    </button>

    <div id="user-bar-content" class="user-bar__content" :class="{ 'user-bar__content--open': isMobileBarOpen }">
      <div class="user-bar__left">
        <button class="edit-slide-button" type="button" @click="$emit('editCurrentSlide')">Edit Slide</button>
        <EditorToggleButton :is-open="isFlowEditorOpen" :logo-url="editorToggleLogoUrl" @toggle="$emit('toggleEditor')" />
        <button class="theme-toggle-button" type="button" @click="$emit('toggleTheme')">
          {{ isDarkTheme ? 'Dark' : 'Light' }}
        </button>
      </div>

      <div class="user-bar__identity">
        <div class="auth-chip">
          <template v-if="permissionsLoading">
            <span class="auth-chip__label">Auth</span>
            <span class="auth-chip__status">Loading...</span>
          </template>
          <template v-else-if="userEmail">
            <span class="auth-chip__status">{{ userEmail }}</span>
            <button
              class="google-login-button google-login-button--logout auth-chip__logout"
              type="button"
              :disabled="permissionsLoading"
              @click="$emit('logout')"
            >
              <span class="google-login-button__text">Logout</span>
            </button>
          </template>
          <template v-else>
            <span class="auth-chip__label">Auth</span>
            <span class="auth-chip__status">Not signed in</span>
          </template>
        </div>
        <span class="plan-indicator__value" :class="`plan-indicator__value--${role}`">{{ role }}</span>
        <span v-if="showUpgradePrompts" class="status-note">{{ storyUsageText }}</span>
      </div>

      <div class="user-bar__actions">
        <div v-if="isAuthenticated" class="story-name-field">
          <label class="story-name-field__label" for="story-name-input">Story</label>
          <input
            id="story-name-input"
            class="story-name-field__input"
            type="text"
            :value="storyName"
            :placeholder="`${storyNamePlaceholder} ${storyNameFallback}`"
            maxlength="160"
            @input="handleStoryNameInput"
          />
        </div>

        <button
          v-if="!isAuthenticated"
          class="google-login-button"
          type="button"
          :disabled="permissionsLoading"
          @click="$emit('login')"
        >
          <span class="google-login-button__icon" aria-hidden="true">
            <GoogleLogoIcon />
          </span>
          <span class="google-login-button__text">Login</span>
        </button>

        <template v-if="isAuthenticated">
          <button
            class="save-story-button"
            type="button"
            :disabled="permissionsLoading || isSavingStory || !canSave"
            @click="$emit('saveStory')"
          >
            <span v-if="isSavingStory">Saving...</span>
            <span v-else>Save</span>
          </button>
          <button
            class="publish-story-button"
            type="button"
            :disabled="permissionsLoading || isPublishingStory || !canPublish"
            @click="$emit('publishStory')"
          >
            <span v-if="isPublishingStory">Publishing...</span>
            <span v-else>Publish</span>
          </button>
          <button v-if="publishedStoryId" class="share-box__button" type="button" @click="$emit('copyPublicLink')">
            Copy Link
          </button>
          <button v-if="publishedStoryId" class="share-box__button" type="button" @click="$emit('copyEmbedCode')">
            Copy iFrame
          </button>
        </template>

        <details v-if="isAuthenticated" ref="myStoriesDropdownRef" class="mini-dropdown">
          <summary class="mini-dropdown__summary">My Stories</summary>
          <div class="mini-dropdown__body">
            <p v-if="isLoadingStories" class="my-stories__hint">Loading stories...</p>
            <p v-else-if="myStories.length === 0" class="my-stories__hint">No stories yet.</p>
            <ul v-else class="my-stories__list">
              <li v-for="story in myStories" :key="story.id" class="my-stories__item">
                <div class="my-stories__meta">
                  <strong class="my-stories__story-title">{{ formatStoryName(story) }}</strong>
                  <span class="my-stories__date" :title="formatStoryUpdatedAtFull(story.updated_at)">
                    {{ formatStoryUpdatedAt(story.updated_at) }} <b v-if="story.published">• Published</b>
                  </span>
                </div>
                <div class="my-stories__actions">
                  <button
                    class="my-stories__open-button"
                    type="button"
                    :disabled="isOpeningStory || isDeletingStory"
                    @click="$emit('openStory', story.id)"
                  >
                    Open
                  </button>
                  <button
                    class="my-stories__delete-button"
                    type="button"
                    :disabled="isOpeningStory || isDeletingStory"
                    @click="$emit('deleteStory', story.id)"
                  >
                    <span v-if="isDeletingStory && deletingStoryId === story.id">Deleting...</span>
                    <span v-else>Delete</span>
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import EditorToggleButton from '@/components/EditorToggleButton.vue'
import type { StoryListItem } from '@/types/stories'
import { formatStoryUpdatedAt, formatStoryUpdatedAtFull } from '@/utils/storyTimestamp'
import { STORY_NAME_LABELS } from '@/constants/storyName'
import { resolveStoryName } from '@/utils/storyName'
import GoogleLogoIcon from './icons/GoogleLogoIcon.vue'

defineProps<{
  isMobileBarOpen: boolean
  isFlowEditorOpen: boolean
  editorToggleLogoUrl: string
  permissionsLoading: boolean
  userEmail: string | null
  isAuthenticated: boolean
  role: string
  isDarkTheme: boolean
  showUpgradePrompts: boolean
  storyUsageText: string
  storyName: string
  storyNameFallback: string
  isSavingStory: boolean
  isPublishingStory: boolean
  canSave: boolean
  canPublish: boolean
  publishedStoryId: string | null
  isLoadingStories: boolean
  isOpeningStory: boolean
  isDeletingStory: boolean
  deletingStoryId: string | null
  myStories: StoryListItem[]
}>()

const emit = defineEmits<{
  toggleMobileMenu: []
  editCurrentSlide: []
  toggleEditor: []
  toggleTheme: []
  login: []
  logout: []
  saveStory: []
  publishStory: []
  updateStoryName: [value: string]
  copyPublicLink: []
  copyEmbedCode: []
  openStory: [storyId: string]
  deleteStory: [storyId: string]
}>()

const myStoriesDropdownRef = ref<HTMLElement | null>(null)
const storyNamePlaceholder = STORY_NAME_LABELS.placeholder
const formatStoryName = (story: StoryListItem) => resolveStoryName(story.title, story.updated_at)

const handleStoryNameInput = (event: Event) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  emit('updateStoryName', target.value)
}

const handleDocumentPointerDown = (event: MouseEvent | TouchEvent) => {
  const dropdown = myStoriesDropdownRef.value
  if (!dropdown || !dropdown.hasAttribute('open')) return
  const target = event.target
  if (!(target instanceof Node)) return
  if (dropdown.contains(target)) return
  dropdown.removeAttribute('open')
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentPointerDown)
  document.addEventListener('touchstart', handleDocumentPointerDown, { passive: true })
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleDocumentPointerDown)
  document.removeEventListener('touchstart', handleDocumentPointerDown)
})
</script>
