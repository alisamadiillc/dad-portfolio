import { CollectionGrid } from "@/components/admin/CollectionGrid";

export function CmsHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">CMS</h1>
        <p className="text-muted-foreground">
          Choose a collection to manage its entries.
        </p>
      </div>
      <CollectionGrid />
    </div>
  );
}
