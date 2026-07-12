import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib";

/** Public: all experience entries in display order. */
export const list = query({
  args: {},
  handler: (ctx) =>
    ctx.db
      .query("experience")
      .withIndex("by_sort_order")
      .order("asc")
      .collect(),
});

/** Admin: auth-gated read for the admin list page. */
export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return ctx.db
      .query("experience")
      .withIndex("by_sort_order")
      .order("asc")
      .collect();
  },
});

/** Public: single entry (edit dialog prefill). */
export const getById = query({
  args: { id: v.id("experience") },
  handler: (ctx, { id }) => ctx.db.get(id),
});

const clearable = v.optional(v.union(v.string(), v.null()));

const normalize = <
  T extends {
    company?: string | null;
    location?: string | null;
    description?: string | null;
  },
>(
  input: T
) => ({
  ...input,
  company: input.company ?? undefined,
  location: input.location ?? undefined,
  description: input.description ?? undefined,
});

export const create = mutation({
  args: {
    role: v.string(),
    company: clearable,
    location: clearable,
    description: clearable,
    period: v.string(),
    sort_order: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return ctx.db.insert("experience", {
      ...normalize(args),
      updated_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("experience"),
    input: v.object({
      role: v.optional(v.string()),
      company: clearable,
      location: clearable,
      description: clearable,
      period: v.optional(v.string()),
      sort_order: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { id, input }) => {
    await requireAuth(ctx);
    const { company, location, description, ...rest } = input;
    await ctx.db.patch(id, {
      ...rest,
      ...(company !== undefined && { company: company ?? undefined }),
      ...(location !== undefined && { location: location ?? undefined }),
      ...(description !== undefined && {
        description: description ?? undefined,
      }),
      updated_at: Date.now(),
    });
    return ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("experience") },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx);
    await ctx.db.delete(id);
  },
});
