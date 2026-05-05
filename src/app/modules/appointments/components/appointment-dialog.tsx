"use client";

import {
  type Appointment,
  type SpecialistAvailability,
} from "@/app/entities/appointment/api";
import { type AppointmentFormData } from "@/app/entities/appointment/schema";
import { type Cabinet } from "@/app/entities/cabinet/api";
import { type Client } from "@/app/entities/client/api";
import { type Material } from "@/app/entities/material/api";
import { type Service } from "@/app/entities/service/api";
import { type Specialist } from "@/app/entities/specialist/api";
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
  Separator,
  Spinner,
  Textarea,
} from "@/app/shared/ui";
import { MessageSquare } from "lucide-react";
import { type UseFormReturn } from "react-hook-form";
import { type SelectedMaterial } from "../types";
import { AvailabilityPanel } from "./availability-panel";
import { MaterialsPicker } from "./materials-picker";

interface AppointmentDialogProps {
  open: boolean;
  isSaving: boolean;
  editing: Appointment | null;
  relatedLoading: boolean;
  form: UseFormReturn<AppointmentFormData>;
  clientsList?: Client[];
  specialistsList?: Specialist[];
  servicesList?: Service[];
  cabinetsList?: Cabinet[];
  materialsList?: Material[];
  selectedMaterials: SelectedMaterial[];
  selectedClient: Client | null;
  availability: SpecialistAvailability | null;
  availLoading: boolean;
  t: (key: string) => string;
  tc: (key: string) => string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AppointmentFormData) => Promise<void>;
  onMaterialsChange: (materials: SelectedMaterial[]) => void;
  onClientChange: (id: string) => void;
  onSpecialistChange: (id: string) => void;
  onServiceChange: (id: string) => void;
  onCabinetChange: (id: string) => void;
  onStartTimeChange: (value: string) => void;
}

export function AppointmentDialog({
  open,
  isSaving,
  editing,
  relatedLoading,
  form,
  clientsList,
  specialistsList,
  servicesList,
  cabinetsList,
  materialsList,
  selectedMaterials,
  selectedClient,
  availability,
  availLoading,
  t,
  tc,
  onOpenChange,
  onSubmit,
  onMaterialsChange,
  onClientChange,
  onSpecialistChange,
  onServiceChange,
  onCabinetChange,
  onStartTimeChange,
}: AppointmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !isSaving && onOpenChange(v)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <LoadingOverlay
          visible={isSaving}
          text={editing ? "Updating..." : "Creating..."}
        />

        <DialogHeader>
          <DialogTitle>
            {editing ? t("editAppointment") : t("addAppointment")}
          </DialogTitle>
        </DialogHeader>
        {relatedLoading ? (
          <div className="flex items-center justify-center gap-3 py-12">
            <Spinner size="lg" />

            <p className="text-sm text-muted-foreground">
              Loading form data...
            </p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("client")}</Label>

                <Select
                  value={form.watch("clientId")}
                  onValueChange={onClientChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>

                  <SelectContent>
                    {clientsList?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("specialist")}</Label>

                <Select
                  value={form.watch("specialistId")}
                  onValueChange={onSpecialistChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialist" />
                  </SelectTrigger>

                  <SelectContent>
                    {specialistsList
                      ?.filter((s) => s.isActive)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.firstName} {s.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedClient?.notes && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40">
                <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />

                <div>
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                    {t("clientNotes")}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                    {selectedClient.notes}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("service")}</Label>

                <Select
                  value={form.watch("serviceId")}
                  onValueChange={onServiceChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>

                  <SelectContent>
                    {servicesList
                      ?.filter((s) => s.isActive)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} (${s.price})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("cabinet")}</Label>

                <Select
                  value={form.watch("cabinetId")}
                  onValueChange={onCabinetChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cabinet" />
                  </SelectTrigger>

                  <SelectContent>
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
            </div>

            <AvailabilityPanel
              availability={availability}
              isLoading={availLoading}
            />

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("date")}</Label>

                <Input
                  type="date"
                  {...form.register("appointmentDate")}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("startTime")}</Label>

                <Input
                  type="time"
                  {...form.register("startTime")}
                  disabled={isSaving}
                  onChange={(e) => onStartTimeChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("endTime")}</Label>

                <Input
                  type="time"
                  {...form.register("endTime")}
                  disabled={isSaving}
                />
              </div>
            </div>

            {editing && (
              <div className="space-y-2">
                <Label>{t("status")}</Label>

                <Select
                  value={form.watch("status")}
                  onValueChange={(v) =>
                    form.setValue("status", v as AppointmentFormData["status"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="scheduled">{t("scheduled")}</SelectItem>
                    <SelectItem value="in_progress">
                      {t("inProgress")}
                    </SelectItem>
                    <SelectItem value="completed">{t("completed")}</SelectItem>
                    <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            <MaterialsPicker
              materialsList={materialsList ?? []}
              selectedMaterials={selectedMaterials}
              onChange={onMaterialsChange}
              disabled={isSaving}
            />

            <Separator />

            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Textarea {...form.register("notes")} disabled={isSaving} />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                {tc("cancel")}
              </Button>

              <Button
                type="submit"
                disabled={isSaving || (availability?.isFull ?? false)}
              >
                {isSaving && (
                  <Spinner size="sm" className="mr-2 text-primary-foreground" />
                )}
                {tc("save")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
