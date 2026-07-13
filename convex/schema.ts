import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Field names stay snake_case (Supabase heritage) so the hook/page layer needs
// no renames. `id`/`created_at` are aliased from `_id`/`_creationTime` by
// `toRow()` in src/lib/convex.ts. `updated_at` is ms-epoch, set by mutations.
export default defineSchema({
  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    excerpt: v.optional(v.string()),
    content: v.string(),
    cover_image_url: v.optional(v.string()),
    published: v.boolean(),
    // Migration-only override: _creationTime can't be set on import, so
    // imported rows keep their original publish date here. toRow prefers it.
    created_at: v.optional(v.number()),
    updated_at: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["published"]),

  projects: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    cover_image_url: v.optional(v.string()),
    sort_order: v.number(),
    updated_at: v.number(),
  }).index("by_sort_order", ["sort_order"]),

  experience: defineTable({
    role: v.string(),
    company: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    period: v.string(),
    sort_order: v.number(),
    updated_at: v.number(),
  }).index("by_sort_order", ["sort_order"]),

  gallery: defineTable({
    image_url: v.string(),
    description: v.optional(v.string()),
    sort_order: v.number(),
    updated_at: v.number(),
  }).index("by_sort_order", ["sort_order"]),

  skills: defineTable({
    label: v.string(),
    sort_order: v.number(),
    updated_at: v.number(),
  }).index("by_sort_order", ["sort_order"]),

  // Singleton — one row, read + update only (seed inserts iff empty).
  site_settings: defineTable({
    name: v.string(),
    short_name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    availability_label: v.optional(v.string()),
    location: v.optional(v.string()),
    years_experience: v.optional(v.number()),
    headline: v.optional(v.string()),
    hero_bio: v.optional(v.string()),
    about: v.optional(v.string()),
    contact_heading: v.optional(v.string()),
    contact_subtext: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    footer_text: v.optional(v.string()),
    updated_at: v.number(),
  }),
});
