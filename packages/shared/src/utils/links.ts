import { LINKS, type LinkKey } from '../config/links'

const KEY_PREFIX = 'link:'

export const resolveLinkValue = (value?: string | null): string => {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (!trimmed.startsWith(KEY_PREFIX)) return trimmed
  const key = trimmed.slice(KEY_PREFIX.length) as LinkKey
  return LINKS[key] ?? ''
}

export const resolveLinkKey = (key?: string | null): string => {
  if (!key) return ''
  return LINKS[key as LinkKey] ?? ''
}

export const toLinkKeyHref = (key: string) => `${KEY_PREFIX}${key}`
