import { ScrollixCardsElement } from './elements/scrollix-cards.element'
import { loadStory } from './state/storyLoader'
import { getRuntimeConfig, setRuntimeConfig, type ScrollixRuntimeInitOptions } from './state/runtimeConfig'

export const SCROLLIX_CARDS_TAG = 'scrollix-cards'

export interface ScrollixRuntimeApi {
  init: (options?: ScrollixRuntimeInitOptions) => ScrollixRuntimeApi
  registerWebComponents: () => ScrollixRuntimeApi
  loadStory: typeof loadStory
  getConfig: typeof getRuntimeConfig
}

declare global {
  interface Window {
    ScrollixRuntime?: ScrollixRuntimeApi
  }
}

let runtimeBootLogged = false

const logRuntimeBoot = () => {
  if (runtimeBootLogged) return
  runtimeBootLogged = true
  console.log('[Scrollix] runtime booted')
}

export const registerWebComponents = () => {
  if (typeof window === 'undefined') return runtimeApi

  console.log('[Scrollix] registering web components')

  if (window.customElements.get(SCROLLIX_CARDS_TAG)) {
    return runtimeApi
  }

  try {
    window.customElements.define(SCROLLIX_CARDS_TAG, ScrollixCardsElement)
    console.log('[Scrollix] scrollix-cards registered')
  } catch (error) {
    if (!window.customElements.get(SCROLLIX_CARDS_TAG)) {
      throw error
    }
  }

  return runtimeApi
}

export const init = (options: ScrollixRuntimeInitOptions = {}) => {
  setRuntimeConfig(options)
  registerWebComponents()
  return runtimeApi
}

const runtimeApi: ScrollixRuntimeApi = {
  init,
  registerWebComponents,
  loadStory,
  getConfig: getRuntimeConfig
}

export const ensureWindowRuntimeApi = () => {
  if (typeof window === 'undefined') return runtimeApi

  logRuntimeBoot()

  if (window.ScrollixRuntime) {
    return window.ScrollixRuntime
  }

  window.ScrollixRuntime = runtimeApi
  return runtimeApi
}
