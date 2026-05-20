# Scrollix Shared

Shared source-of-truth package used by:

- `src/**` (editor + embed app)
- `packages/runtime/**` (portable web-component runtime)

It contains common:

- types
- constants
- config values
- utility helpers
- shared panels stylesheet

This keeps builds independent while avoiding style/schema drift.
