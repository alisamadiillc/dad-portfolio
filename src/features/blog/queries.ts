import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import * as api from "./api";
import type { PostInput } from "./types";

const KEY = ["posts"] as const;

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong";
}

export function usePublishedPosts() {
  return useQuery({
    queryKey: [...KEY, "published"],
    queryFn: api.listPublishedPosts,
  });
}

export function useAllPosts() {
  return useQuery({ queryKey: KEY, queryFn: api.listAllPosts });
}

export function usePostBySlug(slug: string) {
  return useQuery({
    queryKey: [...KEY, "slug", slug],
    queryFn: () => api.getPostBySlug(slug),
    enabled: !!slug,
  });
}

export function usePostById(id?: string) {
  return useQuery({
    queryKey: [...KEY, "id", id],
    queryFn: () => api.getPostById(id!),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PostInput) => api.createPost(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Post created");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PostInput> }) =>
      api.updatePost(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Post updated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Post deleted");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
}
