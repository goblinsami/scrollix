# embed-runtime
Activation: Use when changing `EmbedPage`, embed loaders, runtime rendering, or anything that ships inside iframe embeds.

## Scope
- Keep embed runtime lightweight and isolated.
- Prevent editor dependencies from leaking into embed bundle.
- Preserve stable public rendering behavior.

## Rules
- Embed path only: `src/pages/EmbedPage.vue` + `src/features/embed/**` + shared runtime modules.
- Do not import from `src/editor/**` or `src/features/editor/**` in embed code.
- Keep embed shell minimal: loading/error + `StoryRenderer`.
- Fetch only public stories via `getPublicStoryById` (`published = true`).
- Avoid runtime features that depend on editor UI state.

## Performance Constraints
- Prefer transform/opacity animation already driven by `useSlideSnapNavigation`.
- Avoid additional global listeners unless cleaned up on unmount.
- Keep heavy debug logging behind existing logger utilities.
- Maintain iframe-safe behavior (no assumptions about top-window scroll context beyond current controlled shell).

## Lazy Loading Expectations
- Route-level code splitting should stay through Vue Router (`EditPage`/`EmbedPage` lazy imports).
- If adding embed-only modules, import them from embed routes/composables only.

## Verification Checklist
1. `src/pages/EmbedPage.vue` still composes `useEmbedStoryLoader` + `useStoryRuntime` + `StoryRenderer`.
2. Build output does not include editor-only logic in embed path.
3. `/embed/:storyId` handles invalid IDs and unpublished stories gracefully.
