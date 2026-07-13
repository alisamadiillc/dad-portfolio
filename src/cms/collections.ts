import {
  Briefcase,
  FileText,
  GalleryThumbnails,
  Hammer,
  Images,
  type LucideIcon,
} from "lucide-react";

export interface CmsCollection {
  slug: string;
  label: string;
  description: string;
  /** Base admin path for this collection's list view. */
  path: string;
  icon: LucideIcon;
}

/**
 * CMS collections registry. Adding a collection here surfaces it in the admin
 * sidebar and dashboard. Pair each entry with a `src/services/<slug>.ts` file
 * (schema + queries) and its list/editor pages.
 */
export const collections: CmsCollection[] = [
  {
    slug: "experience",
    label: "Experience",
    description: "Work history timeline",
    path: "/admin/cms/experience",
    icon: Briefcase,
  },
  {
    slug: "skills",
    label: "What I do",
    description: "Services and capabilities",
    path: "/admin/cms/skills",
    icon: Hammer,
  },
  {
    slug: "projects",
    label: "Selected work",
    description: "Featured projects",
    path: "/admin/cms/projects",
    icon: Images,
  },
  {
    slug: "gallery",
    label: "Gallery",
    description: "Photo gallery of work",
    path: "/admin/cms/gallery",
    icon: GalleryThumbnails,
  },
  {
    slug: "blog",
    label: "Blog",
    description: "Articles and posts",
    path: "/admin/cms/blog",
    icon: FileText,
  },
];
