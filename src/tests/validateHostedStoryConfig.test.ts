import { describe, expect, it } from 'vitest'
import { HOSTED_STORY_TYPE } from '@/types/hostedStories'
import { validateHostedStoryConfig } from '@/utils/validateHostedStoryConfig'

describe('validateHostedStoryConfig', () => {
  it('accepts a valid 3d-stack-cards payload', () => {
    const result = validateHostedStoryConfig({
      type: HOSTED_STORY_TYPE.StackCards3d,
      config: {
        cards: [
          {
            id: 'card-1',
            title: 'Card 1',
            eyebrow: 'STEP 01',
            description: 'Description',
            panelColor: '#0f172a',
            image: 'https://example.com/image.jpg'
          }
        ],
        settings: {
          textSide: 'left',
          angleY: -30,
          cardGap: 1,
          autoPlayEnabled: true,
          autoPlaySpeed: 1.2,
          titleSize: 'l',
          descriptionSize: 'm',
          contentAlign: 'left',
          titleMaxWidth: 620,
          descriptionMaxWidth: 760,
          overlayIntensity: 40
        }
      }
    })

    expect(result.ok).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects payloads without cards', () => {
    const result = validateHostedStoryConfig({
      type: HOSTED_STORY_TYPE.StackCards3d,
      config: {
        cards: []
      }
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toContain('config.cards must contain at least one card.')
  })

  it('rejects invalid settings ranges', () => {
    const result = validateHostedStoryConfig({
      type: HOSTED_STORY_TYPE.StackCards3d,
      config: {
        cards: [
          {
            id: 'card-1',
            title: 'Card 1',
            eyebrow: 'STEP 01'
          }
        ],
        settings: {
          angleY: 999
        }
      }
    })

    expect(result.ok).toBe(false)
    expect(result.errors.some((item) => item.includes('config.settings.angleY'))).toBe(true)
  })
})
