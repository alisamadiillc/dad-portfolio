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

export const galleryImageSchema = z.object({
  image_url: z.string().min(1, "Image is required").url("Must be a valid URL"),
  // Optional "after" image — only ever set by the upload flow (a valid URL) or
  // cleared to "", so no .url() (the empty default must pass validation).
  secondary_image_url: z.string().optional(),
  description: z.string().optional(),
});

export type GalleryImageFormValues = z.infer<typeof galleryImageSchema>;

const KEY = ["gallery"] as const;

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong";

export const useGallery = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const rows = await convexHttp.query(api.gallery.list, {});
      return rows.map(toRow);
    },
  });

// Admin page read — reactive + Clerk-authenticated. Renders nothing without a
// valid JWT (the gated query throws Unauthorized).
export const useAdminGallery = () => {
  const rows = useConvexQuery(api.gallery.adminList);
  return { data: rows?.map(toRow), isLoading: rows === undefined };
};

export const useCreateGalleryImage = () => {
  const qc = useQueryClient();
  const create = useConvexMutation(api.gallery.create);
  return useMutation({
    mutationFn: (input: GalleryImageInput) => create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Image added");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useUpdateGalleryImage = () => {
  const qc = useQueryClient();
  const update = useConvexMutation(api.gallery.update);
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<GalleryImageInput>;
    }) => update({ id: id as Id<"gallery">, input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Image updated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useDeleteGalleryImage = () => {
  const qc = useQueryClient();
  const remove = useConvexMutation(api.gallery.remove);
  return useMutation({
    mutationFn: async ({
      id,
      imageUrl,
      secondaryImageUrl,
    }: {
      id: string;
      imageUrl?: string | null;
      secondaryImageUrl?: string | null;
    }) => {
      await remove({ id: id as Id<"gallery"> });
      // Clean up stored images so storage doesn't accumulate orphans.
      await Promise.all([
        deleteStorageObject(imageUrl),
        deleteStorageObject(secondaryImageUrl),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Image deleted");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
};

export const useReorderGallery = () => {
  const qc = useQueryClient();
  const reorder = useConvexMutation(api.gallery.reorder);
  return useMutation({
    mutationFn: (ids: string[]) => reorder({ ids: ids as Id<"gallery">[] }),
    // Fires on every drop — invalidate silently, no toast.
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e) => toast.error(errMsg(e)),
  });
};
