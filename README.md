# Astro CMS Template

Static Astro site with [Tailwind CSS v4](https://tailwindcss.com) and content editable through [Pages CMS](https://pagescms.org) — free, git-based, no code footprint beyond `.pages.yml`.

## Project Structure

```text
/
├── .pages.yml            # Pages CMS config (fields, media)
├── public/
│   └── media/            # CMS-uploaded images
├── src/
│   ├── data/
│   │   └── site.json     # editable site content
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   └── index.astro   # renders site.json
│   └── styles/
│       └── global.css    # Tailwind entry
└── package.json
```

## Commands

| Command        | Action                               |
| :------------- | :----------------------------------- |
| `pnpm install` | Install dependencies                 |
| `pnpm dev`     | Start dev server at `localhost:4321` |
| `pnpm build`   | Build production site to `./dist/`   |
| `pnpm preview` | Preview the build locally            |

## Client Editing (Pages CMS, self-hosted)

Content is edited at [cms.alisamadii.com](https://cms.alisamadii.com) — a self-hosted Pages CMS instance (fork: `alisamadiii/pagescms`, deployed on Vercel, Neon Postgres for accounts).

1. Install the **Ali Samadi CMS** GitHub App on the repository ([github.com/apps/ali-samadi-cms](https://github.com/apps/ali-samadi-cms))
2. Sign in at cms.alisamadii.com with GitHub — the repo appears, `.pages.yml` is read automatically
3. Clients sign in with their GitHub account, or (once Resend is configured) get invited by email under **Collaborators** — magic-link login, no GitHub account needed
4. Every save commits to `main` and triggers a redeploy

Collaborators can edit content and media only — they cannot change `.pages.yml` or site code.

## Adding Editable Fields

1. Add the field to `src/data/site.json`
2. Render it in `src/pages/index.astro`
3. Mirror the field in `.pages.yml` (same name/structure)
