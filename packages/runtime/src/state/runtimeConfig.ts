export interface ScrollixRuntimeInitOptions {
  supabaseUrl?: string
  supabaseAnonKey?: string
  storiesTable?: string
  schema?: string
  cacheTtlMs?: number
}

interface RuntimeConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  storiesTable: string
  schema: string
  cacheTtlMs: number
}

const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  storiesTable: 'stories',
  schema: 'public',
  cacheTtlMs: 15000
}

let runtimeConfig: RuntimeConfig = { ...DEFAULT_RUNTIME_CONFIG }

export const setRuntimeConfig = (next: ScrollixRuntimeInitOptions) => {
  runtimeConfig = {
    ...runtimeConfig,
    ...next,
    supabaseUrl: (next.supabaseUrl ?? runtimeConfig.supabaseUrl).trim(),
    supabaseAnonKey: (next.supabaseAnonKey ?? runtimeConfig.supabaseAnonKey).trim(),
    storiesTable: (next.storiesTable ?? runtimeConfig.storiesTable).trim() || DEFAULT_RUNTIME_CONFIG.storiesTable,
    schema: (next.schema ?? runtimeConfig.schema).trim() || DEFAULT_RUNTIME_CONFIG.schema,
    cacheTtlMs:
      typeof next.cacheTtlMs === 'number' && Number.isFinite(next.cacheTtlMs) && next.cacheTtlMs >= 0
        ? next.cacheTtlMs
        : runtimeConfig.cacheTtlMs
  }

  return { ...runtimeConfig }
}

export const getRuntimeConfig = () => ({ ...runtimeConfig })
