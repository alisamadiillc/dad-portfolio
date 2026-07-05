# Client Template — Project Instructions

Standalone client web app. **Not** the Next.js agency template — different stack. Vite SPA, Clerk auth, Supabase DB.

> Parent `../CLAUDE.md` (Agency Templates root) describes the Next.js/Better Auth/Neon templates. **Those rules do not apply here.** This project is a separate, lighter client build. When they conflict, this file wins.

## Stack

| Concern            | Choice                                             |
| ------------------ | -------------------------------------------------- |
| Build tool         | Vite 8 (Rolldown)                                  |
| Framework          | React 19 (React Compiler enabled via Babel plugin) |
| Language           | TypeScript 6                                       |
| Auth               | **Clerk** (`@clerk/clerk-react`)                   |
| Database / backend | **Supabase** (`@supabase/supabase-js`)             |
| Package manager    | **pnpm only** — never npm/yarn                     |
| Lint               | ESLint 10 flat config (`eslint.config.js`)         |

## Commands

```
pnpm dev        # Vite dev server + HMR
pnpm build      # tsc -b && vite build
pnpm preview    # serve production build
pnpm lint       # eslint .
```

## Structure

```
index.html          # SPA entry, mounts #root
src/
  main.tsx          # createRoot + <StrictMode>
  App.tsx           # root component
  index.css         # global styles
  App.css           # component styles
  assets/           # bundled images/svg
public/             # static, served at / (favicon.svg, icons.svg)
```

Client-only SPA — no server/SSR. All rendering in the browser.

## Auth — Clerk

- Provider: wrap app in `<ClerkProvider publishableKey={...}>` in `main.tsx`.
- Publishable key from `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` (Vite exposes only `VITE_`-prefixed env vars to client).
- Use Clerk hooks/components: `useAuth`, `useUser`, `<SignedIn>`, `<SignedOut>`, `<SignIn>`, `<UserButton>`.
- Gate protected UI with `<SignedIn>` / `<SignedOut>`, not manual token checks.

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
- Path/import style: relative imports from `src/`. Add an alias in `vite.config.ts` + `tsconfig` if `@/` desired.
- Run `pnpm lint` before done.

## Never

- Never use npm/yarn — pnpm only.
- Never expose Supabase service-role key or any non-`VITE_` secret to the client.
- Never disable RLS to "make it work."
- Never assume parent Next.js template rules (Better Auth, Neon, Drizzle, tRPC, Polar) — none apply here.
