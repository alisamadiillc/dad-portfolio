import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib";

/** Public: all gallery images in display order. */
export const list = query({
  args: {},
  handler: (ctx) =>
    ctx.db.query("gallery").withIndex("by_sort_order").order("asc").collect(),
});

/** Admin: same rows, but requires a valid Clerk JWT — admin pages read via
 * this so the admin UI shows nothing without auth. */
export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return ctx.db
      .query("gallery")
      .withIndex("by_sort_order")
      .order("asc")
      .collect();
  },
});

/** Public: single image (used by the edit dialog prefill). */
export const getById = query({
  args: { id: v.id("gallery") },
  handler: (ctx, { id }) => ctx.db.get(id),
});

const clearable = v.optional(v.union(v.string(), v.null()));

const normalize = <T extends { description?: string | null }>(input: T) => ({
  ...input,
  description: input.description ?? undefined,
});

export const create = mutation({
  args: {
    image_url: v.string(),
    description: clearable,
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    // New images append to the end; ordering changes only via `reorder`.
    const last = await ctx.db
      .query("gallery")
      .withIndex("by_sort_order")
      .order("desc")
      .first();
    return ctx.db.insert("gallery", {
      ...normalize(args),
      sort_order: (last?.sort_order ?? -1) + 1,
      updated_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("gallery"),
    input: v.object({
      image_url: v.optional(v.string()),
      description: clearable,
    }),
  },
  handler: async (ctx, { id, input }) => {
    await requireAuth(ctx);
    const { description, ...rest } = input;
    await ctx.db.patch(id, {
      ...rest,
      ...(description !== undefined && {
        description: description ?? undefined,
      }),
      updated_at: Date.now(),
    });
    return ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("gallery") },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx);
    await ctx.db.delete(id);
  },
});

/** Persist a drag-reorder: each id's sort_order becomes its array index. */
export const reorder = mutation({
  args: { ids: v.array(v.id("gallery")) },
  handler: async (ctx, { ids }) => {
    await requireAuth(ctx);
    const now = Date.now();
    await Promise.all(
      ids.map((id, i) => ctx.db.patch(id, { sort_order: i, updated_at: now }))
    );
  },
});
