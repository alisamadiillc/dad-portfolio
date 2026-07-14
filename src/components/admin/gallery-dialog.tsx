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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  galleryImageSchema,
  useCreateGalleryImage,
  useUpdateGalleryImage,
  type GalleryImageFormValues,
} from "@/services/gallery";
import { deleteStorageObject, useUploadFile } from "@/services/storage";

// Gallery images upload under this folder prefix; the upload returns a
// durable public URL we store in image_url / secondary_image_url.
const UPLOAD_PATH = "gallery";

// Delete the ref's uploaded-but-unsaved image, if any. Idempotent.
const discardUncommitted = (ref: React.RefObject<string | null>) => {
  if (ref.current) {
    void deleteStorageObject(ref.current);
    ref.current = null;
  }
};

export function GalleryDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: GalleryImage | null;
}) {
  // The form registers a cleanup that removes any uploaded-but-unsaved images.
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
          <DialogTitle>{row ? "Edit image" : "New image"}</DialogTitle>
        </DialogHeader>
        <GalleryForm
          row={row}
          onDone={() => onOpenChange(false)}
          cleanupRef={cleanupRef}
        />
      </DialogContent>
    </Dialog>
  );
}

function GalleryForm({
  row,
  onDone,
  cleanupRef,
}: {
  row?: GalleryImage | null;
  onDone: () => void;
  cleanupRef: React.RefObject<() => void>;
}) {
  const createRow = useCreateGalleryImage();
  const updateRow = useUpdateGalleryImage();
  const uploadPrimary = useUploadFile();
  const uploadSecondary = useUploadFile();
  // URLs of images uploaded this session but not yet saved to the DB. Any such
  // image is deleted from storage when superseded, removed, or the dialog closes.
  const uncommittedPrimaryRef = useRef<string | null>(null);
  const uncommittedSecondaryRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GalleryImageFormValues>({
    resolver: zodResolver(galleryImageSchema),
    defaultValues: {
      image_url: row?.image_url ?? "",
      secondary_image_url: row?.secondary_image_url ?? "",
      description: row?.description ?? "",
    },
  });

  const imageUrl = watch("image_url");
  const secondaryUrl = watch("secondary_image_url") ?? "";
  const originalUrl = row?.image_url ?? "";
  const originalSecondaryUrl = row?.secondary_image_url ?? "";

  // Registered on the dialog so closing without saving cleans up orphans.
  cleanupRef.current = () => {
    discardUncommitted(uncommittedPrimaryRef);
    discardUncommitted(uncommittedSecondaryRef);
  };

  const onSubmit = handleSubmit((values) => {
    const input = {
      image_url: values.image_url,
      secondary_image_url: values.secondary_image_url
        ? values.secondary_image_url
        : null,
      description: values.description?.trim() ? values.description : null,
    };
    if (row) {
      updateRow.mutate(
        { id: row.id, input },
        {
          onSuccess: () => {
            // The uploaded images are now saved — no longer orphans.
            uncommittedPrimaryRef.current = null;
            uncommittedSecondaryRef.current = null;
            // Replaced or cleared images — remove them from storage.
            if (originalUrl && originalUrl !== input.image_url) {
              void deleteStorageObject(originalUrl);
            }
            if (
              originalSecondaryUrl &&
              originalSecondaryUrl !== (input.secondary_image_url ?? "")
            ) {
              void deleteStorageObject(originalSecondaryUrl);
            }
            onDone();
          },
        }
      );
    } else {
      createRow.mutate(input, {
        onSuccess: () => {
          uncommittedPrimaryRef.current = null;
          uncommittedSecondaryRef.current = null;
          onDone();
        },
      });
    }
  });

  const saving = createRow.isPending || updateRow.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" {...register("image_url")} />
      <input type="hidden" {...register("secondary_image_url")} />

      <div className="space-y-2">
        <ImageUploadField
          label={secondaryUrl ? "Before image" : "Image"}
          value={imageUrl}
          upload={uploadPrimary}
          uncommittedRef={uncommittedPrimaryRef}
          onUrlChange={(url) =>
            setValue("image_url", url, { shouldValidate: true })
          }
          emptyLabel="Upload image"
        />
        {errors.image_url?.message ? (
          <p className="text-destructive text-sm">{errors.image_url.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <ImageUploadField
          label="After image (optional)"
          value={secondaryUrl}
          upload={uploadSecondary}
          uncommittedRef={uncommittedSecondaryRef}
          onUrlChange={(url) =>
            setValue("secondary_image_url", url, { shouldValidate: true })
          }
          emptyLabel="Add after image"
        />
        <p className="text-muted-foreground text-sm">
          Adding a second image turns this into a before/after comparison.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          {...register("description")}
          rows={3}
          placeholder="Short description of this work."
        />
        {errors.description?.message ? (
          <p className="text-destructive text-sm">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={
            saving || uploadPrimary.isPending || uploadSecondary.isPending
          }
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ImageUploadField({
  label,
  value,
  upload,
  uncommittedRef,
  onUrlChange,
  emptyLabel,
}: {
  label: string;
  value: string;
  upload: ReturnType<typeof useUploadFile>;
  uncommittedRef: React.RefObject<string | null>;
  onUrlChange: (url: string) => void;
  emptyLabel: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  // Instant local preview (object URL) shown while the file uploads.
  const [preview, setPreview] = useState<string | null>(null);
  const displaySrc = preview ?? value;

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
          discardUncommitted(uncommittedRef);
          uncommittedRef.current = res.publicUrl;
          onUrlChange(res.publicUrl);
        },
      }
    );
  };

  const clearImage = () => {
    // Removing an unsaved upload deletes it from storage right away.
    discardUncommitted(uncommittedRef);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    onUrlChange("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
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
            alt="Gallery preview"
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
              <span className="text-sm">{emptyLabel}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
