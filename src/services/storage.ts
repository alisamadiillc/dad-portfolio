import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

// Single public bucket for all uploads (avatar, project covers). Created in the
// Supabase dashboard with public read + authenticated write/delete RLS.
export const BUCKET = "media";

// --- Helpers ---------------------------------------------------------------

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : "Upload failed";

// Strip anything unsafe from a filename before it becomes part of an object key.
const safeName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");

/**
 * Parse the storage object key out of a Supabase public URL, e.g.
 * `https://<proj>.supabase.co/storage/v1/object/public/media/projects/abc.webp`
 * → `projects/abc.webp`. Returns `null` when the URL is not a `media`-bucket
 * object (external URLs like the old CDN avatar must be skipped, not deleted).
 */
export const storagePathFromUrl = (url: string | null | undefined) => {
  if (!url) return null;
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const key = url.slice(i + marker.length).split("?")[0];
  return key ? decodeURIComponent(key) : null;
};

/**
 * Best-effort delete of a stored object by its public URL. Never throws — a
 * failed cleanup must not block the surrounding save.
 */
export const deleteStorageObject = async (url: string | null | undefined) => {
  const key = storagePathFromUrl(url);
  if (!key) return;
  try {
    await supabase.storage.from(BUCKET).remove([key]);
  } catch {
    // Swallow — orphaned object is not worth failing the mutation over.
  }
};

// --- Mutations -------------------------------------------------------------

type UploadInput = { file: File; path: string };

/**
 * Upload a file to the `media` bucket under `<path>/<uuid>-<name>` and return
 * its durable public URL. `path` is a folder prefix, e.g. `"projects"`.
 */
export const useUploadFile = () =>
  useMutation({
    mutationFn: async ({ file, path }: UploadInput) => {
      const key = `${path}/${crypto.randomUUID()}-${safeName(file.name)}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(key, file, { upsert: false });
      if (error) throw error;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
      return { path: key, publicUrl: data.publicUrl };
    },
    onSuccess: () => toast.success("File uploaded"),
    onError: (e) => toast.error(errMsg(e)),
  });
