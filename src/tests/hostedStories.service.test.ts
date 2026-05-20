import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HOSTED_STORY_TYPE } from '@/types/hostedStories'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn()
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: fromMock
  }
}))

import {
  createHostedStory,
  getHostedStoryById,
  updateHostedStory,
  upsertHostedStory
} from '@/services/hostedStories'
import type { HostedStoryRecord } from '@/types/hostedStories'

const baseRecord: HostedStoryRecord = {
  id: 'story-1',
  type: HOSTED_STORY_TYPE.StackCards3d,
  config: {
    cards: [
      {
        id: 'card-1',
        title: 'Card 1',
        eyebrow: 'STEP 01',
        description: 'Description',
        panelColor: '#0f172a'
      }
    ],
    settings: {
      textSide: 'left'
    }
  },
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z'
}

const buildQuery = (result: { data: unknown; error: unknown }) => {
  const query: {
    insert: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    select: ReturnType<typeof vi.fn>
    eq: ReturnType<typeof vi.fn>
    single: ReturnType<typeof vi.fn>
    maybeSingle: ReturnType<typeof vi.fn>
  } = {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn()
  }

  query.insert.mockReturnValue(query)
  query.update.mockReturnValue(query)
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.single.mockResolvedValue(result)
  query.maybeSingle.mockResolvedValue(result)

  return query
}

describe('hostedStories service', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('createHostedStory inserts payload', async () => {
    const query = buildQuery({ data: baseRecord, error: null })
    fromMock.mockReturnValue(query)

    const result = await createHostedStory({
      type: HOSTED_STORY_TYPE.StackCards3d,
      config: baseRecord.config
    })

    expect(fromMock).toHaveBeenCalledWith('stories')
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: HOSTED_STORY_TYPE.StackCards3d,
        config: expect.any(Object)
      })
    )
    expect(result.id).toBe('story-1')
  })

  it('updateHostedStory filters by id', async () => {
    const query = buildQuery({ data: baseRecord, error: null })
    fromMock.mockReturnValue(query)

    const result = await updateHostedStory({
      id: 'story-1',
      type: HOSTED_STORY_TYPE.StackCards3d,
      config: baseRecord.config
    })

    expect(query.eq).toHaveBeenCalledWith('id', 'story-1')
    expect(result.id).toBe('story-1')
  })

  it('getHostedStoryById returns null when not found', async () => {
    const query = buildQuery({ data: null, error: null })
    fromMock.mockReturnValue(query)

    const result = await getHostedStoryById('story-404')

    expect(result).toBeNull()
  })

  it('upsertHostedStory creates when update fails', async () => {
    const updateQuery = buildQuery({ data: null, error: { message: 'not found' } })
    const createQuery = buildQuery({ data: baseRecord, error: null })

    fromMock
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce(createQuery)

    const result = await upsertHostedStory({
      id: 'story-1',
      type: HOSTED_STORY_TYPE.StackCards3d,
      config: baseRecord.config
    })

    expect(result.id).toBe('story-1')
  })
})
