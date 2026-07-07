import { useRef } from "react";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <ProjectForm row={row} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ProjectForm({
  row,
  onDone,
}: {
  row?: Project | null;
  onDone: () => void;
}) {
  const createRow = useCreateProject();
  const updateRow = useUpdateProject();
  const upload = useUploadFile();
  const fileRef = useRef<HTMLInputElement>(null);

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

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    const previous = coverUrl; // may be a this-session upload we're superseding
    upload.mutate(
      { file, path: UPLOAD_PATH },
      {
        onSuccess: (res) => {
          if (!res.publicUrl) return;
          // Drop an orphaned upload made earlier in this same session (but keep
          // the original saved image — it's only cleaned up on a successful save).
          if (previous && previous !== originalUrl) {
            void deleteStorageObject(previous);
          }
          setValue("cover_image_url", res.publicUrl, { shouldValidate: true });
        },
      }
    );
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
            // Old cover was replaced (or cleared) — remove it from storage.
            if (originalUrl && originalUrl !== input.cover_image_url) {
              void deleteStorageObject(originalUrl);
            }
            onDone();
          },
        }
      );
    } else {
      createRow.mutate(input, { onSuccess: onDone });
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

        {coverUrl ? (
          <div className="border-border relative overflow-hidden rounded-lg border">
            <img
              src={coverUrl}
              alt="Cover preview"
              className="aspect-[4/3] w-full object-cover"
            />
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
                onClick={() =>
                  setValue("cover_image_url", "", { shouldValidate: true })
                }
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
