import { computed, nextTick, ref, watch, type Ref } from 'vue'
import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { Direction, TemplateType, type Panel } from '../../types/navigation'
import {
  DEFAULT_CONTENT_ALIGN,
  DEFAULT_CONTENT_MAX_WIDTH,
  DEFAULT_CONTENT_WIDTH_MODE,
  DEFAULT_DESCRIPTION_LINE_HEIGHT,
  DEFAULT_DESCRIPTION_MAX_WIDTH,
  DEFAULT_EYEBROW_LETTER_SPACING,
  DEFAULT_EYEBROW_TITLE_GAP,
  DEFAULT_OVERLAY_ENABLED_WITHOUT_IMAGE,
  DEFAULT_OVERLAY_INTENSITY,
  DEFAULT_TEXT_SIZE,
  DEFAULT_TITLE_DESCRIPTION_GAP,
  DEFAULT_TITLE_LINE_HEIGHT,
  DEFAULT_TITLE_MAX_WIDTH,
  deriveDescriptionMaxWidthFromContent,
  deriveTitleMaxWidthFromContent
} from '../../constants/slideStyle'
import { validateContentSchema } from '../../utils/validateContent'
import { FEATURE_FLAGS } from '../../config/featureFlags'
import { normalizeTextSize } from '../../utils/textSize'

gsap.registerPlugin(ScrollToPlugin)

const STEP = 92
const BLOCK_WIDTH = 96
const BLOCK_HEIGHT = 88
const CANVAS_PADDING = 24
const CANVAS_MAX_WIDTH = '100%'
const CANVAS_MAX_HEIGHT = '100%'
const PANEL_CLASS_POOL = ['contrast', 'outro', 'red', 'danger', 'ocean', 'forest', 'violet', 'amber'] as const
const PANEL_COLOR_POOL = ['#1f2937', '#e8f1ff', '#ff4d4d', '#b42318', '#0e7490', '#166534', '#6d28d9', '#f59e0b'] as const

const DEFAULT_DIRECTION: Direction = Direction.Down
const DEFAULT_EYEBROW = 'Section SUBTITLE'
const DEFAULT_TITLE_PREFIX = 'New Panel'
const SCROLL_DELAY_MS = 80
const MIN_PANELS_ALLOWED = 1
const DELETE_LAST_PANEL_ERROR = 'No puedes eliminar el único panel del flujo.'
const INVALID_STRUCTURE_TITLE = 'Estructura inválida:'
const ID_PREFIX = 'panel'
const ALLOWED_INSERT_DIRECTIONS: Direction[] = [Direction.Up, Direction.Down, Direction.Left, Direction.Right]
const NEW_PANEL_TITLE_REGEX = /^New Panel \d+$/i
const SECTION_TITLE_REGEX = /^Section \d+(?::\s*)?/i
const SECTION_TITLE_REPLACEMENT = (n: number) => `Section ${n}: `
const EXPORT_FILE_NAME = 'flow-export.json'

const INVALID_IMPORT_TITLE = 'JSON de importación inválido:'

export function useFlowEditor(panelsRef: Ref<Panel[]>, emitUpdatePanels: (panels: Panel[]) => void) {
  const showModal = ref(false)
  const localPanels = ref<Panel[]>([])
  const canvasRef = ref<HTMLElement | null>(null)
  const showSettings = ref(false)
  const selectedIndex = ref<number | null>(null)
  const pendingScrollToLast = ref(false)

  watch(
    () => panelsRef.value,
    (value) => {
      localPanels.value = value.map((p) => {
        const contentMaxWidth = p.contentMaxWidth ?? DEFAULT_CONTENT_MAX_WIDTH
        return {
          ...p,
          templateType: p.templateType ?? TemplateType.Scroll,
          titleSize: normalizeTextSize(p.titleSize, DEFAULT_TEXT_SIZE),
          eyebrowSize: normalizeTextSize(p.eyebrowSize, DEFAULT_TEXT_SIZE),
          descriptionSize: normalizeTextSize(p.descriptionSize, DEFAULT_TEXT_SIZE),
          logoSize: normalizeTextSize(p.logoSize, DEFAULT_TEXT_SIZE),
          nextPanelPosition: p.nextPanelPosition ?? DEFAULT_DIRECTION,
          contentWidthMode: p.contentWidthMode ?? DEFAULT_CONTENT_WIDTH_MODE,
          eyebrowTitleGap: p.eyebrowTitleGap ?? DEFAULT_EYEBROW_TITLE_GAP,
          titleDescriptionGap: p.titleDescriptionGap ?? DEFAULT_TITLE_DESCRIPTION_GAP,
          titleLineHeight: p.titleLineHeight ?? DEFAULT_TITLE_LINE_HEIGHT,
          descriptionLineHeight: p.descriptionLineHeight ?? DEFAULT_DESCRIPTION_LINE_HEIGHT,
          eyebrowLetterSpacing: p.eyebrowLetterSpacing ?? DEFAULT_EYEBROW_LETTER_SPACING,
          contentMaxWidth,
          titleMaxWidth: p.titleMaxWidth ?? deriveTitleMaxWidthFromContent(contentMaxWidth),
          descriptionMaxWidth: p.descriptionMaxWidth ?? deriveDescriptionMaxWidthFromContent(contentMaxWidth)
        }
      })
    },
    { immediate: true, deep: true }
  )

  const toggleModal = () => {
    showModal.value = !showModal.value
  }

  const moveByDirection = (x: number, y: number, direction: Direction) => {
    switch (direction) {
      case Direction.Up:
        return { x, y: y - 1 }
      case Direction.Down:
        return { x, y: y + 1 }
      case Direction.Left:
        return { x: x - 1, y }
      case Direction.Right:
        return { x: x + 1, y }
      default:
        return { x, y: y + 1 }
    }
  }

  const getRandomPanelClass = (previousClass?: string): string => {
    const options = PANEL_CLASS_POOL.filter((c) => c !== previousClass)
    const pool = options.length ? options : PANEL_CLASS_POOL
    const idx = Math.floor(Math.random() * pool.length)
    return pool[idx]
  }

  const getRandomPanelColor = () => {
    const idx = Math.floor(Math.random() * PANEL_COLOR_POOL.length)
    return PANEL_COLOR_POOL[idx]
  }

  const positionedPanels = computed(() => {
    const placed: { panel: Panel; index: number; x: number; y: number }[] = []
    let x = 0
    let y = 0

    localPanels.value.forEach((panel, index) => {
      placed.push({ panel, index, x, y })
      const direction = (panel.nextPanelPosition ?? DEFAULT_DIRECTION) as Direction
      const nextPos = moveByDirection(x, y, direction)
      x = nextPos.x
      y = nextPos.y
    })

    return placed
  })

  watch(
    () => positionedPanels.value.length,
    async () => {
      if (!pendingScrollToLast.value) return
      await nextTick()
      await nextTick()
      setTimeout(() => {
        forceScrollToBottom()
        pendingScrollToLast.value = false
      }, SCROLL_DELAY_MS)
    }
  )

  const bounds = computed(() => {
    if (!positionedPanels.value.length) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }
    const xs = positionedPanels.value.map((n) => n.x)
    const ys = positionedPanels.value.map((n) => n.y)
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    }
  })

  const canvasStyle = computed(() => ({
    width: '100%',
    height: '100%',
    maxWidth: CANVAS_MAX_WIDTH,
    maxHeight: CANVAS_MAX_HEIGHT
  }))

  const stageStyle = computed(() => {
    const width = (bounds.value.maxX - bounds.value.minX) * STEP + BLOCK_WIDTH + CANVAS_PADDING * 2
    const height = (bounds.value.maxY - bounds.value.minY) * STEP + BLOCK_HEIGHT + CANVAS_PADDING * 2
    return {
      width: `${Math.max(width, BLOCK_WIDTH + CANVAS_PADDING * 2)}px`,
      height: `${Math.max(height, BLOCK_HEIGHT + CANVAS_PADDING * 2)}px`
    }
  })

  const nodeStyle = (x: number, y: number) => ({
    left: `${(x - bounds.value.minX) * STEP + CANVAS_PADDING}px`,
    top: `${(y - bounds.value.minY) * STEP + CANVAS_PADDING}px`
  })

  const forceScrollToBottom = () => {
    window.scrollTo(0, document.body.scrollHeight)
  }

  const flowLinks = computed(() => {
    if (positionedPanels.value.length <= 1) return []
    return positionedPanels.value.slice(0, -1).map((from, index) => {
      const to = positionedPanels.value[index + 1]
      const fromCenterX = (from.x - bounds.value.minX) * STEP + CANVAS_PADDING + BLOCK_WIDTH / 2
      const fromCenterY = (from.y - bounds.value.minY) * STEP + CANVAS_PADDING + BLOCK_HEIGHT / 2
      const toCenterX = (to.x - bounds.value.minX) * STEP + CANVAS_PADDING + BLOCK_WIDTH / 2
      const toCenterY = (to.y - bounds.value.minY) * STEP + CANVAS_PADDING + BLOCK_HEIGHT / 2
      const dx = toCenterX - fromCenterX
      const dy = toCenterY - fromCenterY
      const length = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)
      return {
        id: `${from.panel.id}-${to.panel.id}-${index}`,
        style: {
          left: `${fromCenterX}px`,
          top: `${fromCenterY}px`,
          width: `${length}px`,
          transform: `rotate(${angle}deg)`
        }
      }
    })
  })

  const opposite: Record<Direction, Direction> = {
    [Direction.Up]: Direction.Down,
    [Direction.Down]: Direction.Up,
    [Direction.Left]: Direction.Right,
    [Direction.Right]: Direction.Left
  }

  const normalizePanels = (list: Panel[]): Panel[] =>
    list.map((p) => {
      const contentMaxWidth = p.contentMaxWidth ?? DEFAULT_CONTENT_MAX_WIDTH
      return {
        ...p,
        templateType: p.templateType ?? TemplateType.Scroll,
        titleSize: normalizeTextSize(p.titleSize, DEFAULT_TEXT_SIZE),
        eyebrowSize: normalizeTextSize(p.eyebrowSize, DEFAULT_TEXT_SIZE),
        descriptionSize: normalizeTextSize(p.descriptionSize, DEFAULT_TEXT_SIZE),
        logoSize: normalizeTextSize(p.logoSize, DEFAULT_TEXT_SIZE),
        nextPanelPosition: (p.nextPanelPosition ?? DEFAULT_DIRECTION) as Direction,
        contentWidthMode: p.contentWidthMode ?? DEFAULT_CONTENT_WIDTH_MODE,
        eyebrowTitleGap: p.eyebrowTitleGap ?? DEFAULT_EYEBROW_TITLE_GAP,
        titleDescriptionGap: p.titleDescriptionGap ?? DEFAULT_TITLE_DESCRIPTION_GAP,
        titleLineHeight: p.titleLineHeight ?? DEFAULT_TITLE_LINE_HEIGHT,
        descriptionLineHeight: p.descriptionLineHeight ?? DEFAULT_DESCRIPTION_LINE_HEIGHT,
        eyebrowLetterSpacing: p.eyebrowLetterSpacing ?? DEFAULT_EYEBROW_LETTER_SPACING,
        contentMaxWidth,
        titleMaxWidth: p.titleMaxWidth ?? deriveTitleMaxWidthFromContent(contentMaxWidth),
        descriptionMaxWidth: p.descriptionMaxWidth ?? deriveDescriptionMaxWidthFromContent(contentMaxWidth)
      }
    })

  const renumberPanels = (list: Panel[]): Panel[] =>
    list.map((panel, index) => {
      const n = index + 1
      const title = panel.title
      let nextTitle = title

      if (NEW_PANEL_TITLE_REGEX.test(title)) {
        nextTitle = `${DEFAULT_TITLE_PREFIX} ${n}`
      } else if (SECTION_TITLE_REGEX.test(title)) {
        nextTitle = title.replace(SECTION_TITLE_REGEX, SECTION_TITLE_REPLACEMENT(n))
      }

      return {
        ...panel,
        id: `${ID_PREFIX}-${n}`,
        title: nextTitle
      }
    })

  const allowedDirections = (index: number): Direction[] => {
    if (index === 0) return ALLOWED_INSERT_DIRECTIONS
    const prev = (localPanels.value[index - 1]?.nextPanelPosition ?? DEFAULT_DIRECTION) as Direction
    return ALLOWED_INSERT_DIRECTIONS.filter((d) => d !== opposite[prev])
  }

  const canCommitPanels = (nextPanels: Panel[]) => {
    const sanitized = renumberPanels(normalizePanels(nextPanels))
    return validateContentSchema({ panels: sanitized }).ok
  }

  const buildNewPanel = (position: number, previousNext: Direction, previousClass?: string): Panel => ({
    id: makeId(),
    eyebrow: DEFAULT_EYEBROW,
    title: `${DEFAULT_TITLE_PREFIX} ${position}`,
    description: '',
    templateType: TemplateType.Scroll,
    useMarkdown: false,
    titleSize: DEFAULT_TEXT_SIZE,
    eyebrowSize: DEFAULT_TEXT_SIZE,
    descriptionSize: DEFAULT_TEXT_SIZE,
    contentAlign: DEFAULT_CONTENT_ALIGN,
    contentWidthMode: DEFAULT_CONTENT_WIDTH_MODE,
    eyebrowTitleGap: DEFAULT_EYEBROW_TITLE_GAP,
    titleDescriptionGap: DEFAULT_TITLE_DESCRIPTION_GAP,
    titleLineHeight: DEFAULT_TITLE_LINE_HEIGHT,
    descriptionLineHeight: DEFAULT_DESCRIPTION_LINE_HEIGHT,
    eyebrowLetterSpacing: DEFAULT_EYEBROW_LETTER_SPACING,
    contentMaxWidth: DEFAULT_CONTENT_MAX_WIDTH,
    titleMaxWidth: DEFAULT_TITLE_MAX_WIDTH,
    descriptionMaxWidth: DEFAULT_DESCRIPTION_MAX_WIDTH,
    panelClass: getRandomPanelClass(previousClass),
    panelColor: getRandomPanelColor(),
    overlayEnabled: DEFAULT_OVERLAY_ENABLED_WITHOUT_IMAGE,
    overlayIntensity: DEFAULT_OVERLAY_INTENSITY,
    ctaText: '',
    ctaLink: '',
    logo: '',
    logoSize: DEFAULT_TEXT_SIZE,
    logoTintEnabled: true,
    logoTintColor: '#ffffff',
    nextPanelPosition: previousNext
  })

  const insertableDirections = (index: number): Direction[] =>
    FEATURE_FLAGS.allowNodeCreation
      ? allowedDirections(index).filter((direction) => {
        const current = localPanels.value[index]
        if (!current) return false
        const previousNext = (current.nextPanelPosition ?? DEFAULT_DIRECTION) as Direction
        const nextPanels = localPanels.value.map((p) => ({ ...p }))
        nextPanels[index].nextPanelPosition = direction
        const candidate = buildNewPanel(nextPanels.length + 1, previousNext, nextPanels[index].panelClass)
        nextPanels.splice(index + 1, 0, candidate)
        return canCommitPanels(nextPanels)
      })
      : []

  const commitPanels = (nextPanels: Panel[], showAlert = true) => {
    const sanitized = renumberPanels(normalizePanels(nextPanels))
    const validation = validateContentSchema({ panels: sanitized })
    if (!validation.ok) {
      if (showAlert) console.warn(`${INVALID_STRUCTURE_TITLE}\n\n${validation.errors.join('\n')}`)
      return false
    }

    localPanels.value = sanitized.map((p) => ({ ...p }))
    emitUpdatePanels(localPanels.value.map((p) => ({ ...p })))
    return true
  }

  const makeId = () => `${ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const insertAfter = (index: number, direction: Direction) => {
    if (!FEATURE_FLAGS.allowNodeCreation) {
      console.warn('[flow-editor] Node creation is disabled by feature flag.')
      return
    }

    const current = localPanels.value[index]
    if (!current) return

    const previousNext = (current.nextPanelPosition ?? DEFAULT_DIRECTION) as Direction
    const nextPanels = localPanels.value.map((p) => ({ ...p }))
    nextPanels[index].nextPanelPosition = direction
    const newPanel = buildNewPanel(nextPanels.length + 1, previousNext, nextPanels[index].panelClass)
    nextPanels.splice(index + 1, 0, newPanel)
    if (commitPanels(nextPanels, false)) pendingScrollToLast.value = true
  }

  const openSettings = (index: number) => {
    selectedIndex.value = index
    showSettings.value = true
  }

  const closeSettings = () => {
    showSettings.value = false
    selectedIndex.value = null
  }

  const selectedPanel = computed(() => {
    if (selectedIndex.value === null) return null
    return localPanels.value[selectedIndex.value] ?? null
  })

  const saveSettings = (updated: Panel) => {
    if (selectedIndex.value === null) return
    const nextPanels = localPanels.value.map((p) => ({ ...p }))
    nextPanels[selectedIndex.value] = { ...updated }
    commitPanels(nextPanels)
  }

  const deletePanel = () => {
    if (selectedIndex.value === null) return
    if (localPanels.value.length <= MIN_PANELS_ALLOWED) {
      console.warn(DELETE_LAST_PANEL_ERROR)
      return
    }
    const nextPanels = localPanels.value.map((p) => ({ ...p }))
    nextPanels.splice(selectedIndex.value, 1)
    commitPanels(nextPanels)
  }

  const deletePanelAt = (index: number) => {
    if (localPanels.value.length <= MIN_PANELS_ALLOWED) {
      console.warn(DELETE_LAST_PANEL_ERROR)
      return
    }
    const nextPanels = localPanels.value.map((p) => ({ ...p }))
    nextPanels.splice(index, 1)
    commitPanels(nextPanels)
  }

  const exportFlowJson = () => {
    const payload = {
      panels: localPanels.value.map((panel) => ({ ...panel }))
    }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = EXPORT_FILE_NAME
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const importFlowObject = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') {
      console.warn(`${INVALID_IMPORT_TITLE}\n\nEl contenido no es un objeto JSON válido.`)
      return false
    }

    const candidate = raw as { panels?: unknown }
    if (!Array.isArray(candidate.panels)) {
      console.warn(`${INVALID_IMPORT_TITLE}\n\nDebe incluir la propiedad "panels" como arreglo.`)
      return false
    }

    const nextPanels = candidate.panels as Panel[]
    return commitPanels(nextPanels, true)
  }

  const importFlowFromFile = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown
      return importFlowObject(parsed)
    } catch (_error) {
      console.warn(`${INVALID_IMPORT_TITLE}\n\nNo se pudo leer o parsear el archivo JSON.`)
      return false
    }
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
    toggleModal,
    nodeStyle,
    forceScrollToBottom,
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
  }
}



