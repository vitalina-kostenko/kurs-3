"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCrud } from "@/app/shared/hooks/use-crud";
import { specialistApi, type Specialist } from "@/app/entities/specialist/api";
import { specialistSchema, type SpecialistFormData } from "@/app/entities/specialist/schema";
import {
  Button, Input, Label, Card, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge,
  Spinner, TableSkeleton, LoadingOverlay, ConfirmDialog,
} from "@/app/shared/ui";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/pkg/theme/utils";
import { useRole } from "@/app/shared/hooks/use-role";

export function SpecialistsModule() {
  const t = useTranslations("specialists");
  const tc = useTranslations("common");
  const { isAdmin } = useRole();
  const { data, isLoading, isFetching, create, update, remove, isSaving, isDeleting, deletingId } = useCrud<Specialist>("specialists", specialistApi);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Specialist | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((s) =>
      s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q) || s.specialization?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const form = useForm<SpecialistFormData>({
    resolver: zodResolver(specialistSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", specialization: "", isActive: true, workStartTime: "09:00", workEndTime: "18:00", breakStartTime: "13:00", breakEndTime: "15:00" },
  });

  const onOpen = (item?: Specialist) => {
    if (item) {
      setEditing(item);
      form.reset({ firstName: item.firstName, lastName: item.lastName, email: item.email ?? "", phone: item.phone ?? "", specialization: item.specialization ?? "", isActive: item.isActive, workStartTime: item.workStartTime, workEndTime: item.workEndTime, breakStartTime: item.breakStartTime, breakEndTime: item.breakEndTime });
    } else { setEditing(null); form.reset(); }
    setOpen(true);
  };

  const onSubmit = async (data: SpecialistFormData) => {
    try {
      if (editing) { await update({ id: editing.id, ...data }); } else { await create(data as unknown as Record<string, unknown>); }
      setOpen(false);
    } catch { /* handled */ }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await remove(deleteTarget); } catch { /* toast */ }
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex justify-between items-center"><div className="h-5 w-40 animate-pulse rounded bg-muted" /><div className="h-10 w-40 animate-pulse rounded-xl bg-muted" /></div>
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
        {isAdmin && <Button onClick={() => onOpen()} className="gap-2"><Plus className="h-4 w-4" /> {t("addSpecialist")}</Button>}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={tc("search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("firstName")} / {t("lastName")}</TableHead>
                <TableHead>{t("specialization")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("workStart")} - {t("workEnd")}</TableHead>
                <TableHead>{t("breakStart")} - {t("breakEnd")}</TableHead>
                <TableHead>{tc("status")}</TableHead>
                {isAdmin && <TableHead className="w-24">{tc("actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filtered.map((item) => {
                  const isItemDeleting = deletingId === item.id;
                  return (
                    <motion.tr key={item.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: isItemDeleting ? 0.4 : 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0 }} transition={{ duration: 0.2 }} className={cn("border-b transition-colors hover:bg-muted/50", isItemDeleting && "pointer-events-none")}>
                      <TableCell className="font-medium">{item.firstName} {item.lastName}</TableCell>
                      <TableCell>{item.specialization || "—"}</TableCell>
                      <TableCell>{item.phone || "—"}</TableCell>
                      <TableCell>{item.workStartTime} - {item.workEndTime}</TableCell>
                      <TableCell>{item.breakStartTime} - {item.breakEndTime}</TableCell>
                      <TableCell><Badge variant={item.isActive ? "success" : "secondary"}>{item.isActive ? tc("active") : tc("inactive")}</Badge></TableCell>
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
              {filtered.length === 0 && (<TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{tc("noData")}</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title={tc("deleteConfirmTitle")} description={tc("deleteConfirmDesc")} confirmLabel={tc("delete")} cancelLabel={tc("cancel")} onConfirm={handleDelete} isLoading={isDeleting} />

      <Dialog open={open} onOpenChange={(v) => !isSaving && setOpen(v)}>
        <DialogContent>
          <LoadingOverlay visible={isSaving} text={editing ? "Updating..." : "Creating..."} />
          <DialogHeader><DialogTitle>{editing ? t("editSpecialist") : t("addSpecialist")}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("firstName")}</Label><Input {...form.register("firstName")} disabled={isSaving} /></div>
              <div className="space-y-2"><Label>{t("lastName")}</Label><Input {...form.register("lastName")} disabled={isSaving} /></div>
            </div>
            <div className="space-y-2"><Label>{t("specialization")}</Label><Input {...form.register("specialization")} disabled={isSaving} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("email")}</Label><Input type="email" {...form.register("email")} disabled={isSaving} /></div>
              <div className="space-y-2"><Label>{t("phone")}</Label><Input {...form.register("phone")} disabled={isSaving} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("workStart")}</Label><Input type="time" {...form.register("workStartTime")} disabled={isSaving} /></div>
              <div className="space-y-2"><Label>{t("workEnd")}</Label><Input type="time" {...form.register("workEndTime")} disabled={isSaving} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("breakStart")}</Label><Input type="time" {...form.register("breakStartTime")} disabled={isSaving} /></div>
              <div className="space-y-2"><Label>{t("breakEnd")}</Label><Input type="time" {...form.register("breakEndTime")} disabled={isSaving} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>{tc("cancel")}</Button>
              <Button type="submit" disabled={isSaving}>{isSaving && <Spinner size="sm" className="mr-2 text-primary-foreground" />}{tc("save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
