<template>
  <StackCardsPanel
    v-if="templateType === 'stack-cards' && stackCards"
    v-bind="props"
  />
  <section v-else class="panel panel--hero" :class="panelClass" :style="panelStyle" :data-animate="animateKey">
    <img v-if="image" class="panel__image" :src="image" alt="" />
    <div v-if="overlayVisible" class="panel__overlay" :style="overlayStyle" />
    <article
      class="content"
      :class="[
        `content--align-${contentAlignResolved}`,
        `content--width-${contentWidthModeResolved}`,
        { 'content--on-image': hasVisualBackground }
      ]"
      :style="contentStyle"
    >
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
      <p class="eyebrow" :style="eyebrowStyle">
        <span v-if="useMarkdown" v-html="eyebrowHtml" />
        <template v-else>{{ eyebrow }}</template>
        <span v-if="showDirectionIcon">{{ getDirectionIcon(direction) }}</span>
      </p>
      <h1 :style="titleStyle">
        <span v-if="useMarkdown" v-html="titleHtml" />
        <template v-else>{{ title }}</template>
      </h1>
      <p
        v-if="description"
        class="section-description"
        :style="descriptionStyle"
      >
        <span v-if="useMarkdown" v-html="descriptionHtml" />
        <template v-else>{{ description }}</template>
      </p>
      <a
        v-if="enableCtasResolved && ctaTextResolved && ctaHrefResolved"
        class="slide-cta"
        :href="ctaHrefResolved"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ ctaTextResolved }}
      </a>
      <a
        v-else-if="enableCtasResolved && ctaTextResolved"
        class="slide-cta"
        href="#"
        role="button"
        @click.prevent
      >
        {{ ctaTextResolved }}
      </a>
      <a
        v-else-if="enableCtasResolved && !hasCtaTextField && ctaHref && ctaLabel"
        class="slide-cta"
        :href="ctaHref"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ ctaLabel }}
      </a>
    </article>
  </section>
</template>

<script setup lang="ts">
import { getDirectionIcon } from './useDirectionIcon'
import StackCardsPanel from './StackCardsPanel.vue'
import { useSlidePanelPresentation } from '@/composables/useSlidePanelPresentation'
import type { SlidePanelProps } from '@/types/slidePanel'

const props = defineProps<SlidePanelProps>()

const {
  titleHtml,
  eyebrowHtml,
  descriptionHtml,
  enableCtasResolved,
  hasCtaTextField,
  ctaTextResolved,
  ctaHrefResolved,
  ctaLabel,
  ctaHref,
  contentAlignResolved,
  contentWidthModeResolved,
  contentStyle,
  eyebrowStyle,
  logoStyle,
  logoTintEnabledResolved,
  logoTintStyle,
  titleStyle,
  descriptionStyle,
  overlayVisible,
  hasVisualBackground,
  panelStyle,
  overlayStyle
} = useSlidePanelPresentation(props)
</script>
