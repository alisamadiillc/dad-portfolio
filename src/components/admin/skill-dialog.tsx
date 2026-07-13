import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  skillSchema,
  useCreateSkill,
  useUpdateSkill,
  type SkillFormValues,
} from "@/services/skills";

export function SkillDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: Skill | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{row ? "Edit skill" : "New skill"}</DialogTitle>
        </DialogHeader>
        <SkillForm row={row} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function SkillForm({
  row,
  onDone,
}: {
  row?: Skill | null;
  onDone: () => void;
}) {
  const createRow = useCreateSkill();
  const updateRow = useUpdateSkill();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      label: row?.label ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    const input = { label: values.label };
    if (row) {
      updateRow.mutate({ id: row.id, input }, { onSuccess: onDone });
    } else {
      createRow.mutate(input, { onSuccess: onDone });
    }
  });

  const saving = createRow.isPending || updateRow.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Label" error={errors.label?.message}>
        <Input {...register("label")} placeholder="Kitchen & bath remodeling" />
      </Field>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
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
