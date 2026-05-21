import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn()
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: fromMock
  }
}))

import {
  deleteStory,
  getPublicStoryById,
  getStories,
  getStoryById,
  publishStory,
  saveStory,
  updateStory
} from '@/services/stories'
import { Direction } from '@/types/navigation'
import type { SavedStory } from '@/types/stories'

const buildQuery = (result: { data: unknown; error: unknown }) => {
  const query: {
    insert: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    select: ReturnType<typeof vi.fn>
    eq: ReturnType<typeof vi.fn>
    order: ReturnType<typeof vi.fn>
    single: ReturnType<typeof vi.fn>
    maybeSingle: ReturnType<typeof vi.fn>
  } = {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn()
  }

  query.insert.mockReturnValue(query)
  query.update.mockReturnValue(query)
  query.delete.mockReturnValue(query)
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockResolvedValue(result)
  query.single.mockResolvedValue(result)
  query.maybeSingle.mockResolvedValue(result)

  return query
}

const baseSavedStory: SavedStory = {
  id: 'story-1',
  user_id: 'user-1',
  title: 'Hello Scrollix',
  content_json: {
    panels: [
      {
        id: 'p-1',
        title: 'Panel 1',
        eyebrow: 'Step 1',
        panelClass: 'contrast',
        nextPanelPosition: Direction.Down
      }
    ]
  },
  published: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z'
}

describe('stories service', () => {
  beforeEach(() => {
    fromMock.mockReset()
    vi.useRealTimers()
  })

  it('saveStory inserts a new story and returns saved data', async () => {
    const query = buildQuery({ data: baseSavedStory, error: null })
    fromMock.mockReturnValue(query)

    const result = await saveStory({
      userId: 'user-1',
      title: '  Hello Scrollix  ',
      content: baseSavedStory.content_json
    })

    expect(fromMock).toHaveBeenCalledWith('stories')
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        title: 'Hello Scrollix',
        published: false
      })
    )
    expect(result.id).toBe('story-1')
  })

  it('saveStory throws when Supabase returns an error', async () => {
    const supabaseError = {
      code: '42501',
      details: null,
      hint: null,
      message: 'RLS violation'
    }
    const query = buildQuery({ data: null, error: supabaseError })
    fromMock.mockReturnValue(query)

    await expect(
      saveStory({
        userId: 'user-1',
        title: 'x',
        content: baseSavedStory.content_json
      })
    ).rejects.toBe(supabaseError)
  })

  it('updateStory filters by id and user_id', async () => {
    const query = buildQuery({ data: baseSavedStory, error: null })
    fromMock.mockReturnValue(query)

    const result = await updateStory({
      storyId: 'story-1',
      userId: 'user-1',
      title: 'Updated title',
      content: baseSavedStory.content_json
    })

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated title',
        updated_at: expect.any(String)
      })
    )
    expect(query.eq).toHaveBeenNthCalledWith(1, 'id', 'story-1')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'user_id', 'user-1')
    expect(result.id).toBe('story-1')
  })

  it('saveStory assigns timestamp title when no name is provided', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-21T10:30:40.000Z'))

    const query = buildQuery({ data: baseSavedStory, error: null })
    fromMock.mockReturnValue(query)

    await saveStory({
      userId: 'user-1',
      content: baseSavedStory.content_json
    })

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/^Story \d{4}-\d{2}-\d{2}/)
      })
    )
  })

  it('updateStory assigns timestamp title when name is blank', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-21T10:30:40.000Z'))

    const query = buildQuery({ data: baseSavedStory, error: null })
    fromMock.mockReturnValue(query)

    await updateStory({
      storyId: 'story-1',
      userId: 'user-1',
      title: '   ',
      content: baseSavedStory.content_json
    })

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/^Story \d{4}-\d{2}-\d{2}/)
      })
    )
  })

  it('getStories returns items ordered by updated_at desc', async () => {
    const listData = [
      { id: 'story-2', title: 'B', updated_at: '2026-01-02', published: true },
      { id: 'story-1', title: 'A', updated_at: '2026-01-01', published: false }
    ]
    const query = buildQuery({ data: listData, error: null })
    fromMock.mockReturnValue(query)

    const result = await getStories('user-1')

    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(query.order).toHaveBeenCalledWith('updated_at', { ascending: false })
    expect(result).toEqual(listData)
  })

  it('getStoryById fetches one story by id', async () => {
    const query = buildQuery({ data: baseSavedStory, error: null })
    fromMock.mockReturnValue(query)

    const result = await getStoryById('story-1')

    expect(query.eq).toHaveBeenCalledWith('id', 'story-1')
    expect(query.single).toHaveBeenCalled()
    expect(result.id).toBe('story-1')
  })

  it('getPublicStoryById requires published true', async () => {
    const publishedStory = { ...baseSavedStory, published: true }
    const query = buildQuery({ data: publishedStory, error: null })
    fromMock.mockReturnValue(query)

    const result = await getPublicStoryById('story-1')

    expect(query.eq).toHaveBeenNthCalledWith(1, 'id', 'story-1')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'published', true)
    expect(query.maybeSingle).toHaveBeenCalled()
    expect(result.published).toBe(true)
  })

  it('publishStory sets published=true and filters by owner', async () => {
    const publishedStory = { ...baseSavedStory, published: true }
    const query = buildQuery({ data: publishedStory, error: null })
    fromMock.mockReturnValue(query)

    const result = await publishStory({ storyId: 'story-1', userId: 'user-1' })

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        published: true,
        updated_at: expect.any(String)
      })
    )
    expect(query.eq).toHaveBeenNthCalledWith(1, 'id', 'story-1')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'user_id', 'user-1')
    expect(result.published).toBe(true)
  })

  it('deleteStory filters by id and user_id', async () => {
    const query = buildQuery({ data: { id: 'story-1' }, error: null })
    fromMock.mockReturnValue(query)

    await deleteStory({ storyId: 'story-1', userId: 'user-1' })

    expect(query.delete).toHaveBeenCalled()
    expect(query.eq).toHaveBeenNthCalledWith(1, 'id', 'story-1')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'user_id', 'user-1')
    expect(query.select).toHaveBeenCalledWith('id')
    expect(query.maybeSingle).toHaveBeenCalled()
  })

  it('deleteStory throws when no row was deleted', async () => {
    const query = buildQuery({ data: null, error: null })
    fromMock.mockReturnValue(query)

    await expect(deleteStory({ storyId: 'story-1', userId: 'user-1' })).rejects.toThrow(
      /Story was not deleted/i
    )
  })
})
