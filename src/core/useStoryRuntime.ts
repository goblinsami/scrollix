import { computed, isRef, ref, watch, type Ref } from 'vue'
import type { ContentSchema, Panel } from '../types/navigation'
import { TemplateType } from '../types/navigation'
import { validateContentSchema } from '../utils/validateContent'
import { normalizeSnapEase, type SnapEaseOption } from '../constants/snapEase'
import { normalizeTransitionSpeed } from '../constants/transitionSpeed'
import { normalizeAutoPlaySpeed } from '../constants/autoPlaySpeed'
import { useFlowBlocks } from './useFlowBlocks'
import { useSlideSnapNavigation } from '../composables/useSlideSnapNavigation'
import { DEFAULT_TEXT_SIZE } from '../constants/slideStyle'
import { normalizeTextSize } from '../utils/textSize'

const EMPTY_SCHEMA: ContentSchema = { panels: [] }

interface UseStoryRuntimeOptions {
  enabled?: boolean | Ref<boolean>
  logPrefix?: string
}

export function useStoryRuntime(contentRef: Ref<ContentSchema | null>, options: UseStoryRuntimeOptions = {}) {
  const enabledRef = isRef(options.enabled) ? options.enabled : ref(options.enabled ?? true)
  const schemaRef = computed<ContentSchema>(() => contentRef.value ?? EMPTY_SCHEMA)
  const validation = computed(() => validateContentSchema(schemaRef.value))
  const isValid = computed(() => validation.value.ok)
  const validationErrors = computed(() => validation.value.errors)
  const navigationEnabled = computed(() => enabledRef.value && isValid.value)

  const autoSnapEnabled = ref(true)
  const loopEnabled = ref(false)
  const autoPlayEnabled = ref(false)
  const panelsState = ref<Panel[]>([])
  const snapEase = ref<SnapEaseOption>(normalizeSnapEase(undefined))
  const transitionSpeed = ref(normalizeTransitionSpeed(undefined))
  const autoPlaySpeed = ref(normalizeAutoPlaySpeed(undefined))

  watch(
    () => schemaRef.value,
    (schema) => {
      autoSnapEnabled.value = schema.autoSnapEnabled ?? true
      loopEnabled.value = schema.loopEnabled ?? false
      autoPlayEnabled.value = schema.autoPlayEnabled ?? false
      snapEase.value = normalizeSnapEase(schema.snapEase)
      transitionSpeed.value = normalizeTransitionSpeed(schema.transitionSpeed)
      autoPlaySpeed.value = normalizeAutoPlaySpeed(schema.autoPlaySpeed)

      if (!validateContentSchema(schema).ok) {
        panelsState.value = []
        return
      }
      panelsState.value = (schema.panels ?? []).map((panel) => ({
        ...panel,
        templateType: panel.templateType ?? TemplateType.Scroll,
        titleSize: normalizeTextSize(panel.titleSize, DEFAULT_TEXT_SIZE),
        eyebrowSize: normalizeTextSize(panel.eyebrowSize, DEFAULT_TEXT_SIZE),
        descriptionSize: normalizeTextSize(panel.descriptionSize, DEFAULT_TEXT_SIZE),
        logoSize: normalizeTextSize(panel.logoSize, DEFAULT_TEXT_SIZE)
      })) as Panel[]
    },
    { immediate: true }
  )

  const { flowSteps } = useFlowBlocks(panelsState)

  const { activeStepIndex, snapShellRef, snapStageRef, stepStyle, focusStep } = useSlideSnapNavigation({
    flowSteps,
    autoSnapEnabled,
    loopEnabled,
    snapEase,
    transitionSpeed,
    autoPlayEnabled,
    autoPlaySpeed,
    enabled: navigationEnabled,
    logPrefix: options.logPrefix
  })

  const handlePanelsUpdate = (updated: Panel[]) => {
    panelsState.value = updated.map((panel) => ({ ...panel }))
  }

  const handleSnapEaseUpdate = (ease: string) => {
    snapEase.value = normalizeSnapEase(ease)
  }

  const handleLoopEnabledUpdate = (nextValue: boolean) => {
    loopEnabled.value = nextValue
  }

  const handleAutoSnapEnabledUpdate = (nextValue: boolean) => {
    autoSnapEnabled.value = nextValue
  }

  const handleTransitionSpeedUpdate = (nextValue: number) => {
    transitionSpeed.value = normalizeTransitionSpeed(nextValue)
  }

  const handleAutoPlayEnabledUpdate = (nextValue: boolean) => {
    autoPlayEnabled.value = nextValue
  }

  const handleAutoPlaySpeedUpdate = (nextValue: number) => {
    autoPlaySpeed.value = normalizeAutoPlaySpeed(nextValue)
  }

  return {
    autoSnapEnabled,
    autoPlayEnabled,
    autoPlaySpeed,
    activeStepIndex,
    flowSteps,
    isValid,
    loopEnabled,
    panelsState,
    snapEase,
    snapShellRef,
    snapStageRef,
    stepStyle,
    transitionSpeed,
    validationErrors,
    focusStep,
    handlePanelsUpdate,
    handleSnapEaseUpdate,
    handleLoopEnabledUpdate,
    handleAutoSnapEnabledUpdate,
    handleTransitionSpeedUpdate,
    handleAutoPlayEnabledUpdate,
    handleAutoPlaySpeedUpdate
  }
}
