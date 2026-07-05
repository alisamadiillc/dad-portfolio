import { ArrowLeft } from "lucide-react";
import Markdown from "react-markdown";
import { Link, useParams } from "react-router-dom";

import { Skeleton } from "@/components/ui/skeleton";

import { usePostBySlug } from "@/features/blog/queries";

export function BlogPost() {
  const { slug = "" } = useParams();
  const { data: post, isLoading } = usePostBySlug(slug);

  return (
    <article className="mx-auto max-w-2xl px-4 py-16">
      <Link
        to="/blog"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to blog
      </Link>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !post ? (
        <p className="text-muted-foreground">Post not found.</p>
      ) : (
        <>
          <h1 className="mb-2 text-4xl font-semibold tracking-tight">
            {post.title}
          </h1>
          <p className="text-muted-foreground mb-8 text-sm">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
          {post.cover_image_url ? (
            <img
              src={post.cover_image_url}
              alt=""
              className="mb-8 aspect-video w-full rounded-xl object-cover"
            />
          ) : null}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <Markdown>{post.content}</Markdown>
          </div>
        </>
      )}
    </article>
  );
}
