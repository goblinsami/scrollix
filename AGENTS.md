# Scrollix Agent Context

## Project Snapshot
- Stack: Vue 3 + TypeScript + Vite + GSAP + Supabase.
- Runtime entry: `src/pages/EditPage.vue` (editor) and `src/pages/EmbedPage.vue` (public embed).
- Core render pipeline: `useEditorStorySource/useEmbedStoryLoader` -> `useStoryRuntime` -> `useFlowBlocks` + `useSlideSnapNavigation` -> `StoryRenderer` -> `SectionPanel`.
- Data model is JSON-driven (`ContentSchema` in `src/types/navigation.ts`) and persisted in Supabase `stories.content_json`.

## Architectural Principles
- Keep rendering data-driven from `ContentSchema`; do not hardcode panel content in components.
- Put behavior in composables/services, not page templates.
- Normalize/validate at runtime boundaries (`useStoryRuntime`, `validateContentSchema`) before rendering.
- Prefer constants/types over string literals (`src/constants`, `src/types`).
- Do not declare feature/config constants inside component files; define them in `src/constants/**` and import them.

## Renderer and Runtime Rules
- `StoryRenderer.vue` is the runtime rendering boundary; preserve stable props (`flowSteps`, `stepStyle`, snap refs, CTA flags).
- `useSlideSnapNavigation.ts` owns navigation mechanics, GSAP transitions, ScrollTrigger setup, wheel/touch/keyboard handling, autoplay, and cleanup.
- `useFlowBlocks.ts` owns panel-to-grid step mapping using `nextPanelPosition` directions.
- Preserve `focusStep` compatibility for editor interactions.

## Editor vs Embed Separation
- Editor-only: `src/editor/**`, `src/features/editor/**`, top bar, flow editor, save/publish controls.
- Embed-only: `src/features/embed/**`, `EmbedPage.vue` loading/error shell.
- Shared runtime: `src/core/**`, `src/composables/useSlideSnapNavigation.ts`, `src/composables/useSlidePanelPresentation.ts`.
- Never import editor modules from embed paths.

## JSON-Driven Conventions
- Canonical schema: `ContentSchema` + `Panel` in `src/types/navigation.ts`.
- Validate all imported/loaded story JSON with `validateContentSchema`.
- Keep backward compatibility with existing keys (`loopEnabled`, `enableLoop`, legacy CTA fields).
- When extending schema: add type, validator rule, normalization path, and tests.

## Components, Composables, Services
- Components: presentational and event-forwarding.
- Composables: orchestration/stateful logic (`useStoryRuntime`, `useEditorStoryActions`, `usePermissions`, etc.).
- Services: I/O and external APIs only (`src/services/stories.ts`, `src/services/profiles.ts`).
- Utilities: pure helpers in `src/utils`.

## Styling System
- Global SCSS architecture under `src/styles`: `tokens/`, `mixins/`, `base/`, `components/`, `layouts/`, `themes/`.
- Entry styles:
  - `src/styles/main.scss`: shared base + shared components.
  - `src/styles/editor.scss`: editor layout/components.
  - `src/styles/embed.scss`: embed layout only.
- Prefer token/mixin reuse over inline component-specific style duplication.

## GSAP and Performance
- Register plugins once; destroy/kill timelines, triggers, tweens on re-init/unmount.
- Animate transforms/opacity; avoid width/height/top/left animation.
- Keep `snap-stage` transform-driven (`translate3d`) and steps absolutely positioned.
- Debounce resize re-init and avoid unnecessary deep watchers outside navigation lifecycle.

## Supabase Conventions
- Story persistence goes through `src/services/stories.ts`; no direct Supabase calls in components.
- Respect owner checks on update/publish (`eq('id')` + `eq('user_id')`).
- Public embeds must fetch only published stories (`getPublicStoryById` with `published = true`).
- RLS policy SQL is documented in `docs/supabase_stories_policies.sql`.

## Layout Extension Conventions
- If adding layout variants, keep one runtime contract and switch layout component behind a resolver boundary.
- Reuse `Panel` schema and shared presentation logic (`useSlidePanelPresentation`) before introducing new panel types.
- Preserve editor + embed parity for any layout mode.

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Test (watch): `npm run test`
- Test (CI): `npm run test -- --run`

## Anti-Patterns to Avoid
- Monolithic page components containing persistence + animation + presentation logic.
- Duplicating schema definitions outside `src/types/navigation.ts`.
- Importing editor code into embed runtime.
- Bypassing service layer for Supabase access.
- Adding new animation logic without explicit cleanup path.
