<template>
  <article class="story-card" :style="[cardStyle, panelStyle]">
    <img v-if="image" class="card-image card-image--bg" :src="image" alt="" />
    <div v-if="overlayVisible" class="panel__overlay" :style="overlayStyle" />
    <div class="story-card__content" :style="contentStyle">
      <div
        v-if="logo && logoTintEnabledResolved"
        class="slide-logo slide-logo--tint"
        :style="logoTintStyle"
      />
      <img
        v-else-if="logo"
        class="slide-logo"
        :src="logo"
        alt=""
        :style="logoStyle"
      />
      <p class="step" :style="eyebrowStyle">
        <span v-if="useMarkdown" v-html="eyebrowHtml" />
        <template v-else>{{ eyebrow }}</template>
      </p>
      <h3 :style="titleStyle">
        <span v-if="useMarkdown" v-html="titleHtml" />
        <template v-else>{{ title }}</template>
      </h3>
      <p v-if="description" class="story-card__description" :style="descriptionStyle">
        <span v-if="useMarkdown" v-html="descriptionHtml" />
        <template v-else>{{ description }}</template>
      </p>
      <img v-if="image && !overlayVisible" :src="image" alt="" class="card-image" />
    </div>
  </article>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { useSlidePanelPresentation } from '@/composables/useSlidePanelPresentation'
import type { SlidePanelProps } from '@/types/slidePanel'

const props = defineProps<SlidePanelProps & { cardStyle: CSSProperties }>()

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
