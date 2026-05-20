import type { ContentAlign, Panel, StackCardItem, StackCardsSettings, TextSize } from './navigation'

export const HOSTED_STORY_TYPE = {
  StackCards3d: '3d-stack-cards'
} as const

export type HostedStoryType = (typeof HOSTED_STORY_TYPE)[keyof typeof HOSTED_STORY_TYPE]

export type HostedStackCard = StackCardItem

export interface HostedStackCardsSettings extends Omit<Partial<StackCardsSettings>, 'cards'> {
  title?: string
  eyebrow?: string
  description?: string
  titleSize?: TextSize
  descriptionSize?: TextSize
  contentAlign?: ContentAlign
  titleMaxWidth?: number
  descriptionMaxWidth?: number
  overlayIntensity?: number
  panelColor?: string
  image?: string
  backgroundGradient?: string
}

export interface HostedStackCardsConfig {
  cards: HostedStackCard[]
  settings?: HostedStackCardsSettings
}

export interface HostedStoryConfig {
  type: HostedStoryType
  config: HostedStackCardsConfig
}

export interface HostedStoryRecord {
  id: string
  type: HostedStoryType
  config: HostedStackCardsConfig
  created_at: string
  updated_at: string
}

export interface SaveHostedStoryInput {
  id?: string
  type: HostedStoryType
  config: HostedStackCardsConfig
}

export interface UpdateHostedStoryInput extends SaveHostedStoryInput {
  id: string
}

export type HostedRuntimePanel = Pick<
  Panel,
  | 'title'
  | 'eyebrow'
  | 'description'
  | 'titleSize'
  | 'descriptionSize'
  | 'contentAlign'
  | 'titleMaxWidth'
  | 'descriptionMaxWidth'
  | 'panelColor'
  | 'image'
  | 'backgroundGradient'
  | 'overlayIntensity'
>
