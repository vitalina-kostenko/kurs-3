"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCrud } from "@/app/shared/hooks/use-crud";
import { cabinetApi, type Cabinet } from "@/app/entities/cabinet/api";
import { cabinetSchema, type CabinetFormData } from "@/app/entities/cabinet/schema";
import {
  Button, Input, Label, Card, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Badge, Textarea, Spinner, CardSkeleton, LoadingOverlay, ConfirmDialog,
} from "@/app/shared/ui";
import { Plus, Pencil, Trash2, DoorOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/pkg/theme/utils";
import { useRole } from "@/app/shared/hooks/use-role";

export function CabinetsModule() {
  const t = useTranslations("cabinets");
  const tc = useTranslations("common");
  const { isAdmin } = useRole();
  const { data, isLoading, isFetching, create, update, remove, isSaving, isDeleting, deletingId } = useCrud<Cabinet>("cabinets", cabinetApi);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cabinet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const form = useForm<CabinetFormData>({
    resolver: zodResolver(cabinetSchema),
    defaultValues: { name: "", description: "", capacity: 1, isAvailable: true },
  });

  const onOpen = (item?: Cabinet) => {
    if (item) { setEditing(item); form.reset({ name: item.name, description: item.description ?? "", capacity: item.capacity, isAvailable: item.isAvailable }); }
    else { setEditing(null); form.reset(); }
    setOpen(true);
  };

  const onSubmit = async (data: CabinetFormData) => {
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
        <div className="flex justify-between items-center"><div className="h-5 w-32 animate-pulse rounded bg-muted" /><div className="h-10 w-36 animate-pulse rounded-xl bg-muted" /></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">{data.length} cabinets</p>
          {isFetching && <Spinner size="sm" className="text-muted-foreground" />}
        </div>
        {isAdmin && <Button onClick={() => onOpen()} className="gap-2"><Plus className="h-4 w-4" /> {t("addCabinet")}</Button>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {data.map((item, i) => {
            const isItemDeleting = deletingId === item.id;
            return (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: isItemDeleting ? 0.4 : 1, y: 0, scale: isItemDeleting ? 0.97 : 1 }} exit={{ opacity: 0, scale: 0.9, y: -10 }} transition={{ delay: i * 0.03, duration: 0.25 }}>
                <Card className={cn(isItemDeleting && "pointer-events-none")}>
                  <CardContent className="p-6 relative">
                    {isItemDeleting && (<div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm"><Spinner size="md" /></div>)}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2.5"><DoorOpen className="h-5 w-5 text-primary" /></div>
                        <div><p className="font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">Capacity: {item.capacity}</p></div>
                      </div>
                      <Badge variant={item.isAvailable ? "success" : "secondary"}>{item.isAvailable ? t("isAvailable") : tc("inactive")}</Badge>
                    </div>
                    {item.description && <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>}
                    {isAdmin && <div className="mt-4 flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onOpen(item)}><Pencil className="h-3.5 w-3.5 mr-1" /> {tc("edit")}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(item.id)} disabled={isDeleting}><Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" /> {tc("delete")}</Button>
                    </div>}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {data.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">{tc("noData")}</div>}
      </div>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title={tc("deleteConfirmTitle")} description={tc("deleteConfirmDesc")} confirmLabel={tc("delete")} cancelLabel={tc("cancel")} onConfirm={handleDelete} isLoading={isDeleting} />

      <Dialog open={open} onOpenChange={(v) => !isSaving && setOpen(v)}>
        <DialogContent>
          <LoadingOverlay visible={isSaving} text={editing ? "Updating..." : "Creating..."} />
          <DialogHeader><DialogTitle>{editing ? t("editCabinet") : t("addCabinet")}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2"><Label>{t("name")}</Label><Input {...form.register("name")} disabled={isSaving} /></div>
            <div className="space-y-2"><Label>{t("description")}</Label><Textarea {...form.register("description")} disabled={isSaving} /></div>
            <div className="space-y-2"><Label>{t("capacity")}</Label><Input type="number" {...form.register("capacity", { valueAsNumber: true })} disabled={isSaving} /></div>
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
