"use client";

import { type Client } from "@/app/entities/client/api";
import { type ClientFormData } from "@/app/entities/client/schema";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Textarea,
} from "@/app/shared/ui";
import { type UseFormReturn } from "react-hook-form";

interface CabinetOption {
  id: string;
  name: string;
  isAvailable: boolean;
}

interface ClientDialogProps {
  open: boolean;
  isSaving: boolean;
  editing: Client | null;
  form: UseFormReturn<ClientFormData>;
  cabinetsList?: CabinetOption[];
  t: (key: string) => string;
  tc: (key: string) => string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClientFormData) => Promise<void>;
  onCancel: () => void;
}

export function ClientDialog({
  open,
  isSaving,
  editing,
  form,
  cabinetsList,
  t,
  tc,
  onOpenChange,
  onSubmit,
  onCancel,
}: ClientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <LoadingOverlay
          visible={isSaving}
          text={editing ? "Updating..." : "Creating..."}
        />
        <DialogHeader>
          <DialogTitle>
            {editing ? t("editClient") : t("addClient")}
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

          <div className="space-y-2">
            <Label>{t("preferredCabinet")}</Label>

            <Select
              value={form.watch("preferredCabinetId") || ""}
              onValueChange={(v) =>
                form.setValue("preferredCabinetId", v === "__none__" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectCabinet")} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="__none__">
                  {t("noCabinetPreference")}
                </SelectItem>
                {cabinetsList
                  ?.filter((c) => c.isAvailable)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("notes")}</Label>

            <Textarea {...form.register("notes")} disabled={isSaving} />
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
