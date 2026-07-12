import { ConvexHttpClient } from "convex/browser";
import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

// In production, a missing URL is a fatal misconfig — fail loud. In dev, don't
// throw at module load: this module sits in App's static import chain and
// throwing would blank the whole bundle.
if (import.meta.env.PROD && !convexUrl) {
  throw new Error("Missing VITE_CONVEX_URL");
}

/**
 * Reactive websocket client — ADMIN ONLY. Wrapped by `ConvexProviderWithClerk`
 * in app.tsx, which attaches Clerk's session token so admin functions pass
 * their `ctx.auth.getUserIdentity()` checks. The socket connects lazily on the
 * first subscribed query, so public routes never open it.
 */
export const convex = new ConvexReactClient(
  convexUrl || "https://placeholder.convex.cloud"
);

/**
 * One-shot HTTP client — PUBLIC pages (landing, blog). Marketing content
 * doesn't need live updates, so public reads go over plain HTTP via TanStack
 * Query instead of holding a websocket open per visitor. Unauthenticated:
 * only public Convex queries (no auth check) work through it.
 */
export const convexHttp = new ConvexHttpClient(
  convexUrl || "https://placeholder.convex.cloud"
);

/**
 * Convex docs -> legacy row shape. Fields kept their snake_case names in the
 * schema; only `id`/`created_at` need aliasing from `_id`/`_creationTime`
 * (posts store an explicit `created_at` from the Supabase migration — prefer
 * it so original publish dates survive).
 */
export const toRow = <
  T extends { _id: string; _creationTime: number; created_at?: number },
>(
  doc: T
) => ({
  ...doc,
  id: doc._id as string,
  created_at: doc.created_at ?? doc._creationTime,
});
