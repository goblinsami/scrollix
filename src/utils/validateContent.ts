import {
  ContentAlignValues,
  ContentWidthModeValues,
  Direction,
  TemplateType,
  TemplateTypeValues,
  TextSizeValues,
  type ContentSchema,
  type Panel
} from '../types/navigation'
import {
  MAX_CONTENT_MAX_WIDTH,
  MAX_CONTENT_SIDE_PADDING,
  MAX_DESCRIPTION_LINE_HEIGHT,
  MAX_DESCRIPTION_MAX_WIDTH,
  MAX_EYEBROW_LETTER_SPACING,
  MAX_EYEBROW_TITLE_GAP,
  MAX_OVERLAY_INTENSITY,
  MAX_TITLE_DESCRIPTION_GAP,
  MAX_TITLE_LINE_HEIGHT,
  MAX_TITLE_MAX_WIDTH,
  MIN_CONTENT_MAX_WIDTH,
  MIN_CONTENT_SIDE_PADDING,
  MIN_DESCRIPTION_LINE_HEIGHT,
  MIN_DESCRIPTION_MAX_WIDTH,
  MIN_EYEBROW_LETTER_SPACING,
  MIN_EYEBROW_TITLE_GAP,
  MIN_OVERLAY_INTENSITY,
  MIN_TITLE_DESCRIPTION_GAP,
  MIN_TITLE_LINE_HEIGHT,
  MIN_TITLE_MAX_WIDTH
} from '../constants/slideStyle'
import { MAX_TRANSITION_SPEED, MIN_TRANSITION_SPEED } from '../constants/transitionSpeed'
import { MAX_AUTOPLAY_SPEED, MIN_AUTOPLAY_SPEED } from '../constants/autoPlaySpeed'
import {
  STACK_CARDS_AUTOPLAY_LIMITS,
  STACK_CARDS_LAYOUT_OFFSET_LIMITS,
  STACK_CARDS_MOBILE_TEXT_CARDS_GAP_LIMITS,
  STACK_CARDS_MOBILE_TOUCH_SENSITIVITY_LIMITS,
  STACK_CARDS_LAYOUT_SIDE_PADDING_LIMITS
} from '../constants/stackCards'

const VALID_DIRECTIONS: Direction[] = [Direction.Up, Direction.Down, Direction.Left, Direction.Right]
const VALID_TEXT_SIZES = [...TextSizeValues]
const VALID_CONTENT_ALIGNS = [...ContentAlignValues]
const VALID_CONTENT_WIDTH_MODES = [...ContentWidthModeValues]
const VALID_TEMPLATE_TYPES = [...TemplateTypeValues]

const OPPOSITE: Record<Direction, Direction> = {
  [Direction.Up]: Direction.Down,
  [Direction.Down]: Direction.Up,
  [Direction.Left]: Direction.Right,
  [Direction.Right]: Direction.Left
}

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

export function validateContentSchema(raw: unknown): ValidationResult {
  const errors: string[] = []

  if (!raw || typeof raw !== 'object') {
    return { ok: false, errors: ['content.json debe ser un objeto valido.'] }
  }

  const content = raw as Partial<ContentSchema>
  if (content.autoSnapEnabled !== undefined && typeof content.autoSnapEnabled !== 'boolean') {
    errors.push('content.json: autoSnapEnabled debe ser boolean.')
  }
  if (content.enableCtas !== undefined && typeof content.enableCtas !== 'boolean') {
    errors.push('content.json: enableCtas debe ser boolean.')
  }
  if (content.loopEnabled !== undefined && typeof content.loopEnabled !== 'boolean') {
    errors.push('content.json: loopEnabled debe ser boolean.')
  }
  if (content.enableLoop !== undefined && typeof content.enableLoop !== 'boolean') {
    errors.push('content.json: enableLoop debe ser boolean.')
  }
  if (content.snapEase !== undefined && typeof content.snapEase !== 'string') {
    errors.push('content.json: snapEase debe ser string.')
  }
  if (content.transitionSpeed !== undefined) {
    if (typeof content.transitionSpeed !== 'number' || Number.isNaN(content.transitionSpeed)) {
      errors.push('content.json: transitionSpeed debe ser number.')
    } else if (content.transitionSpeed < MIN_TRANSITION_SPEED || content.transitionSpeed > MAX_TRANSITION_SPEED) {
      errors.push(`content.json: transitionSpeed fuera de rango (${MIN_TRANSITION_SPEED}-${MAX_TRANSITION_SPEED}).`)
    }
  }
  if (content.autoPlayEnabled !== undefined && typeof content.autoPlayEnabled !== 'boolean') {
    errors.push('content.json: autoPlayEnabled debe ser boolean.')
  }
  if (content.autoPlaySpeed !== undefined) {
    if (typeof content.autoPlaySpeed !== 'number' || Number.isNaN(content.autoPlaySpeed)) {
      errors.push('content.json: autoPlaySpeed debe ser number.')
    } else if (content.autoPlaySpeed < MIN_AUTOPLAY_SPEED || content.autoPlaySpeed > MAX_AUTOPLAY_SPEED) {
      errors.push(`content.json: autoPlaySpeed fuera de rango (${MIN_AUTOPLAY_SPEED}-${MAX_AUTOPLAY_SPEED}).`)
    }
  }

  if (!Array.isArray(content.panels) || content.panels.length === 0) {
    return { ok: false, errors: ['content.json debe incluir panels con al menos un elemento.'] }
  }

  const ids = new Set<string>()

  content.panels.forEach((panel, index) => {
    const label = `Panel ${index + 1}`
    const p = panel as Partial<Panel>

    if (!p || typeof p !== 'object') {
      errors.push(`${label}: valor invalido.`)
      return
    }

    if (typeof p.id !== 'string' || p.id.trim() === '') {
      errors.push(`${label}: id obligatorio.`)
    } else if (ids.has(p.id)) {
      errors.push(`${label}: id duplicado (${p.id}).`)
    } else {
      ids.add(p.id)
    }

    if (typeof p.title !== 'string' || p.title.trim() === '') {
      errors.push(`${label}: title obligatorio.`)
    }
    if (p.templateType !== undefined && !VALID_TEMPLATE_TYPES.includes(p.templateType)) {
      errors.push(`${label}: templateType invalido (${String(p.templateType)}).`)
    }

    if (p.description !== undefined && typeof p.description !== 'string') {
      errors.push(`${label}: description debe ser string.`)
    }

    if (p.useMarkdown !== undefined && typeof p.useMarkdown !== 'boolean') {
      errors.push(`${label}: useMarkdown debe ser boolean.`)
    }

    if (p.titleSize !== undefined && !VALID_TEXT_SIZES.includes(p.titleSize)) {
      errors.push(`${label}: titleSize invalido (${String(p.titleSize)}).`)
    }

    if (p.eyebrowSize !== undefined && !VALID_TEXT_SIZES.includes(p.eyebrowSize)) {
      errors.push(`${label}: eyebrowSize invalido (${String(p.eyebrowSize)}).`)
    }

    if (p.descriptionSize !== undefined && !VALID_TEXT_SIZES.includes(p.descriptionSize)) {
      errors.push(`${label}: descriptionSize invalido (${String(p.descriptionSize)}).`)
    }

    if (p.contentAlign !== undefined && !VALID_CONTENT_ALIGNS.includes(p.contentAlign)) {
      errors.push(`${label}: contentAlign invalido (${String(p.contentAlign)}).`)
    }

    if (p.contentWidthMode !== undefined && !VALID_CONTENT_WIDTH_MODES.includes(p.contentWidthMode)) {
      errors.push(`${label}: contentWidthMode invalido (${String(p.contentWidthMode)}).`)
    }

    if (p.eyebrowTitleGap !== undefined) {
      if (typeof p.eyebrowTitleGap !== 'number' || Number.isNaN(p.eyebrowTitleGap)) {
        errors.push(`${label}: eyebrowTitleGap debe ser number.`)
      } else if (p.eyebrowTitleGap < MIN_EYEBROW_TITLE_GAP || p.eyebrowTitleGap > MAX_EYEBROW_TITLE_GAP) {
        errors.push(`${label}: eyebrowTitleGap fuera de rango (${MIN_EYEBROW_TITLE_GAP}-${MAX_EYEBROW_TITLE_GAP}).`)
      }
    }

    if (p.titleDescriptionGap !== undefined) {
      if (typeof p.titleDescriptionGap !== 'number' || Number.isNaN(p.titleDescriptionGap)) {
        errors.push(`${label}: titleDescriptionGap debe ser number.`)
      } else if (
        p.titleDescriptionGap < MIN_TITLE_DESCRIPTION_GAP ||
        p.titleDescriptionGap > MAX_TITLE_DESCRIPTION_GAP
      ) {
        errors.push(
          `${label}: titleDescriptionGap fuera de rango (${MIN_TITLE_DESCRIPTION_GAP}-${MAX_TITLE_DESCRIPTION_GAP}).`
        )
      }
    }

    if (p.titleLineHeight !== undefined) {
      if (typeof p.titleLineHeight !== 'number' || Number.isNaN(p.titleLineHeight)) {
        errors.push(`${label}: titleLineHeight debe ser number.`)
      } else if (p.titleLineHeight < MIN_TITLE_LINE_HEIGHT || p.titleLineHeight > MAX_TITLE_LINE_HEIGHT) {
        errors.push(`${label}: titleLineHeight fuera de rango (${MIN_TITLE_LINE_HEIGHT}-${MAX_TITLE_LINE_HEIGHT}).`)
      }
    }

    if (p.descriptionLineHeight !== undefined) {
      if (typeof p.descriptionLineHeight !== 'number' || Number.isNaN(p.descriptionLineHeight)) {
        errors.push(`${label}: descriptionLineHeight debe ser number.`)
      } else if (
        p.descriptionLineHeight < MIN_DESCRIPTION_LINE_HEIGHT ||
        p.descriptionLineHeight > MAX_DESCRIPTION_LINE_HEIGHT
      ) {
        errors.push(
          `${label}: descriptionLineHeight fuera de rango (${MIN_DESCRIPTION_LINE_HEIGHT}-${MAX_DESCRIPTION_LINE_HEIGHT}).`
        )
      }
    }

    if (p.eyebrowLetterSpacing !== undefined) {
      if (typeof p.eyebrowLetterSpacing !== 'number' || Number.isNaN(p.eyebrowLetterSpacing)) {
        errors.push(`${label}: eyebrowLetterSpacing debe ser number.`)
      } else if (
        p.eyebrowLetterSpacing < MIN_EYEBROW_LETTER_SPACING ||
        p.eyebrowLetterSpacing > MAX_EYEBROW_LETTER_SPACING
      ) {
        errors.push(
          `${label}: eyebrowLetterSpacing fuera de rango (${MIN_EYEBROW_LETTER_SPACING}-${MAX_EYEBROW_LETTER_SPACING}).`
        )
      }
    }

    if (p.contentMaxWidth !== undefined) {
      if (typeof p.contentMaxWidth !== 'number' || Number.isNaN(p.contentMaxWidth)) {
        errors.push(`${label}: contentMaxWidth debe ser number.`)
      } else if (p.contentMaxWidth < MIN_CONTENT_MAX_WIDTH || p.contentMaxWidth > MAX_CONTENT_MAX_WIDTH) {
        errors.push(`${label}: contentMaxWidth fuera de rango (${MIN_CONTENT_MAX_WIDTH}-${MAX_CONTENT_MAX_WIDTH}).`)
      }
    }

    if (p.titleMaxWidth !== undefined) {
      if (typeof p.titleMaxWidth !== 'number' || Number.isNaN(p.titleMaxWidth)) {
        errors.push(`${label}: titleMaxWidth debe ser number.`)
      } else if (p.titleMaxWidth < MIN_TITLE_MAX_WIDTH || p.titleMaxWidth > MAX_TITLE_MAX_WIDTH) {
        errors.push(`${label}: titleMaxWidth fuera de rango (${MIN_TITLE_MAX_WIDTH}-${MAX_TITLE_MAX_WIDTH}).`)
      }
    }

    if (p.descriptionMaxWidth !== undefined) {
      if (typeof p.descriptionMaxWidth !== 'number' || Number.isNaN(p.descriptionMaxWidth)) {
        errors.push(`${label}: descriptionMaxWidth debe ser number.`)
      } else if (
        p.descriptionMaxWidth < MIN_DESCRIPTION_MAX_WIDTH ||
        p.descriptionMaxWidth > MAX_DESCRIPTION_MAX_WIDTH
      ) {
        errors.push(
          `${label}: descriptionMaxWidth fuera de rango (${MIN_DESCRIPTION_MAX_WIDTH}-${MAX_DESCRIPTION_MAX_WIDTH}).`
        )
      }
    }

    if (typeof p.eyebrow !== 'string') {
      errors.push(`${label}: eyebrow debe ser string.`)
    }

    if (typeof p.panelClass !== 'string') {
      errors.push(`${label}: panelClass debe ser string.`)
    }

    if (p.panelColor !== undefined && typeof p.panelColor !== 'string') {
      errors.push(`${label}: panelColor debe ser string.`)
    }

    if (p.image !== undefined && typeof p.image !== 'string') {
      errors.push(`${label}: image debe ser string.`)
    }

    if (p.logo !== undefined && typeof p.logo !== 'string') {
      errors.push(`${label}: logo debe ser string.`)
    }

    if (p.logoSize !== undefined && !VALID_TEXT_SIZES.includes(p.logoSize)) {
      errors.push(`${label}: logoSize invalido (${String(p.logoSize)}).`)
    }

    if (p.logoTintEnabled !== undefined && typeof p.logoTintEnabled !== 'boolean') {
      errors.push(`${label}: logoTintEnabled debe ser boolean.`)
    }

    if (p.logoTintColor !== undefined && typeof p.logoTintColor !== 'string') {
      errors.push(`${label}: logoTintColor debe ser string.`)
    }

    if (p.backgroundGradient !== undefined && typeof p.backgroundGradient !== 'string') {
      errors.push(`${label}: backgroundGradient debe ser string.`)
    }

    if (p.overlayEnabled !== undefined && typeof p.overlayEnabled !== 'boolean') {
      errors.push(`${label}: overlayEnabled debe ser boolean.`)
    }

    if (p.overlayIntensity !== undefined) {
      if (typeof p.overlayIntensity !== 'number' || Number.isNaN(p.overlayIntensity)) {
        errors.push(`${label}: overlayIntensity debe ser number.`)
      } else if (p.overlayIntensity < MIN_OVERLAY_INTENSITY || p.overlayIntensity > MAX_OVERLAY_INTENSITY) {
        errors.push(
          `${label}: overlayIntensity fuera de rango (${MIN_OVERLAY_INTENSITY}-${MAX_OVERLAY_INTENSITY}).`
        )
      }
    }

    if (p.ctaText !== undefined && typeof p.ctaText !== 'string') {
      errors.push(`${label}: ctaText debe ser string.`)
    }
    if (p.ctaLink !== undefined && typeof p.ctaLink !== 'string') {
      errors.push(`${label}: ctaLink debe ser string.`)
    }

    if (p.cta !== undefined) {
      if (!p.cta || typeof p.cta !== 'object') {
        errors.push(`${label}: cta debe ser objeto.`)
      } else {
        const cta = p.cta as { label?: unknown; linkKey?: unknown }
        if (typeof cta.label !== 'string' || cta.label.trim() === '') {
          errors.push(`${label}: cta.label obligatorio.`)
        }
        if (typeof cta.linkKey !== 'string' || cta.linkKey.trim() === '') {
          errors.push(`${label}: cta.linkKey obligatorio.`)
        }
      }
    }

    if (p.nextPanelPosition !== undefined && !VALID_DIRECTIONS.includes(p.nextPanelPosition)) {
      errors.push(`${label}: nextPanelPosition invalido (${String(p.nextPanelPosition)}).`)
    }

    if (p.contentSidePadding !== undefined) {
      if (typeof p.contentSidePadding !== 'number' || Number.isNaN(p.contentSidePadding)) {
        errors.push(`${label}: contentSidePadding debe ser number.`)
      } else if (p.contentSidePadding < MIN_CONTENT_SIDE_PADDING || p.contentSidePadding > MAX_CONTENT_SIDE_PADDING) {
        errors.push(`${label}: contentSidePadding fuera de rango (${MIN_CONTENT_SIDE_PADDING}-${MAX_CONTENT_SIDE_PADDING}).`)
      }
    }

    if (p.stackCards !== undefined) {
      if (!p.stackCards || typeof p.stackCards !== 'object') {
        errors.push(`${label}: stackCards debe ser objeto.`)
      } else {
        const settings = p.stackCards as unknown as Record<string, unknown>
        const numberFields = [
          'angleY',
          'angleX',
          'layoutSidePadding',
          'textOffsetX',
          'textOffsetY',
          'cardsOffsetX',
          'cardsOffsetY',
          'mobileTextCardsGap',
          'cardGap',
          'frontFadeWindow',
          'cardSize',
          'cardWidth',
          'wheelSensitivity',
          'mobileTouchSensitivity',
          'autoPlaySpeed'
        ]
        numberFields.forEach((field) => {
          const value = settings[field]
          if (value !== undefined && (typeof value !== 'number' || Number.isNaN(value))) {
            errors.push(`${label}: stackCards.${field} debe ser number.`)
          }
        })
        if (settings.textSide !== undefined && settings.textSide !== 'left' && settings.textSide !== 'right') {
          errors.push(`${label}: stackCards.textSide debe ser "left" o "right".`)
        }
        if (
          settings.stackDirection !== undefined &&
          settings.stackDirection !== 'left' &&
          settings.stackDirection !== 'right'
        ) {
          errors.push(`${label}: stackCards.stackDirection debe ser "left" o "right".`)
        }
        if (settings.cardsOnly !== undefined && typeof settings.cardsOnly !== 'boolean') {
          errors.push(`${label}: stackCards.cardsOnly debe ser boolean.`)
        }
        if (
          settings.mobileTouchHorizontalEnabled !== undefined &&
          typeof settings.mobileTouchHorizontalEnabled !== 'boolean'
        ) {
          errors.push(`${label}: stackCards.mobileTouchHorizontalEnabled debe ser boolean.`)
        }
        if (
          settings.mobileTouchVerticalEnabled !== undefined &&
          typeof settings.mobileTouchVerticalEnabled !== 'boolean'
        ) {
          errors.push(`${label}: stackCards.mobileTouchVerticalEnabled debe ser boolean.`)
        }
        if (typeof settings.layoutSidePadding === 'number') {
          if (
            settings.layoutSidePadding < STACK_CARDS_LAYOUT_SIDE_PADDING_LIMITS.min ||
            settings.layoutSidePadding > STACK_CARDS_LAYOUT_SIDE_PADDING_LIMITS.max
          ) {
            errors.push(
              `${label}: stackCards.layoutSidePadding fuera de rango (${STACK_CARDS_LAYOUT_SIDE_PADDING_LIMITS.min}-${STACK_CARDS_LAYOUT_SIDE_PADDING_LIMITS.max}).`
            )
          }
        }
        ;(['textOffsetX', 'textOffsetY', 'cardsOffsetX', 'cardsOffsetY'] as const).forEach((field) => {
          const value = settings[field]
          if (typeof value === 'number') {
            if (value < STACK_CARDS_LAYOUT_OFFSET_LIMITS.min || value > STACK_CARDS_LAYOUT_OFFSET_LIMITS.max) {
              errors.push(
                `${label}: stackCards.${field} fuera de rango (${STACK_CARDS_LAYOUT_OFFSET_LIMITS.min}-${STACK_CARDS_LAYOUT_OFFSET_LIMITS.max}).`
              )
            }
          }
        })
        if (typeof settings.mobileTextCardsGap === 'number') {
          if (
            settings.mobileTextCardsGap < STACK_CARDS_MOBILE_TEXT_CARDS_GAP_LIMITS.min ||
            settings.mobileTextCardsGap > STACK_CARDS_MOBILE_TEXT_CARDS_GAP_LIMITS.max
          ) {
            errors.push(
              `${label}: stackCards.mobileTextCardsGap fuera de rango (${STACK_CARDS_MOBILE_TEXT_CARDS_GAP_LIMITS.min}-${STACK_CARDS_MOBILE_TEXT_CARDS_GAP_LIMITS.max}).`
            )
          }
        }
        if (settings.autoPlayEnabled !== undefined && typeof settings.autoPlayEnabled !== 'boolean') {
          errors.push(`${label}: stackCards.autoPlayEnabled debe ser boolean.`)
        }
        if (typeof settings.autoPlaySpeed === 'number') {
          if (
            settings.autoPlaySpeed < STACK_CARDS_AUTOPLAY_LIMITS.min ||
            settings.autoPlaySpeed > STACK_CARDS_AUTOPLAY_LIMITS.max
          ) {
            errors.push(
              `${label}: stackCards.autoPlaySpeed fuera de rango (${STACK_CARDS_AUTOPLAY_LIMITS.min}-${STACK_CARDS_AUTOPLAY_LIMITS.max}).`
            )
          }
        }
        if (typeof settings.mobileTouchSensitivity === 'number') {
          if (
            settings.mobileTouchSensitivity < STACK_CARDS_MOBILE_TOUCH_SENSITIVITY_LIMITS.min ||
            settings.mobileTouchSensitivity > STACK_CARDS_MOBILE_TOUCH_SENSITIVITY_LIMITS.max
          ) {
            errors.push(
              `${label}: stackCards.mobileTouchSensitivity fuera de rango (${STACK_CARDS_MOBILE_TOUCH_SENSITIVITY_LIMITS.min}-${STACK_CARDS_MOBILE_TOUCH_SENSITIVITY_LIMITS.max}).`
            )
          }
        }
        if (!Array.isArray(settings.cards)) {
          errors.push(`${label}: stackCards.cards debe ser arreglo.`)
        } else {
          settings.cards.forEach((card, cardIndex) => {
            const cardLabel = `${label}: stackCards.cards[${cardIndex}]`
            if (!card || typeof card !== 'object') {
              errors.push(`${cardLabel} invalida.`)
              return
            }
            const item = card as Record<string, unknown>
            if (typeof item.id !== 'string' || item.id.trim() === '') errors.push(`${cardLabel}.id debe ser string.`)
            if (typeof item.eyebrow !== 'string') errors.push(`${cardLabel}.eyebrow debe ser string.`)
            if (typeof item.title !== 'string') errors.push(`${cardLabel}.title debe ser string.`)
            if (typeof item.description !== 'string') errors.push(`${cardLabel}.description debe ser string.`)
            if (item.panelColor !== undefined && typeof item.panelColor !== 'string') {
              errors.push(`${cardLabel}.panelColor debe ser string.`)
            }
            if (item.color !== undefined && typeof item.color !== 'string') {
              errors.push(`${cardLabel}.color legado debe ser string.`)
            }
            if (item.image !== undefined && typeof item.image !== 'string') {
              errors.push(`${cardLabel}.image debe ser string.`)
            }
          })
        }
      }
    } else if (p.templateType === TemplateType.StackCards) {
      errors.push(`${label}: templateType "stack-cards" requiere stackCards.`)
    }
  })

  for (let i = 0; i < content.panels.length - 1; i += 1) {
    const currentDir = (content.panels[i].nextPanelPosition ?? Direction.Down) as Direction
    const nextDir = (content.panels[i + 1].nextPanelPosition ?? Direction.Down) as Direction

    if (nextDir === OPPOSITE[currentDir]) {
      errors.push(
        `Regla de flujo: panel ${i + 2} no puede ser '${nextDir}' justo despues de '${currentDir}' (panel ${i + 1}).`
      )
    }
  }

  return { ok: errors.length === 0, errors }
}
