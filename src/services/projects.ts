import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/lib/supabase";

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
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useProjectById = (id?: string) =>
  useQuery({
    queryKey: [...KEY, "id", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjectInput) => {
      const { data, error } = await supabase
        .from("projects")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Project created");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ProjectInput>;
    }) => {
      const { data, error } = await supabase
        .from("projects")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Project updated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Project deleted");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};
