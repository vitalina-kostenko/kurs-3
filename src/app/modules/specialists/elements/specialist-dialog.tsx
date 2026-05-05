"use client";

import { type Specialist } from "@/app/entities/specialist/api";
import { type SpecialistFormData } from "@/app/entities/specialist/schema";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  LoadingOverlay,
  Spinner,
} from "@/app/shared/ui";
import { type UseFormReturn } from "react-hook-form";

interface SpecialistDialogProps {
  open: boolean;
  isSaving: boolean;
  editing: Specialist | null;
  form: UseFormReturn<SpecialistFormData>;
  t: (key: string) => string;
  tc: (key: string) => string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SpecialistFormData) => Promise<void>;
  onCancel: () => void;
}

export function SpecialistDialog({
  open,
  isSaving,
  editing,
  form,
  t,
  tc,
  onOpenChange,
  onSubmit,
  onCancel,
}: SpecialistDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <LoadingOverlay
          visible={isSaving}
          text={editing ? "Updating..." : "Creating..."}
        />
        <DialogHeader>
          <DialogTitle>
            {editing ? t("editSpecialist") : t("addSpecialist")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("firstName")}</Label>
              <Input {...form.register("firstName")} disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label>{t("lastName")}</Label>
              <Input {...form.register("lastName")} disabled={isSaving} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("specialization")}</Label>
            <Input {...form.register("specialization")} disabled={isSaving} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("email")}</Label>
              <Input
                type="email"
                {...form.register("email")}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("phone")}</Label>
              <Input {...form.register("phone")} disabled={isSaving} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("workStart")}</Label>
              <Input
                type="time"
                {...form.register("workStartTime")}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("workEnd")}</Label>
              <Input
                type="time"
                {...form.register("workEndTime")}
                disabled={isSaving}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("breakStart")}</Label>
              <Input
                type="time"
                {...form.register("breakStartTime")}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("breakEnd")}</Label>
              <Input
                type="time"
                {...form.register("breakEndTime")}
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && (
                <Spinner size="sm" className="mr-2 text-primary-foreground" />
              )}
              {tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
