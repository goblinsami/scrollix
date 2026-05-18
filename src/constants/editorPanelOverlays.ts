const clampOpacity = (value: number) => Math.max(0, Math.min(1, value))

export const EDITOR_PANEL_OVERLAYS = {
  flowSidebar: {
    enabled: true,
    opacity: 0.42
  },
  slideSettings: {
    enabled: true,
    opacity: 0.42
  }
} as const

export const EDITOR_OVERLAY_CSS_VARS = {
  flowSidebarOpacity: '--editor-flow-overlay-opacity',
  slideSettingsOpacity: '--editor-slide-settings-overlay-opacity'
} as const

export const resolveEditorPanelOverlayOpacity = (enabled: boolean, opacity: number) =>
  enabled ? clampOpacity(opacity) : 0
