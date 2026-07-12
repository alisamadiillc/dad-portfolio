import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import {
  siteSettingsSchema,
  useAdminSiteSettings,
  useUpdateSiteSettings,
  type SiteSettingsFormValues,
} from "@/services/site-settings";
import { deleteStorageObject, useUploadFile } from "@/services/storage";

const AVATAR_PATH = "avatar";

export function SiteSettings() {
  const { data: settings, isLoading } = useAdminSiteSettings();

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (!settings) {
    return (
      <div className="text-muted-foreground mx-auto max-w-2xl py-10 text-center">
        No settings row found. Seed the <code>site_settings</code> table first.
      </div>
    );
  }

  return <SettingsForm settings={settings} />;
}

function SettingsForm({ settings }: { settings: SiteSettings }) {
  const update = useUpdateSiteSettings();
  const upload = useUploadFile();
  const fileRef = useRef<HTMLInputElement>(null);

  // Tracks the currently persisted avatar so replaced images can be cleaned up.
  const [savedAvatar, setSavedAvatar] = useState(settings.avatar_url ?? "");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      name: settings.name ?? "",
      short_name: settings.short_name ?? "",
      avatar_url: settings.avatar_url ?? "",
      availability_label: settings.availability_label ?? "",
      location: settings.location ?? "",
      years_experience: settings.years_experience ?? undefined,
      headline: settings.headline ?? "",
      hero_bio: settings.hero_bio ?? "",
      about: settings.about ?? "",
      contact_heading: settings.contact_heading ?? "",
      contact_subtext: settings.contact_subtext ?? "",
      email: settings.email ?? "",
      phone: settings.phone ?? "",
      footer_text: settings.footer_text ?? "",
    },
  });

  const avatarUrl = watch("avatar_url");
  // Instant local preview (object URL) shown while the file uploads.
  const [preview, setPreview] = useState<string | null>(null);
  const displaySrc = preview ?? avatarUrl;

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const previousSaved = savedAvatar;
    // Show the picked file immediately from local memory, before it uploads.
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    upload.mutate(
      { file, path: AVATAR_PATH },
      {
        onSuccess: (res) => {
          if (!res.publicUrl) return;
          // Show the new avatar immediately, then auto-save it to the DB.
          setValue("avatar_url", res.publicUrl, { shouldValidate: true });
          update.mutate(
            { id: settings.id, input: { avatar_url: res.publicUrl } },
            {
              onSuccess: () => {
                setSavedAvatar(res.publicUrl);
                // Drop the replaced image from storage once the new one is saved.
                if (previousSaved && previousSaved !== res.publicUrl) {
                  void deleteStorageObject(previousSaved);
                }
              },
            }
          );
        },
      }
    );
  };

  const onSubmit = handleSubmit((values) => {
    const t = (v?: string) => (v?.trim() ? v.trim() : null);
    const input: SiteSettingsInput = {
      name: values.name.trim(),
      short_name: values.short_name?.trim() || values.name.trim(),
      avatar_url: t(values.avatar_url),
      availability_label: t(values.availability_label),
      location: t(values.location),
      years_experience: values.years_experience ?? null,
      headline: t(values.headline),
      hero_bio: t(values.hero_bio),
      about: t(values.about),
      contact_heading: t(values.contact_heading),
      contact_subtext: t(values.contact_subtext),
      email: t(values.email),
      phone: t(values.phone),
      footer_text: t(values.footer_text),
    };

    update.mutate(
      { id: settings.id, input },
      {
        onSuccess: () => {
          const next = input.avatar_url ?? "";
          if (savedAvatar && savedAvatar !== next) {
            void deleteStorageObject(savedAvatar);
          }
          setSavedAvatar(next);
        },
      }
    );
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Site settings</h1>
        <p className="text-muted-foreground">
          About &amp; contact details shown on the home page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Avatar</Label>
            <input type="hidden" {...register("avatar_url")} />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
            />
            <div className="flex items-center gap-4">
              <div className="bg-secondary ring-border relative size-20 shrink-0 overflow-hidden rounded-full ring-1">
                {displaySrc ? (
                  <img
                    src={displaySrc}
                    alt="Avatar preview"
                    className="size-full object-cover"
                  />
                ) : null}
                {upload.isPending ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="size-5 animate-spin text-white" />
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={upload.isPending}
                >
                  {upload.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <ImagePlus className="size-4" />
                      {displaySrc ? "Change" : "Upload"}
                    </>
                  )}
                </Button>
                {displaySrc ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove avatar"
                    disabled={upload.isPending}
                    onClick={() => {
                      setPreview((old) => {
                        if (old) URL.revokeObjectURL(old);
                        return null;
                      });
                      setValue("avatar_url", "", { shouldValidate: true });
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
            {errors.avatar_url?.message ? (
              <p className="text-destructive text-sm">
                {errors.avatar_url.message}
              </p>
            ) : null}
          </div>

          <Field label="Name" error={errors.name?.message}>
            <Input {...register("name")} placeholder="Mohammad Amin Samadi" />
          </Field>
          <Field label="Short name (nav)" error={errors.short_name?.message}>
            <Input
              {...register("short_name")}
              placeholder="Mohammad A. Samadi"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="Availability label"
            error={errors.availability_label?.message}
          >
            <Input
              {...register("availability_label")}
              placeholder="Available for work · Florida"
            />
          </Field>
          <Field label="Location" error={errors.location?.message}>
            <Input {...register("location")} placeholder="Florida" />
          </Field>
          <Field
            label="Years of experience"
            error={errors.years_experience?.message}
          >
            <Input
              type="number"
              {...register("years_experience", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
              placeholder="20"
            />
          </Field>
          <Field label="Headline" error={errors.headline?.message}>
            <Textarea
              {...register("headline")}
              rows={2}
              placeholder="Remodeling & handyman with 20+ years on the tools."
            />
          </Field>
          <Field label="Hero bio" error={errors.hero_bio?.message}>
            <Textarea
              {...register("hero_bio")}
              rows={3}
              placeholder="Hi, I'm …"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <Field
            label="About (blank line = new paragraph)"
            error={errors.about?.message}
          >
            <Textarea {...register("about")} rows={6} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Heading" error={errors.contact_heading?.message}>
            <Input
              {...register("contact_heading")}
              placeholder="Looking to hire? Let's talk."
            />
          </Field>
          <Field label="Subtext" error={errors.contact_subtext?.message}>
            <Textarea {...register("contact_subtext")} rows={2} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input {...register("email")} placeholder="name@email.com" />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <Input {...register("phone")} placeholder="(555) 000-0000" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Footer</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Footer text" error={errors.footer_text?.message}>
            <Input
              {...register("footer_text")}
              placeholder="© 2025 … · Remodeling & Handyman · Florida"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending || upload.isPending}>
          {update.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
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
