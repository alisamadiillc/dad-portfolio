// Global ambient types (no import/export at top level → script scope).
// Derived from the Supabase-generated schema so they stay in sync with the DB.
// Regenerate the source with `pnpm db:types`.

type Post =
  import("./database.types").Database["public"]["Tables"]["posts"]["Row"];
type PostInput =
  import("./database.types").Database["public"]["Tables"]["posts"]["Insert"];
