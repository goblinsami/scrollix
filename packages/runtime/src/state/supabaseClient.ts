import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getRuntimeConfig, type ScrollixRuntimeInitOptions } from './runtimeConfig'

let cachedClient: SupabaseClient | null = null
let cachedKey = ''

const normalizeUrl = (rawUrl: string) => rawUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')

const resolveCredentials = (overrides?: ScrollixRuntimeInitOptions) => {
  const runtime = getRuntimeConfig()

  const supabaseUrl = normalizeUrl(overrides?.supabaseUrl ?? runtime.supabaseUrl)
  const supabaseAnonKey = (overrides?.supabaseAnonKey ?? runtime.supabaseAnonKey).trim()

  return {
    supabaseUrl,
    supabaseAnonKey
  }
}

export const getRuntimeSupabaseClient = (overrides?: ScrollixRuntimeInitOptions) => {
  const { supabaseUrl, supabaseAnonKey } = resolveCredentials(overrides)

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '[scrollix-runtime] Missing Supabase credentials. Call ScrollixRuntime.init({ supabaseUrl, supabaseAnonKey }) first.'
    )
  }

  const nextKey = `${supabaseUrl}::${supabaseAnonKey}`
  if (cachedClient && cachedKey === nextKey) return cachedClient

  cachedClient = createClient(supabaseUrl, supabaseAnonKey)
  cachedKey = nextKey
  return cachedClient
}
