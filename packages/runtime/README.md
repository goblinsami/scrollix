# Scrollix Runtime Package

Build outputs:

- `dist/scrollix-runtime.js`
- `dist/scrollix-runtime.css`

## Build

```bash
npm --prefix packages/runtime run build
```

## Browser Usage

```html
<script type="module" src="/path/to/scrollix-runtime.js"></script>
<script>
  window.ScrollixRuntime.init({
    supabaseUrl: "https://YOUR-PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
    storiesTable: "stories"
  })
</script>

<scrollix-cards project-id="abc123"></scrollix-cards>
```

The runtime fetches the story from Supabase and renders the existing Vue stack-cards runtime inside Shadow DOM.

Important:

- The runtime bundle is ESM and must be loaded with `type="module"`.
- `window.ScrollixRuntime.init(...)` safely registers `scrollix-cards` once.
