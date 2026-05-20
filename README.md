# Scrollix Sandbox

Scrollix is a Vue + GSAP cinematic storytelling runtime.

This repository now includes hosted runtime building blocks for Framer integration:

- `packages/shared`: shared schema/constants/styles consumed by app + runtime.
- `packages/runtime`: portable Web Component runtime (`<scrollix-cards>`) backed by Vue.
- `packages/framer`: thin React adapter with Framer Property Controls + debounced Supabase autosave.
- Runtime package is source-isolated from editor/embed app code (`src/**`) so builds can evolve independently.
- `src/services/hostedStories.ts`: hosted story CRUD service.
- `docs/supabase_hosted_stories.sql`: Supabase table/policy setup for hosted configs.

## Core Commands

```bash
npm run dev
npm run build
npm run test -- --run
npm run build:runtime
npm run build:all
```

## Runtime Output

`packages/runtime` builds:

- `dist/scrollix-runtime.js`
- `dist/scrollix-runtime.css`

`npm run build:all` also copies those runtime artifacts into root `dist/` so Netlify can serve:

- `/scrollix-runtime.js`
- `/scrollix-runtime.css`

Netlify config adds CORS headers for those files (`Access-Control-Allow-Origin: *`) so Framer can load the ESM module from a different origin.
The repo also includes `public/_headers` with the same CORS rules as a fallback.

## Standalone Usage

```html
<script type="module" src="/scrollix-runtime.js"></script>
<script>
  window.ScrollixRuntime.init({
    supabaseUrl: "https://YOUR-PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
    storiesTable: "stories"
  })
</script>

<scrollix-cards project-id="abc123"></scrollix-cards>
```

## Framer Usage

Use `packages/framer/ScrollixCards.tsx` as a Framer Code Component:

- edits cards/images/settings via Property Controls
- autosaves hosted JSON to Supabase with debounce
- renders `<scrollix-cards>` (no iframe)
