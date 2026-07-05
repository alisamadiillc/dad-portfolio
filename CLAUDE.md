# Client Template — Project Instructions

Standalone client web app. **Not** the Next.js agency template — different stack. Vite SPA, Clerk auth, Supabase DB.

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
| Database / backend | **Supabase** (`@supabase/supabase-js`)                                 |
| Package manager    | **pnpm only** — never npm/yarn                                         |
| Lint               | ESLint 10 flat config (`eslint.config.js`)                             |

## Commands

```
pnpm dev        # Vite dev server + HMR
pnpm build      # tsc -b && vite build
pnpm preview    # serve production build
pnpm lint       # eslint .
pnpm format     # prettier --write
pnpm format:check  # prettier --check (CI)
```

## Structure

```
index.html              # SPA entry, mounts #root
src/
  main.tsx              # createRoot + <StrictMode> + <BrowserRouter>
  App.tsx               # ClerkProvider + <Routes>
  index.css             # global styles + Tailwind/theme
  App.css               # landing demo styles
  assets/               # bundled images/svg
  pages/
    Landing.tsx         # / — demo landing (public)
    Admin.tsx           # /admin — protected
  components/
    ProtectedRoute.tsx  # useAuth guard → <Outlet /> or inline <SignIn>
    ui/                 # shadcn components (CLI-generated)
  lib/utils.ts          # cn() — clsx + tailwind-merge
public/                 # static, served at / (favicon.svg, icons.svg)
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

- **Provider** lives in `src/App.tsx` (inside `<BrowserRouter>` from `main.tsx` so it can use `useNavigate`): `<ClerkProvider publishableKey routerPush routerReplace afterSignOutUrl="/">`. Key from `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` (throws if missing).
- **Routes**: `/` demo landing (public) · `/admin` (signed-in only) · `*` → `/`. **No `/sign-in` route** — sign-in is shown inline.
- **No separate sign-in page, no sign-up.** `src/components/ProtectedRoute.tsx` uses `useAuth()` (`isLoaded`/`isSignedIn`): signed out → renders Clerk `<SignIn>` inline (virtual routing, stays on `/admin`); signed in → `<Outlet />`. Wrap protected `<Route>`s inside it. Prefer this over `<SignedIn>/<SignedOut>`.
- Sign-up link hidden via `appearance.elements.footerAction: { display: "none" }`. Users are created in the Clerk dashboard (invite / restricted). Do not add a sign-up page.
- Sign-out (`<UserButton>`) → `/` (`afterSignOutUrl`).
- Dev needs `VITE_CLERK_PUBLISHABLE_KEY=pk_...` in `.env.local`.

## Database — Supabase

- **Client-side only.** Singleton in `src/lib/supabase.ts` — `import { supabase } from "@/lib/supabase"`.
- **Only the anon key ships to the browser.** Never put the service-role key in client code / `VITE_` vars — it bypasses RLS.
- Enforce **Row Level Security** on every table. Client trusts RLS, not app-side checks.
- **Clerk auth via native integration**: client is created with `accessToken: async () => window.Clerk?.session?.getToken()` — Clerk's session token is attached to every Supabase request, so RLS sees the Clerk user id. No JWT template needed.
- Requires the Clerk ↔ Supabase integration enabled in **both dashboards** (Clerk: Supabase integration on; Supabase: Clerk as third-party auth provider). If missing, requests 401 with `PGRST301 "No suitable key … or wrong key type"` — Supabase can't verify Clerk's RS256 token until Clerk is registered as a third-party provider.
- Env vars typed in `src/vite-env.d.ts`; `window.Clerk` global also declared there.
- **Fully typed client**: `createClient<Database>(...)` where `Database` comes from `src/types/database.types.ts`, generated from the live schema via `pnpm db:types` (Supabase CLI; run `supabase login` once first). `.from("posts").select()` etc. are inferred — no manual casts. Regenerate after any schema change. Global `Post`/`PostInput` in `src/types/index.d.ts` are derived from this file (`Database["public"]["Tables"]["posts"]["Row"|"Insert"]`), so they stay in sync.

## CMS

Content collections live behind the admin. Data fetching/mutations use **TanStack
Query** (`QueryClientProvider` in `main.tsx`, `src/lib/queryClient.ts`).

- **Registry**: `src/cms/collections.ts` — array of `{ slug, label, description, path, icon }`. Drives the admin sidebar (`components/admin/AppSidebar.tsx`) and dashboard grid (`components/admin/CollectionGrid.tsx`).
- **Per-collection service file**: `src/services/<slug>.ts` — one file holding the zod `schema` (at top) + React Query hooks. Supabase CRUD is **inlined inside each `queryFn`/`mutationFn`** (no separate `api.ts`); mutations carry toasts + `["<slug>"]` invalidation. Blog is the reference (`src/services/blog.ts`).
- **Types are global**: `src/types/index.d.ts` — ambient declarations (no top-level `import`/`export`), so `Post`, `PostInput`, etc. are available everywhere without importing. They're aliased from the generated `database.types.ts` (see Database section) via inline `import(...)` types, keeping them DB-accurate.
- **Admin pages**: `src/pages/admin/` — `Dashboard`, `CmsHome`, `PostsList` (shadcn Table + row actions + AlertDialog delete), `PostEditor` (react-hook-form + zod + shadcn Input/Textarea/Switch; create & edit).
- **Public pages**: `src/pages/blog/` — `BlogList`, `BlogPost` (markdown via `react-markdown` in `prose`, `@tailwindcss/typography`).
- **Routes**: admin nested under `AdminLayout` (`/admin`, `/admin/cms`, `/admin/cms/blog`, `/admin/cms/blog/new`, `/admin/cms/blog/:id`); public `/blog`, `/blog/:slug`.
- **Forms**: no shadcn `form.tsx` (Base UI registry omits it). Use react-hook-form directly with shadcn `Input`/`Textarea`/`Label`/`Switch`; `Controller` for `Switch`.

**Add a collection**: add a registry entry in `cms/collections.ts`, create `services/<slug>.ts` mirroring `services/blog.ts` (schema + hooks), add its row types to `types/index.d.ts`, add its list/editor pages + routes. Create the Supabase table + RLS (Ali runs SQL).

### Supabase `posts` table

```sql
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  cover_image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table posts enable row level security;
create policy "public read published" on posts
  for select using (published = true);
create policy "authenticated full access" on posts
  for all to authenticated using (true) with check (true);
```

## Env

`.env.local` (gitignored). Client-exposed vars **must** be `VITE_`-prefixed:

```
VITE_CLERK_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never commit secrets. No service-role key client-side.

## Conventions

- React 19 + React Compiler on — **do not** hand-add `useMemo`/`useCallback`/`memo` for perf; compiler handles memoization. Add only for semantic reasons.
- Functional components + hooks. TS strict.
- Imports: use `@/` alias for `src/`. Prettier auto-sorts import order (`@ianvs/prettier-plugin-sort-imports`) and Tailwind classes (`prettier-plugin-tailwindcss`).
- Formatting: double quotes, semicolons, 2-space, `trailingComma: es5` — config in `.prettierrc`. Run `pnpm format` before done.
- Run `pnpm lint` before done.

## Never

- Never use npm/yarn — pnpm only.
- Never expose Supabase service-role key or any non-`VITE_` secret to the client.
- Never disable RLS to "make it work."
- Never assume parent Next.js template rules (Better Auth, Neon, Drizzle, tRPC, Polar) — none apply here.
