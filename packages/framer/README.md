# Scrollix Framer Wrapper

`ScrollixCards.tsx` is a thin React adapter for Framer.

Responsibilities:

- reads Framer property controls
- serializes `3d-stack-cards` config
- debounced autosave to Supabase (`stories` table)
- creates a story when `projectId` is missing
- updates story when `projectId` exists
- renders `<scrollix-cards project-id="...">`

It does not render stack-card visuals in React.

## Expected runtime flow

1. Framer loads `scrollix-runtime.js`.
2. Wrapper calls `window.ScrollixRuntime.init(...)`.
3. Wrapper autosaves config into Supabase.
4. Wrapper renders `<scrollix-cards project-id="...">`.
5. Web Component runtime fetches config and mounts Vue stack cards inside Shadow DOM.
