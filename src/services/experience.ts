import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/lib/supabase";

export const experienceSchema = z.object({
  period: z.string().min(1, "Period is required"),
  role: z.string().min(1, "Role is required"),
  company: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  sort_order: z.number().int(),
});

export type ExperienceFormValues = z.infer<typeof experienceSchema>;

const KEY = ["experience"] as const;

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong";

export const useExperiences = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useExperienceById = (id?: string) =>
  useQuery({
    queryKey: [...KEY, "id", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

export const useCreateExperience = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ExperienceInput) => {
      const { data, error } = await supabase
        .from("experience")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Experience created");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useUpdateExperience = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ExperienceInput>;
    }) => {
      const { data, error } = await supabase
        .from("experience")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Experience updated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useDeleteExperience = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("experience").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Experience deleted");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};
