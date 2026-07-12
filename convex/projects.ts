import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib";

/** Public: all projects in display order. */
export const list = query({
  args: {},
  handler: (ctx) =>
    ctx.db.query("projects").withIndex("by_sort_order").order("asc").collect(),
});

/** Admin: same rows, but requires a valid Clerk JWT — admin pages read via
 * this so the admin UI shows nothing without auth. */
export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return ctx.db
      .query("projects")
      .withIndex("by_sort_order")
      .order("asc")
      .collect();
  },
});

/** Public: single project (used by the edit dialog prefill). */
export const getById = query({
  args: { id: v.id("projects") },
  handler: (ctx, { id }) => ctx.db.get(id),
});

const clearable = v.optional(v.union(v.string(), v.null()));

const normalize = <
  T extends { description?: string | null; cover_image_url?: string | null },
>(
  input: T
) => ({
  ...input,
  description: input.description ?? undefined,
  cover_image_url: input.cover_image_url ?? undefined,
});

export const create = mutation({
  args: {
    title: v.string(),
    description: clearable,
    cover_image_url: clearable,
    sort_order: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return ctx.db.insert("projects", {
      ...normalize(args),
      updated_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    input: v.object({
      title: v.optional(v.string()),
      description: clearable,
      cover_image_url: clearable,
      sort_order: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { id, input }) => {
    await requireAuth(ctx);
    const { description, cover_image_url, ...rest } = input;
    await ctx.db.patch(id, {
      ...rest,
      ...(description !== undefined && {
        description: description ?? undefined,
      }),
      ...(cover_image_url !== undefined && {
        cover_image_url: cover_image_url ?? undefined,
      }),
      updated_at: Date.now(),
    });
    return ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx);
    await ctx.db.delete(id);
  },
});
