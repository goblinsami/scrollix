import type { RealtimeChannel } from '@supabase/supabase-js'
import type { HostedStoryRecord } from '../types/hostedStories'
import { getRuntimeConfig, type ScrollixRuntimeInitOptions } from './runtimeConfig'
import { getRuntimeSupabaseClient } from './supabaseClient'
import { normalizeHostedStory } from '../schema/hostedStory'

export type StoryLoadStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'error'

export interface StoryLoadState {
  status: StoryLoadStatus
  story: HostedStoryRecord | null
  error: string | null
}

interface LoadStoryOptions extends ScrollixRuntimeInitOptions {
  force?: boolean
}

interface CacheEntry {
  story: HostedStoryRecord | null
  expiresAt: number
}

const storyCache = new Map<string, CacheEntry>()
const inflightCache = new Map<string, Promise<HostedStoryRecord | null>>()

const extractProjectIdFromInput = (input: string) => {
  const trimmed = input.trim()
  if (!trimmed) return ''

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

    if (segments.length === 0) return ''
    return segments[segments.length - 1]
  } catch {
    return trimmed
  }
}

const normalizeProjectId = (projectId: string) => extractProjectIdFromInput(projectId)
const normalizeUrl = (rawUrl: string) => rawUrl.trim().replace(/\/+$/, '')

const now = () => Date.now()

const getCacheTtlMs = () => {
  const config = getRuntimeConfig()
  return Math.max(0, config.cacheTtlMs)
}

const getStoriesTable = (overrides?: ScrollixRuntimeInitOptions) =>
  (overrides?.storiesTable ?? getRuntimeConfig().storiesTable).trim() || 'stories'

const resolveStoriesFunctionUrl = (overrides?: ScrollixRuntimeInitOptions) =>
  normalizeUrl(overrides?.storiesFunctionUrl ?? getRuntimeConfig().storiesFunctionUrl)

const resolveSupabaseCredentials = (overrides?: ScrollixRuntimeInitOptions) => {
  const runtime = getRuntimeConfig()
  const supabaseUrl = (overrides?.supabaseUrl ?? runtime.supabaseUrl).trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
  const supabaseAnonKey = (overrides?.supabaseAnonKey ?? runtime.supabaseAnonKey).trim()

  return {
    supabaseUrl,
    supabaseAnonKey
  }
}

const hasSupabaseCredentials = (overrides?: ScrollixRuntimeInitOptions) => {
  const { supabaseUrl, supabaseAnonKey } = resolveSupabaseCredentials(overrides)
  return Boolean(supabaseUrl && supabaseAnonKey)
}

const parseErrorMessage = async (response: Response) => {
  const fallback = `${response.status} ${response.statusText}`
  try {
    const payload = (await response.json()) as { error?: string; message?: string; details?: string }
    return payload.error || payload.message || payload.details || fallback
  } catch {
    return fallback
  }
}

const fetchStoryByFunction = async (
  projectId: string,
  options?: ScrollixRuntimeInitOptions
): Promise<HostedStoryRecord | null> => {
  const functionUrl = resolveStoriesFunctionUrl(options)
  if (!functionUrl) return null

  const requestUrl = new URL(functionUrl)
  requestUrl.searchParams.set('projectId', projectId)
  requestUrl.searchParams.set('storiesTable', getStoriesTable(options))

  const { supabaseAnonKey } = resolveSupabaseCredentials(options)
  const headers: Record<string, string> = {
    Accept: 'application/json'
  }
  if (supabaseAnonKey) {
    headers.apikey = supabaseAnonKey
  }

  const response = await fetch(requestUrl.toString(), {
    method: 'GET',
    headers
  })

  if (response.status === 404) return null

  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(`[scrollix-runtime] Failed to load story "${projectId}" via function: ${message}`)
  }

  const payload = (await response.json().catch(() => null)) as { story?: Partial<HostedStoryRecord> } | null
  if (!payload || !payload.story || typeof payload.story !== 'object') return null

  return normalizeHostedStory(payload.story)
}

const fetchStoryBySupabase = async (
  projectId: string,
  options?: ScrollixRuntimeInitOptions
): Promise<HostedStoryRecord | null> => {
  const client = getRuntimeSupabaseClient(options)
  const storiesTable = getStoriesTable(options)

  const { data, error } = await client
    .from(storiesTable)
    .select('id, type, config, created_at, updated_at')
    .eq('id', projectId)
    .maybeSingle()

  if (error) {
    throw new Error(`[scrollix-runtime] Failed to load story "${projectId}": ${error.message}`)
  }

  if (!data) return null
  return normalizeHostedStory(data as Partial<HostedStoryRecord>)
}

const fetchStoryById = async (
  projectId: string,
  options?: ScrollixRuntimeInitOptions
): Promise<HostedStoryRecord | null> => {
  const functionUrl = resolveStoriesFunctionUrl(options)

  if (functionUrl) {
    try {
      return await fetchStoryByFunction(projectId, options)
    } catch (error) {
      if (!hasSupabaseCredentials(options)) {
        throw error
      }
    }
  }

  if (!hasSupabaseCredentials(options)) {
    throw new Error(
      '[scrollix-runtime] Missing story source. Provide storiesFunctionUrl or Supabase publishable credentials.'
    )
  }

  return fetchStoryBySupabase(projectId, options)
}

const getCacheEntry = (projectId: string) => {
  const entry = storyCache.get(projectId)
  if (!entry) return null
  if (entry.expiresAt < now()) {
    storyCache.delete(projectId)
    return null
  }
  return entry
}

export async function loadStory(projectId: string, options: LoadStoryOptions = {}): Promise<HostedStoryRecord | null> {
  const normalizedProjectId = normalizeProjectId(projectId)
  if (!normalizedProjectId) return null

  if (!options.force) {
    const cached = getCacheEntry(normalizedProjectId)
    if (cached) return cached.story

    const inflight = inflightCache.get(normalizedProjectId)
    if (inflight) return inflight
  }

  const pending = fetchStoryById(normalizedProjectId, options)
    .then((story) => {
      storyCache.set(normalizedProjectId, {
        story,
        expiresAt: now() + getCacheTtlMs()
      })
      return story
    })
    .finally(() => {
      inflightCache.delete(normalizedProjectId)
    })

  inflightCache.set(normalizedProjectId, pending)
  return pending
}

export function createLoadingState(): StoryLoadState {
  return {
    status: 'loading',
    story: null,
    error: null
  }
}

export function createMissingState(): StoryLoadState {
  return {
    status: 'missing',
    story: null,
    error: null
  }
}

export function createErrorState(error: unknown): StoryLoadState {
  const message = error instanceof Error ? error.message : 'Failed to load story.'
  return {
    status: 'error',
    story: null,
    error: message
  }
}

export function createReadyState(story: HostedStoryRecord): StoryLoadState {
  return {
    status: 'ready',
    story,
    error: null
  }
}

const subscribeViaPolling = (
  projectId: string,
  onStoryUpdate: (story: HostedStoryRecord | null) => void,
  options?: ScrollixRuntimeInitOptions
) => {
  let cancelled = false
  let lastHash = ''
  const intervalMs = Math.max(1000, Math.min(5000, Math.floor(getCacheTtlMs() / 2) || 2000))

  const tick = async () => {
    if (cancelled) return

    try {
      const nextStory = await loadStory(projectId, { ...options, force: true })
      const nextHash = nextStory ? JSON.stringify(nextStory) : 'null'
      if (nextHash !== lastHash) {
        lastHash = nextHash
        onStoryUpdate(nextStory)
      }
    } catch {
      // Swallow polling errors to avoid breaking runtime presentation.
    }
  }

  void tick()
  const timer = window.setInterval(() => {
    void tick()
  }, intervalMs)

  return () => {
    cancelled = true
    window.clearInterval(timer)
  }
}

export function subscribeToStory(
  projectId: string,
  onStoryUpdate: (story: HostedStoryRecord | null) => void,
  options?: ScrollixRuntimeInitOptions
) {
  const normalizedProjectId = normalizeProjectId(projectId)
  if (!normalizedProjectId) return () => undefined

  if (!hasSupabaseCredentials(options)) {
    const functionUrl = resolveStoriesFunctionUrl(options)
    if (functionUrl) {
      return subscribeViaPolling(normalizedProjectId, onStoryUpdate, options)
    }
    return () => undefined
  }

  const client = getRuntimeSupabaseClient(options)
  const storiesTable = getStoriesTable(options)
  const channelName = `scrollix-story-${normalizedProjectId}`

  const channel: RealtimeChannel = client
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: (options?.schema ?? getRuntimeConfig().schema).trim() || 'public',
        table: storiesTable,
        filter: `id=eq.${normalizedProjectId}`
      },
      (payload) => {
        const next = payload.new ? normalizeHostedStory(payload.new as Partial<HostedStoryRecord>) : null
        storyCache.set(normalizedProjectId, {
          story: next,
          expiresAt: now() + getCacheTtlMs()
        })
        onStoryUpdate(next)
      }
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}

export const clearStoryCache = (projectId?: string) => {
  if (projectId) {
    storyCache.delete(projectId)
    inflightCache.delete(projectId)
    return
  }

  storyCache.clear()
  inflightCache.clear()
}
