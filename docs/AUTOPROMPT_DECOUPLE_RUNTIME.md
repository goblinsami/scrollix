# AutoPrompt: Decouple Editor, Embed and Runtime Builds

Use this prompt when you need Scrollix to scale with fully independent artifacts.

```text
You are working in the Scrollix monorepo.

Goal:
- Keep 3 independent products:
  1) editor app
  2) embed/viewer app
  3) portable web-component runtime
- Ensure one build does not depend on source files from another product.

Hard constraints:
- Do not rebuild Stack Cards from scratch.
- Reuse existing StackCardsPanel, motion behavior and hosted story schema.
- Keep React (Framer) as a thin adapter only.
- Keep runtime as Vue + Custom Element + Shadow DOM + ESM.

Implementation checklist:
1. Runtime package isolation
   - Move/copy runtime rendering dependencies into `packages/runtime/src/runtime-core/**`.
   - Runtime must not import from `src/**`.
   - Remove runtime aliasing to app source in `packages/runtime/vite.config.ts`.

2. Shared contracts
   - Keep hosted schema compatibility:
     - `type = "3d-stack-cards"`
     - `config.cards[]`
     - `config.settings{}`
   - Runtime loader still reads story by `projectId`.

3. Build independence
   - `npm run build` builds app/editor+embed.
   - `npm run build:runtime` builds only runtime package.
   - `npm run build:all` builds both and copies runtime artifacts into root `dist`.

4. Hosting
   - Runtime JS/CSS served with CORS headers.
   - Runtime remains ESM (`type="module"` required).

5. Validation
   - `packages/runtime` builds successfully without `src/**` imports.
   - `customElements.get('scrollix-cards')` returns class after loading runtime module.
   - Framer wrapper can render `<scrollix-cards project-id="...">` and load stories.

Deliverables:
- changed file list with reasons
- architecture delta summary (before/after)
- known risks and next hardening steps
```

Recommended acceptance commands:

```bash
npm run build
npm run build:runtime
npm run build:all
```
