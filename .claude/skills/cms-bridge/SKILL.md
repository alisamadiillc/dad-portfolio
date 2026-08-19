---
name: cms-bridge
description: Edit this site's CMS wiring — the v2 contract (cms.json / pages.json / variables.json / seo.json), the bridge components, field-path conventions, and collections. Use when adding, renaming, or debugging CMS-editable content on this Astro site.
---

# cms-bridge

This site is wired to the cms-bridge v2 CMS. Before changing any CMS-related
markup or JSON, read:

- [pages-cms.md](pages-cms.md) — the full client-site guide (start here)
- [conventions.md](conventions.md) — the field-path contract and idempotency rules
- [collections.md](collections.md) — array vs markdown collections
- [AGENTS.md](AGENTS.md) — rules for automated agents

Hard rules: field paths are page-relative (never page-prefixed); only ADD keys,
never rename or delete existing ones; never nest one `data-cms-field` / `field`
element inside another; run `npx cms-bridge check` after every batch of changes.
