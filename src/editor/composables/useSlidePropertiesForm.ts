import { reactive, ref, watch, type Ref } from 'vue'
import {
  ContentAlign,
  Direction,
  TemplateType,
  type Panel,
  type StackCardItem
} from '../../types/navigation'
import {
  DEFAULT_CONTENT_ALIGN,
  DEFAULT_CONTENT_MAX_WIDTH,
  DEFAULT_CONTENT_SIDE_PADDING,
  DEFAULT_PANEL_COLOR,
  DEFAULT_CONTENT_WIDTH_MODE,
  DEFAULT_DESCRIPTION_LINE_HEIGHT,
  DEFAULT_DESCRIPTION_MAX_WIDTH,
  DEFAULT_EYEBROW_LETTER_SPACING,
  DEFAULT_EYEBROW_TITLE_GAP,
  DEFAULT_OVERLAY_ENABLED_WITHOUT_IMAGE,
  DEFAULT_OVERLAY_ENABLED_WITH_IMAGE,
  DEFAULT_OVERLAY_INTENSITY,
  DEFAULT_TEXT_SIZE,
  DEFAULT_TITLE_DESCRIPTION_GAP,
  DEFAULT_TITLE_LINE_HEIGHT,
  DEFAULT_TITLE_MAX_WIDTH,
  MAX_CONTENT_MAX_WIDTH,
  MAX_CONTENT_SIDE_PADDING,
  MAX_DESCRIPTION_LINE_HEIGHT,
  MAX_DESCRIPTION_MAX_WIDTH,
  MAX_EYEBROW_LETTER_SPACING,
  MAX_EYEBROW_TITLE_GAP,
  MAX_OVERLAY_INTENSITY,
  MAX_TITLE_LINE_HEIGHT,
  MAX_TITLE_MAX_WIDTH,
  MIN_CONTENT_MAX_WIDTH,
  MIN_CONTENT_SIDE_PADDING,
  MIN_DESCRIPTION_LINE_HEIGHT,
  MIN_DESCRIPTION_MAX_WIDTH,
  MIN_EYEBROW_LETTER_SPACING,
  MIN_EYEBROW_TITLE_GAP,
  MIN_OVERLAY_INTENSITY,
  MIN_TITLE_LINE_HEIGHT,
  MIN_TITLE_MAX_WIDTH,
  TEXT_STYLE_RANGES,
  clampNumber,
  deriveDescriptionMaxWidthFromContent,
  deriveTitleMaxWidthFromContent
} from '../../constants/slideStyle'
import { normalizeTextSize } from '../../utils/textSize'
import { STACK_CARDS_DEFAULTS, STACK_CARDS_DEFAULT_CARDS } from '../../constants/stackCards'

export const contentAlignOptions: Array<{ value: ContentAlign; label: string }> = [
  { value: ContentAlign.Left, label: 'Left' },
  { value: ContentAlign.Center, label: 'Center' },
  { value: ContentAlign.Right, label: 'Right' }
]

const RANDOM_IMAGE_WIDTH = 2400
const RANDOM_IMAGE_HEIGHT = 1350
const RANDOM_IMAGE_BASE_URL = 'https://picsum.photos'
export const DROP_IMAGE_LOADED_TEXT = 'Image loaded'
export const DROP_IMAGE_EMPTY_TEXT = 'Drop image here or choose file'
export const DROP_LOGO_LOADED_TEXT = 'Logo loaded'
export const DROP_LOGO_EMPTY_TEXT = 'Paste logo URL or choose file'
export const DEFAULT_LOGO_TINT_COLOR = '#ffffff'
export const DEFAULT_SLIDE_COLOR = DEFAULT_PANEL_COLOR
export const textStyleRanges = TEXT_STYLE_RANGES

const clampOverlayIntensity = (value: number) => {
  if (Number.isNaN(value)) return DEFAULT_OVERLAY_INTENSITY
  return Math.max(MIN_OVERLAY_INTENSITY, Math.min(MAX_OVERLAY_INTENSITY, value))
}

const cloneStackCards = (cards?: StackCardItem[]) =>
  (cards && cards.length ? cards : STACK_CARDS_DEFAULT_CARDS).map((card) => ({
    id: card.id ?? `stack-card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    eyebrow: card.eyebrow ?? '',
    title: card.title ?? '',
    description: card.description ?? '',
    useMarkdown: card.useMarkdown ?? false,
    titleSize: normalizeTextSize(card.titleSize, DEFAULT_TEXT_SIZE),
    eyebrowSize: normalizeTextSize(card.eyebrowSize, DEFAULT_TEXT_SIZE),
    descriptionSize: normalizeTextSize(card.descriptionSize, DEFAULT_TEXT_SIZE),
    contentAlign: card.contentAlign ?? DEFAULT_CONTENT_ALIGN,
    contentWidthMode: card.contentWidthMode ?? DEFAULT_CONTENT_WIDTH_MODE,
    eyebrowTitleGap: clampNumber(card.eyebrowTitleGap, MIN_EYEBROW_TITLE_GAP, MAX_EYEBROW_TITLE_GAP, DEFAULT_EYEBROW_TITLE_GAP),
    titleDescriptionGap: clampNumber(card.titleDescriptionGap, MIN_EYEBROW_TITLE_GAP, MAX_EYEBROW_TITLE_GAP, DEFAULT_TITLE_DESCRIPTION_GAP),
    titleLineHeight: clampNumber(card.titleLineHeight, MIN_TITLE_LINE_HEIGHT, MAX_TITLE_LINE_HEIGHT, DEFAULT_TITLE_LINE_HEIGHT),
    descriptionLineHeight: clampNumber(card.descriptionLineHeight, MIN_DESCRIPTION_LINE_HEIGHT, MAX_DESCRIPTION_LINE_HEIGHT, DEFAULT_DESCRIPTION_LINE_HEIGHT),
    eyebrowLetterSpacing: clampNumber(card.eyebrowLetterSpacing, MIN_EYEBROW_LETTER_SPACING, MAX_EYEBROW_LETTER_SPACING, DEFAULT_EYEBROW_LETTER_SPACING),
    contentMaxWidth: clampNumber(card.contentMaxWidth, MIN_CONTENT_MAX_WIDTH, MAX_CONTENT_MAX_WIDTH, DEFAULT_CONTENT_MAX_WIDTH),
    contentSidePadding: clampNumber(card.contentSidePadding, MIN_CONTENT_SIDE_PADDING, MAX_CONTENT_SIDE_PADDING, DEFAULT_CONTENT_SIDE_PADDING),
    titleMaxWidth: clampNumber(card.titleMaxWidth, MIN_TITLE_MAX_WIDTH, MAX_TITLE_MAX_WIDTH, DEFAULT_TITLE_MAX_WIDTH),
    descriptionMaxWidth: clampNumber(card.descriptionMaxWidth, MIN_DESCRIPTION_MAX_WIDTH, MAX_DESCRIPTION_MAX_WIDTH, DEFAULT_DESCRIPTION_MAX_WIDTH),
    panelColor: card.panelColor ?? (card as unknown as { color?: string }).color ?? '#0f172a',
    logo: card.logo ?? '',
    logoSize: normalizeTextSize(card.logoSize, DEFAULT_TEXT_SIZE),
    logoTintEnabled: card.logoTintEnabled ?? true,
    logoTintColor: card.logoTintColor ?? DEFAULT_LOGO_TINT_COLOR,
    backgroundGradient: card.backgroundGradient,
    overlayEnabled: card.overlayEnabled ?? DEFAULT_OVERLAY_ENABLED_WITHOUT_IMAGE,
    overlayIntensity: clampOverlayIntensity(card.overlayIntensity ?? DEFAULT_OVERLAY_INTENSITY),
    image: card.image ?? ''
  }))


const copyPanelToDraft = (panel: Panel, draft: Panel) => {
  draft.id = panel.id
  draft.title = panel.title
  draft.eyebrow = panel.eyebrow
  draft.description = panel.description ?? ''
  draft.templateType = panel.templateType ?? TemplateType.Scroll
  draft.useMarkdown = panel.useMarkdown ?? false
  draft.titleSize = normalizeTextSize(panel.titleSize, DEFAULT_TEXT_SIZE)
  draft.eyebrowSize = normalizeTextSize(panel.eyebrowSize, DEFAULT_TEXT_SIZE)
  draft.descriptionSize = normalizeTextSize(panel.descriptionSize, DEFAULT_TEXT_SIZE)
  draft.contentAlign = panel.contentAlign ?? DEFAULT_CONTENT_ALIGN
  draft.contentWidthMode = panel.contentWidthMode ?? DEFAULT_CONTENT_WIDTH_MODE
  const unifiedTextGap = clampNumber(
    panel.eyebrowTitleGap ?? panel.titleDescriptionGap,
    MIN_EYEBROW_TITLE_GAP,
    MAX_EYEBROW_TITLE_GAP,
    DEFAULT_EYEBROW_TITLE_GAP
  )
  draft.eyebrowTitleGap = unifiedTextGap
  draft.titleDescriptionGap = unifiedTextGap
  draft.titleLineHeight = clampNumber(
    panel.titleLineHeight,
    MIN_TITLE_LINE_HEIGHT,
    MAX_TITLE_LINE_HEIGHT,
    DEFAULT_TITLE_LINE_HEIGHT
  )
  draft.descriptionLineHeight = clampNumber(
    panel.descriptionLineHeight,
    MIN_DESCRIPTION_LINE_HEIGHT,
    MAX_DESCRIPTION_LINE_HEIGHT,
    DEFAULT_DESCRIPTION_LINE_HEIGHT
  )
  draft.eyebrowLetterSpacing = clampNumber(
    panel.eyebrowLetterSpacing,
    MIN_EYEBROW_LETTER_SPACING,
    MAX_EYEBROW_LETTER_SPACING,
    DEFAULT_EYEBROW_LETTER_SPACING
  )
  const contentMaxWidth = clampNumber(
    panel.contentMaxWidth,
    MIN_CONTENT_MAX_WIDTH,
    MAX_CONTENT_MAX_WIDTH,
    DEFAULT_CONTENT_MAX_WIDTH
  )
  draft.contentMaxWidth = contentMaxWidth
  draft.contentSidePadding = clampNumber(
    panel.contentSidePadding,
    MIN_CONTENT_SIDE_PADDING,
    MAX_CONTENT_SIDE_PADDING,
    DEFAULT_CONTENT_SIDE_PADDING
  )
  draft.titleMaxWidth = clampNumber(
    panel.titleMaxWidth,
    MIN_TITLE_MAX_WIDTH,
    MAX_TITLE_MAX_WIDTH,
    deriveTitleMaxWidthFromContent(contentMaxWidth)
  )
  draft.descriptionMaxWidth = clampNumber(
    panel.descriptionMaxWidth,
    MIN_DESCRIPTION_MAX_WIDTH,
    MAX_DESCRIPTION_MAX_WIDTH,
    deriveDescriptionMaxWidthFromContent(contentMaxWidth)
  )
  draft.panelClass = panel.panelClass
  draft.panelColor = panel.panelColor ?? ''
  draft.image = panel.image ?? ''
  draft.logo = panel.logo ?? ''
  draft.logoSize = normalizeTextSize(panel.logoSize, DEFAULT_TEXT_SIZE)
  draft.logoTintEnabled = panel.logoTintEnabled ?? true
  draft.logoTintColor = panel.logoTintColor ?? DEFAULT_LOGO_TINT_COLOR
  draft.backgroundGradient = panel.backgroundGradient
  draft.overlayEnabled =
    panel.overlayEnabled ??
    (panel.image ? DEFAULT_OVERLAY_ENABLED_WITH_IMAGE : DEFAULT_OVERLAY_ENABLED_WITHOUT_IMAGE)
  draft.overlayIntensity = clampOverlayIntensity(panel.overlayIntensity ?? DEFAULT_OVERLAY_INTENSITY)
  draft.ctaText = panel.ctaText ?? panel.cta?.label ?? ''
  draft.ctaLink = panel.ctaLink ?? ''
  draft.cta = panel.cta ? { ...panel.cta } : undefined
  draft.stackCards =
    panel.stackCards
      ? {
        variant: panel.stackCards.variant ?? STACK_CARDS_DEFAULTS.variant,
        textSide: panel.stackCards.textSide ?? STACK_CARDS_DEFAULTS.textSide,
        stackDirection: panel.stackCards.stackDirection ?? STACK_CARDS_DEFAULTS.stackDirection,
        cardsOnly: panel.stackCards.cardsOnly ?? STACK_CARDS_DEFAULTS.cardsOnly,
        cardSurfaceOpacity:
          panel.stackCards.cardSurfaceOpacity ?? STACK_CARDS_DEFAULTS.cardSurfaceOpacity,
        layoutSidePadding: panel.stackCards.layoutSidePadding ?? STACK_CARDS_DEFAULTS.layoutSidePadding,
        textOffsetX: panel.stackCards.textOffsetX ?? STACK_CARDS_DEFAULTS.textOffsetX,
        textOffsetY: panel.stackCards.textOffsetY ?? STACK_CARDS_DEFAULTS.textOffsetY,
        cardsOffsetX: panel.stackCards.cardsOffsetX ?? STACK_CARDS_DEFAULTS.cardsOffsetX,
        cardsOffsetY: panel.stackCards.cardsOffsetY ?? STACK_CARDS_DEFAULTS.cardsOffsetY,
        mobileTextCardsGap: panel.stackCards.mobileTextCardsGap ?? STACK_CARDS_DEFAULTS.mobileTextCardsGap,
        angleY: panel.stackCards.angleY ?? STACK_CARDS_DEFAULTS.angleY,
        angleX: panel.stackCards.angleX ?? STACK_CARDS_DEFAULTS.angleX,
        cardGap: panel.stackCards.cardGap ?? STACK_CARDS_DEFAULTS.cardGap,
        frontFadeWindow: panel.stackCards.frontFadeWindow ?? STACK_CARDS_DEFAULTS.frontFadeWindow,
        cardSize: panel.stackCards.cardSize ?? STACK_CARDS_DEFAULTS.cardSize,
        cardWidth: panel.stackCards.cardWidth ?? STACK_CARDS_DEFAULTS.cardWidth,
        wheelSensitivity: panel.stackCards.wheelSensitivity ?? STACK_CARDS_DEFAULTS.wheelSensitivity,
        mobileTouchSensitivity:
          panel.stackCards.mobileTouchSensitivity ?? STACK_CARDS_DEFAULTS.mobileTouchSensitivity,
        mobileTouchHorizontalEnabled:
          panel.stackCards.mobileTouchHorizontalEnabled ?? STACK_CARDS_DEFAULTS.mobileTouchHorizontalEnabled,
        mobileTouchVerticalEnabled:
          panel.stackCards.mobileTouchVerticalEnabled ?? STACK_CARDS_DEFAULTS.mobileTouchVerticalEnabled,
        autoPlayEnabled: panel.stackCards.autoPlayEnabled ?? STACK_CARDS_DEFAULTS.autoPlayEnabled,
        autoPlaySpeed: panel.stackCards.autoPlaySpeed ?? STACK_CARDS_DEFAULTS.autoPlaySpeed,
        cards: cloneStackCards(panel.stackCards.cards)
      }
      : {
        variant: STACK_CARDS_DEFAULTS.variant,
        textSide: STACK_CARDS_DEFAULTS.textSide,
        stackDirection: STACK_CARDS_DEFAULTS.stackDirection,
        cardsOnly: STACK_CARDS_DEFAULTS.cardsOnly,
        cardSurfaceOpacity: STACK_CARDS_DEFAULTS.cardSurfaceOpacity,
        layoutSidePadding: STACK_CARDS_DEFAULTS.layoutSidePadding,
        textOffsetX: STACK_CARDS_DEFAULTS.textOffsetX,
        textOffsetY: STACK_CARDS_DEFAULTS.textOffsetY,
        cardsOffsetX: STACK_CARDS_DEFAULTS.cardsOffsetX,
        cardsOffsetY: STACK_CARDS_DEFAULTS.cardsOffsetY,
        mobileTextCardsGap: STACK_CARDS_DEFAULTS.mobileTextCardsGap,
        angleY: STACK_CARDS_DEFAULTS.angleY,
        angleX: STACK_CARDS_DEFAULTS.angleX,
        cardGap: STACK_CARDS_DEFAULTS.cardGap,
        frontFadeWindow: STACK_CARDS_DEFAULTS.frontFadeWindow,
        cardSize: STACK_CARDS_DEFAULTS.cardSize,
        cardWidth: STACK_CARDS_DEFAULTS.cardWidth,
        wheelSensitivity: STACK_CARDS_DEFAULTS.wheelSensitivity,
        mobileTouchSensitivity: STACK_CARDS_DEFAULTS.mobileTouchSensitivity,
        mobileTouchHorizontalEnabled: STACK_CARDS_DEFAULTS.mobileTouchHorizontalEnabled,
        mobileTouchVerticalEnabled: STACK_CARDS_DEFAULTS.mobileTouchVerticalEnabled,
        autoPlayEnabled: STACK_CARDS_DEFAULTS.autoPlayEnabled,
        autoPlaySpeed: STACK_CARDS_DEFAULTS.autoPlaySpeed,
        cards: cloneStackCards()
      }
  draft.nextPanelPosition = panel.nextPanelPosition ?? Direction.Down
}

interface UseSlidePropertiesFormOptions {
  panelRef: Ref<Panel | null>
  emitSave: (panel: Panel) => void
}

export function useSlidePropertiesForm(options: UseSlidePropertiesFormOptions) {
  const draft = reactive<Panel>({
    id: '',
    title: '',
    eyebrow: '',
    description: '',
    templateType: TemplateType.Scroll,
    useMarkdown: false,
    titleSize: DEFAULT_TEXT_SIZE,
    eyebrowSize: DEFAULT_TEXT_SIZE,
    descriptionSize: DEFAULT_TEXT_SIZE,
    contentAlign: DEFAULT_CONTENT_ALIGN,
    contentWidthMode: DEFAULT_CONTENT_WIDTH_MODE,
    eyebrowTitleGap: DEFAULT_EYEBROW_TITLE_GAP,
    titleDescriptionGap: DEFAULT_TITLE_DESCRIPTION_GAP,
    titleLineHeight: DEFAULT_TITLE_LINE_HEIGHT,
    descriptionLineHeight: DEFAULT_DESCRIPTION_LINE_HEIGHT,
    eyebrowLetterSpacing: DEFAULT_EYEBROW_LETTER_SPACING,
    contentMaxWidth: DEFAULT_CONTENT_MAX_WIDTH,
    contentSidePadding: DEFAULT_CONTENT_SIDE_PADDING,
    titleMaxWidth: DEFAULT_TITLE_MAX_WIDTH,
    descriptionMaxWidth: DEFAULT_DESCRIPTION_MAX_WIDTH,
    panelClass: '',
    panelColor: '',
    image: '',
    logo: '',
    logoSize: DEFAULT_TEXT_SIZE,
    logoTintEnabled: true,
    logoTintColor: DEFAULT_LOGO_TINT_COLOR,
    backgroundGradient: undefined,
    overlayEnabled: DEFAULT_OVERLAY_ENABLED_WITHOUT_IMAGE,
    overlayIntensity: DEFAULT_OVERLAY_INTENSITY,
    ctaText: '',
    ctaLink: '',
    cta: undefined,
    stackCards: {
      variant: STACK_CARDS_DEFAULTS.variant,
      textSide: STACK_CARDS_DEFAULTS.textSide,
      stackDirection: STACK_CARDS_DEFAULTS.stackDirection,
      cardsOnly: STACK_CARDS_DEFAULTS.cardsOnly,
      cardSurfaceOpacity: STACK_CARDS_DEFAULTS.cardSurfaceOpacity,
      layoutSidePadding: STACK_CARDS_DEFAULTS.layoutSidePadding,
      textOffsetX: STACK_CARDS_DEFAULTS.textOffsetX,
      textOffsetY: STACK_CARDS_DEFAULTS.textOffsetY,
      cardsOffsetX: STACK_CARDS_DEFAULTS.cardsOffsetX,
      cardsOffsetY: STACK_CARDS_DEFAULTS.cardsOffsetY,
      mobileTextCardsGap: STACK_CARDS_DEFAULTS.mobileTextCardsGap,
      angleY: STACK_CARDS_DEFAULTS.angleY,
      angleX: STACK_CARDS_DEFAULTS.angleX,
      cardGap: STACK_CARDS_DEFAULTS.cardGap,
      frontFadeWindow: STACK_CARDS_DEFAULTS.frontFadeWindow,
      cardSize: STACK_CARDS_DEFAULTS.cardSize,
      cardWidth: STACK_CARDS_DEFAULTS.cardWidth,
      wheelSensitivity: STACK_CARDS_DEFAULTS.wheelSensitivity,
      mobileTouchSensitivity: STACK_CARDS_DEFAULTS.mobileTouchSensitivity,
      mobileTouchHorizontalEnabled: STACK_CARDS_DEFAULTS.mobileTouchHorizontalEnabled,
      mobileTouchVerticalEnabled: STACK_CARDS_DEFAULTS.mobileTouchVerticalEnabled,
      autoPlayEnabled: STACK_CARDS_DEFAULTS.autoPlayEnabled,
      autoPlaySpeed: STACK_CARDS_DEFAULTS.autoPlaySpeed,
      cards: cloneStackCards()
    },
    nextPanelPosition: Direction.Down
  })

  const fileInputRef = ref<HTMLInputElement | null>(null)
  const logoFileInputRef = ref<HTMLInputElement | null>(null)
  const isDragging = ref(false)

  watch(
    () => options.panelRef.value,
    (panel) => {
      if (!panel) return
      copyPanelToDraft(panel, draft)
    },
    { immediate: true }
  )

  const save = () => {
    options.emitSave({ ...draft })
  }

  const openFilePicker = () => {
    fileInputRef.value?.click()
  }

  const openLogoFilePicker = () => {
    logoFileInputRef.value?.click()
  }

  const readImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    const hadImage = Boolean(draft.image)
    reader.onload = () => {
      draft.image = typeof reader.result === 'string' ? reader.result : ''
      draft.backgroundGradient = undefined
      if (!draft.panelColor?.trim()) {
        draft.panelColor = DEFAULT_SLIDE_COLOR
      }
      if (!hadImage && draft.image) {
        draft.overlayEnabled = DEFAULT_OVERLAY_ENABLED_WITH_IMAGE
      }
      save()
    }
    reader.readAsDataURL(file)
  }

  const onFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) readImageFile(file)
    target.value = ''
  }

  const readLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      draft.logo = typeof reader.result === 'string' ? reader.result : ''
      save()
    }
    reader.readAsDataURL(file)
  }

  const onLogoFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) readLogoFile(file)
    target.value = ''
  }

  const clearLogo = () => {
    draft.logo = ''
    save()
  }

  const onDropImage = (event: DragEvent) => {
    isDragging.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) readImageFile(file)
  }

  const clearImage = () => {
    draft.image = ''
    draft.overlayEnabled = DEFAULT_OVERLAY_ENABLED_WITHOUT_IMAGE
    if (!draft.backgroundGradient && !draft.panelColor?.trim()) {
      draft.panelColor = DEFAULT_SLIDE_COLOR
    }
    save()
  }

  const setRandomImage = () => {
    const hadImage = Boolean(draft.image)
    const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    draft.image = `${RANDOM_IMAGE_BASE_URL}/${RANDOM_IMAGE_WIDTH}/${RANDOM_IMAGE_HEIGHT}?random=${seed}`
    draft.backgroundGradient = undefined
    if (!draft.panelColor?.trim()) {
      draft.panelColor = DEFAULT_SLIDE_COLOR
    }
    if (!hadImage) {
      draft.overlayEnabled = DEFAULT_OVERLAY_ENABLED_WITH_IMAGE
    }
    save()
  }

  const resetDraft = () => {
    const panel = options.panelRef.value
    if (!panel) return
    copyPanelToDraft(panel, draft)
  }

  return {
    draft,
    fileInputRef,
    logoFileInputRef,
    isDragging,
    openFilePicker,
    openLogoFilePicker,
    onFileChange,
    onLogoFileChange,
    onDropImage,
    clearImage,
    clearLogo,
    setRandomImage,
    save,
    resetDraft
  }
}
