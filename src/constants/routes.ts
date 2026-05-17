export const ROUTE_NAMES = {
  Edit: 'edit',
  Embed: 'embed'
} as const

export const ROUTE_PATHS = {
  Root: '/',
  Edit: '/edit',
  EditWithStoryId: '/edit/:id?',
  EmbedWithStoryId: '/embed/:id'
} as const

export const STORY_ROUTE_PARAM = 'id'
export const DEFAULT_EDIT_STORY_ID = '3d-stack-cards'
