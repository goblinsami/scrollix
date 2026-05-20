export type TextContentHighlightScope = 'content' | 'eyebrow' | 'title' | 'description'

export interface TextContentEditingChangePayload {
  targetId: string | null
  active: boolean
  scope?: TextContentHighlightScope
}
