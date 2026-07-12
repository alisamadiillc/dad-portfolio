# Client Template — Project Instructions

Standalone client web app. **Not** the Next.js agency template — different stack. Vite SPA, Clerk auth, Convex DB, agency-api (R2) storage.

> Parent `../CLAUDE.md` (Agency Templates root) describes the Next.js/Better Auth/Neon templates. **Those rules do not apply here.** This project is a separate, lighter client build. When they conflict, this file wins.

## Stack

| Concern            | Choice                                                                 |
| ------------------ | ---------------------------------------------------------------------- |
| Build tool         | Vite 8 (Rolldown)                                                      |
| Framework          | React 19 (React Compiler enabled via Babel plugin)                     |
| Language           | TypeScript 6                                                           |
| Routing            | **react-router-dom v7**                                                |
| Styling            | **Tailwind CSS 4** (`@tailwindcss/vite`, no config file)               |
| UI components      | **shadcn/ui — Base UI** (`base-nova` style, neutral, `@base-ui/react`) |
| Icons              | lucide-react                                                           |
| Auth               | **Clerk** (`@clerk/react`)                                             |
| Database / backend | **Convex** (`convex`, functions in `convex/`)                          |
| File storage       | **@alisamadiillc/agency-api** (Cloudflare R2, presigned uploads)       |
| Package manager    | **pnpm only** — never npm/yarn                                         |
| Lint               | ESLint 10 flat config (`eslint.config.js`)                             |

## Commands

```
pnpm dev        # Vite dev server + HMR
pnpm convex:dev # Convex function/schema watcher (run alongside pnpm dev)
pnpm build      # tsc -b && vite build
pnpm preview    # serve production build
pnpm lint       # eslint .
pnpm format     # prettier --write
pnpm format:check  # prettier --check (CI)
```

## Structure

```
index.html              # SPA entry, mounts #root
convex/                 # Convex backend (schema + functions; _generated committed)
  schema.ts             # table definitions + indexes
  lib.ts                # requireAuth guard
  posts.ts / projects.ts / experience.ts / skills.ts / siteSettings.ts
  auth.config.ts        # Clerk JWT provider
src/
  main.tsx              # createRoot + <StrictMode> + <BrowserRouter> + QueryClientProvider
  app.tsx               # routes; admin subtree: ClerkProvider > ConvexProviderWithClerk
  lib/convex.ts         # convex (reactive) + convexHttp (public) clients + toRow()
  lib/agency.ts         # AgencyClient singleton (storage)
  pages/ components/ services/ types/  # as before
```

Client-only SPA — no server/SSR. All rendering in the browser.

## UI — Tailwind + shadcn

- **Tailwind v4**, config-less. Theme tokens + `@theme inline` live in `src/index.css`. No `tailwind.config.js`.
- Plugin wired in `vite.config.ts` (`@tailwindcss/vite`). Import is `@import 'tailwindcss'` in `index.css`.
- Path alias `@/*` → `src/*` (set in `vite.config.ts` + `tsconfig.json`/`tsconfig.app.json`, **no `baseUrl`** — TS 6 deprecated it; bare `paths` resolves relative to tsconfig).
- Add components: `pnpm dlx shadcn@latest add <name>`. Lands in `src/components/ui/`.
- shadcn config in `components.json` (`base-nova`, neutral, `rsc: false`, `tsx: true`).
- **Base UI, not Radix** — same as parent Next template. **No `asChild`** — compose with the **`render` prop** instead (e.g. `<Button render={<a href="..." />}>`). Primitives import from `@base-ui/react/*`.
- Merge classes with `cn()` from `@/lib/utils`.
- Dark mode: `.dark` class on root; tokens already defined.

## Auth — Clerk

Package is `@clerk/react`. Router is **react-router-dom v7**.

- **Provider** lives in `src/app.tsx` (inside `<BrowserRouter>` from `main.tsx` so it can use `useNavigate`): `<ClerkProvider publishableKey routerPush routerReplace afterSignOutUrl="/admin">`, wrapping `<ConvexProviderWithClerk client={convex} useAuth={useAuth}>` around the admin routes only. Key from `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY`.
- **Routes**: `/` landing (public) · `/blog`, `/blog/:slug` (public) · `/admin/*` (signed-in only) · `*` → `/`. **No `/sign-in` route** — sign-in is shown inline.
- **No separate sign-in page, no sign-up.** `src/components/protected-route.tsx` uses `useAuth()`: signed out → renders Clerk `<SignIn>` inline; signed in → `<Outlet />`. Users are created in the Clerk dashboard (invite / restricted). Do not add a sign-up page.
- **Clerk ↔ Convex**: Clerk dashboard has a JWT template named `convex` (from the Convex preset); its Issuer URL is set as `CLERK_JWT_ISSUER_DOMAIN` on the Convex deployment (`npx convex env set ...`). `convex/auth.config.ts` reads it with `applicationID: "convex"`.

## Database — Convex

- Deployment: `enchanted-deer-7` (prod), project `dad-portfolio`. `VITE_CONVEX_URL` in `.env.local`; `CONVEX_DEPLOY_KEY` (CLI-only, never `VITE_`-prefixed) for non-interactive deploy/import.
- **Function-level auth is the trust boundary** (replaces Supabase RLS): every admin query/mutation calls `requireAuth(ctx)` (`convex/lib.ts`) before touching the db. Public functions (landing/blog reads) skip it and must expose only public data (e.g. `posts.getBySlug` returns null for drafts).
- **Two clients** in `src/lib/convex.ts`:
  - `convex` (`ConvexReactClient`) — reactive websocket, **admin only**, wrapped by `ConvexProviderWithClerk` so Clerk's token reaches `ctx.auth.getUserIdentity()`.
  - `convexHttp` (`ConvexHttpClient`) — one-shot HTTP, **public pages**, unauthenticated; used inside TanStack Query queryFns.
- **Field naming**: schema keeps snake_case columns (`cover_image_url`, `sort_order`, `updated_at`) — Supabase heritage, keeps pages unchanged. `toRow()` in `src/lib/convex.ts` aliases `id`/`created_at` from `_id`/`_creationTime` (posts store an explicit `created_at` ms number preserved from the migration). `updated_at` is ms-epoch set by mutations (`Date.now()`), never by the client.
- **Clearable optionals**: mutation args use `v.optional(v.union(v.string(), v.null()))`; the client sends `null` to clear a field (JSON drops `undefined`); handlers normalize null → undefined so fields are stored absent, never null. Reads therefore yield `undefined` (not `null`) for empty optionals.
- Slug uniqueness enforced in `convex/posts.ts` mutations via the `by_slug` index (no DB constraint).
- `site_settings` is a singleton: `siteSettings.get` returns `.first()`; `siteSettings.seed` inserts a default row iff empty. Note the **filename exception**: `convex/siteSettings.ts` is camelCase because it becomes the `api.siteSettings.*` identifier.
- `convex/_generated/` is **committed** so `tsc -b` works without a live deployment. Never hand-edit it; `pnpm convex:dev` regenerates.
- Types: `src/types/index.d.ts` ambient globals (`Post`, `PostInput`, …) derive from `Doc<"...">` via inline `import(...)` + the `toRow` aliases.

## Storage — agency-api (R2)

- `src/lib/agency.ts`: `AgencyClient(VITE_AGENCY_API_KEY)`. All methods return `Result<T>` (`{ data, error }`, no throw) — branch on `error`, don't try/catch.
- `src/services/storage.ts` keeps the old surface: `useUploadFile()` (`{ file, path }` → `{ path, publicUrl }`, paths `"avatar"`/`"projects"`/`"blog"`) via `agency.uploads.upload(file, { path, naming: "uuid" })`; `deleteStorageObject(url)` best-effort via `agency.uploads.delete({ key: url })` (accepts full public URLs).
- Upload lifecycle (project dialog + avatar): local object-URL preview → upload → publicUrl into the form → on replace/cancel/delete, `deleteStorageObject` cleans up. Orphans are acceptable; cleanup never blocks a save.

## CMS

Content collections live behind the admin. Data fetching/mutations use **TanStack Query** (`QueryClientProvider` in `main.tsx`, `src/lib/query-client.ts`) + Convex.

- **Registry**: `src/cms/collections.ts` — drives the admin sidebar and dashboard grid.
- **Per-collection service file**: `src/services/<slug>.ts` — zod `schema` (form-UX validation only; Convex `v.*` args are the trust boundary — keep both in sync) + hooks. Blog is the reference (`src/services/blog.ts`).
- **Hook transport (project-specific divergence from template/client)**: read hooks are shared by public and admin pages, so:
  - Public/shared reads: TanStack `useQuery` + `convexHttp.query(api.x.y, {})` + `toRow`.
  - Admin-only reads (drafts): `useQuery` from `convex/react` (reactive), `"skip"` instead of `enabled`.
  - Mutations: TanStack `useMutation` shells (toasts + `invalidateQueries`) whose `mutationFn` calls `useMutation(api.x.y)` from `convex/react` (import-aliased `useConvexMutation`). Invalidation is required — the TanStack/convexHttp cache doesn't react on its own.
- **Types are global**: `src/types/index.d.ts` — ambient declarations, no imports needed at use sites.
- **Forms**: react-hook-form + zod + shadcn `Input`/`Textarea`/`Label`/`Switch`; `Controller` for `Switch`. No shadcn `form.tsx`.

**Add a collection**: define the table + indexes in `convex/schema.ts`, create `convex/<slug>.ts` (public reads + `requireAuth`-gated CRUD, mirror `convex/posts.ts`), add a registry entry in `cms/collections.ts`, create `services/<slug>.ts` mirroring `services/blog.ts`, add its globals to `types/index.d.ts`, add list/editor pages + routes. No SQL — `pnpm convex:dev` pushes the schema.

## Env

`.env.local` (gitignored). Client-exposed vars **must** be `VITE_`-prefixed:

```
VITE_CLERK_PUBLISHABLE_KEY=
VITE_CONVEX_URL=
VITE_AGENCY_API_KEY=
CONVEX_DEPLOY_KEY=   # CLI only — never VITE_-prefixed, never in client code
```

Never commit secrets.

## Conventions

- React 19 + React Compiler on — **do not** hand-add `useMemo`/`useCallback`/`memo` for perf; compiler handles memoization. Add only for semantic reasons.
- Functional components + hooks. TS strict.
- **Filenames are lowercase `kebab-case`** — every file under `src/`. Exceptions: `convex/siteSettings.ts` (must be a valid JS identifier) and `convex/auth.config.ts` (Convex convention).
- Imports: use `@/` alias for `src/`. Prettier auto-sorts import order (`@ianvs/prettier-plugin-sort-imports`) and Tailwind classes (`prettier-plugin-tailwindcss`).
- Formatting: double quotes, semicolons, 2-space, `trailingComma: es5` — config in `.prettierrc`. Run `pnpm format` before done.
- Run `pnpm lint` before done.

## Never

- Never use npm/yarn — pnpm only.
- Never write an admin Convex function without `requireAuth(ctx)` first.
- Never hand-edit `convex/_generated/`.
- Never expose `CONVEX_DEPLOY_KEY` or any non-`VITE_` secret to the client.
- Never assume parent Next.js template rules (Better Auth, Neon, Drizzle, tRPC, Polar) — none apply here.
