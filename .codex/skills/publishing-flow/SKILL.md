# publishing-flow
Activation: Use when changing save/publish/share logic, embed URL generation, or story visibility behavior.

## Scope
- Story lifecycle from editor state to public embed.
- URL and iframe generation conventions.

## Current Lifecycle
1. Editor builds `ContentSchema` from runtime/editor state (`useEditorStoryActions`).
2. Save: `saveStory` or `updateStory` persists `content_json`.
3. Publish: `publishStory` sets `published = true`.
4. Public access: embed loader fetches via `getPublicStoryById`.
5. Sharing: public URL + iframe snippet generated from `PUBLIC_APP_URL`.

## Rules
- Keep `buildCurrentStoryContent` in one place (`useEditorStoryActions`) to avoid schema drift.
- Do not bypass publish flag for embed fetches.
- Preserve copy-link/copy-iframe ergonomics and string formats.
- Ensure opening an existing story restores both content and publish status correctly.

## URL Conventions
- Editor route: `/edit/:storyId`
- Embed route: `/embed/:storyId`
- Public link is always embed URL for published stories.

## Invariants
- Draft/private stories are not retrievable from public embed path.
- Publish can auto-create story if not yet saved (existing behavior).
- Any schema extension must be included in save/update payload composition.
