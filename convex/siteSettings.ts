// Filename is camelCase by necessity: it becomes the `api.siteSettings.*`
// namespace, which must be a valid JS identifier (documented exception to the
// repo's kebab-case rule). Table stays `site_settings`.
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib";

/** Public: the singleton settings row (or null before seeding). */
export const get = query({
  args: {},
  handler: (ctx) => ctx.db.query("site_settings").first(),
});

/** Admin: auth-gated read for the settings page. */
export const adminGet = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return ctx.db.query("site_settings").first();
  },
});

const clearable = v.optional(v.union(v.string(), v.null()));
const clearableNumber = v.optional(v.union(v.number(), v.null()));

const inputFields = {
  name: v.optional(v.string()),
  short_name: clearable,
  avatar_url: clearable,
  availability_label: clearable,
  location: clearable,
  years_experience: clearableNumber,
  headline: clearable,
  hero_bio: clearable,
  about: clearable,
  contact_heading: clearable,
  contact_subtext: clearable,
  email: clearable,
  phone: clearable,
  footer_text: clearable,
};

export const update = mutation({
  args: { id: v.id("site_settings"), input: v.object(inputFields) },
  handler: async (ctx, { id, input }) => {
    await requireAuth(ctx);
    // Only include keys the client actually sent; null means "clear" (patch
    // removes keys whose value is undefined).
    const patch: Record<string, unknown> = { updated_at: Date.now() };
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) patch[key] = value ?? undefined;
    }
    await ctx.db.patch(id, patch);
    return ctx.db.get(id);
  },
});

/** Admin: insert the default row iff the table is empty (replaces SQL seed). */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const existing = await ctx.db.query("site_settings").first();
    if (existing) return existing._id;
    return ctx.db.insert("site_settings", {
      name: "Your Name",
      updated_at: Date.now(),
    });
  },
});
