import './styles/runtime.scss'
import { ensureWindowRuntimeApi, type ScrollixRuntimeApi } from './bootstrap'

const runtimeApi: ScrollixRuntimeApi = ensureWindowRuntimeApi()
runtimeApi.registerWebComponents()

export { runtimeApi as ScrollixRuntime }
export { SCROLLIX_CARDS_TAG, ensureWindowRuntimeApi } from './bootstrap'
export { init, registerWebComponents } from './bootstrap'
export { loadStory, subscribeToStory, clearStoryCache } from './state/storyLoader'
export { getRuntimeConfig, setRuntimeConfig } from './state/runtimeConfig'
export type { ScrollixRuntimeApi } from './bootstrap'
export type { ScrollixRuntimeInitOptions } from './state/runtimeConfig'
