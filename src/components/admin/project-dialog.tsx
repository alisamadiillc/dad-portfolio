import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  projectSchema,
  useCreateProject,
  useUpdateProject,
  type ProjectFormValues,
} from "@/services/projects";
import { deleteStorageObject, useUploadFile } from "@/services/storage";

// Cover images upload to the `media` bucket under this folder prefix; the upload
// returns a durable public URL we store in cover_image_url.
const UPLOAD_PATH = "projects";

export function ProjectDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: Project | null;
}) {
  // The form registers a cleanup that removes any uploaded-but-unsaved image.
  const cleanupRef = useRef<() => void>(() => {});
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Any close path (Cancel, Esc, backdrop) that isn't a save discards
        // uploads that never made it into the database.
        if (!next) cleanupRef.current();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <ProjectForm
          row={row}
          onDone={() => onOpenChange(false)}
          cleanupRef={cleanupRef}
        />
      </DialogContent>
    </Dialog>
  );
}

function ProjectForm({
  row,
  onDone,
  cleanupRef,
}: {
  row?: Project | null;
  onDone: () => void;
  cleanupRef: React.RefObject<() => void>;
}) {
  const createRow = useCreateProject();
  const updateRow = useUpdateProject();
  const upload = useUploadFile();
  const fileRef = useRef<HTMLInputElement>(null);
  // URL of an image uploaded this session but not yet saved to the DB. Any such
  // image is deleted from storage when superseded, removed, or the dialog closes.
  const uncommittedRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: row?.title ?? "",
      cover_image_url: row?.cover_image_url ?? "",
      description: row?.description ?? "",
      sort_order: row?.sort_order ?? 0,
    },
  });

  const coverUrl = watch("cover_image_url");
  const originalUrl = row?.cover_image_url ?? "";
  // Instant local preview (object URL) shown while the file uploads.
  const [preview, setPreview] = useState<string | null>(null);
  const displaySrc = preview ?? coverUrl;

  // Delete the current uploaded-but-unsaved image, if any. Idempotent.
  const discardUncommitted = () => {
    if (uncommittedRef.current) {
      void deleteStorageObject(uncommittedRef.current);
      uncommittedRef.current = null;
    }
  };
  // Registered on the dialog so closing without saving cleans up the orphan.
  cleanupRef.current = discardUncommitted;

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    // Show the picked file immediately from local memory, before it uploads.
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    upload.mutate(
      { file, path: UPLOAD_PATH },
      {
        onSuccess: (res) => {
          if (!res.publicUrl) return;
          // Supersede a prior unsaved upload from this session.
          discardUncommitted();
          uncommittedRef.current = res.publicUrl;
          setValue("cover_image_url", res.publicUrl, { shouldValidate: true });
        },
      }
    );
  };

  const clearImage = () => {
    // Removing an unsaved upload deletes it from storage right away.
    discardUncommitted();
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setValue("cover_image_url", "", { shouldValidate: true });
  };

  const onSubmit = handleSubmit((values) => {
    const input = {
      title: values.title,
      cover_image_url: values.cover_image_url?.trim()
        ? values.cover_image_url
        : null,
      description: values.description?.trim() ? values.description : null,
      sort_order: values.sort_order,
    };
    if (row) {
      updateRow.mutate(
        { id: row.id, input },
        {
          onSuccess: () => {
            // The uploaded image is now saved — no longer an orphan.
            uncommittedRef.current = null;
            // Old cover was replaced (or cleared) — remove it from storage.
            if (originalUrl && originalUrl !== input.cover_image_url) {
              void deleteStorageObject(originalUrl);
            }
            onDone();
          },
        }
      );
    } else {
      createRow.mutate(input, {
        onSuccess: () => {
          uncommittedRef.current = null;
          onDone();
        },
      });
    }
  });

  const saving = createRow.isPending || updateRow.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Title" error={errors.title?.message}>
        <Input {...register("title")} placeholder="Kitchen Remodel" />
      </Field>

      <div className="space-y-2">
        <Label>Cover image</Label>
        <input type="hidden" {...register("cover_image_url")} />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickFile}
        />

        {displaySrc ? (
          <div className="border-border relative overflow-hidden rounded-lg border">
            <img
              src={displaySrc}
              alt="Cover preview"
              className="aspect-[4/3] w-full object-cover"
            />
            {upload.isPending ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="size-6 animate-spin text-white" />
              </div>
            ) : null}
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileRef.current?.click()}
                disabled={upload.isPending}
              >
                Change
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="secondary"
                aria-label="Remove image"
                disabled={upload.isPending}
                onClick={clearImage}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
            className="border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition-colors disabled:opacity-60"
          >
            {upload.isPending ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span className="text-sm">Uploading…</span>
              </>
            ) : (
              <>
                <ImagePlus className="size-5" />
                <span className="text-sm">Upload image</span>
              </>
            )}
          </button>
        )}
        {errors.cover_image_url?.message ? (
          <p className="text-destructive text-sm">
            {errors.cover_image_url.message}
          </p>
        ) : null}
      </div>

      <Field label="Description" error={errors.description?.message}>
        <Textarea
          {...register("description")}
          rows={3}
          placeholder="Short description of the project."
        />
      </Field>

      <Field label="Sort order" error={errors.sort_order?.message}>
        <Input
          type="number"
          {...register("sort_order", { valueAsNumber: true })}
          placeholder="0"
        />
      </Field>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={saving || upload.isPending}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
