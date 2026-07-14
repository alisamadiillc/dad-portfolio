import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";

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
import { ExperienceDialog } from "@/components/admin/experience-dialog";
import { ReorderTableBody } from "@/components/admin/reorder-table";

import {
  useAdminExperiences,
  useDeleteExperience,
  useReorderExperiences,
} from "@/services/experience";

export function ExperienceList() {
  const { data: rows, isLoading } = useAdminExperiences();
  const deleteRow = useDeleteExperience();
  const reorder = useReorderExperiences();
  const [toDelete, setToDelete] = useState<Experience | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState<Experience | null>(null);

  const openCreate = () => {
    setEditRow(null);
    setDialogOpen(true);
  };
  const openEdit = (row: Experience) => {
    setEditRow(row);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Experience</h1>
          <p className="text-muted-foreground">
            Manage your work history. Drag rows to reorder.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          New entry
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-0" />
              <TableHead>Period</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : !rows?.length ? (
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-10 text-center"
                >
                  No entries yet. Add your first one.
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
                  <TableCell className="text-muted-foreground">
                    {row.period}
                  </TableCell>
                  <TableCell className="font-medium">{row.role}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.company}
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

      <ExperienceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        row={editRow}
      />

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entry?</AlertDialogTitle>
            <AlertDialogDescription>
              “{toDelete?.role}” will be permanently removed. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete)
                  deleteRow.mutate(toDelete.id, {
                    onSettled: () => setToDelete(null),
                  });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
