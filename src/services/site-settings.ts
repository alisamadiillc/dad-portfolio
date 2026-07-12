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

// Singleton row — seeded once (api.siteSettings.seed). No create/delete, only
// read + update.
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
      const row = await convexHttp.query(api.siteSettings.get, {});
      return row ? toRow(row) : null;
    },
  });

// Admin page read — reactive + Clerk-authenticated.
export const useAdminSiteSettings = () => {
  const row = useConvexQuery(api.siteSettings.adminGet);
  return {
    data: row ? toRow(row) : row,
    isLoading: row === undefined,
  };
};

export const useUpdateSiteSettings = () => {
  const qc = useQueryClient();
  const update = useConvexMutation(api.siteSettings.update);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SiteSettingsInput }) =>
      update({ id: id as Id<"site_settings">, input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};
