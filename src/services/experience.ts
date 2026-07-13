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

export const experienceSchema = z.object({
  period: z.string().min(1, "Period is required"),
  role: z.string().min(1, "Role is required"),
  company: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

export type ExperienceFormValues = z.infer<typeof experienceSchema>;

const KEY = ["experience"] as const;

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong";

export const useExperiences = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const rows = await convexHttp.query(api.experience.list, {});
      return rows.map(toRow);
    },
  });

// Admin page read — reactive + Clerk-authenticated.
export const useAdminExperiences = () => {
  const rows = useConvexQuery(api.experience.adminList);
  return { data: rows?.map(toRow), isLoading: rows === undefined };
};

export const useExperienceById = (id?: string) =>
  useQuery({
    queryKey: [...KEY, "id", id],
    queryFn: async () => {
      const row = await convexHttp.query(api.experience.getById, {
        id: id as Id<"experience">,
      });
      return row ? toRow(row) : null;
    },
    enabled: !!id,
  });

export const useCreateExperience = () => {
  const qc = useQueryClient();
  const create = useConvexMutation(api.experience.create);
  return useMutation({
    mutationFn: (input: ExperienceInput) => create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Experience created");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useUpdateExperience = () => {
  const qc = useQueryClient();
  const update = useConvexMutation(api.experience.update);
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ExperienceInput>;
    }) => update({ id: id as Id<"experience">, input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Experience updated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useDeleteExperience = () => {
  const qc = useQueryClient();
  const remove = useConvexMutation(api.experience.remove);
  return useMutation({
    mutationFn: async (id: string) => {
      await remove({ id: id as Id<"experience"> });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Experience deleted");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useReorderExperiences = () => {
  const qc = useQueryClient();
  const reorder = useConvexMutation(api.experience.reorder);
  return useMutation({
    mutationFn: (ids: string[]) => reorder({ ids: ids as Id<"experience">[] }),
    // Fires on every drop — invalidate silently, no toast.
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e) => toast.error(errMsg(e)),
  });
};
