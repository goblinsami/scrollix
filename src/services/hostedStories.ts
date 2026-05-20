import { supabase } from '@/lib/supabase'
import { DEFAULT_HOSTED_STORY_TYPE, HOSTED_STORIES_TABLE, HOSTED_STORY_SELECT_FIELDS } from '@/constants/hostedStories'
import type {
  HostedStoryConfig,
  HostedStoryRecord,
  SaveHostedStoryInput,
  UpdateHostedStoryInput
} from '@/types/hostedStories'
import { validateHostedStoryConfig } from '@/utils/validateHostedStoryConfig'

const cloneConfig = (config: HostedStoryConfig['config']): HostedStoryConfig['config'] => ({
  ...config,
  cards: config.cards.map((card) => ({ ...card })),
  settings: config.settings ? { ...config.settings } : undefined
})

const assertValidConfig = (type: SaveHostedStoryInput['type'], config: SaveHostedStoryInput['config']) => {
  const validation = validateHostedStoryConfig({ type, config })
  if (!validation.ok) {
    throw new Error(`Invalid hosted story config: ${validation.errors.join(' ')}`)
  }
}

const normalizePayload = (input: SaveHostedStoryInput) => {
  const normalizedType = input.type ?? DEFAULT_HOSTED_STORY_TYPE
  const normalizedConfig = cloneConfig(input.config)
  assertValidConfig(normalizedType, normalizedConfig)

  return {
    type: normalizedType,
    config: normalizedConfig,
    updated_at: new Date().toISOString()
  }
}

export async function createHostedStory(input: SaveHostedStoryInput): Promise<HostedStoryRecord> {
  const payload = normalizePayload(input)

  const insertPayload = input.id
    ? {
        id: input.id,
        ...payload
      }
    : payload

  const { data, error } = await supabase
    .from(HOSTED_STORIES_TABLE)
    .insert(insertPayload)
    .select(HOSTED_STORY_SELECT_FIELDS)
    .single()

  if (error) throw error
  if (!data) throw new Error('createHostedStory returned no data.')

  return data as HostedStoryRecord
}

export async function updateHostedStory(input: UpdateHostedStoryInput): Promise<HostedStoryRecord> {
  const payload = normalizePayload(input)

  const { data, error } = await supabase
    .from(HOSTED_STORIES_TABLE)
    .update(payload)
    .eq('id', input.id)
    .select(HOSTED_STORY_SELECT_FIELDS)
    .single()

  if (error) throw error
  if (!data) throw new Error('updateHostedStory returned no data.')

  return data as HostedStoryRecord
}

export async function upsertHostedStory(input: SaveHostedStoryInput): Promise<HostedStoryRecord> {
  if (input.id) {
    try {
      return await updateHostedStory({ ...input, id: input.id })
    } catch (_error) {
      return createHostedStory(input)
    }
  }

  return createHostedStory(input)
}

export async function getHostedStoryById(id: string): Promise<HostedStoryRecord | null> {
  const storyId = id.trim()
  if (!storyId) return null

  const { data, error } = await supabase
    .from(HOSTED_STORIES_TABLE)
    .select(HOSTED_STORY_SELECT_FIELDS)
    .eq('id', storyId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return data as HostedStoryRecord
}
