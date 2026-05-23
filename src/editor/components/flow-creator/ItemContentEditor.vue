<template>
  <div class="item-content-editor">
    <CollapsibleSection
      title="Text Content"
      :panel-id="`${idPrefix}-text-content-panel-body`"
      :open="isTextContentOpen"
      body-class="text-style-panel__body text-content-panel__body"
      @toggle="isTextContentOpen = !isTextContentOpen"
    >
      <label v-if="showTemplateSelector">
        Template
        <select v-model="localValue.templateType" @change="emitUpdate">
          <option value="scroll">Scroll</option>
          <option value="stack-cards">Stack Cards</option>
        </select>
      </label>

      <ItemContentTextEditor
        :model-value="localValue"
        :default-text-size="defaultTextSize"
        :labels="textContentLabels"
        @update:model-value="onItemContentUpdate"
        @text-content-editing-change="onTextContentEditingChange"
      />
    </CollapsibleSection>

    <CollapsibleSection
      v-if="enableCtas"
      title="CTAs"
      :panel-id="`${idPrefix}-ctas-panel-body`"
      :open="isCtasOpen"
      body-class="text-style-panel__body text-content-panel__body"
      @toggle="isCtasOpen = !isCtasOpen"
    >
      <label>
        CTA Text
        <input v-model="localValue.ctaText" type="text" placeholder="Start Creating" @input="emitUpdate" />
      </label>
      <label>
        CTA Link
        <input v-model="localValue.ctaLink" type="text" placeholder="https://example.com" @input="emitUpdate" />
      </label>
    </CollapsibleSection>

    <CollapsibleSection title="Text Style" :panel-id="`${idPrefix}-text-style-panel-body`" :open="isTextStyleOpen" @toggle="isTextStyleOpen = !isTextStyleOpen">
      <div ref="textStyleGridRef" class="text-style-panel__interactive-zone" @mouseleave="onTextStyleGridLeave" @focusout="onTextStyleGridFocusOut">
      <div class="text-style-panel__grid">
        <p class="text-style-panel__group-title text-style-panel__field--wide">Typography & spacing</p>
        <label class="text-style-panel__field">
          <span>Eyebrow spacing</span>
          <div class="text-style-panel__range">
            <input v-model.number="localValue.eyebrowLetterSpacing" type="range" :min="textStyleRanges.eyebrowLetterSpacing.min" :max="textStyleRanges.eyebrowLetterSpacing.max" :step="textStyleRanges.eyebrowLetterSpacing.step" @input="onTextStyleSliderInput('eyebrow')" @pointerenter="activateTextStyleHighlight('eyebrow')" @focus="activateTextStyleHighlight('eyebrow')" />
            <span>{{ formatNumber(localValue.eyebrowLetterSpacing, 2) }}em</span>
          </div>
        </label>
        <label class="text-style-panel__field text-style-panel__field--wide">
          <span>Text gap</span>
          <div class="text-style-panel__range">
            <input :value="textGapValue" type="range" :min="textStyleRanges.textGap.min" :max="textStyleRanges.textGap.max" :step="textStyleRanges.textGap.step" @input="onTextGapInput" @pointerenter="activateTextStyleHighlight('content')" @focus="activateTextStyleHighlight('content')" />
            <span>{{ formatNumber(textGapValue, 0) }}px</span>
          </div>
        </label>
        <label class="text-style-panel__field">
          <span>Title line</span>
          <div class="text-style-panel__range">
            <input v-model.number="localValue.titleLineHeight" type="range" :min="textStyleRanges.titleLineHeight.min" :max="textStyleRanges.titleLineHeight.max" :step="textStyleRanges.titleLineHeight.step" @input="onTextStyleSliderInput('title')" @pointerenter="activateTextStyleHighlight('title')" @focus="activateTextStyleHighlight('title')" />
            <span>{{ formatNumber(localValue.titleLineHeight, 2) }}</span>
          </div>
        </label>
        <label class="text-style-panel__field">
          <span>Subtitle line</span>
          <div class="text-style-panel__range">
            <input v-model.number="localValue.descriptionLineHeight" type="range" :min="textStyleRanges.descriptionLineHeight.min" :max="textStyleRanges.descriptionLineHeight.max" :step="textStyleRanges.descriptionLineHeight.step" @input="onTextStyleSliderInput('description')" @pointerenter="activateTextStyleHighlight('description')" @focus="activateTextStyleHighlight('description')" />
            <span>{{ formatNumber(localValue.descriptionLineHeight, 2) }}</span>
          </div>
        </label>

        <p class="text-style-panel__group-title text-style-panel__field--wide">Widths</p>
        <label class="text-style-panel__field">
          <span>Content width</span>
          <div class="text-style-panel__range">
            <input v-model.number="localValue.contentMaxWidth" type="range" :min="textStyleRanges.contentMaxWidth.min" :max="textStyleRanges.contentMaxWidth.max" :step="textStyleRanges.contentMaxWidth.step" @input="onTextStyleSliderInput('content')" @pointerenter="activateTextStyleHighlight('content')" @focus="activateTextStyleHighlight('content')" />
            <span>{{ formatNumber(localValue.contentMaxWidth, 0) }}px</span>
          </div>
        </label>
        <label class="text-style-panel__field">
          <span>Title width</span>
          <div class="text-style-panel__range">
            <input v-model.number="localValue.titleMaxWidth" type="range" :min="textStyleRanges.titleMaxWidth.min" :max="textStyleRanges.titleMaxWidth.max" :step="textStyleRanges.titleMaxWidth.step" @input="onTextStyleSliderInput('title')" @pointerenter="activateTextStyleHighlight('title')" @focus="activateTextStyleHighlight('title')" />
            <span>{{ formatNumber(localValue.titleMaxWidth, 0) }}px</span>
          </div>
        </label>
        <label class="text-style-panel__field">
          <span>Subtitle width</span>
          <div class="text-style-panel__range">
            <input v-model.number="localValue.descriptionMaxWidth" type="range" :min="textStyleRanges.descriptionMaxWidth.min" :max="textStyleRanges.descriptionMaxWidth.max" :step="textStyleRanges.descriptionMaxWidth.step" @input="onTextStyleSliderInput('description')" @pointerenter="activateTextStyleHighlight('description')" @focus="activateTextStyleHighlight('description')" />
            <span>{{ formatNumber(localValue.descriptionMaxWidth, 0) }}px</span>
          </div>
        </label>
      </div>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Fill" :panel-id="`${idPrefix}-fill-panel-body`" :open="isFillOpen" body-class="text-style-panel__body gradient-editor" @toggle="isFillOpen = !isFillOpen">
      <label>
        Slide Color
        <div class="logo-row__tint">
          <input :value="localValue.panelColor || DEFAULT_SLIDE_COLOR" type="color" @input="onPanelColorInput" />
          <input :value="localValue.panelColor" type="text" :placeholder="DEFAULT_SLIDE_COLOR" @input="onPanelColorInput" />
        </div>
      </label>
      <label>
        Type
        <select v-model="gradientType" @change="applyGradient">
          <option value="linear">Linear</option>
          <option value="radial">Radial</option>
          <option value="conic">Conic</option>
        </select>
      </label>
      <label>
        Orientation
        <select v-model="gradientOrientation" @change="applyGradient">
          <option v-for="option in orientationOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <div class="gradient-editor__colors">
        <label v-for="(_color, index) in gradientColors" :key="`gradient-color-${index}`">
          Color {{ index + 1 }}
          <div class="logo-row__tint">
            <input v-model="gradientColors[index]" type="color" @input="applyGradient" />
            <input v-model="gradientColors[index]" type="text" @input="applyGradient" />
          </div>
        </label>
      </div>
      <div class="gradient-editor__preview" :style="{ background: localValue.backgroundGradient || localValue.panelColor || DEFAULT_SLIDE_COLOR }" />
      <div class="gradient-editor__actions">
        <button type="button" class="ui-btn" @click="applyGradient">Apply gradient</button>
        <button type="button" class="ui-btn" @click="clearGradient">Clear gradient</button>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Logo" :panel-id="`${idPrefix}-logo-panel-body`" :open="isLogoOpen" body-class="text-style-panel__body logo-row" @toggle="isLogoOpen = !isLogoOpen">
      <input v-model="localValue.logo" type="text" :placeholder="DROP_LOGO_EMPTY_TEXT" @input="emitUpdate" />
      <input ref="logoFileInputRef" type="file" accept="image/*" class="image-dropzone__input" @change="onLogoFileChange" />
      <div class="logo-row__actions">
        <button type="button" class="ui-btn" @click="openLogoFilePicker">Choose Logo</button>
        <button v-if="localValue.logo" type="button" class="ui-btn" @click="clearLogo">Remove</button>
      </div>
      <label>
        Logo Size
        <TextSizeSelector :model-value="localValue.logoSize ?? defaultTextSize" @update:model-value="(value) => { localValue.logoSize = value; emitUpdate() }" />
      </label>
      <label class="block-settings__toggle">
        <div class="block-settings__toggle-row">
          <input v-model="localValue.logoTintEnabled" type="checkbox" class="block-settings__toggle-input" :disabled="!localValue.logo" @change="emitUpdate" />
          <span class="block-settings__toggle-switch" aria-hidden="true" />
          <span class="block-settings__toggle-text">Tint logo</span>
        </div>
      </label>
      <div class="logo-row__tint">
        <input v-model="localValue.logoTintColor" type="color" :disabled="!localValue.logo || !localValue.logoTintEnabled" @input="emitUpdate" />
        <input v-model="localValue.logoTintColor" type="text" :disabled="!localValue.logo || !localValue.logoTintEnabled" :placeholder="DEFAULT_LOGO_TINT_COLOR" @input="emitUpdate" />
      </div>
      <small>{{ localValue.logo ? DROP_LOGO_LOADED_TEXT : 'No logo (default)' }}</small>
    </CollapsibleSection>

    <CollapsibleSection title="Image" :panel-id="`${idPrefix}-image-panel-body`" :open="isImageOpen" body-class="text-style-panel__body image-editor" @toggle="isImageOpen = !isImageOpen">
      <label>
        Panel Image
        <p v-if="!canUploadImages" class="upgrade-hint">Login with Google to upload persistent images.</p>
        <input v-model="localValue.image" type="text" placeholder="https://..." @input="emitUpdate" />
        <input ref="fileInputRef" type="file" accept="image/*" class="image-dropzone__input" :disabled="!canUploadImages" @change="onFileChange" />
        <div class="image-dropzone__actions">
          <button type="button" class="ui-btn" :disabled="!canUploadImages" @click="openFilePicker">Choose Image</button>
          <button type="button" class="ui-btn" :disabled="!canUploadImages" @click="setRandomImage">Random Image</button>
          <button v-if="localValue.image" type="button" class="ui-btn" :disabled="!canUploadImages" @click="clearImage">Remove</button>
        </div>
      </label>
      <label>
        Image Overlay
        <div class="overlay-controls">
          <label class="block-settings__toggle">
            <div class="block-settings__toggle-row">
              <input v-model="localValue.overlayEnabled" type="checkbox" class="block-settings__toggle-input" :disabled="!localValue.image" @change="emitUpdate" />
              <span class="block-settings__toggle-switch" aria-hidden="true" />
              <span class="block-settings__toggle-text">
                {{ localValue.image ? 'Show overlay' : 'Add image to enable' }}
              </span>
            </div>
          </label>
          <div class="overlay-intensity">
            <input
              v-model.number="localValue.overlayIntensity"
              type="range"
              :min="PANEL_OVERLAY_OPACITY_LIMITS.min"
              :max="PANEL_OVERLAY_OPACITY_LIMITS.max"
              :step="PANEL_OVERLAY_OPACITY_LIMITS.step"
              :disabled="!localValue.image || !localValue.overlayEnabled"
              @input="emitUpdate"
            />
            <span>{{ Math.max(PANEL_OVERLAY_OPACITY_LIMITS.min, Math.min(PANEL_OVERLAY_OPACITY_LIMITS.max, Number(localValue.overlayIntensity ?? DEFAULT_OVERLAY_INTENSITY))) }}%</span>
          </div>
        </div>
      </label>
    </CollapsibleSection>

    <template v-if="enableStackCards && localValue.templateType === 'stack-cards' && localValue.stackCards">
      <CollapsibleSection
        :title="'Stack Cards'"
        :panel-id="`${idPrefix}-stack-cards-root-panel-body`"
        :open="isStackCardsRootOpen"
        body-class="text-style-panel__body text-content-panel__body stack-cards-group"
        @toggle="isStackCardsRootOpen = !isStackCardsRootOpen"
      >
      <CollapsibleSection :title="'Settings'" :panel-id="`${idPrefix}-stack-cards-settings-panel-body`" :open="isStackCardsSettingsOpen" body-class="text-style-panel__body text-content-panel__body" @toggle="isStackCardsSettingsOpen = !isStackCardsSettingsOpen">
        <label>
          Variant
          <select v-model="localValue.stackCards.variant" @change="emitUpdate">
            <option value="perspective">Perspective</option>
            <option value="horizontal">Horizontal Reel</option>
          </select>
        </label>
        <label>
          Text Side
          <select v-model="localValue.stackCards.textSide" @change="emitUpdate">
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </label>
        <label>
          Stack Direction
          <select v-model="localValue.stackCards.stackDirection" @change="emitUpdate">
            <option value="right">Right</option>
            <option value="left">Left</option>
          </select>
        </label>
        <label>
          Layout side padding
          <div class="text-style-panel__range">
            <input
              v-model.number="localValue.stackCards.layoutSidePadding"
              type="range"
              :min="STACK_CARDS_LAYOUT_SIDE_PADDING_LIMITS.min"
              :max="STACK_CARDS_LAYOUT_SIDE_PADDING_LIMITS.max"
              :step="STACK_CARDS_LAYOUT_SIDE_PADDING_LIMITS.step"
              @input="emitUpdate"
            />
            <span>{{ formatNumber(Number(localValue.stackCards.layoutSidePadding), 0) }}px</span>
          </div>
        </label>
        <label>
          Text offset X
          <div class="text-style-panel__range">
            <input
              v-model.number="localValue.stackCards.textOffsetX"
              type="range"
              :min="STACK_CARDS_LAYOUT_OFFSET_LIMITS.min"
              :max="STACK_CARDS_LAYOUT_OFFSET_LIMITS.max"
              :step="STACK_CARDS_LAYOUT_OFFSET_LIMITS.step"
              @input="emitUpdate"
            />
            <span>{{ formatNumber(Number(localValue.stackCards.textOffsetX), 0) }}px</span>
          </div>
        </label>
        <label>
          Text offset Y
          <div class="text-style-panel__range">
            <input
              v-model.number="localValue.stackCards.textOffsetY"
              type="range"
              :min="STACK_CARDS_LAYOUT_OFFSET_LIMITS.min"
              :max="STACK_CARDS_LAYOUT_OFFSET_LIMITS.max"
              :step="STACK_CARDS_LAYOUT_OFFSET_LIMITS.step"
              @input="emitUpdate"
            />
            <span>{{ formatNumber(Number(localValue.stackCards.textOffsetY), 0) }}px</span>
          </div>
        </label>
        <label>
          Cards offset X
          <div class="text-style-panel__range">
            <input
              v-model.number="localValue.stackCards.cardsOffsetX"
              type="range"
              :min="STACK_CARDS_LAYOUT_OFFSET_LIMITS.min"
              :max="STACK_CARDS_LAYOUT_OFFSET_LIMITS.max"
              :step="STACK_CARDS_LAYOUT_OFFSET_LIMITS.step"
              @input="emitUpdate"
            />
            <span>{{ formatNumber(Number(localValue.stackCards.cardsOffsetX), 0) }}px</span>
          </div>
        </label>
        <label>
          Cards offset Y
          <div class="text-style-panel__range">
            <input
              v-model.number="localValue.stackCards.cardsOffsetY"
              type="range"
              :min="STACK_CARDS_LAYOUT_OFFSET_LIMITS.min"
              :max="STACK_CARDS_LAYOUT_OFFSET_LIMITS.max"
              :step="STACK_CARDS_LAYOUT_OFFSET_LIMITS.step"
              @input="emitUpdate"
            />
            <span>{{ formatNumber(Number(localValue.stackCards.cardsOffsetY), 0) }}px</span>
          </div>
        </label>
        <label class="block-settings__toggle">
          <div class="block-settings__toggle-row">
            <input v-model="localValue.stackCards.cardsOnly" type="checkbox" class="block-settings__toggle-input" @change="emitUpdate" />
            <span class="block-settings__toggle-switch" aria-hidden="true" />
            <span class="block-settings__toggle-text">Cards only (hide slide text)</span>
          </div>
        </label>
        <label class="block-settings__toggle">
          <div class="block-settings__toggle-row">
            <input
              v-model="stackCardsOverlayEnabled"
              type="checkbox"
              class="block-settings__toggle-input"
              :disabled="!hasStackCardsImages"
            />
            <span class="block-settings__toggle-switch" aria-hidden="true" />
            <span class="block-settings__toggle-text">
              {{ hasStackCardsImages ? 'Show card overlay' : 'Add image to enable' }}
            </span>
          </div>
        </label>
        <label class="block-settings__toggle">
          <div class="block-settings__toggle-row">
            <input v-model="localValue.stackCards.fitCardToImage" type="checkbox" class="block-settings__toggle-input" @change="emitUpdate" />
            <span class="block-settings__toggle-switch" aria-hidden="true" />
            <span class="block-settings__toggle-text">Fit card to image ratio</span>
          </div>
        </label>
        <label class="block-settings__toggle">
          <div class="block-settings__toggle-row">
            <input v-model="localValue.stackCards.autoPlayEnabled" type="checkbox" class="block-settings__toggle-input" @change="emitUpdate" />
            <span class="block-settings__toggle-switch" aria-hidden="true" />
            <span class="block-settings__toggle-text">Autoplay cards</span>
          </div>
        </label>
        <label>
          Autoplay speed (s)
          <div class="text-style-panel__range">
            <input v-model.number="localValue.stackCards.autoPlaySpeed" type="range" :min="STACK_CARDS_AUTOPLAY_LIMITS.min" :max="STACK_CARDS_AUTOPLAY_LIMITS.max" :step="STACK_CARDS_AUTOPLAY_LIMITS.step" :disabled="!localValue.stackCards.autoPlayEnabled" @input="emitUpdate" />
            <span>{{ formatNumber(Number(localValue.stackCards.autoPlaySpeed), 2) }}</span>
          </div>
        </label>
        <label>
          Mobile text-cards gap
          <div class="text-style-panel__range">
            <input v-model.number="localValue.stackCards.mobileTextCardsGap" type="range" :min="STACK_CARDS_MOBILE_TEXT_CARDS_GAP_LIMITS.min" :max="STACK_CARDS_MOBILE_TEXT_CARDS_GAP_LIMITS.max" :step="STACK_CARDS_MOBILE_TEXT_CARDS_GAP_LIMITS.step" @input="emitUpdate" />
            <span>{{ formatNumber(Number(localValue.stackCards.mobileTextCardsGap), 0) }}px</span>
          </div>
        </label>
        <label>
          Mobile touch sensitivity
          <div class="text-style-panel__range">
            <input v-model.number="localValue.stackCards.mobileTouchSensitivity" type="range" :min="STACK_CARDS_MOBILE_TOUCH_SENSITIVITY_LIMITS.min" :max="STACK_CARDS_MOBILE_TOUCH_SENSITIVITY_LIMITS.max" :step="STACK_CARDS_MOBILE_TOUCH_SENSITIVITY_LIMITS.step" @input="emitUpdate" />
            <span>{{ formatNumber(Number(localValue.stackCards.mobileTouchSensitivity), 2) }}</span>
          </div>
        </label>
        <label class="block-settings__toggle">
          <div class="block-settings__toggle-row">
            <input v-model="localValue.stackCards.mobileTouchHorizontalEnabled" type="checkbox" class="block-settings__toggle-input" @change="emitUpdate" />
            <span class="block-settings__toggle-switch" aria-hidden="true" />
            <span class="block-settings__toggle-text">Mobile touch horizontal</span>
          </div>
        </label>
        <label class="block-settings__toggle">
          <div class="block-settings__toggle-row">
            <input v-model="localValue.stackCards.mobileTouchVerticalEnabled" type="checkbox" class="block-settings__toggle-input" @change="emitUpdate" />
            <span class="block-settings__toggle-switch" aria-hidden="true" />
            <span class="block-settings__toggle-text">Mobile touch vertical</span>
          </div>
        </label>
        <label v-for="control in stackCardControls" :key="control.key">
          {{ control.label }}
          <div class="text-style-panel__range">
            <input v-model.number="localValue.stackCards[control.key]" type="range" :min="control.min" :max="control.max" :step="control.step" @input="emitUpdate" />
            <span>{{ formatNumber(Number(localValue.stackCards[control.key]), 2) }}</span>
          </div>
        </label>
      </CollapsibleSection>

      <CollapsibleSection :title="'Items'" :panel-id="`${idPrefix}-stack-cards-items-panel-body`" :open="isStackCardsItemsOpen" body-class="text-style-panel__body text-content-panel__body stack-cards-items-group" @toggle="isStackCardsItemsOpen = !isStackCardsItemsOpen">
        <CollapsibleSection
          v-for="(card, cardIndex) in localValue.stackCards.cards"
          :key="`item-stack-card-${card.id || cardIndex}`"
          :title="`Card ${cardIndex + 1}`"
          :panel-id="`${idPrefix}-stack-card-${cardIndex}`"
          :open="isStackCardItemOpen(cardIndex)"
          body-class="text-style-panel__body text-content-panel__body"
          @toggle="toggleStackCardItem(cardIndex)"
        >
          <ItemContentEditor
            :model-value="card"
            :default-text-size="defaultTextSize"
            :enable-ctas="false"
            :can-upload-images="canUploadImages"
            :show-template-selector="false"
            :enable-stack-cards="false"
            :id-prefix="`${idPrefix}-stack-card-content-${cardIndex}`"
            :text-content-editing-target-id="card.id ?? null"
            :text-content-labels="{
              title: `Card ${cardIndex + 1} title`,
              eyebrow: `Card ${cardIndex + 1} eyebrow`,
              description: `Card ${cardIndex + 1} description`,
              align: `Card ${cardIndex + 1} text align`,
              contentWidth: 'Card content width'
            }"
            @update:model-value="(value) => onStackCardUpdate(cardIndex, value)"
            @text-content-editing-change="onNestedTextContentEditingChange"
          />
          <button type="button" class="ui-btn ui-btn--danger" :disabled="localValue.stackCards.cards.length <= 1" @click="removeStackCard(cardIndex)">Remove card</button>
        </CollapsibleSection>
        <button type="button" class="ui-btn" @click="addStackCard">Add card</button>
      </CollapsibleSection>
      </CollapsibleSection>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ContentWidthMode, type ItemContent, type StackCardItem, type TextSize } from '@/types/navigation'
import type { TextContentEditingChangePayload, TextContentHighlightScope } from '@/types/textContentHighlight'
import {
  DEFAULT_LOGO_TINT_COLOR,
  DEFAULT_SLIDE_COLOR,
  DROP_LOGO_EMPTY_TEXT,
  DROP_LOGO_LOADED_TEXT,
  textStyleRanges
} from '../../composables/useSlidePropertiesForm'
import { useGradientEditor } from '../../composables/useGradientEditor'
import { DEFAULT_OVERLAY_INTENSITY, PANEL_OVERLAY_OPACITY_LIMITS } from '@/constants/slideStyle'
import {
  STACK_CARDS_AUTOPLAY_LIMITS,
  STACK_CARDS_CONTROLS,
  STACK_CARDS_LAYOUT_OFFSET_LIMITS,
  STACK_CARDS_LAYOUT_SIDE_PADDING_LIMITS,
  STACK_CARDS_MOBILE_TEXT_CARDS_GAP_LIMITS,
  STACK_CARDS_MOBILE_TOUCH_SENSITIVITY_LIMITS
} from '@/constants/stackCards'
import CollapsibleSection from '../atoms/CollapsibleSection.vue'
import ItemContentTextEditor from './ItemContentTextEditor.vue'
import TextSizeSelector from '../atoms/TextSizeSelector.vue'

defineOptions({ name: 'ItemContentEditor' })

const props = withDefaults(defineProps<{
  modelValue: ItemContent & {
    templateType?: string
    stackCards?: {
      variant?: 'perspective' | 'horizontal'
      textSide?: 'left' | 'right'
      stackDirection?: 'left' | 'right'
      cardsOnly?: boolean
      fitCardToImage?: boolean
      layoutSidePadding?: number
      textOffsetX?: number
      textOffsetY?: number
      cardsOffsetX?: number
      cardsOffsetY?: number
      mobileTextCardsGap?: number
      angleY?: number
      angleX?: number
      cardGap?: number
      frontFadeWindow?: number
      cardSize?: number
      cardWidth?: number
      cardSurfaceOpacity?: number
      wheelSensitivity?: number
      mobileTouchSensitivity?: number
      mobileTouchHorizontalEnabled?: boolean
      mobileTouchVerticalEnabled?: boolean
      autoPlayEnabled?: boolean
      autoPlaySpeed?: number
      cards: StackCardItem[]
    }
  }
  defaultTextSize: TextSize
  enableCtas?: boolean
  canUploadImages?: boolean
  showTemplateSelector?: boolean
  enableStackCards?: boolean
  idPrefix?: string
  textContentLabels?: {
    title: string
    eyebrow: string
    description: string
    align: string
    contentWidth: string
  }
  textContentEditingTargetId?: string | null
}>(), {
  enableCtas: true,
  canUploadImages: true,
  showTemplateSelector: false,
  enableStackCards: false,
  idPrefix: 'item-content-editor',
  textContentLabels: () => ({
    title: 'Name',
    eyebrow: 'Eyebrow',
    description: 'Description',
    align: 'Text Align',
    contentWidth: 'Content Width'
  }),
  textContentEditingTargetId: null
})

const idPrefix = computed(() => props.idPrefix)

const emit = defineEmits<{
  'update:modelValue': [value: ItemContent & Record<string, unknown>]
  'text-content-editing-change': [payload: TextContentEditingChangePayload]
}>()
const fileInputRef = ref<HTMLInputElement | null>(null)
const logoFileInputRef = ref<HTMLInputElement | null>(null)
const textStyleGridRef = ref<HTMLElement | null>(null)
const activeTextStyleScope = ref<TextContentHighlightScope>('content')

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value as ItemContent & Record<string, unknown>)
})

const isTextContentOpen = ref(true)
const isCtasOpen = ref(false)
const isTextStyleOpen = ref(false)
const isFillOpen = ref(false)
const isLogoOpen = ref(false)
const isImageOpen = ref(false)
const isStackCardsRootOpen = ref(true)
const isStackCardsSettingsOpen = ref(false)
const isStackCardsItemsOpen = ref(true)
const stackCardOpenMap = ref<Record<number, boolean>>({ 0: true })

const stackCardControls = STACK_CARDS_CONTROLS

const { gradientType, gradientOrientation, gradientColors, orientationOptions, buildGradient, syncFromGradient } =
  useGradientEditor(localValue.value.backgroundGradient)

const normalizeImageValue = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const stackCardsWithImage = computed(() => {
  const cards = localValue.value.stackCards?.cards ?? []
  return cards.filter((card) => normalizeImageValue(card.image).length > 0)
})

const hasStackCardsImages = computed(() => stackCardsWithImage.value.length > 0)

const stackCardsOverlayEnabled = computed({
  get: () => {
    const cards = stackCardsWithImage.value
    if (cards.length === 0) return false
    return cards.every((card) => card.overlayEnabled !== false)
  },
  set: (value: boolean) => {
    if (!localValue.value.stackCards) return
    localValue.value.stackCards.cards = localValue.value.stackCards.cards.map((card) => ({
      ...card,
      overlayEnabled: normalizeImageValue(card.image).length > 0 ? value : false
    }))
    emitUpdate()
  }
})

watch(
  () => localValue.value.backgroundGradient,
  (gradient) => syncFromGradient(gradient)
)

const emitUpdate = () => emit('update:modelValue', { ...localValue.value } as ItemContent & Record<string, unknown>)
const formatNumber = (value: number | undefined, digits: number) => Number(value ?? 0).toFixed(digits)

const onItemContentUpdate = (value: ItemContent) => {
  Object.assign(localValue.value, value)
  emitUpdate()
}

const emitTextContentEditingChange = (active: boolean, scope: TextContentHighlightScope = 'content') => {
  activeTextStyleScope.value = scope
  emit('text-content-editing-change', {
    targetId: props.textContentEditingTargetId,
    active,
    scope
  })
}

const onTextContentEditingChange = (active: boolean) => {
  emitTextContentEditingChange(active, 'content')
}

const onNestedTextContentEditingChange = (payload: TextContentEditingChangePayload) => {
  emit('text-content-editing-change', payload)
}

const textGapValue = computed(() => Number(localValue.value.eyebrowTitleGap ?? localValue.value.titleDescriptionGap ?? 24))
const onTextGapInput = (event: Event) => {
  activateTextStyleHighlight('content')
  const value = Number((event.target as HTMLInputElement).value)
  localValue.value.eyebrowTitleGap = value
  localValue.value.titleDescriptionGap = value
  emitUpdate()
}

const onTextStyleSliderInput = (scope: TextContentHighlightScope) => {
  activateTextStyleHighlight(scope)
  emitUpdate()
}

const activateTextStyleHighlight = (scope: TextContentHighlightScope) => {
  emitTextContentEditingChange(true, scope)
}

const deactivateTextStyleHighlight = () => {
  emitTextContentEditingChange(false, activeTextStyleScope.value)
}

const onTextStyleGridLeave = () => {
  if (textStyleGridRef.value?.contains(document.activeElement)) return
  deactivateTextStyleHighlight()
}

const onTextStyleGridFocusOut = () => {
  requestAnimationFrame(() => {
    if (textStyleGridRef.value?.contains(document.activeElement)) return
    deactivateTextStyleHighlight()
  })
}

const applyGradient = () => {
  localValue.value.backgroundGradient = buildGradient()
  emitUpdate()
}

const onPanelColorInput = (event: Event) => {
  const rawColor = (event.target as HTMLInputElement).value ?? ''
  localValue.value.panelColor = rawColor
  localValue.value.backgroundGradient = undefined
  emitUpdate()
}

const clearGradient = () => {
  localValue.value.backgroundGradient = undefined
  if (!localValue.value.panelColor?.trim()) {
    localValue.value.panelColor = DEFAULT_SLIDE_COLOR
  }
  emitUpdate()
}

const openFilePicker = () => fileInputRef.value?.click()
const openLogoFilePicker = () => logoFileInputRef.value?.click()

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !file.type.startsWith('image/')) {
    target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    localValue.value.image = typeof reader.result === 'string' ? reader.result : ''
    emitUpdate()
  }
  reader.readAsDataURL(file)
  target.value = ''
}

const clearImage = () => {
  localValue.value.image = ''
  emitUpdate()
}

const onLogoFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !file.type.startsWith('image/')) {
    target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    localValue.value.logo = typeof reader.result === 'string' ? reader.result : ''
    localValue.value.logoTintEnabled = false
    emitUpdate()
  }
  reader.readAsDataURL(file)
  target.value = ''
}

const clearLogo = () => {
  localValue.value.logo = ''
  emitUpdate()
}

const setRandomImage = () => {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  localValue.value.image = `https://picsum.photos/2400/1350?random=${seed}`
  emitUpdate()
}

const isStackCardItemOpen = (index: number) => stackCardOpenMap.value[index] ?? false
const toggleStackCardItem = (index: number) => {
  stackCardOpenMap.value[index] = !isStackCardItemOpen(index)
}

const onStackCardUpdate = (index: number, value: ItemContent) => {
  if (!localValue.value.stackCards) return
  localValue.value.stackCards.cards[index] = {
    ...localValue.value.stackCards.cards[index],
    ...value
  }
  emitUpdate()
}

const addStackCard = () => {
  if (!localValue.value.stackCards) return
  const nextIndex = localValue.value.stackCards.cards.length
  localValue.value.stackCards.cards.push({
    id: `stack-card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    eyebrow: `STEP ${String(nextIndex + 1).padStart(2, '0')}`,
    title: `Card ${nextIndex + 1}`,
    description: '',
    useMarkdown: false,
    contentAlign: undefined,
    contentWidthMode: ContentWidthMode.Contained,
    panelColor: '#0f172a',
    overlayEnabled: false
  })
  stackCardOpenMap.value[nextIndex] = true
  emitUpdate()
}

const removeStackCard = (index: number) => {
  if (!localValue.value.stackCards || localValue.value.stackCards.cards.length <= 1) return
  localValue.value.stackCards.cards.splice(index, 1)
  emitUpdate()
}
</script>
