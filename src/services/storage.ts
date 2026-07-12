import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { agency } from "@/lib/agency";

// Uploads live in the agency R2 bucket (via @alisamadiillc/agency-api).
// Files are keyed `<path>/<uuid>` — `path` is a folder prefix like
// "projects" or "avatar".

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : "Upload failed";

/**
 * Best-effort delete of a stored object by its public URL — the endpoint
 * resolves full URLs to keys server-side. Never throws — a failed cleanup
 * must not block the surrounding save. (Old supabase.co URLs that survive
 * the migration are simply not found; that's fine.)
 */
export const deleteStorageObject = async (url: string | null | undefined) => {
  if (!url) return;
  try {
    await agency.uploads.delete({ key: url });
  } catch {
    // Swallow — orphaned object is not worth failing the mutation over.
  }
};

// --- Mutations -------------------------------------------------------------

type UploadInput = { file: File; path: string };

/**
 * Upload a file under `<path>/<uuid>` and return its durable public URL.
 */
export const useUploadFile = () =>
  useMutation({
    mutationFn: async ({ file, path }: UploadInput) => {
      const { data, error } = await agency.uploads.upload(file, {
        path,
        naming: "uuid",
      });
      if (error) throw new Error(error.message || "Upload failed");
      return { path: data.key, publicUrl: data.publicUrl };
    },
    onSuccess: () => toast.success("File uploaded"),
    onError: (e) => toast.error(errMsg(e)),
  });
