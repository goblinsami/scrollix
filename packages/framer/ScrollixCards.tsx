import * as React from 'react'
import { addPropertyControls, ControlType } from 'framer'

type TextSize = 's' | 'm' | 'l'
type ContentAlign = 'left' | 'center' | 'right'
type TextSide = 'left' | 'right'
type StackDirection = 'left' | 'right'
type StackVariant = 'perspective' | 'horizontal'

interface FramerCard {
  title: string
  description: string
  image?: string
  eyebrow: string
  panelColor: string
}

interface ScrollixCardsProps {
  style?: React.CSSProperties
  projectId: string
  storiesFunctionUrl: string
  allowProjectIdAutosave: boolean
  autoSaveDelayMs: number
  cards: FramerCard[]
  panelColor: string
  image?: string
  backgroundGradient: string
  angleY: number
  angleX: number
  cardGap: number
  frontFadeWindow: number
  cardSize: number
  cardWidth: number
  cardSurfaceOpacity: number
  cardOverlayEnabled: boolean
  fitCardToImage: boolean
  autoPlayEnabled: boolean
  autoPlaySpeed: number
  stackVariant: StackVariant
  stackDirection: StackDirection
  overlayIntensity: number
}

interface HostedSavePayload {
  type: '3d-stack-cards'
  config: {
    cards: Array<{
      id: string
      title: string
      description: string
      image?: string
      eyebrow: string
      panelColor: string
      overlayEnabled?: boolean
    }>
    settings: {
      title: string
      description: string
      eyebrow: string
      panelColor: string
      image?: string
      backgroundGradient: string
      angleY: number
      angleX: number
      cardGap: number
      frontFadeWindow: number
      cardSize: number
      cardWidth: number
      cardSurfaceOpacity: number
      fitCardToImage: boolean
      autoPlayEnabled: boolean
      autoPlaySpeed: number
      variant: StackVariant
      textSide: TextSide
      stackDirection: StackDirection
      cardsOnly: boolean
      overlayIntensity: number
      titleSize: TextSize
      descriptionSize: TextSize
      contentAlign: ContentAlign
      titleMaxWidth: number
      descriptionMaxWidth: number
    }
  }
}

interface SaveState {
  status: 'idle' | 'saving' | 'saved' | 'error'
  errorMessage: string
}

interface ScrollixRuntimeApi {
  init: (options: {
    supabaseUrl?: string
    supabaseAnonKey?: string
    storiesFunctionUrl?: string
    storiesTable?: string
  }) => unknown
}

declare global {
  interface Window {
    ScrollixRuntime?: ScrollixRuntimeApi
    __SCROLLIX_RUNTIME_AUTO_VERSION__?: string
  }

  namespace JSX {
    interface ScrollixCardsIntrinsicProps
      extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
      'project-id'?: string
      'supabase-url'?: string
      'supabase-anon-key'?: string
      'stories-function-url'?: string
      'stories-table'?: string
    }

    interface IntrinsicElements {
      'scrollix-cards': ScrollixCardsIntrinsicProps
    }
  }
}

const SCROLLIX_CARDS_TAG = 'scrollix-cards'
const RUNTIME_SCRIPT_ATTR = 'data-scrollix-runtime-url'
const DEFAULT_REGISTRATION_TIMEOUT_MS = 7000

interface RuntimeHookState {
  ready: boolean
  loading: boolean
  error: string | null
}

const runtimeScriptPromiseByUrl = new Map<string, Promise<void>>()

const getRuntimeScriptElement = (runtimeUrl: string) => {
  const normalizedRuntimeUrl = new URL(runtimeUrl, window.location.href).href
  const scripts = Array.from(document.querySelectorAll('script'))

  return scripts.find((script) => {
    if (!(script instanceof HTMLScriptElement)) return false
    const taggedUrl = script.getAttribute(RUNTIME_SCRIPT_ATTR)
    if (taggedUrl === runtimeUrl) return true
    if (!script.src) return false

    try {
      return new URL(script.src, window.location.href).href === normalizedRuntimeUrl
    } catch (_error) {
      return false
    }
  }) as HTMLScriptElement | undefined
}

const waitForScriptLoad = (script: HTMLScriptElement, runtimeUrl: string) =>
  new Promise<void>((resolve, reject) => {
    if (script.getAttribute('data-scrollix-loaded') === 'true') {
      resolve()
      return
    }

    const readyState = (script as HTMLScriptElement & { readyState?: string }).readyState
    if (readyState === 'loaded' || readyState === 'complete') {
      script.setAttribute('data-scrollix-loaded', 'true')
      resolve()
      return
    }

    const handleLoad = () => {
      script.setAttribute('data-scrollix-loaded', 'true')
      resolve()
    }

    const handleError = () => {
      reject(new Error(`[Scrollix] Failed to load runtime module: ${runtimeUrl}`))
    }

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })
  })

const waitForRegistration = async (tagName: string, timeoutMs: number) => {
  if (window.customElements.get(tagName)) return

  await Promise.race([
    window.customElements.whenDefined(tagName),
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(`[Scrollix] Timed out waiting for ${tagName} registration.`))
      }, timeoutMs)
    })
  ])

  if (!window.customElements.get(tagName)) {
    throw new Error(`[Scrollix] ${tagName} is still not registered after module load.`)
  }
}

const loadRuntimeModule = async (runtimeUrl: string) => {
  const normalizedUrl = runtimeUrl.trim()
  if (!normalizedUrl) return

  if (window.customElements.get(SCROLLIX_CARDS_TAG)) return

  const existingPromise = runtimeScriptPromiseByUrl.get(normalizedUrl)
  if (existingPromise) {
    await existingPromise
    await waitForRegistration(SCROLLIX_CARDS_TAG, DEFAULT_REGISTRATION_TIMEOUT_MS)
    return
  }

  const pendingLoad = (async () => {
    const existingScript = getRuntimeScriptElement(normalizedUrl)

    if (existingScript) {
      await waitForScriptLoad(existingScript, normalizedUrl)
    } else {
      const script = document.createElement('script')
      script.type = 'module'
      script.async = true
      script.src = normalizedUrl
      script.setAttribute(RUNTIME_SCRIPT_ATTR, normalizedUrl)

      const loadPromise = waitForScriptLoad(script, normalizedUrl)
      document.head.appendChild(script)
      await loadPromise
    }

    await waitForRegistration(SCROLLIX_CARDS_TAG, DEFAULT_REGISTRATION_TIMEOUT_MS)
  })()

  runtimeScriptPromiseByUrl.set(normalizedUrl, pendingLoad)

  try {
    await pendingLoad
  } finally {
    runtimeScriptPromiseByUrl.delete(normalizedUrl)
  }
}

const stripRuntimeVersionParam = (runtimeUrl: string) => {
  try {
    const url = new URL(runtimeUrl, window.location.href)
    url.searchParams.delete('v')
    return url.toString()
  } catch (_error) {
    return runtimeUrl
      .replace(/([?&])v=[^&]*(&|$)/, (_match, lead: string, tail: string) => {
        if (lead === '?' && tail) return '?'
        if (lead === '&' && tail) return '&'
        return ''
      })
      .replace(/[?&]$/, '')
  }
}

const useScrollixRuntime = (runtimeUrl: string): RuntimeHookState => {
  const [state, setState] = React.useState<RuntimeHookState>({
    ready: false,
    loading: false,
    error: null
  })

  React.useEffect(() => {
    let cancelled = false

    const normalizedUrl = runtimeUrl.trim()
    if (!normalizedUrl) {
      setState({
        ready: false,
        loading: false,
        error: '[Scrollix] runtimeScriptUrl is required.'
      })
      return
    }

    setState({ ready: false, loading: true, error: null })
    console.log('[Scrollix] loading runtime')

    const fallbackUrl = stripRuntimeVersionParam(normalizedUrl)
    const canRetryWithoutVersion = fallbackUrl !== normalizedUrl

    const loadWithFallback = async () => {
      try {
        await loadRuntimeModule(normalizedUrl)
      } catch (primaryError) {
        if (!canRetryWithoutVersion) throw primaryError
        console.warn('[Scrollix] runtime load failed with versioned URL; retrying without version param')
        await loadRuntimeModule(fallbackUrl)
      }
    }

    void loadWithFallback()
      .then(() => {
        if (cancelled) return
        console.log('[Scrollix] runtime ready')
        setState({ ready: true, loading: false, error: null })
      })
      .catch((error) => {
        if (cancelled) return
        setState({
          ready: false,
          loading: false,
          error: error instanceof Error ? error.message : '[Scrollix] runtime load failed.'
        })
      })

    return () => {
      cancelled = true
    }
  }, [runtimeUrl])

  return state
}

const buildPayload = (props: ScrollixCardsProps): HostedSavePayload => ({
  type: '3d-stack-cards',
  config: {
    cards: props.cards.map((card, index) => ({
      id: `framer-card-${index + 1}`,
      title: card.title,
      description: card.description,
      image: card.image,
      eyebrow: card.eyebrow,
      panelColor: card.panelColor,
      overlayEnabled: props.cardOverlayEnabled
    })),
    settings: {
      title: STACK_CARDS_TEMPLATE_SETTINGS.title,
      description: STACK_CARDS_TEMPLATE_SETTINGS.description,
      eyebrow: STACK_CARDS_TEMPLATE_SETTINGS.eyebrow,
      panelColor: props.panelColor,
      image: props.image,
      backgroundGradient: props.backgroundGradient,
      angleY: props.angleY,
      angleX: props.angleX,
      cardGap: props.cardGap,
      frontFadeWindow: props.frontFadeWindow,
      cardSize: props.cardSize,
      cardWidth: props.cardWidth,
      cardSurfaceOpacity: props.cardSurfaceOpacity,
      fitCardToImage: props.fitCardToImage,
      autoPlayEnabled: props.autoPlayEnabled,
      autoPlaySpeed: props.autoPlaySpeed,
      variant: props.stackVariant,
      textSide: STACK_CARDS_TEMPLATE_SETTINGS.textSide,
      stackDirection: props.stackDirection,
      cardsOnly: STACK_CARDS_TEMPLATE_SETTINGS.cardsOnly,
      overlayIntensity: props.overlayIntensity,
      titleSize: STACK_CARDS_TEMPLATE_SETTINGS.titleSize,
      descriptionSize: STACK_CARDS_TEMPLATE_SETTINGS.descriptionSize,
      contentAlign: STACK_CARDS_TEMPLATE_SETTINGS.contentAlign,
      titleMaxWidth: STACK_CARDS_TEMPLATE_SETTINGS.titleMaxWidth,
      descriptionMaxWidth: STACK_CARDS_TEMPLATE_SETTINGS.descriptionMaxWidth
    }
  }
})

interface StoriesFunctionContext {
  functionUrl: string
  publishableKey: string
}

const normalizeSupabaseBaseUrl = (rawUrl: string) => rawUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')

const resolveStoriesFunctionUrl = (supabaseUrl: string, storiesFunctionUrl: string) => {
  const trimmedFunctionUrl = storiesFunctionUrl.trim()
  if (trimmedFunctionUrl) return trimmedFunctionUrl

  const trimmedSupabaseUrl = supabaseUrl.trim()
  if (!trimmedSupabaseUrl) return ''

  return `${normalizeSupabaseBaseUrl(trimmedSupabaseUrl)}/functions/v1/scrollix-story`
}

const getStoriesFunctionContext = (
  supabaseUrl: string,
  storiesFunctionUrl: string,
  supabaseAnonKey: string
): StoriesFunctionContext | null => {
  const functionUrl = resolveStoriesFunctionUrl(supabaseUrl, storiesFunctionUrl)
  if (!functionUrl) return null

  return {
    functionUrl,
    publishableKey: supabaseAnonKey.trim()
  }
}

const parseFunctionError = async (response: Response) => {
  const fallback = `${response.status} ${response.statusText}`

  try {
    const payload = (await response.json()) as {
      message?: string
      details?: string
      hint?: string
      code?: string
    }

    const details = [payload.message, payload.details, payload.hint].filter(Boolean).join(' ')
    if (details) return details
    if (payload.code) return payload.code
    return fallback
  } catch (_error) {
    return fallback
  }
}

const saveHostedStoryViaFunction = async ({
  context,
  projectId,
  storiesTable,
  payload
}: {
  context: StoriesFunctionContext
  projectId: string
  storiesTable: string
  payload: HostedSavePayload
}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
  if (context.publishableKey) {
    headers.apikey = context.publishableKey
  }

  const normalizedProjectId = projectId.trim()
  const body: Record<string, unknown> = {
    type: payload.type,
    config: payload.config
  }
  if (normalizedProjectId) body.projectId = normalizedProjectId
  if (storiesTable.trim()) body.storiesTable = storiesTable.trim()

  const response = await fetch(context.functionUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const message = await parseFunctionError(response)
    throw new Error(`[Scrollix] Hosted save failed: ${message}`)
  }

  const result = (await response.json().catch(() => ({}))) as { projectId?: unknown }
  if (typeof result.projectId !== 'string' || result.projectId.trim().length === 0) {
    throw new Error('[Scrollix] Hosted save failed: missing projectId in function response.')
  }

  return result.projectId
}

const runtimePlaceholderStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: '220px',
  display: 'grid',
  placeItems: 'center',
  padding: '12px',
  background: '#060914',
  color: '#e7eeff',
  fontSize: '12px',
  lineHeight: 1.4,
  textAlign: 'center'
}

const DEFAULT_SUPABASE_URL = ''
const DEFAULT_SUPABASE_ANON_KEY = ''
const DEFAULT_STORIES_FUNCTION_URL = 'https://xvlpcwygcetcccmorihr.supabase.co/functions/v1/scrollix-story'
const DEFAULT_RUNTIME_SCRIPT_URL = 'https://magical-klepon-3c1475.netlify.app/scrollix-runtime.js'
const DEFAULT_RUNTIME_VERSION = 'auto'
const DEFAULT_STORIES_TABLE = 'stories'
const DEFAULT_PROJECT_ID = '21ebaa36-93e1-4356-85c8-78e0c84d4154'

const STACK_CARDS_TEMPLATE_SETTINGS = {
  title: '',
  description: '',
  eyebrow: '',
  textSide: 'left' as TextSide,
  cardsOnly: true,
  titleSize: 'l' as TextSize,
  descriptionSize: 'm' as TextSize,
  contentAlign: 'left' as ContentAlign,
  titleMaxWidth: 620,
  descriptionMaxWidth: 760
}

const RUNTIME_VERSION_AUTO = 'auto'
const FRAMER_PREVIEW_HOST_TOKENS = ['framercanvas.com']
const FRAMER_PREVIEW_PATH_TOKENS = ['canvas-sandbox.html', 'preview-module.html']

const isFramerPreviewRuntime = () => {
  if (typeof window === 'undefined') return false

  const host = window.location.hostname.toLowerCase()
  const path = window.location.pathname.toLowerCase()
  return (
    FRAMER_PREVIEW_HOST_TOKENS.some((token) => host.includes(token)) ||
    FRAMER_PREVIEW_PATH_TOKENS.some((token) => path.includes(token))
  )
}

const getAutoRuntimeVersion = () => {
  if (!isFramerPreviewRuntime()) return ''
  if (!window.__SCROLLIX_RUNTIME_AUTO_VERSION__) {
    window.__SCROLLIX_RUNTIME_AUTO_VERSION__ = `auto-${Date.now().toString(36)}`
  }
  return window.__SCROLLIX_RUNTIME_AUTO_VERSION__
}

const resolveRuntimeUrl = (runtimeScriptUrl: string, runtimeVersion: string, autoRuntimeVersion: string) => {
  const trimmedUrl = runtimeScriptUrl.trim()
  if (!trimmedUrl) return ''

  const trimmedVersion = runtimeVersion.trim()
  const resolvedVersion =
    !trimmedVersion || trimmedVersion.toLowerCase() === RUNTIME_VERSION_AUTO
      ? autoRuntimeVersion
      : trimmedVersion
  if (!resolvedVersion) return trimmedUrl

  try {
    const url = new URL(trimmedUrl, window.location.href)
    url.searchParams.set('v', resolvedVersion)
    return url.toString()
  } catch (_error) {
    const separator = trimmedUrl.includes('?') ? '&' : '?'
    return `${trimmedUrl}${separator}v=${encodeURIComponent(resolvedVersion)}`
  }
}

const UUID_REGEX = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i
const HEX32_REGEX = /\b[0-9a-f]{32}\b/i

const extractLikelyIdFromText = (input: string) => {
  const uuidMatch = input.match(UUID_REGEX)
  if (uuidMatch) return uuidMatch[0]

  const hex32Match = input.match(HEX32_REGEX)
  if (hex32Match) return hex32Match[0]

  return ''
}

const normalizeProjectIdInput = (input: string) => {
  const trimmed = input.trim()
  if (!trimmed) return ''

  const directId = extractLikelyIdFromText(trimmed)
  if (directId) return directId

  const srcAttrMatch = trimmed.match(/src=["']([^"']+)["']/i)
  if (srcAttrMatch && srcAttrMatch[1]) {
    const fromSrc = normalizeProjectIdInput(srcAttrMatch[1])
    if (fromSrc) return fromSrc
  }

  try {
    const parsed = new URL(trimmed)
    const queryKeys = ['projectId', 'project_id', 'storyId', 'story_id', 'id']
    for (const key of queryKeys) {
      const value = (parsed.searchParams.get(key) || '').trim()
      if (value) return value
    }

    const segments = parsed.pathname
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean)

    if (segments.length === 0) return directId

    const lastSegment = segments[segments.length - 1]
    const fromSegment = extractLikelyIdFromText(lastSegment)
    return fromSegment || lastSegment
  } catch (_error) {
    return directId || trimmed
  }
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 720
 */
function ScrollixCards(props: ScrollixCardsProps) {
  const autoRuntimeVersion = React.useMemo(() => getAutoRuntimeVersion(), [])
  const resolvedRuntimeScriptUrl = React.useMemo(
    () => resolveRuntimeUrl(DEFAULT_RUNTIME_SCRIPT_URL, DEFAULT_RUNTIME_VERSION, autoRuntimeVersion),
    [autoRuntimeVersion]
  )

  const { ready: runtimeReady, loading: runtimeLoading, error: runtimeLoadError } = useScrollixRuntime(
    resolvedRuntimeScriptUrl
  )

  const [runtimeInitialized, setRuntimeInitialized] = React.useState(false)
  const [runtimeInitError, setRuntimeInitError] = React.useState<string | null>(null)
  const [resolvedProjectId, setResolvedProjectId] = React.useState(normalizeProjectIdInput(props.projectId))
  const [saveState, setSaveState] = React.useState<SaveState>({ status: 'idle', errorMessage: '' })
  const lastSavedSignatureRef = React.useRef('')
  const resolvedStoriesFunctionUrl = React.useMemo(
    () => resolveStoriesFunctionUrl(DEFAULT_SUPABASE_URL, props.storiesFunctionUrl),
    [props.storiesFunctionUrl]
  )
  const hasProjectId = resolvedProjectId.trim().length > 0
  const isExternalProjectBinding = props.projectId.trim().length > 0
  const storiesFunctionContext = React.useMemo(
    () => getStoriesFunctionContext(DEFAULT_SUPABASE_URL, props.storiesFunctionUrl, DEFAULT_SUPABASE_ANON_KEY),
    [props.storiesFunctionUrl]
  )
  const hasStoriesFunctionTarget = Boolean(storiesFunctionContext)
  const hasRuntimeStorySource = hasStoriesFunctionTarget
  const trimmedSupabaseKey = DEFAULT_SUPABASE_ANON_KEY.trim()
  const isSecretSupabaseKey =
    trimmedSupabaseKey.startsWith('sb_secret_') ||
    trimmedSupabaseKey.includes('service_role') ||
    trimmedSupabaseKey.includes('SERVICE_ROLE')
  const frameStyle = React.useMemo<React.CSSProperties>(
    () => ({
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
      ...(props.style ?? {})
    }),
    [props.style]
  )
  const runtimeElementStyle = React.useMemo<React.CSSProperties>(
    () => ({
      display: 'block',
      width: '100%',
      height: '100%',
      minHeight: '100%',
      minWidth: 0
    }),
    []
  )

  React.useEffect(() => {
    setResolvedProjectId(normalizeProjectIdInput(props.projectId))
  }, [props.projectId])

  const payload = React.useMemo(() => buildPayload(props), [props])
  const payloadSignature = React.useMemo(() => JSON.stringify(payload), [payload])

  React.useEffect(() => {
    if (!runtimeReady) {
      setRuntimeInitialized(false)
      return
    }

    try {
      window.ScrollixRuntime?.init({
        supabaseUrl: DEFAULT_SUPABASE_URL,
        supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY,
        storiesFunctionUrl: resolvedStoriesFunctionUrl,
        storiesTable: DEFAULT_STORIES_TABLE
      })

      const isRegistered = Boolean(window.customElements.get('scrollix-cards'))
      if (!isRegistered) {
        throw new Error('[Scrollix] runtime module loaded but scrollix-cards was not registered.')
      }

      console.log('[Scrollix] runtime ready')
      setRuntimeInitError(null)
      setRuntimeInitialized(true)
    } catch (error) {
      setRuntimeInitialized(false)
      setRuntimeInitError(error instanceof Error ? error.message : 'Runtime bootstrap failed.')
    }
  }, [runtimeReady, resolvedStoriesFunctionUrl])

  React.useEffect(() => {
    if (!runtimeInitialized) return

    if (isExternalProjectBinding && !props.allowProjectIdAutosave) return

    if (!storiesFunctionContext) return

    const debounceMs = Math.min(1000, Math.max(500, props.autoSaveDelayMs))

    const timer = window.setTimeout(() => {
      const saveSignature = `${resolvedProjectId}::${payloadSignature}`
      if (saveSignature === lastSavedSignatureRef.current) return

      setSaveState((current) => ({ ...current, status: 'saving', errorMessage: '' }))

      void saveHostedStoryViaFunction({
        context: storiesFunctionContext,
        storiesTable: DEFAULT_STORIES_TABLE,
        projectId: resolvedProjectId,
        payload
      })
        .then((savedProjectId) => {
          setResolvedProjectId(savedProjectId)
          lastSavedSignatureRef.current = `${savedProjectId}::${payloadSignature}`
          setSaveState({ status: 'saved', errorMessage: '' })
        })
        .catch((error) => {
          setSaveState({
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Autosave failed.'
          })
        })
    }, debounceMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [
    runtimeInitialized,
    isExternalProjectBinding,
    props.allowProjectIdAutosave,
    storiesFunctionContext,
    props.autoSaveDelayMs,
    resolvedProjectId,
    payload,
    payloadSignature
  ])

  if (runtimeLoadError || runtimeInitError) {
    const errorMessage = runtimeLoadError ?? runtimeInitError ?? 'Runtime failed to initialize.'
    return (
      <div
        style={{ ...runtimePlaceholderStyle, ...(props.style ?? {}) }}
        data-runtime-ready="false"
        data-runtime-error={errorMessage}
      >
        <span>{errorMessage}</span>
      </div>
    )
  }

  if (isSecretSupabaseKey) {
    return (
      <div style={{ ...runtimePlaceholderStyle, ...(props.style ?? {}) }} data-runtime-ready="false">
        <span>[Scrollix] Never use Supabase secret/service_role keys in Framer. Use only publishable/anon key.</span>
      </div>
    )
  }

  if (!hasProjectId && !hasStoriesFunctionTarget) {
    return (
      <div style={{ ...runtimePlaceholderStyle, ...(props.style ?? {}) }} data-runtime-ready="false">
        <span>
          Set `Function URL` to auto-create a hosted story, or provide an existing `Project ID`.
        </span>
      </div>
    )
  }

  if (hasProjectId && !hasRuntimeStorySource) {
    return (
      <div style={{ ...runtimePlaceholderStyle, ...(props.style ?? {}) }} data-runtime-ready="false">
        <span>
          Set `Function URL` so the runtime can load this `Project ID`.
        </span>
      </div>
    )
  }

  if (!hasProjectId && hasStoriesFunctionTarget) {
    if (saveState.status === 'error') {
      return (
        <div style={{ ...runtimePlaceholderStyle, ...(props.style ?? {}) }} data-runtime-ready="false">
          <span>{saveState.errorMessage || 'Failed to create hosted story.'}</span>
        </div>
      )
    }

    return (
      <div style={{ ...runtimePlaceholderStyle, ...(props.style ?? {}) }} data-runtime-ready="false">
        <span>Creating hosted story...</span>
      </div>
    )
  }

  if (runtimeLoading || !runtimeInitialized) {
    return (
      <div style={{ ...runtimePlaceholderStyle, ...(props.style ?? {}) }} data-runtime-ready="false" data-runtime-loading="true">
        <span>Loading Scrollix runtime...</span>
      </div>
    )
  }

  return (
    <div
      style={frameStyle}
      data-runtime-ready={runtimeInitialized ? 'true' : 'false'}
      data-save-state={saveState.status}
      data-save-error={saveState.errorMessage}
    >
      <scrollix-cards
        style={runtimeElementStyle}
        project-id={resolvedProjectId}
        supabase-url={DEFAULT_SUPABASE_URL}
        supabase-anon-key={DEFAULT_SUPABASE_ANON_KEY}
        stories-function-url={resolvedStoriesFunctionUrl}
        stories-table={DEFAULT_STORIES_TABLE}
        live-updates="true"
      />
    </div>
  )
}

ScrollixCards.defaultProps = {
  projectId: DEFAULT_PROJECT_ID,
  storiesFunctionUrl: DEFAULT_STORIES_FUNCTION_URL,
  allowProjectIdAutosave: true,
  autoSaveDelayMs: 800,
  cards: [
    {
      title: 'Concept',
      description: 'Define narrative arc and key beats.',
      eyebrow: 'STEP 01',
      panelColor: '#171c3d',
      image: ''
    },
    {
      title: 'Design',
      description: 'Shape motion and visual identity.',
      eyebrow: 'STEP 02',
      panelColor: '#143d9a',
      image: ''
    },
    {
      title: 'Publish',
      description: 'Embed cinematic runtime without iframe.',
      eyebrow: 'STEP 03',
      panelColor: '#0b6ea6',
      image: ''
    }
  ],
  panelColor: '#060914',
  image: '',
  backgroundGradient:
    'radial-gradient(circle at 18% 14%, rgba(138, 91, 255, 0.54) 0%, rgba(138, 91, 255, 0.12) 34%, transparent 62%), radial-gradient(circle at 82% 18%, rgba(47, 212, 255, 0.45) 0%, rgba(47, 212, 255, 0.08) 38%, transparent 66%), linear-gradient(128deg, #060914 0%, #0f1f46 46%, #131b44 100%)',
  angleY: -28,
  angleX: 2,
  cardGap: 1,
  frontFadeWindow: 0.45,
  cardSize: 1,
  cardWidth: 1,
  cardSurfaceOpacity: 100,
  cardOverlayEnabled: false,
  fitCardToImage: false,
  autoPlayEnabled: true,
  autoPlaySpeed: 0.65,
  stackVariant: 'perspective',
  stackDirection: 'right',
  overlayIntensity: 40
} as ScrollixCardsProps

addPropertyControls(ScrollixCards, {
  projectId: {
    type: ControlType.String,
    title: 'Project ID',
    description: 'Connection: Story source and hosted persistence.',
    defaultValue: DEFAULT_PROJECT_ID,
    placeholder: 'Auto-created on first save'
  },
  storiesFunctionUrl: {
    type: ControlType.String,
    title: 'Function URL',
    defaultValue: DEFAULT_STORIES_FUNCTION_URL,
    placeholder: 'https://<project-ref>.supabase.co/functions/v1/scrollix-story'
  },
  allowProjectIdAutosave: {
    type: ControlType.Boolean,
    title: 'Save With ID',
    enabledTitle: 'Yes',
    disabledTitle: 'No',
    defaultValue: true
  },
  autoSaveDelayMs: {
    type: ControlType.Number,
    title: 'Autosave ms',
    min: 500,
    max: 1000,
    step: 50,
    defaultValue: 800
  },
  cards: {
    type: ControlType.Array,
    title: 'Cards',
    description: 'Cards: Editable cinematic card content.',
    maxCount: 12,
    control: {
      type: ControlType.Object,
      controls: {
        title: {
          type: ControlType.String,
          title: 'Title',
          defaultValue: 'Card title'
        },
        description: {
          type: ControlType.String,
          title: 'Description',
          defaultValue: 'Card description',
          displayTextArea: true
        },
        image: {
          type: ControlType.Image,
          title: 'Image'
        },
        eyebrow: {
          type: ControlType.String,
          title: 'Eyebrow',
          defaultValue: 'STEP'
        },
        panelColor: {
          type: ControlType.Color,
          title: 'Panel Color',
          defaultValue: '#171c3d'
        }
      }
    }
  },
  panelColor: {
    type: ControlType.Color,
    title: 'Panel Color',
    defaultValue: '#060914'
  },
  image: {
    type: ControlType.Image,
    title: 'Panel Image'
  },
  backgroundGradient: {
    type: ControlType.String,
    title: 'Gradient',
    displayTextArea: true
  },
  stackDirection: {
    type: ControlType.Enum,
    description: 'Stack Layout: Motion direction controls.',
    title: 'Stack Dir',
    options: ['left', 'right'],
    optionTitles: ['Left', 'Right'],
    defaultValue: 'right'
  },
  stackVariant: {
    type: ControlType.Enum,
    title: 'Variant',
    options: ['perspective', 'horizontal'],
    optionTitles: ['Perspective', 'Horizontal'],
    defaultValue: 'perspective'
  },
  angleY: {
    type: ControlType.Number,
    title: 'Angle Y',
    description: 'Motion: 3D transform and autoplay behavior.',
    min: -60,
    max: 60,
    step: 1,
    defaultValue: -28
  },
  angleX: {
    type: ControlType.Number,
    title: 'Angle X',
    min: -60,
    max: 60,
    step: 1,
    defaultValue: 2
  },
  cardGap: {
    type: ControlType.Number,
    title: 'Card Gap',
    min: 0.6,
    max: 5,
    step: 0.1,
    defaultValue: 1
  },
  frontFadeWindow: {
    type: ControlType.Number,
    title: 'Front Fade',
    min: 0,
    max: 5,
    step: 0.1,
    defaultValue: 0.45
  },
  cardSize: {
    type: ControlType.Number,
    title: 'Card Size',
    min: 0.7,
    max: 10,
    step: 0.1,
    defaultValue: 1
  },
  cardWidth: {
    type: ControlType.Number,
    title: 'Card Width',
    min: 0.7,
    max: 2.2,
    step: 0.1,
    defaultValue: 1
  },
  cardSurfaceOpacity: {
    type: ControlType.Number,
    title: 'Card BG %',
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 100
  },
  cardOverlayEnabled: {
    type: ControlType.Boolean,
    title: 'Card Overlay',
    enabledTitle: 'On',
    disabledTitle: 'Off',
    defaultValue: false
  },
  fitCardToImage: {
    type: ControlType.Boolean,
    title: 'Fit Img Ratio',
    enabledTitle: 'On',
    disabledTitle: 'Off',
    defaultValue: false
  },
  autoPlayEnabled: {
    type: ControlType.Boolean,
    title: 'Autoplay',
    defaultValue: true
  },
  autoPlaySpeed: {
    type: ControlType.Number,
    title: 'Autoplay Sec',
    min: 0.4,
    max: 8,
    step: 0.1,
    defaultValue: 0.65
  },
  overlayIntensity: {
    type: ControlType.Number,
    title: 'Overlay %',
    description: 'Advanced card/panel presentation tuning.',
    min: 0,
    max: 90,
    step: 1,
    defaultValue: 40
  }
})

export default ScrollixCards
