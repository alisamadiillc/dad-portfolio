import { useState } from "react";
import { Loader2, MoreHorizontal, Plus } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GalleryDialog } from "@/components/admin/gallery-dialog";
import { ReorderTableBody } from "@/components/admin/reorder-table";

import {
  useAdminGallery,
  useDeleteGalleryImage,
  useReorderGallery,
} from "@/services/gallery";

export function GalleryList() {
  const { data: rows, isLoading } = useAdminGallery();
  const deleteRow = useDeleteGalleryImage();
  const reorder = useReorderGallery();
  const [toDelete, setToDelete] = useState<GalleryImage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState<GalleryImage | null>(null);

  const openCreate = () => {
    setEditRow(null);
    setDialogOpen(true);
  };
  const openEdit = (row: GalleryImage) => {
    setEditRow(row);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gallery</h1>
          <p className="text-muted-foreground">
            Manage your photo gallery. Drag rows to reorder.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          New image
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-0" />
              <TableHead className="w-0">Image</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : !rows?.length ? (
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground py-10 text-center"
                >
                  No images yet. Add your first one.
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <ReorderTableBody
              rows={rows}
              onCommit={(ids) => reorder.mutate(ids)}
              onRowClick={openEdit}
              renderCells={(row) => (
                <>
                  <TableCell>
                    <div
                      className="relative size-12"
                      title={
                        row.secondary_image_url
                          ? "Before/after pair"
                          : undefined
                      }
                    >
                      <img
                        src={row.image_url}
                        alt={row.description ?? "Gallery image"}
                        className="bg-secondary size-12 rounded-md object-cover"
                      />
                      {row.secondary_image_url ? (
                        <img
                          src={row.secondary_image_url}
                          alt=""
                          className="bg-secondary ring-background absolute -right-1.5 -bottom-1.5 size-7 rounded-md object-cover ring-2"
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-md truncate whitespace-normal">
                    {row.description || "-"}
                  </TableCell>
                  {/* Row click opens edit — keep menu clicks from bubbling. */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(row)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setToDelete(row)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </>
              )}
            />
          )}
        </Table>
      </div>

      <GalleryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        row={editRow}
      />

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          // Don't let the dialog close mid-delete.
          if (deleteRow.isPending) return;
          if (!open) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription>
              The image will be permanently removed from the gallery and from
              storage. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRow.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteRow.isPending}
              onClick={(e) => {
                e.preventDefault(); // keep the dialog open until the delete settles
                if (toDelete)
                  deleteRow.mutate(
                    {
                      id: toDelete.id,
                      imageUrl: toDelete.image_url,
                      secondaryImageUrl: toDelete.secondary_image_url,
                    },
                    { onSettled: () => setToDelete(null) }
                  );
              }}
            >
              {deleteRow.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
