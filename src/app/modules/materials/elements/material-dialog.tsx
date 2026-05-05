"use client";

import { type Material } from "@/app/entities/material/api";
import { type MaterialFormData } from "@/app/entities/material/schema";
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

interface MaterialDialogProps {
  open: boolean;
  isSaving: boolean;
  editing: Material | null;
  form: UseFormReturn<MaterialFormData>;
  t: (key: string) => string;
  tc: (key: string) => string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MaterialFormData) => Promise<void>;
  onCancel: () => void;
}

export function MaterialDialog({
  open,
  isSaving,
  editing,
  form,
  t,
  tc,
  onOpenChange,
  onSubmit,
  onCancel,
}: MaterialDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <LoadingOverlay
          visible={isSaving}
          text={editing ? "Updating..." : "Creating..."}
        />

        <DialogHeader>
          <DialogTitle>{editing ? t("editMaterial") : t("addMaterial")}</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("unit")}</Label>

              <Input {...form.register("unit")} disabled={isSaving} />
            </div>

            <div className="space-y-2">
              <Label>{t("pricePerUnit")}</Label>

              <Input {...form.register("pricePerUnit")} disabled={isSaving} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("quantity")}</Label>

              <Input {...form.register("quantity")} disabled={isSaving} />
            </div>

            <div className="space-y-2">
              <Label>{t("minQuantity")}</Label>

              <Input {...form.register("minQuantity")} disabled={isSaving} />
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
