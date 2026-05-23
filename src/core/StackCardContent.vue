<template>
  <article class="story-card" :style="[cardStyle, panelStyle]">
    <img v-if="image" class="card-image card-image--bg" :src="image" alt="" />
    <div v-if="overlayVisible" class="panel__overlay" :style="overlayStyle" />
    <div
      class="story-card__content"
      :class="{
        'story-card__content--text-content-editing': isTextContentEditingActive,
        'debug-container debug-container--content': showDebugContainers
      }"
      :style="contentStyle"
    >
      <div
        v-if="logo && logoTintEnabledResolved"
        class="slide-logo slide-logo--tint"
        :class="{ 'debug-container debug-container--logo': showDebugContainers }"
        :style="logoTintStyle"
      />
      <img
        v-else-if="logo"
        class="slide-logo"
        :class="{ 'debug-container debug-container--logo': showDebugContainers }"
        :src="logo"
        alt=""
        :style="logoStyle"
      />
      <p
        class="step"
        :class="{
          'text-content-highlight-target': isEyebrowHighlightActive,
          'debug-container debug-container--eyebrow': showDebugContainers
        }"
        :style="eyebrowStyle"
      >
        <span v-if="useMarkdown" v-html="eyebrowHtml" />
        <template v-else>{{ eyebrow }}</template>
      </p>
      <h3
        :class="{
          'text-content-highlight-target': isTitleHighlightActive,
          'debug-container debug-container--title': showDebugContainers
        }"
        :style="titleStyle"
      >
        <span v-if="useMarkdown" v-html="titleHtml" />
        <template v-else>{{ title }}</template>
      </h3>
      <p
        v-if="description"
        class="story-card__description"
        :class="{
          'text-content-highlight-target': isDescriptionHighlightActive,
          'debug-container debug-container--description': showDebugContainers
        }"
        :style="descriptionStyle"
      >
        <span v-if="useMarkdown" v-html="descriptionHtml" />
        <template v-else>{{ description }}</template>
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { FEATURE_FLAGS } from '@/config/featureFlags'
import { useSlidePanelPresentation } from '@/composables/useSlidePanelPresentation'
import type { SlidePanelProps } from '@/types/slidePanel'
import type { TextContentHighlightScope } from '@/types/textContentHighlight'

const props = withDefaults(
  defineProps<SlidePanelProps & { cardStyle: CSSProperties; isTextContentEditingActive?: boolean; textContentHighlightScope?: TextContentHighlightScope }>(),
  {
    isTextContentEditingActive: false,
    textContentHighlightScope: 'content'
  }
)
const showDebugContainers = FEATURE_FLAGS.enableDebugContainers
const isEyebrowHighlightActive = computed(
  () => props.isTextContentEditingActive && props.textContentHighlightScope === 'eyebrow'
)
const isTitleHighlightActive = computed(
  () => props.isTextContentEditingActive && props.textContentHighlightScope === 'title'
)
const isDescriptionHighlightActive = computed(
  () => props.isTextContentEditingActive && props.textContentHighlightScope === 'description'
)

const {
  titleHtml,
  eyebrowHtml,
  descriptionHtml,
  contentStyle,
  eyebrowStyle,
  logoStyle,
  logoTintEnabledResolved,
  logoTintStyle,
  titleStyle,
  descriptionStyle,
  overlayVisible,
  panelStyle,
  overlayStyle
} = useSlidePanelPresentation(props)
</script>
