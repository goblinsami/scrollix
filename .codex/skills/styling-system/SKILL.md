# styling-system
Activation: Use when editing SCSS, design tokens, layout styles, or introducing new visual systems.

## Scope
- SCSS architecture and token usage.
- Editor/embed style separation.
- Responsive and maintainability rules.

## Current Structure
- `src/styles/main.scss`: shared base/tokens/components.
- `src/styles/editor.scss`: editor layout/components only.
- `src/styles/embed.scss`: embed layout styles only.
- Subsystems: `tokens/`, `mixins/`, `base/`, `components/`, `layouts/`, `themes/`.

## Rules
- Prefer token/mixin reuse over one-off hardcoded values.
- Keep structural styles in global SCSS modules, not giant per-component scoped blocks.
- Respect separation: editor-specific styles do not ship to embed entry.
- Use responsive behavior through existing breakpoints/mixins conventions.

## Performance and UX
- Maintain transform-based animation support (`snap-stage`, `snap-step`).
- Avoid expensive style patterns that trigger heavy repaint during scroll animations.
- Keep accessibility-visible states (`:focus-visible`) on interactive controls.

## Anti-Patterns
- Duplicating panel styles across multiple files.
- Introducing a parallel token system outside `src/styles/tokens`.
- Coupling visual tokens to component business logic.
