# gsap-scroll
Activation: Use when editing `useSlideSnapNavigation.ts`, step navigation behavior, autoplay, or GSAP/ScrollTrigger flows.

## Scope
- Scroll snapping orchestration.
- ScrollTrigger/timeline setup and teardown.
- Looping/index normalization behavior.

## Core Patterns
- Navigation engine lives in composable (`useSlideSnapNavigation`), not components.
- Two modes:
  - `autoSnapEnabled=true`: wheel/touch/keyboard transitions with GSAP `to`.
  - `autoSnapEnabled=false`: pinned `ScrollTrigger` timeline + label snapping.
- Step positions use `translate3d` with vw/vh grid coordinates.

## Rules
- Always kill previous listeners/tweens/triggers before re-init.
- Re-init on flow/mode/speed/ease/loop changes and on resize (debounced).
- Keep index normalization centralized (`normalizeStepIndex` + loop awareness).
- Manual input and autoplay must coordinate with transition lock (`isTransitioning`).

## Performance Rules
- Animate `x/y/opacity/scale/rotation`; avoid layout-thrashing properties.
- Keep `will-change: transform` on moving stage.
- Avoid duplicate watchers that trigger unnecessary navigation rebuilds.

## Loop Guidance
- Existing runtime loop is index normalization-based.
- If visual infinite loops are added, implement virtual indexing without breaking logical `activeStepIndex`.

## Safety Checklist
1. No leaked event listeners on unmount.
2. No orphaned ScrollTriggers/timelines after mode switch.
3. Keyboard/touch/wheel behavior unchanged for current stories unless explicitly intended.
