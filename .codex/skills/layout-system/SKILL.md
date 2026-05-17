# layout-system
Activation: Use when changing `StoryRenderer`, adding/changing layout modes, or touching `src/core/layouts/*`.

## Scope
- Renderer composition and layout coexistence.
- Layout naming and registration rules.
- Editor/embed compatibility for layout work.

## Current Architecture
- Active runtime renderer: `src/core/StoryRenderer.vue` (single contract with `flowSteps`, `stepStyle`, snap refs).
- Existing layout candidates in repo: `src/core/layouts/DefaultScrollLayout.vue`, `src/core/layouts/Stacked3DCardsLayout.vue`.
- Navigation and step orchestration remain outside layouts (`useStoryRuntime`, `useSlideSnapNavigation`, `useFlowBlocks`).

## Rules
- Keep one renderer contract for all layouts; do not fork editor/embed pages per layout.
- Layout identifiers should be kebab-case and schema-driven (story JSON), not route-driven.
- New layout components must be presentation-focused; avoid duplicating snap/navigation logic.
- Preserve fallback behavior (unknown layout -> default renderer path).
- Keep layout changes compatible with `Panel` schema and CTA/markdown/image conventions.

## Workflow for New Layout
1. Add/extend layout constant(s) in `src/constants`.
2. Add schema field + validator handling (`src/types/navigation.ts`, `src/utils/validateContent.ts`).
3. Register layout in renderer resolver.
4. Reuse shared presentation/composables where possible.
5. Verify both `/edit/:storyId` and `/embed/:storyId` render the same story correctly.

## Invariants
- `focusStep` and `activeStepIndex` behavior must remain stable.
- `flowSteps` generation logic stays source-of-truth for story progression.
- Layout work must not introduce editor-only imports into runtime/embed paths.
