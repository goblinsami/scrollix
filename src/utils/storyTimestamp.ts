import {
  STORY_DATE_TIME_FORMAT_OPTIONS,
  STORY_TIMESTAMP_LABELS,
  STORY_TIME_FORMAT_OPTIONS
} from '@/constants/storyTimestamp'

const DAY_MS = 24 * 60 * 60 * 1000

const getDayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const isValidDate = (date: Date) => !Number.isNaN(date.getTime())

const getLocalDayDiff = (from: Date, to: Date) => {
  const fromStart = getDayStart(from).getTime()
  const toStart = getDayStart(to).getTime()
  return Math.round((toStart - fromStart) / DAY_MS)
}

export const formatStoryUpdatedAt = (rawDate: string, now = new Date()) => {
  const date = new Date(rawDate)
  if (!isValidDate(date)) return STORY_TIMESTAMP_LABELS.invalid

  const dayDiff = getLocalDayDiff(date, now)
  const timeLabel = new Intl.DateTimeFormat(undefined, STORY_TIME_FORMAT_OPTIONS).format(date)

  if (dayDiff === 0) return `${STORY_TIMESTAMP_LABELS.today} ${timeLabel}`
  if (dayDiff === 1) return `${STORY_TIMESTAMP_LABELS.yesterday} ${timeLabel}`

  return new Intl.DateTimeFormat(undefined, STORY_DATE_TIME_FORMAT_OPTIONS).format(date)
}

export const formatStoryUpdatedAtFull = (rawDate: string) => {
  const date = new Date(rawDate)
  if (!isValidDate(date)) return STORY_TIMESTAMP_LABELS.invalid
  return new Intl.DateTimeFormat(undefined, STORY_DATE_TIME_FORMAT_OPTIONS).format(date)
}
