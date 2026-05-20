import { createApp, reactive, type App } from 'vue'
import RuntimeStackCards from '../vue/RuntimeStackCards.vue'
import { getRuntimeConfig, setRuntimeConfig } from '../state/runtimeConfig'

const RUNTIME_CSS_HREF = new URL(/* @vite-ignore */ './scrollix-runtime.css', import.meta.url).toString()

interface RuntimeElementProps {
  projectId: string
  supabaseUrl: string
  supabaseAnonKey: string
  storiesTable: string
  schema: string
  liveUpdates: boolean
}

const readBooleanAttribute = (value: string | null) => value !== null && value !== 'false'

export class ScrollixCardsElement extends HTMLElement {
  static get observedAttributes() {
    return ['project-id', 'supabase-url', 'supabase-anon-key', 'stories-table', 'schema', 'live-updates']
  }

  private app: App<Element> | null = null
  private mountNode: HTMLDivElement | null = null
  private props = reactive<RuntimeElementProps>({
    projectId: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    storiesTable: 'stories',
    schema: 'public',
    liveUpdates: false
  })

  connectedCallback() {
    const shadowRoot = this.shadowRoot ?? this.attachShadow({ mode: 'open' })

    if (!this.mountNode) {
      this.mountNode = document.createElement('div')
      this.mountNode.className = 'scrollix-runtime-host'

      const styleLink = document.createElement('link')
      styleLink.setAttribute('rel', 'stylesheet')
      styleLink.setAttribute('href', RUNTIME_CSS_HREF)
      styleLink.setAttribute('data-scrollix-runtime-style', 'true')

      shadowRoot.append(styleLink, this.mountNode)
    }

    this.syncPropsFromAttributes()

    if (!this.app && this.mountNode) {
      this.app = createApp(RuntimeStackCards, this.props)
      this.app.mount(this.mountNode)
    }
  }

  disconnectedCallback() {
    if (this.app) {
      this.app.unmount()
      this.app = null
    }
  }

  attributeChangedCallback() {
    this.syncPropsFromAttributes()
  }

  private syncPropsFromAttributes() {
    const runtimeConfig = getRuntimeConfig()
    const projectIdAttr = this.getAttribute('project-id')
    const supabaseUrlAttr = this.getAttribute('supabase-url')
    const supabaseAnonKeyAttr = this.getAttribute('supabase-anon-key')
    const storiesTableAttr = this.getAttribute('stories-table')
    const schemaAttr = this.getAttribute('schema')

    this.props.projectId = (this.getAttribute('project-id') ?? '').trim()
    this.props.supabaseUrl =
      supabaseUrlAttr !== null ? supabaseUrlAttr.trim() : runtimeConfig.supabaseUrl
    this.props.supabaseAnonKey =
      supabaseAnonKeyAttr !== null ? supabaseAnonKeyAttr.trim() : runtimeConfig.supabaseAnonKey
    this.props.storiesTable =
      storiesTableAttr !== null
        ? storiesTableAttr.trim() || 'stories'
        : runtimeConfig.storiesTable || 'stories'
    this.props.schema = schemaAttr !== null ? schemaAttr.trim() || 'public' : runtimeConfig.schema || 'public'
    this.props.liveUpdates = readBooleanAttribute(this.getAttribute('live-updates'))

    const nextConfig: Parameters<typeof setRuntimeConfig>[0] = {}
    if (supabaseUrlAttr !== null) nextConfig.supabaseUrl = this.props.supabaseUrl
    if (supabaseAnonKeyAttr !== null) nextConfig.supabaseAnonKey = this.props.supabaseAnonKey
    if (storiesTableAttr !== null) nextConfig.storiesTable = this.props.storiesTable
    if (schemaAttr !== null) nextConfig.schema = this.props.schema
    if (Object.keys(nextConfig).length > 0) {
      setRuntimeConfig(nextConfig)
    }

    if (projectIdAttr === null) {
      this.props.projectId = ''
    }
  }
}
