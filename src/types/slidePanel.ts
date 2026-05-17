import type {
  ContentAlign as SlideContentAlign,
  ContentWidthMode as SlideContentWidthMode,
  Direction,
  PanelCta,
  StackCardsSettings,
  TemplateType,
  TextSize as SlideTextSize
} from './navigation'

export interface SlidePanelProps {
  title: string
  eyebrow?: string
  description?: string
  templateType?: TemplateType
  stackCards?: StackCardsSettings
  useMarkdown?: boolean
  titleSize?: SlideTextSize
  eyebrowSize?: SlideTextSize
  descriptionSize?: SlideTextSize
  contentAlign?: SlideContentAlign
  contentWidthMode?: SlideContentWidthMode
  eyebrowTitleGap?: number
  titleDescriptionGap?: number
  titleLineHeight?: number
  descriptionLineHeight?: number
  eyebrowLetterSpacing?: number
  contentMaxWidth?: number
  contentSidePadding?: number
  titleMaxWidth?: number
  descriptionMaxWidth?: number
  panelClass?: string
  panelColor?: string
  image?: string
  logo?: string
  logoSize?: SlideTextSize
  logoTintEnabled?: boolean
  logoTintColor?: string
  backgroundGradient?: string
  overlayEnabled?: boolean
  overlayIntensity?: number
  enableCtas?: boolean
  ctaText?: string
  ctaLink?: string
  cta?: PanelCta
  animateKey?: string
  direction: Direction
  showDirectionIcon?: boolean
}
