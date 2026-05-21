import { STORY_NAME_LABELS, STORY_NAME_TIMESTAMP_FORMAT_OPTIONS } from '@/constants/storyName'

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

const parseDateOrNow = (rawDate?: string | Date) => {
  if (!rawDate) return new Date()
  const date = rawDate instanceof Date ? rawDate : new Date(rawDate)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

const formatTimestamp = (date: Date) => {
  const formatted = new Intl.DateTimeFormat('sv-SE', STORY_NAME_TIMESTAMP_FORMAT_OPTIONS).format(date)
  return formatted.replace(',', '')
}

export const buildStoryTimestampName = (rawDate?: string | Date) => {
  const timestamp = formatTimestamp(parseDateOrNow(rawDate))
  return `${STORY_NAME_LABELS.defaultPrefix} ${timestamp}`
}

export const resolveStoryName = (value?: string | null, fallbackDate?: string | Date) => {
  const normalized = normalizeWhitespace(value ?? '')
  if (normalized) return normalized
  return buildStoryTimestampName(fallbackDate)
}

