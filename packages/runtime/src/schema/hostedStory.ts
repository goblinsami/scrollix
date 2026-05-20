import { STACK_CARDS_DEFAULTS, STACK_CARDS_DEFAULT_CARDS } from '@/constants/stackCards'
import { ContentAlign, Direction, TemplateType, TextSize, type StackCardItem, type StackCardsSettings } from '@/types/navigation'
import {
  HOSTED_STORY_TYPE,
  type HostedRuntimePanel,
  type HostedStackCard,
  type HostedStackCardsConfig,
  type HostedStackCardsSettings,
  type HostedStoryRecord,
  type HostedStoryType
} from '@/types/hostedStories'

const DEFAULT_PANEL_TITLE = 'Create cinematic storytelling experiences'
const DEFAULT_PANEL_EYEBROW = 'Built with Scrollix'
const DEFAULT_PANEL_DESCRIPTION = 'Portable, hosted stack cards runtime rendered by Vue inside Web Components.'

const DEFAULT_STORY_TYPE: HostedStoryType = HOSTED_STORY_TYPE.StackCards3d

const normalizeCard = (card: Partial<HostedStackCard>, index: number): HostedStackCard => {
  const fallback = STACK_CARDS_DEFAULT_CARDS[index % STACK_CARDS_DEFAULT_CARDS.length]

  return {
    ...fallback,
    ...card,
    id: typeof card.id === 'string' && card.id.trim() ? card.id : `stack-card-${index + 1}`,
    title: typeof card.title === 'string' && card.title.trim() ? card.title : fallback.title,
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
  textSide: settings?.textSide ?? STACK_CARDS_DEFAULTS.textSide,
  stackDirection: settings?.stackDirection ?? STACK_CARDS_DEFAULTS.stackDirection,
  cardsOnly: settings?.cardsOnly ?? STACK_CARDS_DEFAULTS.cardsOnly,
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

export const normalizeHostedStory = (record: Partial<HostedStoryRecord>): HostedStoryRecord => {
  const normalizedType =
    record.type === HOSTED_STORY_TYPE.StackCards3d ? record.type : DEFAULT_STORY_TYPE

  return {
    id: typeof record.id === 'string' ? record.id : '',
    type: normalizedType,
    config: normalizeConfig(record.config),
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
