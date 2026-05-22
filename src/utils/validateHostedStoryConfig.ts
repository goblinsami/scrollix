import {
  STACK_CARDS_AUTOPLAY_LIMITS,
  STACK_CARDS_CONTROL_LIMITS,
  STACK_CARDS_LAYOUT_OFFSET_LIMITS,
  STACK_CARDS_LAYOUT_SIDE_PADDING_LIMITS
} from '@/constants/stackCards'
import {
  MAX_DESCRIPTION_MAX_WIDTH,
  MAX_OVERLAY_INTENSITY,
  MAX_TITLE_MAX_WIDTH,
  MIN_DESCRIPTION_MAX_WIDTH,
  MIN_OVERLAY_INTENSITY,
  MIN_TITLE_MAX_WIDTH
} from '@/constants/slideStyle'
import { StackCardsVariant } from '@/types/navigation'
import { HOSTED_STORY_TYPE, type HostedStoryConfig, type HostedStoryType } from '@/types/hostedStories'

const VALID_STORY_TYPES: HostedStoryType[] = [HOSTED_STORY_TYPE.StackCards3d]

interface ValidationResult {
  ok: boolean
  errors: string[]
}

const pushNumberRangeError = (
  errors: string[],
  label: string,
  value: unknown,
  min: number,
  max: number
) => {
  if (value === undefined) return
  if (typeof value !== 'number' || Number.isNaN(value)) {
    errors.push(`${label} must be a number.`)
    return
  }
  if (value < min || value > max) {
    errors.push(`${label} is out of range (${min}-${max}).`)
  }
}

export function validateHostedStoryConfig(raw: unknown): ValidationResult {
  const errors: string[] = []

  if (!raw || typeof raw !== 'object') {
    return { ok: false, errors: ['Hosted story payload must be an object.'] }
  }

  const story = raw as Partial<HostedStoryConfig>

  if (!story.type || !VALID_STORY_TYPES.includes(story.type)) {
    errors.push(`type must be one of: ${VALID_STORY_TYPES.join(', ')}.`)
  }

  if (!story.config || typeof story.config !== 'object') {
    return { ok: false, errors: [...errors, 'config must be an object.'] }
  }

  const config = story.config as unknown as Record<string, unknown>
  const cards = config.cards
  if (!Array.isArray(cards) || cards.length === 0) {
    errors.push('config.cards must contain at least one card.')
  } else {
    cards.forEach((card, index) => {
      const label = `config.cards[${index}]`
      if (!card || typeof card !== 'object') {
        errors.push(`${label} must be an object.`)
        return
      }
      const item = card as Record<string, unknown>
      if (typeof item.id !== 'string' || item.id.trim() === '') {
        errors.push(`${label}.id is required.`)
      }
      if (typeof item.title !== 'string' || item.title.trim() === '') {
        errors.push(`${label}.title is required.`)
      }
      if (typeof item.eyebrow !== 'string') {
        errors.push(`${label}.eyebrow must be a string.`)
      }
      if (item.description !== undefined && typeof item.description !== 'string') {
        errors.push(`${label}.description must be a string.`)
      }
      if (item.image !== undefined && typeof item.image !== 'string') {
        errors.push(`${label}.image must be a string URL.`)
      }
      if (item.panelColor !== undefined && typeof item.panelColor !== 'string') {
        errors.push(`${label}.panelColor must be a string.`)
      }
    })
  }

  const settings = config.settings
  if (settings !== undefined) {
    if (!settings || typeof settings !== 'object') {
      errors.push('config.settings must be an object when provided.')
    } else {
      const payload = settings as Record<string, unknown>
      pushNumberRangeError(errors, 'config.settings.angleY', payload.angleY, STACK_CARDS_CONTROL_LIMITS.angleY.min, STACK_CARDS_CONTROL_LIMITS.angleY.max)
      pushNumberRangeError(errors, 'config.settings.angleX', payload.angleX, STACK_CARDS_CONTROL_LIMITS.angleX.min, STACK_CARDS_CONTROL_LIMITS.angleX.max)
      pushNumberRangeError(errors, 'config.settings.cardGap', payload.cardGap, STACK_CARDS_CONTROL_LIMITS.cardGap.min, STACK_CARDS_CONTROL_LIMITS.cardGap.max)
      pushNumberRangeError(
        errors,
        'config.settings.frontFadeWindow',
        payload.frontFadeWindow,
        STACK_CARDS_CONTROL_LIMITS.frontFadeWindow.min,
        STACK_CARDS_CONTROL_LIMITS.frontFadeWindow.max
      )
      pushNumberRangeError(errors, 'config.settings.cardSize', payload.cardSize, STACK_CARDS_CONTROL_LIMITS.cardSize.min, STACK_CARDS_CONTROL_LIMITS.cardSize.max)
      pushNumberRangeError(errors, 'config.settings.cardWidth', payload.cardWidth, STACK_CARDS_CONTROL_LIMITS.cardWidth.min, STACK_CARDS_CONTROL_LIMITS.cardWidth.max)
      pushNumberRangeError(
        errors,
        'config.settings.cardSurfaceOpacity',
        payload.cardSurfaceOpacity,
        STACK_CARDS_CONTROL_LIMITS.cardSurfaceOpacity.min,
        STACK_CARDS_CONTROL_LIMITS.cardSurfaceOpacity.max
      )
      pushNumberRangeError(
        errors,
        'config.settings.autoPlaySpeed',
        payload.autoPlaySpeed,
        STACK_CARDS_AUTOPLAY_LIMITS.min,
        STACK_CARDS_AUTOPLAY_LIMITS.max
      )
      pushNumberRangeError(
        errors,
        'config.settings.titleMaxWidth',
        payload.titleMaxWidth,
        MIN_TITLE_MAX_WIDTH,
        MAX_TITLE_MAX_WIDTH
      )
      pushNumberRangeError(
        errors,
        'config.settings.descriptionMaxWidth',
        payload.descriptionMaxWidth,
        MIN_DESCRIPTION_MAX_WIDTH,
        MAX_DESCRIPTION_MAX_WIDTH
      )
      pushNumberRangeError(
        errors,
        'config.settings.overlayIntensity',
        payload.overlayIntensity,
        MIN_OVERLAY_INTENSITY,
        MAX_OVERLAY_INTENSITY
      )
      pushNumberRangeError(
        errors,
        'config.settings.layoutSidePadding',
        payload.layoutSidePadding,
        STACK_CARDS_LAYOUT_SIDE_PADDING_LIMITS.min,
        STACK_CARDS_LAYOUT_SIDE_PADDING_LIMITS.max
      )
      pushNumberRangeError(
        errors,
        'config.settings.textOffsetX',
        payload.textOffsetX,
        STACK_CARDS_LAYOUT_OFFSET_LIMITS.min,
        STACK_CARDS_LAYOUT_OFFSET_LIMITS.max
      )
      pushNumberRangeError(
        errors,
        'config.settings.textOffsetY',
        payload.textOffsetY,
        STACK_CARDS_LAYOUT_OFFSET_LIMITS.min,
        STACK_CARDS_LAYOUT_OFFSET_LIMITS.max
      )

      if (payload.textSide !== undefined && payload.textSide !== 'left' && payload.textSide !== 'right') {
        errors.push('config.settings.textSide must be "left" or "right".')
      }
      if (
        payload.variant !== undefined &&
        payload.variant !== StackCardsVariant.Perspective &&
        payload.variant !== StackCardsVariant.Horizontal
      ) {
        errors.push(
          `config.settings.variant must be "${StackCardsVariant.Perspective}" or "${StackCardsVariant.Horizontal}".`
        )
      }
      if (payload.contentAlign !== undefined && !['left', 'center', 'right'].includes(String(payload.contentAlign))) {
        errors.push('config.settings.contentAlign must be left, center, or right.')
      }
      if (payload.autoPlayEnabled !== undefined && typeof payload.autoPlayEnabled !== 'boolean') {
        errors.push('config.settings.autoPlayEnabled must be boolean.')
      }
    }
  }

  return { ok: errors.length === 0, errors }
}
