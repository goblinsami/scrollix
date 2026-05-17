import { computed, onMounted, onUnmounted, ref, toRef, watch, type Ref } from 'vue'
import { ContentAlign } from '@/types/navigation'
import { useFlowEditor } from './useFlowEditor'
import { loadStory } from '@/core/storySource'
import {
  MAX_TRANSITION_SPEED,
  MIN_TRANSITION_SPEED,
  TRANSITION_SPEED_STEP,
  normalizeTransitionSpeed
} from '@/constants/transitionSpeed'
import {
  AUTOPLAY_SPEED_STEP,
  MAX_AUTOPLAY_SPEED,
  MIN_AUTOPLAY_SPEED,
  normalizeAutoPlaySpeed
} from '@/constants/autoPlaySpeed'
import type { FlowEditorEmit, FlowEditorExposed, FlowEditorProps } from '../types/flowEditor'

const DESKTOP_BREAKPOINT_QUERY = '(min-width: 1024px)'

interface UseFlowEditorControllerResult {
  showModal: Ref<boolean>
  canvasRef: Ref<HTMLElement | null>
  showSettings: Ref<boolean>
  positionedPanels: ReturnType<typeof useFlowEditor>['positionedPanels']
  canvasStyle: ReturnType<typeof useFlowEditor>['canvasStyle']
  stageStyle: ReturnType<typeof useFlowEditor>['stageStyle']
  flowLinks: ReturnType<typeof useFlowEditor>['flowLinks']
  selectedPanel: ReturnType<typeof useFlowEditor>['selectedPanel']
  nodeStyle: ReturnType<typeof useFlowEditor>['nodeStyle']
  closeSettings: ReturnType<typeof useFlowEditor>['closeSettings']
  saveSettings: ReturnType<typeof useFlowEditor>['saveSettings']
  deletePanel: ReturnType<typeof useFlowEditor>['deletePanel']
  deletePanelAt: ReturnType<typeof useFlowEditor>['deletePanelAt']
  exportFlowJson: ReturnType<typeof useFlowEditor>['exportFlowJson']
  insertableDirections: ReturnType<typeof useFlowEditor>['insertableDirections']
  insertAfter: ReturnType<typeof useFlowEditor>['insertAfter']
  availableStoryIds: Readonly<Ref<string[]>>
  selectedDataFile: Ref<string>
  selectedAutoSnapEnabled: Ref<boolean>
  selectedEase: Ref<string>
  selectedTransitionSpeed: Ref<number>
  selectedAutoPlayEnabled: Ref<boolean>
  selectedAutoPlaySpeed: Ref<number>
  selectedLoopEnabled: Ref<boolean>
  isDesktop: Ref<boolean>
  jsonFileInputRef: Ref<HTMLInputElement | null>
  isTransitionOpen: Ref<boolean>
  isAutoPlayOpen: Ref<boolean>
  isFilesOpen: Ref<boolean>
  slideSettingsSide: Readonly<Ref<'left' | 'right'>>
  toggleSlideSettingsSide: () => void
  MIN_TRANSITION_SPEED: number
  MAX_TRANSITION_SPEED: number
  TRANSITION_SPEED_STEP: number
  MIN_AUTOPLAY_SPEED: number
  MAX_AUTOPLAY_SPEED: number
  AUTOPLAY_SPEED_STEP: number
  toggleModal: () => void
  emitSnapEase: () => void
  emitAutoSnapEnabled: () => void
  emitTransitionSpeed: () => void
  emitAutoPlayEnabled: () => void
  emitAutoPlaySpeed: () => void
  emitLoopEnabled: () => void
  handleNodeClick: (index: number) => void
  importSelectedDataFile: () => Promise<void>
  onJsonFileChange: (event: Event) => Promise<void>
  openJsonFilePicker: () => void
  exposed: FlowEditorExposed
}

export function useFlowEditorController(
  props: Readonly<FlowEditorProps>,
  emit: FlowEditorEmit
): UseFlowEditorControllerResult {
  const {
    showModal,
    canvasRef,
    showSettings,
    positionedPanels,
    canvasStyle,
    stageStyle,
    flowLinks,
    selectedPanel,
    toggleModal,
    nodeStyle,
    openSettings,
    closeSettings,
    saveSettings,
    deletePanel,
    deletePanelAt,
    exportFlowJson,
    importFlowObject,
    importFlowFromFile,
    insertableDirections,
    insertAfter
  } = useFlowEditor(toRef(props, 'panels'), (panels) => emit('update:panels', panels))

  const availableStoryIds = computed(() => props.availableStories ?? [])

  const selectedDataFile = ref('')
  const selectedAutoSnapEnabled = ref(props.autoSnapEnabled)
  const selectedEase = ref(props.snapEase)
  const selectedTransitionSpeed = ref(normalizeTransitionSpeed(props.transitionSpeed))
  const selectedAutoPlayEnabled = ref(props.autoPlayEnabled)
  const selectedAutoPlaySpeed = ref(normalizeAutoPlaySpeed(props.autoPlaySpeed))
  const selectedLoopEnabled = ref(props.loopEnabled)
  const isDesktop = ref(false)
  const jsonFileInputRef = ref<HTMLInputElement | null>(null)
  const isTransitionOpen = ref(false)
  const isAutoPlayOpen = ref(false)
  const isFilesOpen = ref(false)
  const slideSettingsSideOverride = ref<'left' | 'right' | null>(null)

  const applyViewportMode = () => {
    const desktop = window.matchMedia(DESKTOP_BREAKPOINT_QUERY).matches
    const wasDesktop = isDesktop.value
    isDesktop.value = desktop

    if (desktop && !wasDesktop) {
      showModal.value = true
    }
  }

  onMounted(() => {
    applyViewportMode()
    window.addEventListener('resize', applyViewportMode)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', applyViewportMode)
  })

  watch(
    () => props.autoSnapEnabled,
    (value) => {
      selectedAutoSnapEnabled.value = value
    }
  )

  watch(
    () => props.snapEase,
    (value) => {
      selectedEase.value = value
    }
  )

  watch(
    () => props.loopEnabled,
    (value) => {
      selectedLoopEnabled.value = value
    }
  )

  watch(
    () => props.autoPlayEnabled,
    (value) => {
      selectedAutoPlayEnabled.value = value
    }
  )

  watch(
    () => props.autoPlaySpeed,
    (value) => {
      selectedAutoPlaySpeed.value = normalizeAutoPlaySpeed(value)
    }
  )

  watch(
    () => props.transitionSpeed,
    (value) => {
      selectedTransitionSpeed.value = normalizeTransitionSpeed(value)
    }
  )

  const emitSnapEase = () => {
    emit('update:snapEase', selectedEase.value)
  }

  const emitAutoSnapEnabled = () => {
    emit('update:auto-snap-enabled', selectedAutoSnapEnabled.value)
  }

  const emitTransitionSpeed = () => {
    const normalized = normalizeTransitionSpeed(selectedTransitionSpeed.value)
    selectedTransitionSpeed.value = normalized
    emit('update:transition-speed', normalized)
  }

  const emitAutoPlayEnabled = () => {
    emit('update:auto-play-enabled', selectedAutoPlayEnabled.value)
  }

  const emitAutoPlaySpeed = () => {
    const normalized = normalizeAutoPlaySpeed(selectedAutoPlaySpeed.value)
    selectedAutoPlaySpeed.value = normalized
    emit('update:auto-play-speed', normalized)
  }

  const emitLoopEnabled = () => {
    emit('update:loopEnabled', selectedLoopEnabled.value)
  }

  const handleNodeClick = (index: number) => {
    emit('focusStep', index)
    openSettings(index)
  }

  const autoSlideSettingsSide = computed<'left' | 'right'>(() => {
    const align = selectedPanel.value?.contentAlign
    if (align === ContentAlign.Left) return 'right'
    if (align === ContentAlign.Right) return 'left'
    return 'right'
  })
  const slideSettingsSide = computed<'left' | 'right'>(() => slideSettingsSideOverride.value ?? autoSlideSettingsSide.value)
  const toggleSlideSettingsSide = () => {
    const current = slideSettingsSide.value
    slideSettingsSideOverride.value = current === 'left' ? 'right' : 'left'
  }

  const importSelectedDataFile = async () => {
    if (!selectedDataFile.value) return
    try {
      const nextData = await loadStory(selectedDataFile.value)
      importFlowObject(nextData)
    } catch (error) {
      console.warn(`[flow-editor] Failed to load story "${selectedDataFile.value}"`, error)
    }
  }

  const onJsonFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) await importFlowFromFile(file)
    input.value = ''
  }

  const openJsonFilePicker = () => {
    jsonFileInputRef.value?.click()
  }

  const openSlideSettings = (index: number) => {
    if (index < 0 || index >= props.panels.length) return
    openSettings(index)
  }

  const toggleFlowEditor = () => {
    const willClose = showModal.value
    toggleModal()
    if (willClose) {
      closeSettings()
    }
    return showModal.value
  }

  const isFlowEditorOpen = () => showModal.value

  const exposed: FlowEditorExposed = {
    openSlideSettings,
    toggleFlowEditor,
    isFlowEditorOpen
  }

  return {
    showModal,
    canvasRef,
    showSettings,
    positionedPanels,
    canvasStyle,
    stageStyle,
    flowLinks,
    selectedPanel,
    nodeStyle,
    closeSettings,
    saveSettings,
    deletePanel,
    deletePanelAt,
    exportFlowJson,
    insertableDirections,
    insertAfter,
    availableStoryIds,
    selectedDataFile,
    selectedAutoSnapEnabled,
    selectedEase,
    selectedTransitionSpeed,
    selectedAutoPlayEnabled,
    selectedAutoPlaySpeed,
    selectedLoopEnabled,
    isDesktop,
    jsonFileInputRef,
    isTransitionOpen,
    isAutoPlayOpen,
    isFilesOpen,
    slideSettingsSide,
    toggleSlideSettingsSide,
    MIN_TRANSITION_SPEED,
    MAX_TRANSITION_SPEED,
    TRANSITION_SPEED_STEP,
    MIN_AUTOPLAY_SPEED,
    MAX_AUTOPLAY_SPEED,
    AUTOPLAY_SPEED_STEP,
    toggleModal,
    emitSnapEase,
    emitAutoSnapEnabled,
    emitTransitionSpeed,
    emitAutoPlayEnabled,
    emitAutoPlaySpeed,
    emitLoopEnabled,
    handleNodeClick,
    importSelectedDataFile,
    onJsonFileChange,
    openJsonFilePicker,
    exposed
  }
}
