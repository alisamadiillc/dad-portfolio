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
    SignInPage.tsx      # /sign-in — Clerk <SignIn>
    Admin.tsx           # /admin — protected
  components/
    ProtectedRoute.tsx  # useAuth guard → <Outlet /> or redirect
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
- **Routes**: `/` demo landing (public) · `/sign-in` (public) · `/admin` (signed-in only) · `*` → `/`.
- **Sign-in only, no sign-up.** `src/pages/SignInPage.tsx` renders `<SignIn forceRedirectUrl="/admin" />`. There is **no `/sign-up` route** — users are created in the Clerk dashboard (invite / restricted mode). Do not add a sign-up page.
- **Protecting routes**: `src/components/ProtectedRoute.tsx` uses `useAuth()` (`isLoaded`/`isSignedIn`) and renders `<Outlet />` or `<Navigate to="/sign-in" replace />`. Wrap protected `<Route>`s inside it. Prefer this over `<SignedIn>/<SignedOut>`.
- After sign-in → `/admin` (`forceRedirectUrl`). Sign-out (`<UserButton>`) → `/` (`afterSignOutUrl`).
- Dev needs `VITE_CLERK_PUBLISHABLE_KEY=pk_...` in `.env.local`.

## Database — Supabase

- Client: `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)` in a `src/lib/supabase.ts` singleton.
- **Only the anon key ships to the browser.** Never put the service-role key in client code / `VITE_` vars — it bypasses RLS.
- Enforce **Row Level Security** on every table. Client trusts RLS, not app-side checks.
- Bridge Clerk → Supabase: mint a Supabase-compatible token from Clerk (Clerk JWT template) and pass it to the Supabase client so RLS sees the Clerk user id. Without this, Supabase auth and Clerk auth are separate.

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
