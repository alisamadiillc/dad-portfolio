import type { MutationCtx, QueryCtx } from "./_generated/server";

// Function-level auth is the trust boundary (replaces Supabase RLS): every
// non-public function must call this before touching the db.
export const requireAuth = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
};
