"use client";

import { type Cabinet } from "@/app/entities/cabinet/api";
import { type CabinetFormData } from "@/app/entities/cabinet/schema";
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

interface CabinetDialogProps {
  open: boolean;
  isSaving: boolean;
  editing: Cabinet | null;
  form: UseFormReturn<CabinetFormData>;
  t: (key: string) => string;
  tc: (key: string) => string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CabinetFormData) => Promise<void>;
  onCancel: () => void;
}

export function CabinetDialog({
  open,
  isSaving,
  editing,
  form,
  t,
  tc,
  onOpenChange,
  onSubmit,
  onCancel,
}: CabinetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <LoadingOverlay
          visible={isSaving}
          text={editing ? "Updating..." : "Creating..."}
        />

        <DialogHeader>
          <DialogTitle>{editing ? t("editCabinet") : t("addCabinet")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("name")}</Label>
            
            <Input {...form.register("name")} disabled={isSaving} />
          </div>

          <div className="space-y-2">
            <Label>{t("description")}</Label>

            <Textarea {...form.register("description")} disabled={isSaving} />
          </div>

          <div className="space-y-2">
            <Label>{t("capacity")}</Label>

            <Input
              type="number"
              {...form.register("capacity", { valueAsNumber: true })}
              disabled={isSaving}
            />
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
