import { supabase } from '@/lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'
import { STORY_LIST_SELECT_FIELDS, STORY_SELECT_FIELDS, SUPABASE_TABLES } from '@/constants/supabase'
import type { DeleteStoryInput, SaveStoryInput, SavedStory, StoryListItem, UpdateStoryInput } from '@/types/stories'
import { debugLog } from '@/utils/logger'
import { resolveStoryName } from '@/utils/storyName'

export type { DeleteStoryInput, SaveStoryInput, SavedStory, StoryListItem, UpdateStoryInput } from '@/types/stories'

const isRlsViolation = (error: PostgrestError | null): boolean => {
  if (!error) return false
  return error.code === '42501'
}

export async function saveStory({ userId, title, content }: SaveStoryInput): Promise<SavedStory> {
  const normalizedTitle = resolveStoryName(title)

  debugLog('[stories] saveStory:start', {
    userId,
    title: normalizedTitle
  })

  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.Stories)
      .insert({
        user_id: userId,
        title: normalizedTitle,
        content_json: content,
        published: false
      })
      .select(STORY_SELECT_FIELDS)
      .single()

    if (error) {
      console.error('[stories] saveStory:supabase-error', error)
      if (isRlsViolation(error)) {
        console.error(
          '[stories] RLS policy blocked insert/select on public.stories. Check INSERT WITH CHECK(auth.uid() = user_id) and SELECT USING(auth.uid() = user_id) policies.'
        )
      }
      throw error
    }

    if (!data) {
      const noDataError = new Error('saveStory returned no data.')
      console.error('[stories] saveStory:no-data', noDataError)
      throw noDataError
    }

    debugLog('[stories] saveStory:success', data)
    debugLog('[stories] saveStory:id', data.id)

    return data as SavedStory
  } catch (error) {
    console.error('[stories] saveStory:failed', error)
    throw error
  }
}

export async function updateStory({
  storyId,
  userId,
  title,
  content
}: UpdateStoryInput): Promise<SavedStory> {
  const normalizedTitle = resolveStoryName(title)

  debugLog('[stories] updateStory:start', {
    storyId,
    userId,
    title: normalizedTitle
  })

  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.Stories)
      .update({
        title: normalizedTitle,
        content_json: content,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId)
      .eq('user_id', userId)
      .select(STORY_SELECT_FIELDS)
      .single()

    if (error) {
      console.error('[stories] updateStory:supabase-error', error)
      if (isRlsViolation(error)) {
        console.error(
          '[stories] RLS policy blocked update/select on public.stories. Check UPDATE USING(auth.uid() = user_id) and SELECT USING(auth.uid() = user_id) policies.'
        )
      }
      throw error
    }

    if (!data) {
      const noDataError = new Error('updateStory returned no data.')
      console.error('[stories] updateStory:no-data', noDataError)
      throw noDataError
    }

    debugLog('[stories] updateStory:success', data)
    debugLog('[stories] updateStory:id', data.id)

    return data as SavedStory
  } catch (error) {
    console.error('[stories] updateStory:failed', error)
    throw error
  }
}

export async function getStories(userId: string): Promise<StoryListItem[]> {
  debugLog('[stories] getStories:start', { userId })

  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.Stories)
      .select(STORY_LIST_SELECT_FIELDS)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[stories] getStories:supabase-error', error)
      throw error
    }

    const stories = (data ?? []) as StoryListItem[]
    debugLog('[stories] getStories:success', { count: stories.length })
    return stories
  } catch (error) {
    console.error('[stories] getStories:failed', error)
    throw error
  }
}

export async function getStoryById(storyId: string): Promise<SavedStory> {
  debugLog('[stories] getStoryById:start', { storyId })

  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.Stories)
      .select(STORY_SELECT_FIELDS)
      .eq('id', storyId)
      .single()

    if (error) {
      console.error('[stories] getStoryById:supabase-error', error)
      if (isRlsViolation(error)) {
        console.error('[stories] RLS blocked getStoryById. Check SELECT policy on public.stories.')
      }
      throw error
    }

    if (!data) {
      const noDataError = new Error('getStoryById returned no data.')
      console.error('[stories] getStoryById:no-data', noDataError)
      throw noDataError
    }

    debugLog('[stories] getStoryById:success', { id: data.id, title: data.title })
    return data as SavedStory
  } catch (error) {
    console.error('[stories] getStoryById:failed', error)
    throw error
  }
}

export async function getPublicStoryById(storyId: string): Promise<SavedStory> {
  debugLog('[stories] getPublicStoryById:start', { storyId })

  try {
    const activeSupabaseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim()
    debugLog('[stories] getPublicStoryById:env', {
      supabaseUrl: activeSupabaseUrl
    })

    const { data, error } = await supabase
      .from(SUPABASE_TABLES.Stories)
      .select(STORY_SELECT_FIELDS)
      .eq('id', storyId)
      .eq('published', true)
      .maybeSingle()

    if (error) {
      console.error('[stories] getPublicStoryById:supabase-error', error)
      throw error
    }

    if (!data) {
      const noDataError = new Error('Story not found or not published in current Supabase project.')
      console.error('[stories] getPublicStoryById:no-data', noDataError)
      throw noDataError
    }

    debugLog('[stories] getPublicStoryById:success', { id: data.id, title: data.title })
    return data as SavedStory
  } catch (error) {
    console.error('[stories] getPublicStoryById:failed', error)
    throw error
  }
}

export async function publishStory({
  storyId,
  userId
}: {
  storyId: string
  userId: string
}): Promise<SavedStory> {
  debugLog('[stories] publishStory:start', { storyId, userId })

  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.Stories)
      .update({
        published: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId)
      .eq('user_id', userId)
      .select(STORY_SELECT_FIELDS)
      .single()

    if (error) {
      console.error('[stories] publishStory:supabase-error', error)
      if (isRlsViolation(error)) {
        console.error('[stories] RLS blocked publishStory update/select on public.stories.')
      }
      throw error
    }

    if (!data) {
      const noDataError = new Error('publishStory returned no data.')
      console.error('[stories] publishStory:no-data', noDataError)
      throw noDataError
    }

    debugLog('[stories] publishStory:success', { id: data.id, published: data.published })
    return data as SavedStory
  } catch (error) {
    console.error('[stories] publishStory:failed', error)
    throw error
  }
}

export async function deleteStory({ storyId, userId }: DeleteStoryInput): Promise<void> {
  debugLog('[stories] deleteStory:start', { storyId, userId })

  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.Stories)
      .delete()
      .eq('id', storyId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('[stories] deleteStory:supabase-error', error)
      if (isRlsViolation(error)) {
        console.error(
          '[stories] RLS policy blocked delete on public.stories. Check DELETE USING(auth.uid() = user_id) policy.'
        )
      }
      throw error
    }

    if (!data || typeof data.id !== 'string' || data.id.trim().length === 0) {
      const notDeletedError = new Error(
        'Story was not deleted. Verify DELETE policy/grant on public.stories and ownership (auth.uid() = user_id).'
      )
      console.error('[stories] deleteStory:not-deleted', notDeletedError)
      throw notDeletedError
    }

    debugLog('[stories] deleteStory:success', { storyId })
  } catch (error) {
    console.error('[stories] deleteStory:failed', error)
    throw error
  }
}

