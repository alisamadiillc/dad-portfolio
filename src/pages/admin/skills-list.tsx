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
import { ReorderTableBody } from "@/components/admin/reorder-table";
import { SkillDialog } from "@/components/admin/skill-dialog";

import {
  useAdminSkills,
  useDeleteSkill,
  useReorderSkills,
} from "@/services/skills";

export function SkillsList() {
  const { data: rows, isLoading } = useAdminSkills();
  const deleteRow = useDeleteSkill();
  const reorder = useReorderSkills();
  const [toDelete, setToDelete] = useState<Skill | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState<Skill | null>(null);

  const openCreate = () => {
    setEditRow(null);
    setDialogOpen(true);
  };
  const openEdit = (row: Skill) => {
    setEditRow(row);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">What I do</h1>
          <p className="text-muted-foreground">
            Manage your services and capabilities. Drag rows to reorder.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          New skill
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-0" />
              <TableHead>Label</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : !rows?.length ? (
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-muted-foreground py-10 text-center"
                >
                  No skills yet. Add your first one.
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
                  <TableCell className="font-medium">{row.label}</TableCell>
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

      <SkillDialog
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
            <AlertDialogTitle>Delete skill?</AlertDialogTitle>
            <AlertDialogDescription>
              “{toDelete?.label}” will be permanently removed. This cannot be
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
