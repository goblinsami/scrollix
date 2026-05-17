import { computed } from 'vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import type { SlidePanelProps } from '@/types/slidePanel'
import {
  ContentAlign,
  type ContentAlign as SlideContentAlign,
  type ContentWidthMode as SlideContentWidthMode
} from '@/types/navigation'
import {
  DEFAULT_CONTENT_ALIGN,
  DEFAULT_CONTENT_MAX_WIDTH,
  DEFAULT_CONTENT_SIDE_PADDING,
  DEFAULT_CONTENT_WIDTH_MODE,
  DEFAULT_DESCRIPTION_LINE_HEIGHT,
  DEFAULT_PANEL_COLOR,
  DEFAULT_EYEBROW_LETTER_SPACING,
  DEFAULT_EYEBROW_TITLE_GAP,
  DEFAULT_OVERLAY_INTENSITY,
  DEFAULT_TEXT_SIZE,
  DEFAULT_TITLE_DESCRIPTION_GAP,
  DEFAULT_TITLE_LINE_HEIGHT,
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
  MIN_TITLE_MAX_WIDTH,
  clampNumber,
  deriveDescriptionMaxWidthFromContent,
  deriveTitleMaxWidthFromContent,
  getDescriptionClampSize,
  getEyebrowFontSizeRem,
  getLogoDimensions,
  getTitleClampSize
} from '@/constants/slideStyle'
import { resolveLinkKey, resolveLinkValue } from '@/utils/links'

const CTA_BRAND_DOMAINS = ['scrollix.netlify.app', 'framer.com'] as const

const asExternalAnchorHtml = (rawHtml: string) => {
  if (typeof window === 'undefined') return rawHtml

  const host = document.createElement('div')
  host.innerHTML = rawHtml
  host.querySelectorAll('a').forEach((anchor) => {
    const href = resolveLinkValue(anchor.getAttribute('href'))
    if (!href) {
      anchor.removeAttribute('href')
      return
    }

    anchor.setAttribute('href', href)
    anchor.setAttribute('target', '_blank')
    anchor.setAttribute('rel', 'noopener noreferrer')

    if (anchor.classList.contains('slide-cta')) return
    if ((anchor.textContent ?? '').trim().length === 0) return

    const sourceHref = anchor.getAttribute('href') ?? ''
    if (CTA_BRAND_DOMAINS.some((domain) => sourceHref.includes(domain))) {
      anchor.classList.add('slide-cta', 'slide-cta--inline')
    }
  })
  return host.innerHTML
}

const renderMarkdown = (value?: string) => {
  const html = marked.parse(value ?? '', { breaks: true }) as string
  const sanitized = DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel', 'class'] })
  return asExternalAnchorHtml(sanitized)
}

const clampOverlayIntensity = (value?: number) => {
  const candidate = typeof value === 'number' ? value : DEFAULT_OVERLAY_INTENSITY
  if (Number.isNaN(candidate)) return DEFAULT_OVERLAY_INTENSITY
  return Math.max(MIN_OVERLAY_INTENSITY, Math.min(MAX_OVERLAY_INTENSITY, candidate))
}

export function useSlidePanelPresentation(props: Readonly<SlidePanelProps>) {
  const titleHtml = computed(() => renderMarkdown(props.title))
  const eyebrowHtml = computed(() => renderMarkdown(props.eyebrow))
  const descriptionHtml = computed(() => renderMarkdown(props.description))

  const enableCtasResolved = computed(() => props.enableCtas ?? true)
  const hasCtaTextField = computed(() => typeof props.ctaText === 'string')
  const ctaTextResolved = computed(() => props.ctaText?.trim() ?? '')
  const ctaHrefResolved = computed(() => resolveLinkValue(props.ctaLink))
  const ctaLabel = computed(() => props.cta?.label?.trim() ?? '')
  const ctaHref = computed(() => resolveLinkKey(props.cta?.linkKey))

  const contentAlignResolved = computed<SlideContentAlign>(() => props.contentAlign ?? DEFAULT_CONTENT_ALIGN)
  const contentWidthModeResolved = computed<SlideContentWidthMode>(() => props.contentWidthMode ?? DEFAULT_CONTENT_WIDTH_MODE)

  const eyebrowTitleGapResolved = computed(() =>
    clampNumber(
      props.eyebrowTitleGap ?? props.titleDescriptionGap,
      MIN_EYEBROW_TITLE_GAP,
      MAX_EYEBROW_TITLE_GAP,
      DEFAULT_EYEBROW_TITLE_GAP
    )
  )
  const titleDescriptionGapResolved = computed(() =>
    clampNumber(
      props.titleDescriptionGap ?? props.eyebrowTitleGap,
      MIN_TITLE_DESCRIPTION_GAP,
      MAX_TITLE_DESCRIPTION_GAP,
      DEFAULT_TITLE_DESCRIPTION_GAP
    )
  )
  const titleLineHeightResolved = computed(() =>
    clampNumber(props.titleLineHeight, MIN_TITLE_LINE_HEIGHT, MAX_TITLE_LINE_HEIGHT, DEFAULT_TITLE_LINE_HEIGHT)
  )
  const descriptionLineHeightResolved = computed(() =>
    clampNumber(
      props.descriptionLineHeight,
      MIN_DESCRIPTION_LINE_HEIGHT,
      MAX_DESCRIPTION_LINE_HEIGHT,
      DEFAULT_DESCRIPTION_LINE_HEIGHT
    )
  )
  const eyebrowLetterSpacingResolved = computed(() =>
    clampNumber(
      props.eyebrowLetterSpacing,
      MIN_EYEBROW_LETTER_SPACING,
      MAX_EYEBROW_LETTER_SPACING,
      DEFAULT_EYEBROW_LETTER_SPACING
    )
  )
  const contentMaxWidthResolved = computed(() =>
    clampNumber(props.contentMaxWidth, MIN_CONTENT_MAX_WIDTH, MAX_CONTENT_MAX_WIDTH, DEFAULT_CONTENT_MAX_WIDTH)
  )
  const contentSidePaddingResolved = computed(() =>
    clampNumber(
      props.contentSidePadding,
      MIN_CONTENT_SIDE_PADDING,
      MAX_CONTENT_SIDE_PADDING,
      DEFAULT_CONTENT_SIDE_PADDING
    )
  )
  const titleMaxWidthResolved = computed(() => {
    const fallback = deriveTitleMaxWidthFromContent(contentMaxWidthResolved.value)
    return clampNumber(props.titleMaxWidth, MIN_TITLE_MAX_WIDTH, MAX_TITLE_MAX_WIDTH, fallback)
  })
  const descriptionMaxWidthResolved = computed(() => {
    const fallback = deriveDescriptionMaxWidthFromContent(contentMaxWidthResolved.value)
    return clampNumber(props.descriptionMaxWidth, MIN_DESCRIPTION_MAX_WIDTH, MAX_DESCRIPTION_MAX_WIDTH, fallback)
  })

  const contentStyle = computed(() => ({
    '--content-max-width': `${contentMaxWidthResolved.value}px`,
    '--content-side-padding': `${contentSidePaddingResolved.value}px`,
    '--title-max-width': `${titleMaxWidthResolved.value}px`,
    '--description-max-width': `${descriptionMaxWidthResolved.value}px`
  }))

  const eyebrowStyle = computed(() => ({
    marginBottom: `${eyebrowTitleGapResolved.value}px`,
    letterSpacing: `${eyebrowLetterSpacingResolved.value}em`,
    fontSize: `${getEyebrowFontSizeRem(props.eyebrowSize ?? DEFAULT_TEXT_SIZE)}rem`
  }))

  const logoDimensionsResolved = computed(() => getLogoDimensions(props.logoSize ?? DEFAULT_TEXT_SIZE))
  const logoStyle = computed(() => ({
    marginBottom: `${eyebrowTitleGapResolved.value}px`,
    width: `${logoDimensionsResolved.value.widthPx}px`,
    height: `${logoDimensionsResolved.value.heightPx}px`,
    maxWidth: `${logoDimensionsResolved.value.widthPx}px`,
    maxHeight: `${logoDimensionsResolved.value.heightPx}px`,
    objectPosition:
      contentAlignResolved.value === ContentAlign.Right
        ? 'right center'
        : contentAlignResolved.value === ContentAlign.Left
          ? 'left center'
          : 'center center'
  }))

  const logoTintEnabledResolved = computed(() => props.logoTintEnabled ?? true)
  const logoTintColorResolved = computed(() => props.logoTintColor ?? '#ffffff')
  const logoTintStyle = computed(() => ({
    ...logoStyle.value,
    backgroundColor: logoTintColorResolved.value,
    WebkitMaskImage: `url(${props.logo})`,
    maskImage: `url(${props.logo})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition:
      contentAlignResolved.value === ContentAlign.Right
        ? 'right center'
        : contentAlignResolved.value === ContentAlign.Left
          ? 'left center'
          : 'center center',
    maskPosition:
      contentAlignResolved.value === ContentAlign.Right
        ? 'right center'
        : contentAlignResolved.value === ContentAlign.Left
          ? 'left center'
          : 'center center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain'
  }))

  const titleStyle = computed(() => ({
    marginBottom: props.description ? `${titleDescriptionGapResolved.value}px` : '0px',
    lineHeight: String(titleLineHeightResolved.value),
    fontSize: getTitleClampSize(props.titleSize ?? DEFAULT_TEXT_SIZE)
  }))
  const descriptionStyle = computed(() => ({
    lineHeight: String(descriptionLineHeightResolved.value),
    fontSize: getDescriptionClampSize(props.descriptionSize ?? DEFAULT_TEXT_SIZE)
  }))

  const overlayIntensityResolved = computed(() => clampOverlayIntensity(props.overlayIntensity))
  const overlayEnabledResolved = computed(() => props.overlayEnabled ?? Boolean(props.image))
  const overlayVisible = computed(
    () => Boolean(props.image) && overlayEnabledResolved.value && overlayIntensityResolved.value > 0
  )
  const hasVisualBackground = computed(() => Boolean(props.image || props.backgroundGradient))
  const panelStyle = computed(() => ({
    background: props.backgroundGradient,
    backgroundColor: props.panelColor || DEFAULT_PANEL_COLOR
  }))

  const overlayStyle = computed(() => {
    const ratio = overlayIntensityResolved.value / 100
    const strong = Math.min(0.94, ratio * 1.04)
    const mid = Math.min(0.84, ratio * 0.92)
    const soft = Math.min(0.32, ratio * 0.5)
    const gradientDirection = contentAlignResolved.value === ContentAlign.Right ? '270deg' : '90deg'

    return {
      background: `linear-gradient(${gradientDirection}, rgba(7, 7, 12, ${strong}) 0%, rgba(7, 7, 12, ${mid}) 30%, rgba(7, 7, 12, ${soft}) 60%, rgba(7, 7, 12, 0) 100%)`
    }
  })

  return {
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
    titleMaxWidthResolved,
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
  }
}
