import { z } from "zod";

export const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  excerpt: z.string().max(300, "Keep it under 300 characters").optional(),
  content: z.string(),
  cover_image_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  published: z.boolean(),
});

export type PostFormValues = z.infer<typeof postSchema>;
