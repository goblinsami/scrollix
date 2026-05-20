export const LINKS = {
  editor: 'https://www.lavanguardia.com/',
  framerReferral: 'https://framer.com/?via=scrollix'
} as const

export type LinkKey = keyof typeof LINKS
