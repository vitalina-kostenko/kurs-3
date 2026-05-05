"use client";

import {
  appointmentApi,
  type Appointment,
  type SpecialistAvailability,
} from "@/app/entities/appointment/api";
import {
  appointmentSchema,
  type AppointmentFormData,
} from "@/app/entities/appointment/schema";
import { cabinetApi, type Cabinet } from "@/app/entities/cabinet/api";
import { clientApi } from "@/app/entities/client/api";
import { materialApi } from "@/app/entities/material/api";
import { serviceApi, type Service } from "@/app/entities/service/api";
import { specialistApi, type Specialist } from "@/app/entities/specialist/api";
import { useCrud } from "@/app/shared/hooks/use-crud";
import { useRole } from "@/app/shared/hooks/use-role";
import { exportToCsv } from "@/app/shared/lib/csv-export";
import {
  Button,
  Card,
  ConfirmDialog,
  Spinner,
  TableSkeleton,
} from "@/app/shared/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AppointmentDialog } from "./components/appointment-dialog";
import { AppointmentsFilters } from "./components/appointments-filters";
import { AppointmentsTable } from "./components/appointments-table";
import { type SelectedMaterial } from "./types";

export function AppointmentsModule() {
  const t = useTranslations("appointments");
  const tc = useTranslations("common");

  const { isAdmin } = useRole();

  const {
    data,
    isLoading,
    isFetching,
    create,
    update,
    remove,
    isSaving,
    isDeleting,
    deletingId,
  } = useCrud<Appointment>("appointments", appointmentApi);
  const { data: servicesList, isLoading: svcLoading } = useQuery({
    queryKey: ["services"],
    queryFn: serviceApi.getAll,
  });

  const { data: specialistsList, isLoading: specLoading } = useQuery({
    queryKey: ["specialists"],
    queryFn: specialistApi.getAll,
  });

  const { data: clientsList, isLoading: cliLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: clientApi.getAll,
  });

  const { data: cabinetsList, isLoading: cabLoading } = useQuery({
    queryKey: ["cabinets"],
    queryFn: cabinetApi.getAll,
  });

  const { data: materialsList, isLoading: matLoading } = useQuery({
    queryKey: ["materials"],
    queryFn: materialApi.getAll,
  });

  const relatedLoading =
    svcLoading || specLoading || cliLoading || cabLoading || matLoading;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const [availability, setAvailability] =
    useState<SpecialistAvailability | null>(null);
  const [availLoading, setAvailLoading] = useState(false);

  const [selectedMaterials, setSelectedMaterials] = useState<
    SelectedMaterial[]
  >([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSpecialist, setFilterSpecialist] = useState("");

  const filtered = useMemo(() => {
    let result = data;

    if (filterDate)
      result = result.filter((a) => a.appointmentDate === filterDate);

    if (filterStatus) result = result.filter((a) => a.status === filterStatus);

    if (filterSpecialist)
      result = result.filter((a) => a.specialistId === filterSpecialist);

    return result;
  }, [data, filterDate, filterStatus, filterSpecialist]);

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientId: "",
      specialistId: "",
      serviceId: "",
      cabinetId: "",
      appointmentDate: "",
      startTime: "",
      endTime: "",
      status: "scheduled",
      notes: "",
    },
  });

  const watchSpecialistId = form.watch("specialistId");
  const watchDate = form.watch("appointmentDate");
  const watchServiceId = form.watch("serviceId");
  const watchClientId = form.watch("clientId");

  const selectedClient = useMemo(
    () => clientsList?.find((c) => c.id === watchClientId) ?? null,
    [clientsList, watchClientId],
  );

  const fetchAvailability = useCallback(
    async (specId: string, date: string, excludeId?: string) => {
      if (!specId || !date) {
        setAvailability(null);
        return;
      }
      setAvailLoading(true);
      try {
        const data = await appointmentApi.getAvailability(
          specId,
          date,
          excludeId,
        );
        setAvailability(data);
      } catch {
        setAvailability(null);
        toast.error("Failed to load specialist availability.");
      } finally {
        setAvailLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    fetchAvailability(watchSpecialistId, watchDate, editing?.id);
  }, [watchSpecialistId, watchDate, open, editing?.id, fetchAvailability]);

  useEffect(() => {
    if (!open || !availability || !watchServiceId) return;

    const svc = servicesList?.find((s) => s.id === watchServiceId);
    if (!svc) return;

    const currentStart = form.getValues("startTime");
    if (!currentStart) return;

    const [h, m] = currentStart.split(":").map(Number);
    const totalMin = h * 60 + m + svc.durationMinutes;
    const endH = String(Math.floor(totalMin / 60) % 24).padStart(2, "0");
    const endM = String(totalMin % 60).padStart(2, "0");
    form.setValue("endTime", `${endH}:${endM}`);
  }, [watchServiceId, open, availability, servicesList, form]);

  const autoSelectFreeSlot = useCallback(
    (avail: SpecialistAvailability, durationMin: number) => {
      for (const slot of avail.freeSlots) {
        const [sh, sm] = slot.start.split(":").map(Number);
        const [eh, em] = slot.end.split(":").map(Number);

        const slotDuration = eh * 60 + em - (sh * 60 + sm);

        if (slotDuration >= durationMin) {
          const endTotal = sh * 60 + sm + durationMin;

          return {
            startTime: slot.start,
            endTime: `${String(Math.floor(endTotal / 60) % 24).padStart(2, "0")}:${String(endTotal % 60).padStart(2, "0")}`,
          };
        }
      }
      return null;
    },
    [],
  );

  const onOpen = async (item?: Appointment) => {
    if (item) {
      setEditing(item);
      form.reset({
        clientId: item.clientId,
        specialistId: item.specialistId,
        serviceId: item.serviceId,
        cabinetId: item.cabinetId,
        appointmentDate: item.appointmentDate,
        startTime: item.startTime,
        endTime: item.endTime,
        status: item.status,
        notes: item.notes ?? "",
      });

      try {
        const mats = await appointmentApi.getMaterials(item.id);
        setSelectedMaterials(
          mats.map((m) => ({ materialId: m.materialId, quantity: m.quantity })),
        );
      } catch {
        setSelectedMaterials([]);
        toast.error("Failed to load appointment materials.");
      }
    } else {
      setEditing(null);
      const activeService = servicesList?.find((s: Service) => s.isActive);
      const activeSpecialist = specialistsList?.find(
        (s: Specialist) => s.isActive,
      );
      const availableCabinet = cabinetsList?.find(
        (c: Cabinet) => c.isAvailable,
      );
      form.reset({
        clientId: "",
        specialistId: activeSpecialist?.id ?? "",
        serviceId: activeService?.id ?? "",
        cabinetId: availableCabinet?.id ?? "",
        appointmentDate: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endTime: activeService
          ? `${String(Math.floor(9 + activeService.durationMinutes / 60)).padStart(2, "0")}:${String(activeService.durationMinutes % 60).padStart(2, "0")}`
          : "10:00",
        status: "scheduled",
        notes: "",
      });
      setSelectedMaterials([]);
    }
    setAvailability(null);
    setOpen(true);
  };

  useEffect(() => {
    if (!open || editing || !availability || availability.isFull) return;

    const svcId = form.getValues("serviceId");
    const svc = servicesList?.find((s) => s.id === svcId);
    if (!svc) return;

    if (availability.appointmentCount === 0) return;

    const freeSlot = autoSelectFreeSlot(availability, svc.durationMinutes);
    if (freeSlot) {
      form.setValue("startTime", freeSlot.startTime);
      form.setValue("endTime", freeSlot.endTime);
    }
  }, [availability, open, editing, servicesList, form, autoSelectFreeSlot]);

  const onSubmit = async (formData: AppointmentFormData) => {
    try {
      let appointmentId: string;
      if (editing) {
        await update({ id: editing.id, ...formData });
        appointmentId = editing.id;
      } else {
        const result = await create(
          formData as unknown as Record<string, unknown>,
        );
        appointmentId = (result as Appointment).id;
      }
      try {
        await appointmentApi.saveMaterials(appointmentId, selectedMaterials);
      } catch {
        toast.error("Appointment saved, but failed to save materials.");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save appointment.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget);
    } catch {
      toast.error("Failed to delete appointment.");
    }
    setDeleteTarget(null);
  };

  const handleExport = () => {
    exportToCsv(
      filtered,
      [
        { key: "clientFirstName", label: "Client First Name" },
        { key: "clientLastName", label: "Client Last Name" },
        { key: "serviceName", label: "Service" },
        { key: "specialistFirstName", label: "Specialist" },
        { key: "appointmentDate", label: "Date" },
        { key: "startTime", label: "Start Time" },
        { key: "endTime", label: "End Time" },
        { key: "status", label: "Status" },
        { key: "servicePrice", label: "Price" },
      ],
      "appointments",
    );
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <div className="flex justify-between items-center">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />

          <div className="h-10 w-44 animate-pulse rounded-xl bg-muted" />
        </div>

        <Card>
          <TableSkeleton rows={5} cols={7} />
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">
            {filtered.length} / {data.length}
          </p>
          {isFetching && (
            <Spinner size="sm" className="text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" /> {tc("export")}
          </Button>

          <Button onClick={() => onOpen()} className="gap-2">
            <Plus className="h-4 w-4" /> {t("addAppointment")}
          </Button>
        </div>
      </div>

      <AppointmentsFilters
        filterDate={filterDate}
        filterStatus={filterStatus}
        filterSpecialist={filterSpecialist}
        specialistsList={specialistsList}
        t={t}
        tc={tc}
        onFilterDateChange={setFilterDate}
        onFilterStatusChange={(v) => setFilterStatus(v === "__all__" ? "" : v)}
        onFilterSpecialistChange={(v) =>
          setFilterSpecialist(v === "__all__" ? "" : v)
        }
        onClear={() => {
          setFilterDate("");
          setFilterStatus("");
          setFilterSpecialist("");
        }}
      />

      <AppointmentsTable
        items={filtered}
        isAdmin={isAdmin}
        deletingId={deletingId}
        isDeleting={isDeleting}
        onEdit={onOpen}
        onDelete={setDeleteTarget}
        t={t}
        tc={tc}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={tc("deleteConfirmTitle")}
        description={tc("deleteConfirmDesc")}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      <AppointmentDialog
        open={open}
        isSaving={isSaving}
        editing={editing}
        relatedLoading={relatedLoading}
        form={form}
        clientsList={clientsList}
        specialistsList={specialistsList}
        servicesList={servicesList}
        cabinetsList={cabinetsList}
        materialsList={materialsList}
        selectedMaterials={selectedMaterials}
        selectedClient={selectedClient}
        availability={availability}
        availLoading={availLoading}
        t={t}
        tc={tc}
        onOpenChange={setOpen}
        onSubmit={onSubmit}
        onMaterialsChange={setSelectedMaterials}
        onClientChange={(v) => {
          form.setValue("clientId", v);

          const client = clientsList?.find((c) => c.id === v);

          if (client?.preferredCabinetId) {
            const cabinet = cabinetsList?.find(
              (c) => c.id === client.preferredCabinetId && c.isAvailable,
            );

            if (cabinet) {
              form.setValue("cabinetId", cabinet.id);
            }
          }
        }}
        onSpecialistChange={(v) => form.setValue("specialistId", v)}
        onServiceChange={(v) => {
          form.setValue("serviceId", v);

          const svc = servicesList?.find((s) => s.id === v);

          const start = form.getValues("startTime");

          if (svc && start) {
            const [h, m] = start.split(":").map(Number);
            const totalMin = h * 60 + m + svc.durationMinutes;

            const endH = String(Math.floor(totalMin / 60) % 24).padStart(
              2,
              "0",
            );
            const endM = String(totalMin % 60).padStart(2, "0");

            form.setValue("endTime", `${endH}:${endM}`);
          }
        }}
        onCabinetChange={(v) => form.setValue("cabinetId", v)}
        onStartTimeChange={(value) => {
          form.setValue("startTime", value);
          const svc = servicesList?.find(
            (s) => s.id === form.getValues("serviceId"),
          );

          if (svc && value) {
            const [h, m] = value.split(":").map(Number);

            const totalMin = h * 60 + m + svc.durationMinutes;

            const endH = String(Math.floor(totalMin / 60) % 24).padStart(
              2,
              "0",
            );
            const endM = String(totalMin % 60).padStart(2, "0");

            form.setValue("endTime", `${endH}:${endM}`);
          }
        }}
      />
    </motion.div>
  );
}
