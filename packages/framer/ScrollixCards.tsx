import * as React from 'react'
import { addPropertyControls, ControlType } from 'framer'

type TextSize = 's' | 'm' | 'l'
type ContentAlign = 'left' | 'center' | 'right'
type TextSide = 'left' | 'right'
type StackDirection = 'left' | 'right'

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
  supabaseUrl: string
  supabaseAnonKey: string
  storiesFunctionUrl: string
  storiesTable: string
  runtimeScriptUrl: string
  runtimeVersion: string
  autoSaveDelayMs: number
  cards: FramerCard[]
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
  autoPlayEnabled: boolean
  autoPlaySpeed: number
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
      autoPlayEnabled: boolean
      autoPlaySpeed: number
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

    void loadRuntimeModule(normalizedUrl)
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
      panelColor: card.panelColor
    })),
    settings: {
      title: props.title,
      description: props.description,
      eyebrow: props.eyebrow,
      panelColor: props.panelColor,
      image: props.image,
      backgroundGradient: props.backgroundGradient,
      angleY: props.angleY,
      angleX: props.angleX,
      cardGap: props.cardGap,
      frontFadeWindow: props.frontFadeWindow,
      cardSize: props.cardSize,
      cardWidth: props.cardWidth,
      autoPlayEnabled: props.autoPlayEnabled,
      autoPlaySpeed: props.autoPlaySpeed,
      textSide: props.textSide,
      stackDirection: props.stackDirection,
      cardsOnly: props.cardsOnly,
      overlayIntensity: props.overlayIntensity,
      titleSize: props.titleSize,
      descriptionSize: props.descriptionSize,
      contentAlign: props.contentAlign,
      titleMaxWidth: props.titleMaxWidth,
      descriptionMaxWidth: props.descriptionMaxWidth
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
const DEFAULT_RUNTIME_VERSION = 'force-13'
const DEFAULT_PROJECT_ID = '21ebaa36-93e1-4356-85c8-78e0c84d4154'

const resolveRuntimeUrl = (runtimeScriptUrl: string, runtimeVersion: string) => {
  const trimmedUrl = runtimeScriptUrl.trim()
  if (!trimmedUrl) return ''

  const trimmedVersion = runtimeVersion.trim()
  if (!trimmedVersion) return trimmedUrl

  try {
    const url = new URL(trimmedUrl, window.location.href)
    url.searchParams.set('v', trimmedVersion)
    return url.toString()
  } catch (_error) {
    const separator = trimmedUrl.includes('?') ? '&' : '?'
    return `${trimmedUrl}${separator}v=${encodeURIComponent(trimmedVersion)}`
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
  const resolvedRuntimeScriptUrl = React.useMemo(
    () => resolveRuntimeUrl(props.runtimeScriptUrl, props.runtimeVersion),
    [props.runtimeScriptUrl, props.runtimeVersion]
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
    () => resolveStoriesFunctionUrl(props.supabaseUrl, props.storiesFunctionUrl),
    [props.supabaseUrl, props.storiesFunctionUrl]
  )
  const hasProjectId = resolvedProjectId.trim().length > 0
  const isExternalProjectBinding = props.projectId.trim().length > 0
  const storiesFunctionContext = React.useMemo(
    () => getStoriesFunctionContext(props.supabaseUrl, props.storiesFunctionUrl, props.supabaseAnonKey),
    [props.supabaseUrl, props.storiesFunctionUrl, props.supabaseAnonKey]
  )
  const hasStoriesFunctionTarget = Boolean(storiesFunctionContext)
  const hasSupabaseReadCredentials = props.supabaseUrl.trim().length > 0 && props.supabaseAnonKey.trim().length > 0
  const hasRuntimeStorySource = hasStoriesFunctionTarget || hasSupabaseReadCredentials
  const trimmedSupabaseKey = props.supabaseAnonKey.trim()
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
        supabaseUrl: props.supabaseUrl,
        supabaseAnonKey: props.supabaseAnonKey,
        storiesFunctionUrl: resolvedStoriesFunctionUrl,
        storiesTable: props.storiesTable
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
  }, [runtimeReady, props.supabaseUrl, props.supabaseAnonKey, resolvedStoriesFunctionUrl, props.storiesTable])

  React.useEffect(() => {
    if (!runtimeInitialized) return

    if (isExternalProjectBinding) return

    if (!storiesFunctionContext) return

    const debounceMs = Math.min(1000, Math.max(500, props.autoSaveDelayMs))

    const timer = window.setTimeout(() => {
      const saveSignature = `${resolvedProjectId}::${payloadSignature}`
      if (saveSignature === lastSavedSignatureRef.current) return

      setSaveState((current) => ({ ...current, status: 'saving', errorMessage: '' }))

      void saveHostedStoryViaFunction({
        context: storiesFunctionContext,
        storiesTable: props.storiesTable,
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
    storiesFunctionContext,
    props.storiesTable,
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
          Set `Function URL` (or `Supabase URL`) to auto-create a hosted story, or provide an existing `Project ID`.
        </span>
      </div>
    )
  }

  if (hasProjectId && !hasRuntimeStorySource) {
    return (
      <div style={{ ...runtimePlaceholderStyle, ...(props.style ?? {}) }} data-runtime-ready="false">
        <span>
          Set `Function URL` (or `Supabase URL` + `Anon Key`) so the runtime can load this `Project ID`.
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
        supabase-url={props.supabaseUrl}
        supabase-anon-key={props.supabaseAnonKey}
        stories-function-url={resolvedStoriesFunctionUrl}
        stories-table={props.storiesTable}
        live-updates="true"
      />
    </div>
  )
}

ScrollixCards.defaultProps = {
  projectId: DEFAULT_PROJECT_ID,
  supabaseUrl: DEFAULT_SUPABASE_URL,
  supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY,
  storiesFunctionUrl: DEFAULT_STORIES_FUNCTION_URL,
  storiesTable: 'stories',
  runtimeScriptUrl: DEFAULT_RUNTIME_SCRIPT_URL,
  runtimeVersion: DEFAULT_RUNTIME_VERSION,
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
  title: 'Create cinematic storytelling experiences',
  description: 'Powered by Scrollix runtime and Supabase-hosted JSON.',
  eyebrow: 'Scrollix Runtime',
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
  autoPlayEnabled: true,
  autoPlaySpeed: 0.65,
  textSide: 'left',
  stackDirection: 'right',
  cardsOnly: true,
  overlayIntensity: 40,
  titleSize: 'l',
  descriptionSize: 'm',
  contentAlign: 'left',
  titleMaxWidth: 620,
  descriptionMaxWidth: 760
} as ScrollixCardsProps

addPropertyControls(ScrollixCards, {
  projectId: {
    type: ControlType.String,
    title: 'Project ID',
    description: 'Connection: Story source and hosted persistence.',
    defaultValue: DEFAULT_PROJECT_ID,
    placeholder: 'Auto-created on first save'
  },
  supabaseUrl: {
    type: ControlType.String,
    title: 'Supabase URL',
    defaultValue: DEFAULT_SUPABASE_URL,
    placeholder: 'https://YOUR-PROJECT.supabase.co'
  },
  supabaseAnonKey: {
    type: ControlType.String,
    title: 'Anon Key',
    defaultValue: DEFAULT_SUPABASE_ANON_KEY,
    placeholder: 'sb_publishable_...'
  },
  storiesFunctionUrl: {
    type: ControlType.String,
    title: 'Function URL',
    defaultValue: DEFAULT_STORIES_FUNCTION_URL,
    placeholder: 'https://<project-ref>.supabase.co/functions/v1/scrollix-story'
  },
  storiesTable: {
    type: ControlType.String,
    title: 'Table',
    defaultValue: 'stories'
  },
  runtimeScriptUrl: {
    type: ControlType.String,
    title: 'Runtime JS',
    description: 'Runtime: Web Component runtime bundle location.',
    defaultValue: DEFAULT_RUNTIME_SCRIPT_URL
  },
  runtimeVersion: {
    type: ControlType.String,
    title: 'Runtime Ver',
    defaultValue: DEFAULT_RUNTIME_VERSION,
    placeholder: 'auto cache-bust key'
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
  title: {
    type: ControlType.String,
    title: 'Title',
    description: 'Panel: Intro copy and visual shell.',
    defaultValue: 'Create cinematic storytelling experiences'
  },
  description: {
    type: ControlType.String,
    title: 'Description',
    displayTextArea: true,
    defaultValue: 'Powered by Scrollix runtime and Supabase-hosted JSON.'
  },
  eyebrow: {
    type: ControlType.String,
    title: 'Eyebrow',
    defaultValue: 'Scrollix Runtime'
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
  textSide: {
    type: ControlType.Enum,
    title: 'Text Side',
    description: 'Stack Layout: Text/cards composition controls.',
    options: ['left', 'right'],
    optionTitles: ['Left', 'Right'],
    defaultValue: 'left'
  },
  stackDirection: {
    type: ControlType.Enum,
    title: 'Stack Dir',
    options: ['left', 'right'],
    optionTitles: ['Left', 'Right'],
    defaultValue: 'right'
  },
  cardsOnly: {
    type: ControlType.Boolean,
    title: 'Cards Only',
    defaultValue: true
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
    description: 'Typography and advanced presentation tuning.',
    min: 0,
    max: 90,
    step: 1,
    defaultValue: 40
  },
  titleSize: {
    type: ControlType.Enum,
    title: 'Title Size',
    options: ['s', 'm', 'l'],
    optionTitles: ['S', 'M', 'L'],
    defaultValue: 'l'
  },
  descriptionSize: {
    type: ControlType.Enum,
    title: 'Desc Size',
    options: ['s', 'm', 'l'],
    optionTitles: ['S', 'M', 'L'],
    defaultValue: 'm'
  },
  contentAlign: {
    type: ControlType.Enum,
    title: 'Align',
    options: ['left', 'center', 'right'],
    optionTitles: ['Left', 'Center', 'Right'],
    defaultValue: 'left'
  },
  titleMaxWidth: {
    type: ControlType.Number,
    title: 'Title Max',
    min: 200,
    max: 1200,
    step: 10,
    defaultValue: 620
  },
  descriptionMaxWidth: {
    type: ControlType.Number,
    title: 'Desc Max',
    min: 200,
    max: 1400,
    step: 10,
    defaultValue: 760
  }
})

export default ScrollixCards
