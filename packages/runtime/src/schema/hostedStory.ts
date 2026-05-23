import { STACK_CARDS_DEFAULTS, STACK_CARDS_DEFAULT_CARDS } from '../runtime-core/constants/stackCards'
import {
  ContentAlign,
  Direction,
  TemplateType,
  TextSize,
  type StackCardItem,
  type StackCardsSettings
} from '../runtime-core/types/navigation'
import {
  HOSTED_STORY_TYPE,
  type HostedRuntimePanel,
  type HostedStackCard,
  type HostedStackCardsConfig,
  type HostedStackCardsSettings,
  type HostedStoryRecord,
  type HostedStoryType
} from '../types/hostedStories'

const DEFAULT_PANEL_TITLE = 'Create cinematic storytelling experiences'
const DEFAULT_PANEL_EYEBROW = 'Built with Scrollix'
const DEFAULT_PANEL_DESCRIPTION = 'Portable, hosted stack cards runtime rendered by Vue inside Web Components.'

const DEFAULT_STORY_TYPE: HostedStoryType = HOSTED_STORY_TYPE.StackCards3d

const asFiniteNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const normalizeCard = (card: Partial<HostedStackCard>, index: number): HostedStackCard => {
  const fallback = STACK_CARDS_DEFAULT_CARDS[index % STACK_CARDS_DEFAULT_CARDS.length]

  return {
    ...fallback,
    ...card,
    id: typeof card.id === 'string' && card.id.trim() ? card.id : `stack-card-${index + 1}`,
    title: typeof card.title === 'string' ? card.title : fallback.title,
    eyebrow: typeof card.eyebrow === 'string' ? card.eyebrow : fallback.eyebrow,
    description: typeof card.description === 'string' ? card.description : fallback.description,
    panelColor: typeof card.panelColor === 'string' ? card.panelColor : fallback.panelColor,
    image: typeof card.image === 'string' ? card.image : undefined
  }
}

const normalizeCards = (cards: unknown): StackCardItem[] => {
  if (!Array.isArray(cards) || cards.length === 0) {
    return STACK_CARDS_DEFAULT_CARDS.map((item) => ({ ...item }))
  }

  return cards
    .map((card, index) => {
      if (!card || typeof card !== 'object') return null
      return normalizeCard(card as Partial<HostedStackCard>, index)
    })
    .filter((item): item is StackCardItem => Boolean(item))
}

const normalizeSettings = (settings: HostedStackCardsSettings | undefined, cards: StackCardItem[]): StackCardsSettings => ({
  cards,
  variant: settings?.variant ?? STACK_CARDS_DEFAULTS.variant,
  textSide: settings?.textSide ?? STACK_CARDS_DEFAULTS.textSide,
  stackDirection: settings?.stackDirection ?? STACK_CARDS_DEFAULTS.stackDirection,
  cardsOnly: settings?.cardsOnly ?? STACK_CARDS_DEFAULTS.cardsOnly,
  fitCardToImage: settings?.fitCardToImage ?? STACK_CARDS_DEFAULTS.fitCardToImage,
  cardSurfaceOpacity: settings?.cardSurfaceOpacity ?? STACK_CARDS_DEFAULTS.cardSurfaceOpacity,
  layoutSidePadding: settings?.layoutSidePadding ?? STACK_CARDS_DEFAULTS.layoutSidePadding,
  textOffsetX: settings?.textOffsetX ?? STACK_CARDS_DEFAULTS.textOffsetX,
  textOffsetY: settings?.textOffsetY ?? STACK_CARDS_DEFAULTS.textOffsetY,
  cardsOffsetX: settings?.cardsOffsetX ?? STACK_CARDS_DEFAULTS.cardsOffsetX,
  cardsOffsetY: settings?.cardsOffsetY ?? STACK_CARDS_DEFAULTS.cardsOffsetY,
  mobileTextCardsGap: settings?.mobileTextCardsGap ?? STACK_CARDS_DEFAULTS.mobileTextCardsGap,
  angleY: settings?.angleY ?? STACK_CARDS_DEFAULTS.angleY,
  angleX: settings?.angleX ?? STACK_CARDS_DEFAULTS.angleX,
  cardGap: settings?.cardGap ?? STACK_CARDS_DEFAULTS.cardGap,
  frontFadeWindow: settings?.frontFadeWindow ?? STACK_CARDS_DEFAULTS.frontFadeWindow,
  cardSize: settings?.cardSize ?? STACK_CARDS_DEFAULTS.cardSize,
  cardWidth: settings?.cardWidth ?? STACK_CARDS_DEFAULTS.cardWidth,
  autoPlayEnabled: settings?.autoPlayEnabled ?? STACK_CARDS_DEFAULTS.autoPlayEnabled,
  autoPlaySpeed: settings?.autoPlaySpeed ?? STACK_CARDS_DEFAULTS.autoPlaySpeed
})

const normalizeConfig = (config: unknown): HostedStackCardsConfig => {
  if (!config || typeof config !== 'object') {
    return {
      cards: STACK_CARDS_DEFAULT_CARDS.map((card) => ({ ...card })),
      settings: { ...STACK_CARDS_DEFAULTS }
    }
  }

  const rawConfig = config as Partial<HostedStackCardsConfig>
  const cards = normalizeCards(rawConfig.cards)

  return {
    cards,
    settings: rawConfig.settings ? { ...rawConfig.settings } : { ...STACK_CARDS_DEFAULTS }
  }
}

const deriveConfigFromLegacyContentJson = (contentJson: unknown): HostedStackCardsConfig | null => {
  if (!contentJson || typeof contentJson !== 'object') return null

  const panels = (contentJson as { panels?: unknown }).panels
  if (!Array.isArray(panels) || panels.length === 0) return null

  const stackPanel = panels.find((panel) => {
    if (!panel || typeof panel !== 'object') return false
    const rawPanel = panel as {
      templateType?: unknown
      stackCards?: unknown
    }
    if (rawPanel.stackCards && typeof rawPanel.stackCards === 'object') return true
    return rawPanel.templateType === TemplateType.StackCards
  }) as
    | ({
        title?: unknown
        eyebrow?: unknown
        description?: unknown
        titleSize?: unknown
        descriptionSize?: unknown
        contentAlign?: unknown
        titleMaxWidth?: unknown
        descriptionMaxWidth?: unknown
        overlayIntensity?: unknown
        panelColor?: unknown
        image?: unknown
        backgroundGradient?: unknown
        stackCards?: unknown
      })
    | undefined

  if (!stackPanel) return null

  const stackCards =
    stackPanel.stackCards && typeof stackPanel.stackCards === 'object'
      ? (stackPanel.stackCards as Record<string, unknown>)
      : {}

  const cards = normalizeCards(stackCards.cards)

  const settings: HostedStackCardsSettings = {
    title: typeof stackPanel.title === 'string' ? stackPanel.title : undefined,
    eyebrow: typeof stackPanel.eyebrow === 'string' ? stackPanel.eyebrow : undefined,
    description: typeof stackPanel.description === 'string' ? stackPanel.description : undefined,
    titleSize: stackPanel.titleSize as TextSize | undefined,
    descriptionSize: stackPanel.descriptionSize as TextSize | undefined,
    contentAlign: stackPanel.contentAlign as ContentAlign | undefined,
    titleMaxWidth: asFiniteNumber(stackPanel.titleMaxWidth),
    descriptionMaxWidth: asFiniteNumber(stackPanel.descriptionMaxWidth),
    overlayIntensity: asFiniteNumber(stackPanel.overlayIntensity),
    panelColor: typeof stackPanel.panelColor === 'string' ? stackPanel.panelColor : undefined,
    image: typeof stackPanel.image === 'string' ? stackPanel.image : undefined,
    backgroundGradient:
      typeof stackPanel.backgroundGradient === 'string'
        ? stackPanel.backgroundGradient
        : undefined,
    variant: stackCards.variant as StackCardsSettings['variant'],
    textSide: stackCards.textSide as StackCardsSettings['textSide'],
    stackDirection: stackCards.stackDirection as StackCardsSettings['stackDirection'],
    cardsOnly: typeof stackCards.cardsOnly === 'boolean' ? stackCards.cardsOnly : undefined,
    fitCardToImage: typeof stackCards.fitCardToImage === 'boolean' ? stackCards.fitCardToImage : undefined,
    cardSurfaceOpacity: asFiniteNumber(stackCards.cardSurfaceOpacity),
    layoutSidePadding: asFiniteNumber(stackCards.layoutSidePadding),
    textOffsetX: asFiniteNumber(stackCards.textOffsetX),
    textOffsetY: asFiniteNumber(stackCards.textOffsetY),
    cardsOffsetX: asFiniteNumber(stackCards.cardsOffsetX),
    cardsOffsetY: asFiniteNumber(stackCards.cardsOffsetY),
    mobileTextCardsGap: asFiniteNumber(stackCards.mobileTextCardsGap),
    angleY: asFiniteNumber(stackCards.angleY),
    angleX: asFiniteNumber(stackCards.angleX),
    cardGap: asFiniteNumber(stackCards.cardGap),
    frontFadeWindow: asFiniteNumber(stackCards.frontFadeWindow),
    cardSize: asFiniteNumber(stackCards.cardSize),
    cardWidth: asFiniteNumber(stackCards.cardWidth),
    autoPlayEnabled:
      typeof stackCards.autoPlayEnabled === 'boolean' ? stackCards.autoPlayEnabled : undefined,
    autoPlaySpeed: asFiniteNumber(stackCards.autoPlaySpeed)
  }

  return {
    cards,
    settings
  }
}

export const normalizeHostedStory = (record: Partial<HostedStoryRecord>): HostedStoryRecord => {
  const normalizedType =
    record.type === HOSTED_STORY_TYPE.StackCards3d ? record.type : DEFAULT_STORY_TYPE

  const rawConfig = (record as { config?: unknown }).config
  const legacyContentJson = (record as { content_json?: unknown }).content_json

  const rawConfigHasCards =
    rawConfig &&
    typeof rawConfig === 'object' &&
    Array.isArray((rawConfig as { cards?: unknown[] }).cards) &&
    ((rawConfig as { cards?: unknown[] }).cards?.length ?? 0) > 0

  const configFromLegacy = deriveConfigFromLegacyContentJson(legacyContentJson)
  const normalizedConfig =
    !rawConfigHasCards && configFromLegacy
      ? configFromLegacy
      : normalizeConfig(rawConfig)

  return {
    id: typeof record.id === 'string' ? record.id : '',
    type: normalizedType,
    config: normalizedConfig,
    created_at: typeof record.created_at === 'string' ? record.created_at : '',
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : ''
  }
}

export const mapHostedStoryToRuntimePanel = (story: HostedStoryRecord): HostedRuntimePanel & {
  stackCards: StackCardsSettings
  templateType: TemplateType
  panelClass: string
  direction: Direction
} => {
  const normalizedStory = normalizeHostedStory(story)
  const cards = normalizeCards(normalizedStory.config.cards)
  const settings = normalizedStory.config.settings ?? {}

  return {
    templateType: TemplateType.StackCards,
    panelClass: 'panel--hosted-runtime',
    direction: Direction.Down,
    stackCards: normalizeSettings(settings, cards),
    title: settings.title ?? DEFAULT_PANEL_TITLE,
    eyebrow: settings.eyebrow ?? DEFAULT_PANEL_EYEBROW,
    description: settings.description ?? DEFAULT_PANEL_DESCRIPTION,
    titleSize: settings.titleSize ?? TextSize.Large,
    descriptionSize: settings.descriptionSize ?? TextSize.Medium,
    contentAlign: settings.contentAlign ?? ContentAlign.Left,
    titleMaxWidth: settings.titleMaxWidth,
    descriptionMaxWidth: settings.descriptionMaxWidth,
    panelColor: settings.panelColor,
    image: settings.image,
    backgroundGradient: settings.backgroundGradient,
    overlayIntensity: settings.overlayIntensity
  }
}

