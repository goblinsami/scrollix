export const STORY_TIMESTAMP_LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
  invalid: 'Unknown update time'
} as const

export const STORY_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit'
}

export const STORY_DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}
