import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib";

// Parity with the old Postgres unique constraint on slug.
const assertSlugUnique = async (
  ctx: MutationCtx,
  slug: string,
  excludeId?: Id<"posts">
) => {
  const existing = await ctx.db
    .query("posts")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing && existing._id !== excludeId) {
    throw new Error(`Slug "${slug}" is already in use`);
  }
};

/** Public: published posts, newest first. */
export const listPublished = query({
  args: {},
  handler: (ctx) =>
    ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .order("desc")
      .collect(),
});

/** Admin: all posts, most recently updated first. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const posts = await ctx.db.query("posts").collect();
    return posts.sort((a, b) => b.updated_at - a.updated_at);
  },
});

/** Public: resolves only published posts (drafts stay invisible, as with RLS). */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    return post?.published ? post : null;
  },
});

/** Admin: single post for the editor (drafts included). */
export const getById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx);
    return ctx.db.get(id);
  },
});

// Clearable optionals accept null from the client: the JSON wire format drops
// `undefined` keys, so null is the only way to say "clear this field".
const clearable = v.optional(v.union(v.string(), v.null()));

/** null -> undefined so optional fields are stored as absent, never null. */
const normalize = <
  T extends { excerpt?: string | null; cover_image_url?: string | null },
>(
  input: T
) => ({
  ...input,
  excerpt: input.excerpt ?? undefined,
  cover_image_url: input.cover_image_url ?? undefined,
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    excerpt: clearable,
    content: v.string(),
    cover_image_url: clearable,
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await assertSlugUnique(ctx, args.slug);
    return ctx.db.insert("posts", {
      ...normalize(args),
      updated_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("posts"),
    input: v.object({
      title: v.optional(v.string()),
      slug: v.optional(v.string()),
      excerpt: clearable,
      content: v.optional(v.string()),
      cover_image_url: clearable,
      published: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { id, input }) => {
    await requireAuth(ctx);
    if (input.slug) await assertSlugUnique(ctx, input.slug, id);
    const { excerpt, cover_image_url, ...rest } = input;
    // A key explicitly set to undefined is removed by patch; omitted keys are
    // left untouched — so only include clearables when the client sent them.
    await ctx.db.patch(id, {
      ...rest,
      ...(excerpt !== undefined && { excerpt: excerpt ?? undefined }),
      ...(cover_image_url !== undefined && {
        cover_image_url: cover_image_url ?? undefined,
      }),
      updated_at: Date.now(),
    });
    return ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx);
    await ctx.db.delete(id);
  },
});
