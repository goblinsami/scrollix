# component-architecture
Activation: Use when adding/refactoring Vue components, composables, or feature modules.

## Scope
- Vue maintainability and file responsibility boundaries.
- Where logic belongs (component vs composable vs service vs util).

## Rules
- Components: rendering + event forwarding, minimal orchestration.
- Composables: stateful logic, side effects, coordination (`useStoryRuntime`, `useEditorStoryActions`).
- Services: external I/O only (Supabase/network/storage).
- Utils/constants/types: shared pure logic and contracts.

## Practical Conventions
- Keep page components thin (`EditPage`, `EmbedPage` should mostly compose hooks/components).
- Extract repeated literals into `src/constants`.
- Extract schema and DTO interfaces into `src/types`.
- Prefer explicit emits/props typing in SFCs.

## File Size Guidance
- If a component/composable exceeds clear single responsibility, split by concern.
- Avoid giant SFCs that combine rendering, networking, and animation orchestration.

## Anti-Patterns
- Direct Supabase calls inside SFC templates/scripts.
- Duplicating panel presentation logic instead of reusing `useSlidePanelPresentation`.
- Cross-importing editor-only internals into generic runtime modules.
