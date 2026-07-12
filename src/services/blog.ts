import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useMutation as useConvexMutation,
  useQuery as useConvexQuery,
} from "convex/react";
import { toast } from "sonner";
import { z } from "zod";

import { convexHttp, toRow } from "@/lib/convex";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

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

const KEY = ["posts"] as const;

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong";

// Public reads go over the one-shot HTTP client (no websocket, no auth) via
// TanStack Query; admin reads use the reactive Convex client, which carries
// the Clerk token required by the auth-gated functions.

export const usePublishedPosts = () =>
  useQuery({
    queryKey: [...KEY, "published"],
    queryFn: async () => {
      const posts = await convexHttp.query(api.posts.listPublished, {});
      return posts.map(toRow);
    },
  });

export const useAllPosts = () => {
  const posts = useConvexQuery(api.posts.list);
  return { data: posts?.map(toRow), isLoading: posts === undefined };
};

export const usePostBySlug = (slug: string) =>
  useQuery({
    queryKey: [...KEY, "slug", slug],
    queryFn: async () => {
      const post = await convexHttp.query(api.posts.getBySlug, { slug });
      return post ? toRow(post) : null;
    },
    enabled: !!slug,
  });

export const usePostById = (id?: string) => {
  const post = useConvexQuery(
    api.posts.getById,
    id ? { id: id as Id<"posts"> } : "skip"
  );
  return {
    data: post ? toRow(post) : post,
    isLoading: !!id && post === undefined,
  };
};

export const useCreatePost = () => {
  const qc = useQueryClient();
  const create = useConvexMutation(api.posts.create);
  return useMutation({
    mutationFn: (input: PostInput) => create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Post created");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useUpdatePost = () => {
  const qc = useQueryClient();
  const update = useConvexMutation(api.posts.update);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PostInput> }) =>
      update({ id: id as Id<"posts">, input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Post updated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useDeletePost = () => {
  const qc = useQueryClient();
  const remove = useConvexMutation(api.posts.remove);
  return useMutation({
    mutationFn: async (id: string) => {
      await remove({ id: id as Id<"posts"> });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Post deleted");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};
