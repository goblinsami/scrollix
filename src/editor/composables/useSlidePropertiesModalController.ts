import { computed, ref, watch, type Ref } from 'vue'
import { ContentWidthMode, type Panel } from '@/types/navigation'
import { DEFAULT_OVERLAY_ENABLED_WITHOUT_IMAGE } from '@/constants/slideStyle'
import {
  DEFAULT_OPEN_SLIDE_PROPERTIES_SECTIONS,
  SlidePropertiesSection,
  type SlidePropertiesSection as SlidePropertiesSectionKey
} from '@/config/editor'
import { useGradientEditor } from './useGradientEditor'
import { DEFAULT_SLIDE_COLOR } from './useSlidePropertiesForm'

type PanelKey = SlidePropertiesSectionKey

interface UseSlidePropertiesModalControllerOptions {
  openRef: Ref<boolean>
  panelRef: Ref<Panel | null>
  draft: Panel
  save: () => void
  resetDraft: () => void
  emitClose: () => void
  emitSave: (panel: Panel) => void
  emitDelete: () => void
}

export function useSlidePropertiesModalController(options: UseSlidePropertiesModalControllerOptions) {
  const originalPanelSnapshot = ref<Panel | null>(null)

  const isContentWidthContained = computed(() => options.draft.contentWidthMode !== ContentWidthMode.Full)
  const onContentWidthModeToggle = (event: Event) => {
    const checked = (event.target as HTMLInputElement).checked
    options.draft.contentWidthMode = checked ? ContentWidthMode.Contained : ContentWidthMode.Full
    options.save()
  }

  const textGapValue = computed(() => Number(options.draft.eyebrowTitleGap ?? options.draft.titleDescriptionGap ?? 24))
  const onTextGapInput = (event: Event) => {
    const value = Number((event.target as HTMLInputElement).value)
    options.draft.eyebrowTitleGap = value
    options.draft.titleDescriptionGap = value
    options.save()
  }

  const isTextContentOpen = ref(false)
  const isCtasOpen = ref(false)
  const isTextStyleOpen = ref(false)
  const isStackCardsOpen = ref(false)
  const isGradientEditorOpen = ref(false)
  const isLogoEditorOpen = ref(false)
  const isImageEditorOpen = ref(false)

  const applyDefaultOpenSection = () => {
    const openSections = new Set(DEFAULT_OPEN_SLIDE_PROPERTIES_SECTIONS)
    isTextContentOpen.value = openSections.has(SlidePropertiesSection.TextContent)
    isCtasOpen.value = openSections.has(SlidePropertiesSection.Ctas)
    isTextStyleOpen.value = openSections.has(SlidePropertiesSection.TextStyle)
    isStackCardsOpen.value = openSections.has(SlidePropertiesSection.StackCards)
    isGradientEditorOpen.value = openSections.has(SlidePropertiesSection.Fill)
    isLogoEditorOpen.value = openSections.has(SlidePropertiesSection.Logo)
    isImageEditorOpen.value = openSections.has(SlidePropertiesSection.Image)
  }

  applyDefaultOpenSection()

  const {
    gradientType,
    gradientOrientation,
    gradientColors,
    orientationOptions,
    buildGradient,
    syncFromGradient
  } = useGradientEditor(options.draft.backgroundGradient)

  const togglePanel = (key: PanelKey) => {
    if (key === 'textContent') isTextContentOpen.value = !isTextContentOpen.value
    if (key === 'ctas') isCtasOpen.value = !isCtasOpen.value
    if (key === 'textStyle') isTextStyleOpen.value = !isTextStyleOpen.value
    if (key === 'stackCards') isStackCardsOpen.value = !isStackCardsOpen.value
    if (key === 'gradientEditor') isGradientEditorOpen.value = !isGradientEditorOpen.value
    if (key === 'logoEditor') isLogoEditorOpen.value = !isLogoEditorOpen.value
    if (key === 'imageEditor') isImageEditorOpen.value = !isImageEditorOpen.value
  }

  const applyGradient = () => {
    options.draft.backgroundGradient = buildGradient()
    if (options.draft.image) {
      options.draft.image = ''
      options.draft.overlayEnabled = DEFAULT_OVERLAY_ENABLED_WITHOUT_IMAGE
    }
    options.save()
  }

  const applyColorFill = (rawColor: string) => {
    options.draft.panelColor = rawColor
    options.draft.backgroundGradient = undefined
    if (options.draft.image) {
      options.draft.image = ''
      options.draft.overlayEnabled = DEFAULT_OVERLAY_ENABLED_WITHOUT_IMAGE
    }
    options.save()
  }

  const onPanelColorInput = (event: Event) => {
    const rawColor = (event.target as HTMLInputElement).value ?? ''
    applyColorFill(rawColor)
  }

  const clearGradient = () => {
    options.draft.backgroundGradient = undefined
    if (!options.draft.panelColor?.trim()) {
      options.draft.panelColor = DEFAULT_SLIDE_COLOR
    }
    options.save()
  }

  const formatNumber = (value: number | undefined, digits: number) => Number(value ?? 0).toFixed(digits)

  const saveAndClose = () => {
    options.save()
    options.emitClose()
  }

  const cancelAndClose = () => {
    if (originalPanelSnapshot.value) {
      options.emitSave({ ...originalPanelSnapshot.value })
    } else {
      options.resetDraft()
    }
    options.emitClose()
  }

  const deleteAndClose = () => {
    options.emitDelete()
    options.emitClose()
  }

  watch(
    () => options.openRef.value,
    (isOpen, wasOpen) => {
      if (!isOpen || wasOpen || !options.panelRef.value) return
      applyDefaultOpenSection()
      originalPanelSnapshot.value = { ...options.panelRef.value }
      syncFromGradient(options.draft.backgroundGradient)
    }
  )

  watch(
    () => options.panelRef.value?.id,
    (nextId, prevId) => {
      if (!options.openRef.value || !nextId || nextId === prevId || !options.panelRef.value) return
      originalPanelSnapshot.value = { ...options.panelRef.value }
      syncFromGradient(options.draft.backgroundGradient)
    }
  )

  return {
    isContentWidthContained,
    onContentWidthModeToggle,
    textGapValue,
    onTextGapInput,
    isTextContentOpen,
    isCtasOpen,
    isTextStyleOpen,
    isStackCardsOpen,
    isGradientEditorOpen,
    isLogoEditorOpen,
    isImageEditorOpen,
    gradientType,
    gradientOrientation,
    gradientColors,
    orientationOptions,
    togglePanel,
    onPanelColorInput,
    applyGradient,
    applyColorFill,
    clearGradient,
    formatNumber,
    saveAndClose,
    cancelAndClose,
    deleteAndClose
  }
}
