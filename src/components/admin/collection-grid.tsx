import { Link } from "react-router-dom";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { collections } from "@/cms/collections";

export function CollectionGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => {
        const Icon = collection.icon;
        return (
          <Link key={collection.slug} to={collection.path} className="group">
            <Card className="group-hover:border-primary h-full transition-colors">
              <CardHeader>
                <Icon className="text-muted-foreground size-5" />
                <CardTitle className="mt-2">{collection.label}</CardTitle>
                <CardDescription>{collection.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
