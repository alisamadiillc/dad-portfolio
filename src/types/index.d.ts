// Global ambient types (no import/export at top level → script scope).
// Derived from the Supabase-generated schema so they stay in sync with the DB.
// Regenerate the source with `pnpm db:types`.

type Post =
  import("./database.types").Database["public"]["Tables"]["posts"]["Row"];
type PostInput =
  import("./database.types").Database["public"]["Tables"]["posts"]["Insert"];

type Experience =
  import("./database.types").Database["public"]["Tables"]["experience"]["Row"];
type ExperienceInput =
  import("./database.types").Database["public"]["Tables"]["experience"]["Insert"];

type Skill =
  import("./database.types").Database["public"]["Tables"]["skills"]["Row"];
type SkillInput =
  import("./database.types").Database["public"]["Tables"]["skills"]["Insert"];

type Project =
  import("./database.types").Database["public"]["Tables"]["projects"]["Row"];
type ProjectInput =
  import("./database.types").Database["public"]["Tables"]["projects"]["Insert"];

type SiteSettings =
  import("./database.types").Database["public"]["Tables"]["site_settings"]["Row"];
type SiteSettingsInput =
  import("./database.types").Database["public"]["Tables"]["site_settings"]["Update"];
