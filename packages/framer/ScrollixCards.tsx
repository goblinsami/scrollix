import * as React from 'react'
import { addPropertyControls, ControlType } from 'framer'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type TextSize = 's' | 'm' | 'l'
type ContentAlign = 'left' | 'center' | 'right'
type TextSide = 'left' | 'right'

interface FramerCard {
  title: string
  description: string
  image?: string
  eyebrow: string
  panelColor: string
}

interface ScrollixCardsProps {
  projectId: string
  supabaseUrl: string
  supabaseAnonKey: string
  storiesTable: string
  runtimeScriptUrl: string
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
    storiesTable?: string
  }) => unknown
}

declare global {
  interface Window {
    ScrollixRuntime?: ScrollixRuntimeApi
  }

  namespace JSX {
    interface IntrinsicElements {
      'scrollix-cards': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}

const runtimeScriptPromiseByUrl = new Map<string, Promise<void>>()

const ensureRuntimeScript = async (runtimeScriptUrl: string) => {
  const trimmedUrl = runtimeScriptUrl.trim()
  if (!trimmedUrl) return
  if (window.ScrollixRuntime) return

  const cachedPromise = runtimeScriptPromiseByUrl.get(trimmedUrl)
  if (cachedPromise) {
    await cachedPromise
    return
  }

  const loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'module'
    script.src = trimmedUrl
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`[ScrollixCards] Failed to load runtime script: ${trimmedUrl}`))
    document.head.appendChild(script)
  })

  runtimeScriptPromiseByUrl.set(trimmedUrl, loader)
  await loader
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
      overlayIntensity: props.overlayIntensity,
      titleSize: props.titleSize,
      descriptionSize: props.descriptionSize,
      contentAlign: props.contentAlign,
      titleMaxWidth: props.titleMaxWidth,
      descriptionMaxWidth: props.descriptionMaxWidth
    }
  }
})

const getSupabaseClient = (supabaseUrl: string, supabaseAnonKey: string): SupabaseClient | null => {
  const trimmedUrl = supabaseUrl.trim()
  const trimmedKey = supabaseAnonKey.trim()
  if (!trimmedUrl || !trimmedKey) return null

  return createClient(trimmedUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/i, ''), trimmedKey)
}

const persistHostedStory = async ({
  client,
  storiesTable,
  projectId,
  payload
}: {
  client: SupabaseClient
  storiesTable: string
  projectId: string
  payload: HostedSavePayload
}) => {
  const normalizedProjectId = projectId.trim()

  if (normalizedProjectId) {
    const { data: updateResult, error: updateError } = await client
      .from(storiesTable)
      .update({
        type: payload.type,
        config: payload.config,
        updated_at: new Date().toISOString()
      })
      .eq('id', normalizedProjectId)
      .select('id')
      .maybeSingle()

    if (!updateError && updateResult?.id) return String(updateResult.id)

    const { data: upsertResult, error: upsertError } = await client
      .from(storiesTable)
      .upsert(
        {
          id: normalizedProjectId,
          type: payload.type,
          config: payload.config,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )
      .select('id')
      .single()

    if (upsertError || !upsertResult) {
      throw upsertError ?? new Error('Failed to upsert hosted story.')
    }

    return String(upsertResult.id)
  }

  const { data: insertResult, error: insertError } = await client
    .from(storiesTable)
    .insert({
      type: payload.type,
      config: payload.config
    })
    .select('id')
    .single()

  if (insertError || !insertResult) {
    throw insertError ?? new Error('Failed to create hosted story.')
  }

  return String(insertResult.id)
}

export function ScrollixCards(props: ScrollixCardsProps) {
  const [runtimeReady, setRuntimeReady] = React.useState(false)
  const [resolvedProjectId, setResolvedProjectId] = React.useState(props.projectId.trim())
  const [saveState, setSaveState] = React.useState<SaveState>({ status: 'idle', errorMessage: '' })
  const lastSavedSignatureRef = React.useRef('')

  React.useEffect(() => {
    setResolvedProjectId(props.projectId.trim())
  }, [props.projectId])

  const payload = React.useMemo(() => buildPayload(props), [props])
  const payloadSignature = React.useMemo(() => JSON.stringify(payload), [payload])

  React.useEffect(() => {
    let cancelled = false

    const bootRuntime = async () => {
      try {
        await ensureRuntimeScript(props.runtimeScriptUrl)
        if (cancelled) return

        window.ScrollixRuntime?.init({
          supabaseUrl: props.supabaseUrl,
          supabaseAnonKey: props.supabaseAnonKey,
          storiesTable: props.storiesTable
        })

        if (!cancelled) setRuntimeReady(true)
      } catch (error) {
        if (!cancelled) {
          setRuntimeReady(false)
          setSaveState({
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Runtime bootstrap failed.'
          })
        }
      }
    }

    void bootRuntime()

    return () => {
      cancelled = true
    }
  }, [props.runtimeScriptUrl, props.supabaseUrl, props.supabaseAnonKey, props.storiesTable])

  React.useEffect(() => {
    if (!runtimeReady) return

    const client = getSupabaseClient(props.supabaseUrl, props.supabaseAnonKey)
    if (!client) return

    const debounceMs = Math.min(1000, Math.max(500, props.autoSaveDelayMs))

    const timer = window.setTimeout(() => {
      const saveSignature = `${resolvedProjectId}::${payloadSignature}`
      if (saveSignature === lastSavedSignatureRef.current) return

      setSaveState((current) => ({ ...current, status: 'saving', errorMessage: '' }))

      void persistHostedStory({
        client,
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
    runtimeReady,
    props.supabaseUrl,
    props.supabaseAnonKey,
    props.storiesTable,
    props.autoSaveDelayMs,
    resolvedProjectId,
    payload,
    payloadSignature
  ])

  return (
    <div
      style={{ width: '100%', height: '100%' }}
      data-runtime-ready={runtimeReady ? 'true' : 'false'}
      data-save-state={saveState.status}
      data-save-error={saveState.errorMessage}
    >
      <scrollix-cards
        project-id={resolvedProjectId}
        supabase-url={props.supabaseUrl}
        supabase-anon-key={props.supabaseAnonKey}
        stories-table={props.storiesTable}
      />
    </div>
  )
}

ScrollixCards.defaultProps = {
  projectId: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
  storiesTable: 'stories',
  runtimeScriptUrl: 'https://cdn.scrollix.app/scrollix-runtime.js',
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
    placeholder: 'Auto-created on first save'
  },
  supabaseUrl: {
    type: ControlType.String,
    title: 'Supabase URL',
    placeholder: 'https://xxx.supabase.co'
  },
  supabaseAnonKey: {
    type: ControlType.String,
    title: 'Anon Key',
    placeholder: 'eyJ...'
  },
  storiesTable: {
    type: ControlType.String,
    title: 'Table',
    defaultValue: 'stories'
  },
  runtimeScriptUrl: {
    type: ControlType.String,
    title: 'Runtime JS',
    defaultValue: 'https://cdn.scrollix.app/scrollix-runtime.js'
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
    options: ['left', 'right'],
    optionTitles: ['Left', 'Right'],
    defaultValue: 'left'
  },
  angleY: {
    type: ControlType.Number,
    title: 'Angle Y',
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
