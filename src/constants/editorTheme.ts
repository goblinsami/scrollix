export const EDITOR_THEME = {
  Dark: 'dark',
  Light: 'light'
} as const

export type EditorTheme = (typeof EDITOR_THEME)[keyof typeof EDITOR_THEME]

export const EDITOR_THEME_STORAGE_KEY = 'scrollix.editor.theme'
export const EDITOR_THEME_DATA_ATTR = 'data-editor-theme'
