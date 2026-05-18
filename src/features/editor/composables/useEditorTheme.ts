import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  EDITOR_THEME,
  EDITOR_THEME_DATA_ATTR,
  EDITOR_THEME_STORAGE_KEY,
  type EditorTheme
} from '@/constants/editorTheme'
import {
  EDITOR_OVERLAY_CSS_VARS,
  EDITOR_PANEL_OVERLAYS,
  resolveEditorPanelOverlayOpacity
} from '@/constants/editorPanelOverlays'

const isEditorTheme = (value: string | null): value is EditorTheme =>
  value === EDITOR_THEME.Dark || value === EDITOR_THEME.Light

const resolveInitialTheme = (): EditorTheme => {
  if (typeof window === 'undefined') return EDITOR_THEME.Dark

  const stored = window.localStorage.getItem(EDITOR_THEME_STORAGE_KEY)
  if (isEditorTheme(stored)) return stored

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? EDITOR_THEME.Dark
    : EDITOR_THEME.Light
}

const applyThemeAttribute = (theme: EditorTheme) => {
  if (typeof document === 'undefined') return
  document.body.setAttribute(EDITOR_THEME_DATA_ATTR, theme)
}

const applyOverlayCssVariables = () => {
  if (typeof document === 'undefined') return
  const rootStyle = document.documentElement.style
  rootStyle.setProperty(
    EDITOR_OVERLAY_CSS_VARS.flowSidebarOpacity,
    String(
      resolveEditorPanelOverlayOpacity(
        EDITOR_PANEL_OVERLAYS.flowSidebar.enabled,
        EDITOR_PANEL_OVERLAYS.flowSidebar.opacity
      )
    )
  )
  rootStyle.setProperty(
    EDITOR_OVERLAY_CSS_VARS.slideSettingsOpacity,
    String(
      resolveEditorPanelOverlayOpacity(
        EDITOR_PANEL_OVERLAYS.slideSettings.enabled,
        EDITOR_PANEL_OVERLAYS.slideSettings.opacity
      )
    )
  )
}

export function useEditorTheme() {
  const theme = ref<EditorTheme>(resolveInitialTheme())

  watch(
    theme,
    (nextTheme) => {
      applyThemeAttribute(nextTheme)
      applyOverlayCssVariables()
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(EDITOR_THEME_STORAGE_KEY, nextTheme)
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    if (typeof document === 'undefined') return
    document.body.removeAttribute(EDITOR_THEME_DATA_ATTR)
    const rootStyle = document.documentElement.style
    rootStyle.removeProperty(EDITOR_OVERLAY_CSS_VARS.flowSidebarOpacity)
    rootStyle.removeProperty(EDITOR_OVERLAY_CSS_VARS.slideSettingsOpacity)
  })

  const isDarkTheme = computed(() => theme.value === EDITOR_THEME.Dark)
  const toggleTheme = () => {
    theme.value = isDarkTheme.value ? EDITOR_THEME.Light : EDITOR_THEME.Dark
  }

  return {
    theme,
    isDarkTheme,
    toggleTheme
  }
}
