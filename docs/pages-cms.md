# Pages CMS — `.pages.yml` conventions

This documents the **CMS-specific conventions** the Pages CMS understands in a
site's `.pages.yml`. The CMS renders special UI when it sees these, so the config
must follow the exact shapes below.

> **Maintainers:** update this file whenever a new CMS feature/skill is added, so
> the AI editing a `.pages.yml` knows the syntax for it. This is the canonical
> reference — keep it in sync with the CMS.

Field basics recap: each field has `name`, `label`, `type` (`string`, `text`,
`number`, `boolean`, `image`, `file`, `object`, `rich-text`, …), and optional
`required`, `list`, `options`.

---

## Typed string inputs — `options.type`

Give a `string` field `options.type` to tell the CMS the value is a link, email, or
phone number. The CMS then renders the input with a **leading icon**:

| `options.type` | icon  | use for                                   |
| -------------- | ----- | ----------------------------------------- |
| `url`          | link  | links, CTAs/buttons, social profile URLs  |
| `email`        | email | `mailto:` / contact email addresses       |
| `tel`          | phone | `tel:` dial links / phone numbers         |

The value is stored **verbatim as plain text** — there is no strict URL validation,
so relative links like `/donate` and `tel:+1971...` are all valid.

Only add `options.type` when the field really holds that kind of value. A normal
`string` field stays a plain input.

```yaml
- name: href
  label: Link
  type: string
  options: { type: url }

- name: email
  label: Contact email
  type: string
  options: { type: email }

- name: phoneHref
  label: Phone link
  type: string
  options: { type: tel }
```

---

## SEO / metadata section — `seo`

To give a page search-engine metadata, add a **top-level object field named exactly
`seo`** with `title` and `description` subfields. The CMS recognizes it and shows a
**live Google search-result (SERP) preview** that updates as you type.

Rules:

- The section's `name` **must be `seo`** and it must be **top-level** (a direct
  entry in the page file's `fields`, not nested inside another object).
- Keep the subfield names **`title`** (string) and **`description`** (text) — the
  preview reads those.
- Put it first in the page's `fields` so metadata sits at the top of the form.

```yaml
- name: seo
  label: SEO
  type: object
  fields:
    - name: title
      label: Title
      type: string
      required: true
    - name: description
      label: Description
      type: text
```

Then wire the values into the page's `<head>` in your Astro layout (e.g.
`<title>{seo.title}</title>` and `<meta name="description" content={seo.description}>`).

---

## Live preview highlighting — `settings` + `data-cms-field`

The CMS can dock a **live preview of the site** in the bottom-right of the edit
screen. When the client focuses a field input, the preview **scrolls to and
highlights** the matching element on the page — so a non-technical client always
knows which text/image an input controls.

This needs three things wired up per site. **When you build or edit a site, do all
three so preview works out of the box.**

### 1. `settings.baseUrl` (+ optional `settings.preview.paths`)

Add a top-level `settings` block to `.pages.yml` with the site's live URL. Without
`baseUrl` the preview panel simply doesn't show.

```yaml
settings:
  baseUrl: https://the-client-site.com   # live (or local dev) URL of the site
  preview:
    paths:              # optional — override the route for a content entry
      site: /           # default route is `/` for entry `home`, else `/<name>`
      about: /about
      hervoice-winners: /hervoice/winners
```

Route resolution per content entry: `settings.preview.paths[<entry name>]` if set,
otherwise `/` when the entry is named `home`, otherwise `/<entry name>`. A
single-page site whose only entry is `site` therefore needs `paths: { site: / }`.

### 2. `data-cms-field` on every rendered element

Every element that outputs a CMS value **must** carry a `data-cms-field` attribute
whose value is the **exact `.pages.yml` field path** — the same dot-path the CMS
uses and the same key path as the JSON. Section object name + field name, joined by
dots; **list items append their index**.

| `.pages.yml` field         | `data-cms-field` value    |
| -------------------------- | ------------------------- |
| top-level `tagline`        | `tagline`                 |
| `hero` › `heading`         | `hero.heading`            |
| `seo` › `title`            | `seo.title`               |
| `features` (list) item 0   | `features.0`              |
| `features` item 0 › `title`| `features.0.title`        |

Before / after:

```astro
<!-- before -->
<h1>{site.hero.heading}</h1>

<!-- after -->
<h1 data-cms-field="hero.heading">{site.hero.heading}</h1>
```

List loops — use the loop index (add it to the `.map` callback):

```astro
{site.features.map((feature, i) => (
  <div data-cms-field={`features.${i}`}>
    <h2 data-cms-field={`features.${i}.title`}>{feature.title}</h2>
    <p data-cms-field={`features.${i}.text`}>{feature.text}</p>
  </div>
))}
```

For an element that renders a whole object (e.g. an `<a>` that uses both a `cta.label`
and a `cta.link` field), tag it with the object path (`data-cms-field="hero.cta"`).
Focusing either subfield resolves to it via the prefix fallback below.

**Resolution order** in the browser: exact match → nearest tagged ancestor path
(`hero.cta.link` → `hero.cta` → `hero`) → first tagged descendant. So tagging the
most specific elements you can is best; objects highlight through their children.

#### Component-based sites — the `cmsField()` helper

When a page renders its data **inline** (like this template's `index.astro`, which
reads root-level `site.json` directly), the field paths are static — just write the
literal string: `data-cms-field="hero.heading"`.

But most real sites split each section into its own component and pass a **slice** of
the data down (`<Hero {...content.hero} />`). Inside `Hero.astro` you no longer know
you're the `hero` section — so hardcoding `"hero.heading"` would be wrong and
un-reusable. Instead, the page passes the section's key as a `cmsPath` prop and the
component builds paths from it with the `cmsField()` helper in `src/lib/cms.ts`:

```ts
// src/lib/cms.ts
export function cmsField(prefix: string | undefined, sub?: string): string | undefined {
  if (prefix === undefined) return undefined;            // not in preview → omit attr
  const path = [prefix, sub].filter(Boolean).join(".");
  return path || undefined;
}
```

```astro
---
// src/pages/index.astro — page passes the section key as cmsPath
import Hero from "../components/marketing/home/Hero.astro";
import content from "../data/home.json";
---
<Hero cmsPath="hero" {...content.hero} />
```

```astro
---
// src/components/marketing/home/Hero.astro — component builds paths off cmsPath
import { cmsField } from "../../../lib/cms";
interface Props { heading: string; images: { image: string }[]; cmsPath?: string }
const { heading, images, cmsPath } = Astro.props;
---
<h1 data-cms-field={cmsField(cmsPath, "heading")}>{heading}</h1>
{images.map((img, i) => (
  <img src={img.image} data-cms-field={cmsField(cmsPath, `images.${i}.image`)} />
))}
```

Rules:

- Page passes `cmsPath="<sectionKey>"` — the key must equal the JSON slice key and the
  `.pages.yml` field name (e.g. `statsBar`, `herVoiceContest`).
- The component adds an optional `cmsPath?: string` prop and tags every leaf with
  `cmsField(cmsPath, "<sub>")`. Nested lists append indices: `cmsField(cmsPath, `stats.${i}.number`)`.
- **Thread into child components**: pass a deeper prefix down, e.g.
  `<TeamMember cmsPath={cmsField(cmsPath, `groups.${gi}.members.${mi}`)} … />`, and the
  child tags its own leaves (`cmsField(cmsPath, "name")`).
- **Root-level pages** (fields live at the JSON root, no wrapping section object — e.g.
  a Privacy page): the page passes `cmsPath=""`, and `cmsField("", "title")` yields the
  bare path `"title"`.
- When `cmsPath` is `undefined` (a normal visit, not the CMS preview), `cmsField` returns
  `undefined` so **no attribute renders** — zero production overhead.

Because `cmsField` returns `undefined` for the no-prefix case, it produces the same
output as writing the literal by hand — use literals for inline root pages, the helper
for anything that receives a `cmsPath` prop.

### 3. The bridge script

The site must ship the preview bridge and fetch it **only** when the URL has
`?cms-preview=1` (the CMS iframe adds this flag). Copy `public/cms-preview.js` from
the template, and in the base layout add a tiny inline loader that checks the flag
client-side and injects the bridge only then.

> **Why not gate with `Astro.url.searchParams`?** Static (prerendered) Astro pages
> have no query params at render time — `Astro.url.search` is always empty — so a
> server-side `{Astro.url... && <script>}` gate never fires. Gate on the client with
> `location.search` instead.

```astro
<!-- src/layouts/Layout.astro, just before </body> -->
<script is:inline>
  if (new URLSearchParams(location.search).has("cms-preview")) {
    var s = document.createElement("script");
    s.src = "/cms-preview.js";
    document.head.appendChild(s);
  }
</script>
```

Normal visitors run the tiny inline check, it's false, and the 2.8KB bridge is never
fetched.

The script listens for the CMS `postMessage`, resolves the element by
`data-cms-field`, scrolls to it, and adds a brief highlight outline. It stays inert
(and unloaded) for real visitors.

> **The one rule that makes it all work:** the CMS field path, the JSON key, and the
> `data-cms-field` value are the same string. Keep them aligned and there is nothing
> else to map.

---

## Sidebar grouping — `type: group` in `content`

When a site has many pages, a flat `content` list forces the client to scroll a long
column to find anything. Organize related entries into **collapsible groups** so the
sidebar reads as a few categories instead of 25+ loose items.

A group is an entry in the top-level `content` array with **`type: group`** and an
**`items`** array holding the real entries (files/collections). The CMS renders it as
a collapsible section with a chevron and a **leaf-count badge**, and auto-expands the
group containing the active page.

Rules:

- `type: group` and `items` are required. `items` holds normal `content` entries
  (`type: file` / `type: collection`) — or nested groups (grouping is recursive).
- `name` must be **alphanumeric with dashes/underscores** (`^[a-zA-Z0-9-_]+$`) and
  unique among its siblings. It is a UI key only — it is **not** a route or a file.
- `label` is the visible category title. `description` is optional.
- Grouping is **presentation only** — it does not change any page's URL or file path.
  The entries inside `items` keep the exact `name`/`path`/`type` they had when flat, so
  moving a page into a group never breaks its content or links.
- Entries left at the top level (not inside any group) still render flat, above/among
  the groups. Grouping is opt-in per entry — you do not have to group everything.

Group by what the client thinks in (Programs, About, Get Involved, Legal…), keep each
group to a handful of entries, and put the most-used pages (Home) at the top level or
first. Clients can also jump to any page instantly with the sidebar's **⌘K search**,
which searches across all groups — so grouping is about tidiness, not findability.

```yaml
content:
  # Frequently-used pages can stay flat at the top.
  - name: home
    label: Home
    type: file
    path: src/content/home.md
    # ...fields

  - name: programs
    label: Programs
    type: group
    items:
      - name: mentorship
        label: Mentorship
        type: file
        path: src/content/mentorship.md
        # ...fields
      - name: hervoice-winners
        label: HerVoice Winners
        type: collection
        path: src/content/hervoice-winners
        # ...fields

  - name: legal
    label: Legal
    type: group
    items:
      - name: privacy
        label: Privacy Policy
        type: file
        path: src/content/privacy.md
        # ...fields
```

> **When re-organizing an existing site:** move entries into `type: group` wrappers
> **without editing their `path`, `name`, or fields**. Only the nesting changes.
