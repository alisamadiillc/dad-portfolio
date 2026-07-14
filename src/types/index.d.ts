// Global ambient types (no import/export at top level → script scope).
// Derived from the Convex-generated data model (convex/_generated/dataModel,
// regenerated automatically by `pnpm convex:dev`). Field names stay snake_case
// in the schema; `toRow()` in src/lib/convex.ts adds the `id`/`created_at`
// aliases these row types include.

type PostDoc = import("../../convex/_generated/dataModel").Doc<"posts">;
type Post = PostDoc & { id: string; created_at: number };
type PostInput = {
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image_url?: string | null;
  published: boolean;
};

type ExperienceDoc =
  import("../../convex/_generated/dataModel").Doc<"experience">;
type Experience = ExperienceDoc & { id: string; created_at: number };
type ExperienceInput = {
  role: string;
  company?: string | null;
  location?: string | null;
  description?: string | null;
  period: string;
};

type SkillDoc = import("../../convex/_generated/dataModel").Doc<"skills">;
type Skill = SkillDoc & { id: string; created_at: number };
type SkillInput = {
  label: string;
};

type ProjectDoc = import("../../convex/_generated/dataModel").Doc<"projects">;
type Project = ProjectDoc & { id: string; created_at: number };
type ProjectInput = {
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
};

type GalleryImageDoc =
  import("../../convex/_generated/dataModel").Doc<"gallery">;
type GalleryImage = GalleryImageDoc & { id: string; created_at: number };
type GalleryImageInput = {
  image_url: string;
  secondary_image_url?: string | null;
  description?: string | null;
};

type SiteSettingsDoc =
  import("../../convex/_generated/dataModel").Doc<"site_settings">;
type SiteSettings = SiteSettingsDoc & { id: string; created_at: number };
type SiteSettingsInput = {
  name?: string;
  short_name?: string | null;
  avatar_url?: string | null;
  availability_label?: string | null;
  location?: string | null;
  years_experience?: number | null;
  headline?: string | null;
  hero_bio?: string | null;
  about?: string | null;
  contact_heading?: string | null;
  contact_subtext?: string | null;
  email?: string | null;
  phone?: string | null;
  footer_text?: string | null;
};
