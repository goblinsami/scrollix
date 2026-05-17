# json-schema
Activation: Use when editing story JSON, validators, panel fields, import/export, or story persistence shape.

## Scope
- `ContentSchema` and `Panel` contracts.
- Validation and normalization pathways.
- Schema evolution strategy.

## Current Canonical Shape
- Types: `src/types/navigation.ts`.
- Validation: `src/utils/validateContent.ts`.
- Runtime normalization: `src/core/useStoryRuntime.ts`.

## Key Fields
- Story-level: `autoSnapEnabled`, `loopEnabled`, `enableLoop` (legacy), `snapEase`, `transitionSpeed`, `autoPlayEnabled`, `autoPlaySpeed`, `enableCtas`, `watermarkEnabled`.
- Panels: text, markdown flags, sizing/alignment, visual fields (`image`, `backgroundGradient`, overlays), CTA (`ctaText/ctaLink` and structured `cta`), and `nextPanelPosition`.

## Rules
- Treat `navigation.ts` as single source of truth.
- Any new field requires:
  1. type update,
  2. validator rule,
  3. runtime/default normalization,
  4. tests.
- Preserve backward compatibility for existing public stories.
- Keep validation errors actionable and field-specific.

## CTA Conventions
- Structured CTA: `{ label, linkKey }` preferred for managed links.
- Legacy CTA text/link remains supported for compatibility.

## Evolution Guidance
- Prefer additive changes; avoid breaking required fields.
- If a breaking schema change is unavoidable, add explicit versioning (e.g., `schemaVersion`) and migration path in loader/import flow.
