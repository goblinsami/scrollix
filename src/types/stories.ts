import type { ContentSchema } from './navigation'

export interface SaveStoryInput {
  userId: string
  title?: string
  content: ContentSchema
}

export interface UpdateStoryInput extends SaveStoryInput {
  storyId: string
}

export interface DeleteStoryInput {
  storyId: string
  userId: string
}

export interface SavedStory {
  id: string
  user_id: string
  title: string
  content_json: ContentSchema
  published: boolean
  created_at: string
  updated_at: string
}

export interface StoryListItem {
  id: string
  title: string
  updated_at: string
  published?: boolean
}
