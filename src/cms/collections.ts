import { FileText, type LucideIcon } from "lucide-react";

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
 * sidebar and dashboard. Pair each entry with a `src/features/<slug>/` folder
 * (types, api, queries, schema) and its list/editor pages.
 */
export const collections: CmsCollection[] = [
  {
    slug: "blog",
    label: "Blog",
    description: "Articles and posts",
    path: "/admin/cms/blog",
    icon: FileText,
  },
];
