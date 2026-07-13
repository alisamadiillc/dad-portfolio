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

export const skillSchema = z.object({
  label: z.string().min(1, "Label is required"),
});

export type SkillFormValues = z.infer<typeof skillSchema>;

const KEY = ["skills"] as const;

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong";

export const useSkills = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const rows = await convexHttp.query(api.skills.list, {});
      return rows.map(toRow);
    },
  });

// Admin page read — reactive + Clerk-authenticated.
export const useAdminSkills = () => {
  const rows = useConvexQuery(api.skills.adminList);
  return { data: rows?.map(toRow), isLoading: rows === undefined };
};

export const useSkillById = (id?: string) =>
  useQuery({
    queryKey: [...KEY, "id", id],
    queryFn: async () => {
      const row = await convexHttp.query(api.skills.getById, {
        id: id as Id<"skills">,
      });
      return row ? toRow(row) : null;
    },
    enabled: !!id,
  });

export const useCreateSkill = () => {
  const qc = useQueryClient();
  const create = useConvexMutation(api.skills.create);
  return useMutation({
    mutationFn: (input: SkillInput) => create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Skill created");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useUpdateSkill = () => {
  const qc = useQueryClient();
  const update = useConvexMutation(api.skills.update);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SkillInput> }) =>
      update({ id: id as Id<"skills">, input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Skill updated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useDeleteSkill = () => {
  const qc = useQueryClient();
  const remove = useConvexMutation(api.skills.remove);
  return useMutation({
    mutationFn: async (id: string) => {
      await remove({ id: id as Id<"skills"> });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Skill deleted");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useReorderSkills = () => {
  const qc = useQueryClient();
  const reorder = useConvexMutation(api.skills.reorder);
  return useMutation({
    mutationFn: (ids: string[]) => reorder({ ids: ids as Id<"skills">[] }),
    // Fires on every drop — invalidate silently, no toast.
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e) => toast.error(errMsg(e)),
  });
};
