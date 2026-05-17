# supabase-architecture
Activation: Use when modifying auth, profiles/plans, story persistence, publish flow, or RLS-sensitive behavior.

## Scope
- Supabase client usage and service boundaries.
- Stories/profiles data flows.
- RLS-safe update/read patterns.

## Current Structure
- Client: `src/lib/supabase.ts`.
- Story service: `src/services/stories.ts`.
- Profile service: `src/services/profiles.ts`.
- Constants: `src/constants/supabase.ts`, plans in `src/config/plans.ts`.
- Policies reference: `docs/supabase_stories_policies.sql`.

## Rules
- Components/composables do not call Supabase directly; use services.
- Save/update/publish must enforce ownership filters (`id` + `user_id`).
- Public embed fetch uses published stories only (`getPublicStoryById`).
- Keep error logging explicit for RLS diagnosis (`42501` handling already exists).

## Auth and Plan Expectations
- Auth is handled through `useAuth`.
- Permissions and plan-gated capabilities go through `usePermissions`.
- Story limits/watermark/publish rights derive from profile role/plan state.

## Storage Guidance
- Current story payload is JSON in `stories.content_json`.
- If adding media storage, keep bucket operations in dedicated services and never in render components.

## Verification Checklist
1. Unauthenticated users cannot mutate stories.
2. User can mutate only own stories.
3. Embed endpoint cannot return unpublished/private content.
