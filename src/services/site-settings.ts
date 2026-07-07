import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/lib/supabase";

// Singleton row — seeded once via SQL. No create/delete, only read + update.
export const siteSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  short_name: z.string().optional(),
  avatar_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  availability_label: z.string().optional(),
  location: z.string().optional(),
  years_experience: z.number().int().nonnegative().optional(),
  headline: z.string().optional(),
  hero_bio: z.string().optional(),
  about: z.string().optional(),
  contact_heading: z.string().optional(),
  contact_subtext: z.string().optional(),
  email: z.email("Must be a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  footer_text: z.string().optional(),
});

export type SiteSettingsFormValues = z.infer<typeof siteSettingsSchema>;

const KEY = ["site-settings"] as const;

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong";

export const useSiteSettings = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const useUpdateSiteSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: SiteSettingsInput;
    }) => {
      const { data, error } = await supabase
        .from("site_settings")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};
