"use client";

import { type Service } from "@/app/entities/service/api";
import { type ServiceFormData } from "@/app/entities/service/schema";
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
  Textarea,
} from "@/app/shared/ui";
import { type UseFormReturn } from "react-hook-form";

interface ServiceDialogProps {
  open: boolean;
  isSaving: boolean;
  editing: Service | null;
  form: UseFormReturn<ServiceFormData>;
  t: (key: string) => string;
  tc: (key: string) => string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ServiceFormData) => Promise<void>;
  onCancel: () => void;
}

export function ServiceDialog({
  open,
  isSaving,
  editing,
  form,
  t,
  tc,
  onOpenChange,
  onSubmit,
  onCancel,
}: ServiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <LoadingOverlay
          visible={isSaving}
          text={editing ? "Updating..." : "Creating..."}
        />
        <DialogHeader>
          <DialogTitle>
            {editing ? t("editService") : t("addService")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("name")}</Label>
            <Input {...form.register("name")} disabled={isSaving} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("description")}</Label>
            <Textarea {...form.register("description")} disabled={isSaving} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("duration")}</Label>
              <Input
                type="number"
                {...form.register("durationMinutes", { valueAsNumber: true })}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("price")}</Label>
              <Input {...form.register("price")} disabled={isSaving} />
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
