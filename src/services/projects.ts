import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useMutation as useConvexMutation,
  useQuery as useConvexQuery,
} from "convex/react";
import { toast } from "sonner";
import { z } from "zod";

import { convexHttp, toRow } from "@/lib/convex";

import { deleteStorageObject } from "@/services/storage";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  cover_image_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
  sort_order: z.number().int(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

const KEY = ["projects"] as const;

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong";

export const useProjects = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const rows = await convexHttp.query(api.projects.list, {});
      return rows.map(toRow);
    },
  });

// Admin page read — reactive + Clerk-authenticated. Renders nothing without a
// valid JWT (the gated query throws Unauthorized).
export const useAdminProjects = () => {
  const rows = useConvexQuery(api.projects.adminList);
  return { data: rows?.map(toRow), isLoading: rows === undefined };
};

export const useProjectById = (id?: string) =>
  useQuery({
    queryKey: [...KEY, "id", id],
    queryFn: async () => {
      const row = await convexHttp.query(api.projects.getById, {
        id: id as Id<"projects">,
      });
      return row ? toRow(row) : null;
    },
    enabled: !!id,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  const create = useConvexMutation(api.projects.create);
  return useMutation({
    mutationFn: (input: ProjectInput) => create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Project created");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  const update = useConvexMutation(api.projects.update);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProjectInput> }) =>
      update({ id: id as Id<"projects">, input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Project updated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  const remove = useConvexMutation(api.projects.remove);
  return useMutation({
    mutationFn: async ({
      id,
      imageUrl,
    }: {
      id: string;
      imageUrl?: string | null;
    }) => {
      await remove({ id: id as Id<"projects"> });
      // Clean up the cover image so storage doesn't accumulate orphans.
      await deleteStorageObject(imageUrl);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Project deleted");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};
