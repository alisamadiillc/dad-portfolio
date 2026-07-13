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
import { Textarea } from "@/components/ui/textarea";

import {
  experienceSchema,
  useCreateExperience,
  useUpdateExperience,
  type ExperienceFormValues,
} from "@/services/experience";

export function ExperienceDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: Experience | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row ? "Edit entry" : "New entry"}</DialogTitle>
        </DialogHeader>
        <ExperienceForm row={row} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ExperienceForm({
  row,
  onDone,
}: {
  row?: Experience | null;
  onDone: () => void;
}) {
  const createRow = useCreateExperience();
  const updateRow = useUpdateExperience();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      period: row?.period ?? "",
      role: row?.role ?? "",
      company: row?.company ?? "",
      location: row?.location ?? "",
      description: row?.description ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    const input = {
      period: values.period,
      role: values.role,
      company: values.company?.trim() ? values.company : null,
      location: values.location?.trim() ? values.location : null,
      description: values.description?.trim() ? values.description : null,
    };

    if (row) {
      updateRow.mutate({ id: row.id, input }, { onSuccess: onDone });
    } else {
      createRow.mutate(input, { onSuccess: onDone });
    }
  });

  const saving = createRow.isPending || updateRow.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Period" error={errors.period?.message}>
        <Input {...register("period")} placeholder="2010 - Now" />
      </Field>

      <Field label="Role" error={errors.role?.message}>
        <Input
          {...register("role")}
          placeholder="Independent Remodeling Contractor"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" error={errors.company?.message}>
          <Input {...register("company")} placeholder="Self-employed" />
        </Field>
        <Field label="Location" error={errors.location?.message}>
          <Input {...register("location")} placeholder="Florida" />
        </Field>
      </div>

      <Field label="Description" error={errors.description?.message}>
        <Textarea
          {...register("description")}
          rows={4}
          placeholder="What you did in this role."
        />
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
