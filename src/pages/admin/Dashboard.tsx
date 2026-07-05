import { CollectionGrid } from "@/components/admin/CollectionGrid";

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your content collections.
        </p>
      </div>
      <CollectionGrid />
    </div>
  );
}
