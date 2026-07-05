import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";

import { slugify } from "@/lib/slug";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  postSchema,
  useCreatePost,
  usePostById,
  useUpdatePost,
  type PostFormValues,
} from "@/services/blog";

const EMPTY: PostFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  published: false,
};

export function PostEditor() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: post, isLoading } = usePostById(id);
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: EMPTY,
    values: post
      ? {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          content: post.content,
          cover_image_url: post.cover_image_url ?? "",
          published: post.published,
        }
      : undefined,
  });

  const onSubmit = handleSubmit((values) => {
    const input = {
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt?.trim() ? values.excerpt : null,
      content: values.content,
      cover_image_url: values.cover_image_url?.trim()
        ? values.cover_image_url
        : null,
      published: values.published,
    };

    if (isEdit && id) {
      updatePost.mutate(
        { id, input },
        { onSuccess: () => navigate("/admin/cms/blog") }
      );
    } else {
      createPost.mutate(input, {
        onSuccess: () => navigate("/admin/cms/blog"),
      });
    }
  });

  const saving = createPost.isPending || updatePost.isPending;

  if (isEdit && isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          render={<Link to="/admin/cms/blog" />}
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold">
          {isEdit ? "Edit post" : "New post"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Title" error={errors.title?.message}>
            <Input
              {...register("title", {
                onChange: (e) => {
                  if (!isEdit && !slugTouched) {
                    setValue("slug", slugify(e.target.value));
                  }
                },
              })}
              placeholder="My first post"
            />
          </Field>

          <Field label="Slug" error={errors.slug?.message}>
            <Input
              {...register("slug", { onChange: () => setSlugTouched(true) })}
              placeholder="my-first-post"
            />
          </Field>

          <Field label="Excerpt" error={errors.excerpt?.message}>
            <Textarea
              {...register("excerpt")}
              rows={2}
              placeholder="Short summary shown in listings"
            />
          </Field>

          <Field label="Content (Markdown)" error={errors.content?.message}>
            <Textarea
              {...register("content")}
              rows={12}
              className="font-mono text-sm"
              placeholder="# Hello&#10;&#10;Write your post in **Markdown**."
            />
          </Field>

          <Field
            label="Cover image URL"
            error={errors.cover_image_url?.message}
          >
            <Input {...register("cover_image_url")} placeholder="https://…" />
          </Field>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Published</Label>
              <p className="text-muted-foreground text-sm">
                Visible on the public blog.
              </p>
            </div>
            <Controller
              control={control}
              name="published"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          render={<Link to="/admin/cms/blog" />}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
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
