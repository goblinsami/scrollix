# Scrollix Sandbox

Scrollix is a Vue + GSAP cinematic storytelling runtime.

This repository now includes hosted runtime building blocks for Framer integration:

- `packages/runtime`: portable Web Component runtime (`<scrollix-cards>`) backed by Vue.
- `packages/framer`: thin React adapter with Framer Property Controls + debounced Supabase autosave.
- `src/services/hostedStories.ts`: hosted story CRUD service.
- `docs/supabase_hosted_stories.sql`: Supabase table/policy setup for hosted configs.

## Core Commands

```bash
npm run dev
npm run build
npm run test -- --run
npm run build:runtime
```

## Runtime Output

`packages/runtime` builds:

- `dist/scrollix-runtime.js`
- `dist/scrollix-runtime.css`

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
