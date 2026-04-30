"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useCrud } from "@/app/shared/hooks/use-crud";
import { appointmentApi, type Appointment, type SpecialistAvailability, type AppointmentMaterial } from "@/app/entities/appointment/api";
import { appointmentSchema, type AppointmentFormData } from "@/app/entities/appointment/schema";
import { serviceApi, type Service } from "@/app/entities/service/api";
import { specialistApi, type Specialist } from "@/app/entities/specialist/api";
import { clientApi, type Client } from "@/app/entities/client/api";
import { cabinetApi, type Cabinet } from "@/app/entities/cabinet/api";
import { materialApi, type Material } from "@/app/entities/material/api";
import { exportToCsv } from "@/app/shared/lib/csv-export";
import {
  Button, Input, Label, Card, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Textarea, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Spinner, TableSkeleton, LoadingOverlay, Separator, ConfirmDialog,
} from "@/app/shared/ui";
import { Plus, Pencil, Trash2, Clock, AlertTriangle, CheckCircle, X, Package, MessageSquare, Download, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/pkg/theme/utils";
import { useRole } from "@/app/shared/hooks/use-role";

const statusVariant: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  scheduled: "secondary",
  in_progress: "warning",
  completed: "success",
  cancelled: "destructive",
};

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function AvailabilityPanel({ availability, isLoading }: { availability: SpecialistAvailability | null; isLoading: boolean }) {
  const t = useTranslations("appointments");

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
        <Spinner size="sm" />
        <span className="text-sm text-muted-foreground">{t("availability")}...</span>
      </div>
    );
  }

  if (!availability) {
    return (
      <div className="p-3 rounded-lg bg-muted/30 border border-dashed">
        <p className="text-xs text-muted-foreground text-center">{t("selectSpecialistAndDate")}</p>
      </div>
    );
  }

  const totalWork = availability.totalWorkMinutes;
  const percentBooked = totalWork > 0 ? Math.round((availability.totalBookedMinutes / totalWork) * 100) : 0;
  const isFull = availability.isFull;
  const isAlmostFull = availability.freeMinutes <= 60 && !isFull;

  return (
    <div className={cn(
      "rounded-lg border p-3 space-y-2 transition-colors",
      isFull && "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/40",
      isAlmostFull && "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40",
      !isFull && !isAlmostFull && "bg-muted/30 border-border",
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isFull ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : isAlmostFull ? (
            <Clock className="h-4 w-4 text-amber-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          )}
          <span className="text-sm font-medium">{t("availability")}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {t("workingHours")}: {availability.workStart}–{availability.workEnd} (break: {availability.breakStart}–{availability.breakEnd})
        </span>
      </div>

      {isFull && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">{t("specialistFull")}</p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isFull ? "bg-red-500" : isAlmostFull ? "bg-amber-500" : "bg-primary",
            )}
            style={{ width: `${Math.min(percentBooked, 100)}%` }}
          />
        </div>
        <span className="text-xs font-mono whitespace-nowrap">
          {formatMinutes(availability.totalBookedMinutes)} / {formatMinutes(totalWork)}
        </span>
      </div>

      <div className="flex gap-4 text-xs">
        <span>
          <span className="text-muted-foreground">{t("bookedMinutes")}:</span>{" "}
          <span className="font-medium">{formatMinutes(availability.totalBookedMinutes)}</span>
          {" "}({availability.appointmentCount} {t("appointments")})
        </span>
        <span>
          <span className="text-muted-foreground">{t("freeMinutes")}:</span>{" "}
          <span className={cn("font-medium", isFull && "text-red-600 dark:text-red-400")}>
            {formatMinutes(availability.freeMinutes)}
          </span>
        </span>
      </div>

      {availability.busySlots.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">{t("busySlots")}:</p>
          <div className="flex flex-wrap gap-1">
            {availability.busySlots.map((slot, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {slot.start}–{slot.end}
                {slot.service && <span className="opacity-70">({slot.service})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {availability.freeSlots.length > 0 && !isFull && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">{t("freeSlots")}:</p>
          <div className="flex flex-wrap gap-1">
            {availability.freeSlots.map((slot, i) => (
              <span key={i} className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {slot.start}–{slot.end}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SelectedMaterial {
  materialId: string;
  quantity: string;
}

function MaterialsPicker({
  materialsList,
  selectedMaterials,
  onChange,
  disabled,
}: {
  materialsList: Material[];
  selectedMaterials: SelectedMaterial[];
  onChange: (materials: SelectedMaterial[]) => void;
  disabled: boolean;
}) {
  const t = useTranslations("appointments");

  const availableMaterials = materialsList.filter(
    (m) => !selectedMaterials.some((s) => s.materialId === m.id)
  );

  const addMaterial = (materialId: string) => {
    onChange([...selectedMaterials, { materialId, quantity: "1" }]);
  };

  const removeMaterial = (materialId: string) => {
    onChange(selectedMaterials.filter((m) => m.materialId !== materialId));
  };

  const updateQuantity = (materialId: string, quantity: string) => {
    onChange(
      selectedMaterials.map((m) =>
        m.materialId === materialId ? { ...m, quantity } : m
      )
    );
  };

  const totalCost = selectedMaterials.reduce((sum, sm) => {
    const mat = materialsList.find((m) => m.id === sm.materialId);
    return sum + (mat ? Number(mat.pricePerUnit) * Number(sm.quantity) : 0);
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <Label className="font-medium">{t("materials")}</Label>
        </div>
        {selectedMaterials.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {t("materialsCost")}: ${totalCost.toFixed(2)}
          </span>
        )}
      </div>

      {selectedMaterials.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {selectedMaterials.map((sm) => {
              const mat = materialsList.find((m) => m.id === sm.materialId);
              if (!mat) return null;
              return (
                <motion.div
                  key={sm.materialId}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ${mat.pricePerUnit}/{mat.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      step="0.5"
                      value={sm.quantity}
                      onChange={(e) => updateQuantity(sm.materialId, e.target.value || "1")}
                      disabled={disabled}
                      className="w-20 h-8 text-sm"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      = ${(Number(mat.pricePerUnit) * Number(sm.quantity)).toFixed(2)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => removeMaterial(sm.materialId)}
                      disabled={disabled}
                    >
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {availableMaterials.length > 0 && (
        <Select onValueChange={addMaterial} value="">
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t("addMaterial")} />
          </SelectTrigger>
          <SelectContent>
            {availableMaterials.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name} (${m.pricePerUnit}/{m.unit})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedMaterials.length === 0 && availableMaterials.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">{t("noMaterialsAvailable")}</p>
      )}
    </div>
  );
}

export function AppointmentsModule() {
  const t = useTranslations("appointments");
  const tc = useTranslations("common");
  const { isAdmin } = useRole();
  const {
    data, isLoading, isFetching, create, update, remove,
    isSaving, isDeleting, deletingId,
  } = useCrud<Appointment>("appointments", appointmentApi);
  const { data: servicesList, isLoading: svcLoading } = useQuery({ queryKey: ["services"], queryFn: serviceApi.getAll });
  const { data: specialistsList, isLoading: specLoading } = useQuery({ queryKey: ["specialists"], queryFn: specialistApi.getAll });
  const { data: clientsList, isLoading: cliLoading } = useQuery({ queryKey: ["clients"], queryFn: clientApi.getAll });
  const { data: cabinetsList, isLoading: cabLoading } = useQuery({ queryKey: ["cabinets"], queryFn: cabinetApi.getAll });
  const { data: materialsList, isLoading: matLoading } = useQuery({ queryKey: ["materials"], queryFn: materialApi.getAll });

  const relatedLoading = svcLoading || specLoading || cliLoading || cabLoading || matLoading;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [availability, setAvailability] = useState<SpecialistAvailability | null>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSpecialist, setFilterSpecialist] = useState("");

  const filtered = useMemo(() => {
    let result = data;
    if (filterDate) result = result.filter((a) => a.appointmentDate === filterDate);
    if (filterStatus) result = result.filter((a) => a.status === filterStatus);
    if (filterSpecialist) result = result.filter((a) => a.specialistId === filterSpecialist);
    return result;
  }, [data, filterDate, filterStatus, filterSpecialist]);

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { clientId: "", specialistId: "", serviceId: "", cabinetId: "", appointmentDate: "", startTime: "", endTime: "", status: "scheduled", notes: "" },
  });

  const watchSpecialistId = form.watch("specialistId");
  const watchDate = form.watch("appointmentDate");
  const watchServiceId = form.watch("serviceId");
  const watchClientId = form.watch("clientId");

  const selectedClient = useMemo(
    () => clientsList?.find((c) => c.id === watchClientId) ?? null,
    [clientsList, watchClientId]
  );

  const fetchAvailability = useCallback(async (specId: string, date: string, excludeId?: string) => {
    if (!specId || !date) {
      setAvailability(null);
      return;
    }
    setAvailLoading(true);
    try {
      const data = await appointmentApi.getAvailability(specId, date, excludeId);
      setAvailability(data);
    } catch {
      setAvailability(null);
    } finally {
      setAvailLoading(false);
    }
  }, []);

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

  const autoSelectFreeSlot = useCallback((avail: SpecialistAvailability, durationMin: number) => {
    for (const slot of avail.freeSlots) {
      const [sh, sm] = slot.start.split(":").map(Number);
      const [eh, em] = slot.end.split(":").map(Number);
      const slotDuration = (eh * 60 + em) - (sh * 60 + sm);
      if (slotDuration >= durationMin) {
        const endTotal = sh * 60 + sm + durationMin;
        return {
          startTime: slot.start,
          endTime: `${String(Math.floor(endTotal / 60) % 24).padStart(2, "0")}:${String(endTotal % 60).padStart(2, "0")}`,
        };
      }
    }
    return null;
  }, []);

  const onOpen = async (item?: Appointment) => {
    if (item) {
      setEditing(item);
      form.reset({
        clientId: item.clientId, specialistId: item.specialistId,
        serviceId: item.serviceId, cabinetId: item.cabinetId,
        appointmentDate: item.appointmentDate,
        startTime: item.startTime, endTime: item.endTime,
        status: item.status, notes: item.notes ?? "",
      });
      try {
        const mats = await appointmentApi.getMaterials(item.id);
        setSelectedMaterials(mats.map((m) => ({ materialId: m.materialId, quantity: m.quantity })));
      } catch {
        setSelectedMaterials([]);
      }
    } else {
      setEditing(null);
      const activeService = servicesList?.find((s: Service) => s.isActive);
      const activeSpecialist = specialistsList?.find((s: Specialist) => s.isActive);
      const availableCabinet = cabinetsList?.find((c: Cabinet) => c.isAvailable);
      form.reset({
        clientId: "",
        specialistId: activeSpecialist?.id ?? "",
        serviceId: activeService?.id ?? "",
        cabinetId: availableCabinet?.id ?? "",
        appointmentDate: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endTime: activeService ? `${String(Math.floor(9 + activeService.durationMinutes / 60)).padStart(2, "0")}:${String(activeService.durationMinutes % 60).padStart(2, "0")}` : "10:00",
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
        const result = await create(formData as unknown as Record<string, unknown>);
        appointmentId = (result as Appointment).id;
      }
      try {
        await appointmentApi.saveMaterials(appointmentId, selectedMaterials);
      } catch {
        // materials save is secondary
      }
      setOpen(false);
    } catch {
      // handled by useCrud toast
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await remove(deleteTarget); } catch { /* toast */ }
    setDeleteTarget(null);
  };

  const handleExport = () => {
    exportToCsv(filtered, [
      { key: "clientFirstName", label: "Client First Name" },
      { key: "clientLastName", label: "Client Last Name" },
      { key: "serviceName", label: "Service" },
      { key: "specialistFirstName", label: "Specialist" },
      { key: "appointmentDate", label: "Date" },
      { key: "startTime", label: "Start Time" },
      { key: "endTime", label: "End Time" },
      { key: "status", label: "Status" },
      { key: "servicePrice", label: "Price" },
    ], "appointments");
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-10 w-44 animate-pulse rounded-xl bg-muted" />
        </div>
        <Card><TableSkeleton rows={5} cols={7} /></Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">{filtered.length} / {data.length}</p>
          {isFetching && <Spinner size="sm" className="text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2" disabled={filtered.length === 0}><Download className="h-4 w-4" /> {tc("export")}</Button>
          <Button onClick={() => onOpen()} className="gap-2"><Plus className="h-4 w-4" /> {t("addAppointment")}</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{tc("filterByDate")}</Label>
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-44 h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{tc("filterByStatus")}</Label>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder={tc("all")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{tc("all")}</SelectItem>
              <SelectItem value="scheduled">{t("scheduled")}</SelectItem>
              <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
              <SelectItem value="completed">{t("completed")}</SelectItem>
              <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{tc("filterBySpecialist")}</Label>
          <Select value={filterSpecialist} onValueChange={(v) => setFilterSpecialist(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-48 h-9"><SelectValue placeholder={tc("all")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{tc("all")}</SelectItem>
              {specialistsList?.map((s) => (<SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        {(filterDate || filterStatus || filterSpecialist) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterDate(""); setFilterStatus(""); setFilterSpecialist(""); }} className="h-9">
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("client")}</TableHead>
                <TableHead>{t("service")}</TableHead>
                <TableHead>{t("specialist")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("startTime")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                {isAdmin && <TableHead className="w-24">{tc("actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filtered.map((item) => {
                  const isItemDeleting = deletingId === item.id;
                  return (
                    <motion.tr key={item.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: isItemDeleting ? 0.4 : 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0 }} transition={{ duration: 0.2 }} className={cn("border-b transition-colors hover:bg-muted/50", isItemDeleting && "pointer-events-none")}>
                      <TableCell className="font-medium">{item.clientFirstName} {item.clientLastName}</TableCell>
                      <TableCell>{item.serviceName}</TableCell>
                      <TableCell>{item.specialistFirstName} {item.specialistLastName}</TableCell>
                      <TableCell>{item.appointmentDate}</TableCell>
                      <TableCell>{item.startTime} - {item.endTime}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[item.status] ?? "default"}>
                          {t(item.status === "in_progress" ? "inProgress" : item.status)}
                        </Badge>
                      </TableCell>
                      {isAdmin && <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => onOpen(item)} disabled={isItemDeleting}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item.id)} disabled={isDeleting}>
                            {isItemDeleting ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                          </Button>
                        </div>
                      </TableCell>}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{tc("noData")}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title={tc("deleteConfirmTitle")} description={tc("deleteConfirmDesc")} confirmLabel={tc("delete")} cancelLabel={tc("cancel")} onConfirm={handleDelete} isLoading={isDeleting} />

      <Dialog open={open} onOpenChange={(v) => !isSaving && setOpen(v)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <LoadingOverlay visible={isSaving} text={editing ? "Updating..." : "Creating..."} />
          <DialogHeader>
            <DialogTitle>{editing ? t("editAppointment") : t("addAppointment")}</DialogTitle>
          </DialogHeader>
          {relatedLoading ? (
            <div className="flex items-center justify-center gap-3 py-12">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground">Loading form data...</p>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("client")}</Label>
                  <Select
                    value={form.watch("clientId")}
                    onValueChange={(v) => {
                      form.setValue("clientId", v);
                      const client = clientsList?.find((c) => c.id === v);
                      if (client?.preferredCabinetId) {
                        const cabinet = cabinetsList?.find((c) => c.id === client.preferredCabinetId && c.isAvailable);
                        if (cabinet) {
                          form.setValue("cabinetId", cabinet.id);
                        }
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clientsList?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("specialist")}</Label>
                  <Select value={form.watch("specialistId")} onValueChange={(v) => form.setValue("specialistId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select specialist" /></SelectTrigger>
                    <SelectContent>
                      {specialistsList?.filter((s) => s.isActive).map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedClient?.notes && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40">
                  <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{t("clientNotes")}</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">{selectedClient.notes}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("service")}</Label>
                  <Select
                    value={form.watch("serviceId")}
                    onValueChange={(v) => {
                      form.setValue("serviceId", v);
                      const svc = servicesList?.find((s) => s.id === v);
                      const start = form.getValues("startTime");
                      if (svc && start) {
                        const [h, m] = start.split(":").map(Number);
                        const totalMin = h * 60 + m + svc.durationMinutes;
                        const endH = String(Math.floor(totalMin / 60) % 24).padStart(2, "0");
                        const endM = String(totalMin % 60).padStart(2, "0");
                        form.setValue("endTime", `${endH}:${endM}`);
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                    <SelectContent>
                      {servicesList?.filter((s) => s.isActive).map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name} (${s.price})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("cabinet")}</Label>
                  <Select value={form.watch("cabinetId")} onValueChange={(v) => form.setValue("cabinetId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select cabinet" /></SelectTrigger>
                    <SelectContent>
                      {cabinetsList?.filter((c) => c.isAvailable).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <AvailabilityPanel availability={availability} isLoading={availLoading} />

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t("date")}</Label>
                  <Input type="date" {...form.register("appointmentDate")} disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label>{t("startTime")}</Label>
                  <Input
                    type="time"
                    {...form.register("startTime")}
                    disabled={isSaving}
                    onChange={(e) => {
                      form.setValue("startTime", e.target.value);
                      const svc = servicesList?.find((s) => s.id === form.getValues("serviceId"));
                      if (svc && e.target.value) {
                        const [h, m] = e.target.value.split(":").map(Number);
                        const totalMin = h * 60 + m + svc.durationMinutes;
                        const endH = String(Math.floor(totalMin / 60) % 24).padStart(2, "0");
                        const endM = String(totalMin % 60).padStart(2, "0");
                        form.setValue("endTime", `${endH}:${endM}`);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("endTime")}</Label>
                  <Input type="time" {...form.register("endTime")} disabled={isSaving} />
                </div>
              </div>
              {editing && (
                <div className="space-y-2">
                  <Label>{t("status")}</Label>
                  <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as AppointmentFormData["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">{t("scheduled")}</SelectItem>
                      <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
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
                onChange={setSelectedMaterials}
                disabled={isSaving}
              />

              <Separator />

              <div className="space-y-2">
                <Label>{t("notes")}</Label>
                <Textarea {...form.register("notes")} disabled={isSaving} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
                  {tc("cancel")}
                </Button>
                <Button type="submit" disabled={isSaving || (availability?.isFull ?? false)}>
                  {isSaving && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
                  {tc("save")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
