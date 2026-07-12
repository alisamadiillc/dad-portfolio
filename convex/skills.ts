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
    sort_order: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return ctx.db.insert("skills", { ...args, updated_at: Date.now() });
  },
});

export const update = mutation({
  args: {
    id: v.id("skills"),
    input: v.object({
      label: v.optional(v.string()),
      sort_order: v.optional(v.number()),
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
