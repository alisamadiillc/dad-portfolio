import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib";

/** Public: all skills in display order. */
export const list = query({
  args: {},
  handler: (ctx) =>
    ctx.db.query("skills").withIndex("by_sort_order").order("asc").collect(),
});

/** Admin: auth-gated read for the admin list page. */
export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return ctx.db
      .query("skills")
      .withIndex("by_sort_order")
      .order("asc")
      .collect();
  },
});

/** Public: single skill (edit dialog prefill). */
export const getById = query({
  args: { id: v.id("skills") },
  handler: (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    label: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    // New skills append to the end; ordering changes only via `reorder`.
    const last = await ctx.db
      .query("skills")
      .withIndex("by_sort_order")
      .order("desc")
      .first();
    return ctx.db.insert("skills", {
      ...args,
      sort_order: (last?.sort_order ?? -1) + 1,
      updated_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("skills"),
    input: v.object({
      label: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { id, input }) => {
    await requireAuth(ctx);
    await ctx.db.patch(id, { ...input, updated_at: Date.now() });
    return ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("skills") },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx);
    await ctx.db.delete(id);
  },
});

/** Persist a drag-reorder: each id's sort_order becomes its array index. */
export const reorder = mutation({
  args: { ids: v.array(v.id("skills")) },
  handler: async (ctx, { ids }) => {
    await requireAuth(ctx);
    const now = Date.now();
    await Promise.all(
      ids.map((id, i) => ctx.db.patch(id, { sort_order: i, updated_at: now }))
    );
  },
});
