import { Link } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { usePublishedPosts } from "@/features/blog/queries";

export function BlogList() {
  const { data: posts, isLoading } = usePublishedPosts();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Blog</h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : !posts?.length ? (
        <p className="text-muted-foreground">No posts published yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group block"
            >
              <Card className="group-hover:border-primary transition-colors">
                {post.cover_image_url ? (
                  <img
                    src={post.cover_image_url}
                    alt=""
                    className="aspect-video w-full rounded-t-xl object-cover"
                  />
                ) : null}
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  {post.excerpt ? (
                    <CardDescription>{post.excerpt}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {new Date(post.created_at).toLocaleDateString()}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
