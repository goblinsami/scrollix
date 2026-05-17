import { ContentAlign, ContentWidthMode, TextSize, type TextSize as SlideTextSize } from '../types/navigation'

export const DEFAULT_TEXT_SIZE = TextSize.Medium
export const DEFAULT_CONTENT_ALIGN = ContentAlign.Left
export const DEFAULT_CONTENT_WIDTH_MODE = ContentWidthMode.Contained
export const DEFAULT_PANEL_COLOR = '#111111'

export const DEFAULT_EYEBROW_TITLE_GAP = 24
export const DEFAULT_TITLE_DESCRIPTION_GAP = DEFAULT_EYEBROW_TITLE_GAP
export const DEFAULT_TITLE_LINE_HEIGHT = 0.95
export const DEFAULT_DESCRIPTION_LINE_HEIGHT = 1.75
export const DEFAULT_EYEBROW_LETTER_SPACING = 0.18
export const DEFAULT_CONTENT_MAX_WIDTH = 900
export const DEFAULT_CONTENT_SIDE_PADDING = 128
export const DEFAULT_TITLE_MAX_WIDTH = 560
export const DEFAULT_DESCRIPTION_MAX_WIDTH = 810

export const MIN_EYEBROW_TITLE_GAP = 0
export const MAX_EYEBROW_TITLE_GAP = 80
export const MIN_TITLE_DESCRIPTION_GAP = 0
export const MAX_TITLE_DESCRIPTION_GAP = 96
export const MIN_TITLE_LINE_HEIGHT = 0.9
export const MAX_TITLE_LINE_HEIGHT = 1.7
export const MIN_DESCRIPTION_LINE_HEIGHT = 1.1
export const MAX_DESCRIPTION_LINE_HEIGHT = 2.4
export const MIN_EYEBROW_LETTER_SPACING = 0
export const MAX_EYEBROW_LETTER_SPACING = 0.4
export const MIN_CONTENT_MAX_WIDTH = 480
export const MAX_CONTENT_MAX_WIDTH = 1600
export const MIN_CONTENT_SIDE_PADDING = 16
export const MAX_CONTENT_SIDE_PADDING = 240
export const MIN_TITLE_MAX_WIDTH = 220
export const MAX_TITLE_MAX_WIDTH = 1400
export const MIN_DESCRIPTION_MAX_WIDTH = 320
export const MAX_DESCRIPTION_MAX_WIDTH = 1500

export const DEFAULT_OVERLAY_ENABLED_WITH_IMAGE = true
export const DEFAULT_OVERLAY_ENABLED_WITHOUT_IMAGE = false
export const DEFAULT_OVERLAY_INTENSITY = 55
export const MIN_OVERLAY_INTENSITY = 0
export const MAX_OVERLAY_INTENSITY = 100

export const WIDTH_DERIVE_RATIO_TITLE = 0.62
export const WIDTH_DERIVE_RATIO_DESCRIPTION = 0.9

export const TEXT_SCALE_MULTIPLIER: Record<SlideTextSize, number> = {
  [TextSize.Small]: 0.86,
  [TextSize.Medium]: 1,
  [TextSize.Large]: 1.14
}

export const EYEBROW_FONT_SIZE_M_REM = 1
export const DESCRIPTION_FONT_SIZE_M_REM = 1.7
export const TITLE_FONT_SIZE_M = {
  minRem: 3,
  vw: 6,
  maxRem: 5.5
} as const

export const LOGO_BASE_SIZE_M = {
  widthPx: 220,
  heightPx: 72
} as const

export const TEXT_STYLE_RANGES = {
  textGap: { min: MIN_EYEBROW_TITLE_GAP, max: MAX_EYEBROW_TITLE_GAP, step: 1 },
  eyebrowTitleGap: { min: MIN_EYEBROW_TITLE_GAP, max: MAX_EYEBROW_TITLE_GAP, step: 1 },
  titleDescriptionGap: { min: MIN_TITLE_DESCRIPTION_GAP, max: MAX_TITLE_DESCRIPTION_GAP, step: 1 },
  titleLineHeight: { min: MIN_TITLE_LINE_HEIGHT, max: MAX_TITLE_LINE_HEIGHT, step: 0.01 },
  descriptionLineHeight: { min: MIN_DESCRIPTION_LINE_HEIGHT, max: MAX_DESCRIPTION_LINE_HEIGHT, step: 0.01 },
  eyebrowLetterSpacing: { min: MIN_EYEBROW_LETTER_SPACING, max: MAX_EYEBROW_LETTER_SPACING, step: 0.01 },
  contentMaxWidth: { min: MIN_CONTENT_MAX_WIDTH, max: MAX_CONTENT_MAX_WIDTH, step: 10 },
  contentSidePadding: { min: MIN_CONTENT_SIDE_PADDING, max: MAX_CONTENT_SIDE_PADDING, step: 2 },
  titleMaxWidth: { min: MIN_TITLE_MAX_WIDTH, max: MAX_TITLE_MAX_WIDTH, step: 10 },
  descriptionMaxWidth: { min: MIN_DESCRIPTION_MAX_WIDTH, max: MAX_DESCRIPTION_MAX_WIDTH, step: 10 }
} as const

const round3 = (value: number) => Math.round(value * 1000) / 1000

export const getTextScale = (size: SlideTextSize | undefined) =>
  TEXT_SCALE_MULTIPLIER[size ?? DEFAULT_TEXT_SIZE]

export const getEyebrowFontSizeRem = (size: SlideTextSize | undefined) =>
  round3(EYEBROW_FONT_SIZE_M_REM * getTextScale(size))

export const getDescriptionFontSizeRem = (size: SlideTextSize | undefined) =>
  round3(DESCRIPTION_FONT_SIZE_M_REM * getTextScale(size))

export const getDescriptionClampSize = (size: SlideTextSize | undefined) => {
  const maxRem = getDescriptionFontSizeRem(size)
  // Keep mobile text readable and avoid oversized description text on small screens.
  const minRem = round3(Math.min(1.28, Math.max(0.98, maxRem * 0.66)))
  const baseRem = round3(maxRem * 0.6)
  return `clamp(${minRem}rem, calc(${baseRem}rem + 0.78vw), ${maxRem}rem)`
}

export const getTitleClampSize = (size: SlideTextSize | undefined) => {
  const scale = getTextScale(size)
  const minRem = round3(TITLE_FONT_SIZE_M.minRem * scale)
  const vw = round3(TITLE_FONT_SIZE_M.vw * scale)
  const maxRem = round3(TITLE_FONT_SIZE_M.maxRem * scale)
  return `clamp(${minRem}rem, ${vw}vw, ${maxRem}rem)`
}

export const getLogoDimensions = (size: SlideTextSize | undefined) => {
  const scale = getTextScale(size)
  return {
    widthPx: Math.round(LOGO_BASE_SIZE_M.widthPx * scale),
    heightPx: Math.round(LOGO_BASE_SIZE_M.heightPx * scale)
  }
}

export const clampNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(min, Math.min(max, value))
}

export const deriveTitleMaxWidthFromContent = (contentWidth: number) =>
  Math.max(DEFAULT_TITLE_MAX_WIDTH, Math.round(contentWidth * WIDTH_DERIVE_RATIO_TITLE))

export const deriveDescriptionMaxWidthFromContent = (contentWidth: number) =>
  Math.max(DEFAULT_DESCRIPTION_MAX_WIDTH, Math.round(contentWidth * WIDTH_DERIVE_RATIO_DESCRIPTION))
