import type { Panel } from '@/types/navigation'
import type { TextContentEditingChangePayload } from '@/types/textContentHighlight'
export type { TextContentEditingChangePayload } from '@/types/textContentHighlight'

export interface FlowEditorProps {
  panels: Panel[]
  autoSnapEnabled: boolean
  snapEase: string
  transitionSpeed: number
  autoPlayEnabled: boolean
  autoPlaySpeed: number
  loopEnabled: boolean
  easeOptions: readonly string[]
  availableStories?: string[]
  canUploadImages?: boolean
  enableCtas?: boolean
}

export type FlowEditorEmit = {
  (event: 'update:panels', panels: Panel[]): void
  (event: 'update:auto-snap-enabled', enabled: boolean): void
  (event: 'update:snapEase', ease: string): void
  (event: 'update:transition-speed', speed: number): void
  (event: 'update:auto-play-enabled', enabled: boolean): void
  (event: 'update:auto-play-speed', speed: number): void
  (event: 'update:loopEnabled', enabled: boolean): void
  (event: 'focusStep', index: number): void
  (event: 'text-content-editing-change', payload: TextContentEditingChangePayload): void
}

export interface FlowEditorExposed {
  openSlideSettings: (index: number) => void
  toggleFlowEditor: () => boolean
  isFlowEditorOpen: () => boolean
}
