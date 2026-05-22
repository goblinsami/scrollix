import type { StackCardItem } from '../types/navigation'

export const STACK_CARDS_CONTROL_LIMITS = {
  angleY: { min: -60, max: 60, step: 1 },
  angleX: { min: -60, max: 60, step: 1 },
  cardGap: { min: 0.6, max: 5, step: 0.1 },
  frontFadeWindow: { min: 0, max: 5, step: 0.1 },
  cardSize: { min: 0.7, max: 10, step: 0.1 },
  cardWidth: { min: 0.7, max: 2.2, step: 0.1 },
  cardSurfaceOpacity: { min: 0, max: 100, step: 1 },
  wheelSensitivity: { min: 0.4, max: 4, step: 0.1 }
} as const
export const STACK_CARDS_AUTOPLAY_LIMITS = { min: 0.4, max: 8, step: 0.1 } as const
export const STACK_CARDS_LAYOUT_SIDE_PADDING_LIMITS = { min: 0, max: 560, step: 2 } as const
export const STACK_CARDS_LAYOUT_OFFSET_LIMITS = { min: -400, max: 400, step: 2 } as const
export const STACK_CARDS_MOBILE_TOUCH_SENSITIVITY_LIMITS = { min: 0.2, max: 4, step: 0.1 } as const
export const STACK_CARDS_MOBILE_TEXT_CARDS_GAP_LIMITS = { min: -120, max: 280, step: 2 } as const

export const STACK_CARDS_CONTROLS = [
  { key: 'angleY', label: 'Y', ...STACK_CARDS_CONTROL_LIMITS.angleY },
  { key: 'angleX', label: 'X', ...STACK_CARDS_CONTROL_LIMITS.angleX },
  { key: 'cardGap', label: 'Distancia', ...STACK_CARDS_CONTROL_LIMITS.cardGap },
  { key: 'frontFadeWindow', label: 'Front fade', ...STACK_CARDS_CONTROL_LIMITS.frontFadeWindow },
  { key: 'cardSize', label: 'Tamano card', ...STACK_CARDS_CONTROL_LIMITS.cardSize },
  { key: 'cardWidth', label: 'Anchura card', ...STACK_CARDS_CONTROL_LIMITS.cardWidth },
  { key: 'cardSurfaceOpacity', label: 'Fondo card %', ...STACK_CARDS_CONTROL_LIMITS.cardSurfaceOpacity },
  { key: 'wheelSensitivity', label: 'Sensibilidad', ...STACK_CARDS_CONTROL_LIMITS.wheelSensitivity }
] as const

export const STACK_CARDS_DEFAULT_CARDS: StackCardItem[] = [
  { id: 'stack-card-1', title: 'Card 1', eyebrow: 'STEP 01', description: 'Description 1', panelColor: '#0f172a' },
  { id: 'stack-card-2', title: 'Card 2', eyebrow: 'STEP 02', description: 'Description 2', panelColor: '#1d4ed8' },
  { id: 'stack-card-3', title: 'Card 3', eyebrow: 'STEP 03', description: 'Description 3', panelColor: '#0ea5e9' }
]

export const STACK_CARDS_DEFAULTS = {
  variant: 'perspective' as const,
  textSide: 'left' as const,
  stackDirection: 'right' as const,
  cardsOnly: true,
  cardSurfaceOpacity: 100,
  layoutSidePadding: 48,
  textOffsetX: 0,
  textOffsetY: 0,
  cardsOffsetX: 0,
  cardsOffsetY: 0,
  mobileTextCardsGap: 0,
  angleY: -30,
  angleX: 0,
  cardGap: 1,
  frontFadeWindow: 0,
  cardSize: 1,
  cardWidth: 1,
  wheelSensitivity: 1,
  mobileTouchSensitivity: 1,
  mobileTouchHorizontalEnabled: true,
  mobileTouchVerticalEnabled: true,
  autoPlayEnabled: false,
  autoPlaySpeed: 1.6
} as const
