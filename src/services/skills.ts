import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/lib/supabase";

export const skillSchema = z.object({
  label: z.string().min(1, "Label is required"),
  sort_order: z.number().int(),
});

export type SkillFormValues = z.infer<typeof skillSchema>;

const KEY = ["skills"] as const;

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong";

export const useSkills = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useSkillById = (id?: string) =>
  useQuery({
    queryKey: [...KEY, "id", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

export const useCreateSkill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SkillInput) => {
      const { data, error } = await supabase
        .from("skills")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Skill created");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useUpdateSkill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<SkillInput>;
    }) => {
      const { data, error } = await supabase
        .from("skills")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Skill updated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useDeleteSkill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Skill deleted");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};
