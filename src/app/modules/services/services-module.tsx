"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCrud } from "@/app/shared/hooks/use-crud";
import { serviceApi, type Service } from "@/app/entities/service/api";
import { serviceSchema, type ServiceFormData } from "@/app/entities/service/schema";
import {
  Button, Input, Label, Card, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Textarea, Spinner, TableSkeleton, LoadingOverlay, ConfirmDialog,
} from "@/app/shared/ui";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/pkg/theme/utils";
import { useRole } from "@/app/shared/hooks/use-role";

export function ServicesModule() {
  const t = useTranslations("services");
  const tc = useTranslations("common");
  const { isAdmin } = useRole();
  const {
    data, isLoading, isFetching, create, update, remove,
    isSaving, isDeleting, deletingId,
  } = useCrud<Service>("services", serviceApi);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((s) =>
      s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", description: "", durationMinutes: 60, price: "", isActive: true },
  });

  const onOpen = (service?: Service) => {
    if (service) {
      setEditing(service);
      form.reset({ name: service.name, description: service.description ?? "", durationMinutes: service.durationMinutes, price: service.price, isActive: service.isActive });
    } else {
      setEditing(null);
      form.reset({ name: "", description: "", durationMinutes: 60, price: "", isActive: true });
    }
    setOpen(true);
  };

  const onSubmit = async (data: ServiceFormData) => {
    try {
      if (editing) { await update({ id: editing.id, ...data }); } else { await create(data as unknown as Record<string, unknown>); }
      setOpen(false);
    } catch { /* handled by useCrud toast */ }
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
        <Card><TableSkeleton rows={5} cols={5} /></Card>
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
        {isAdmin && <Button onClick={() => onOpen()} className="gap-2"><Plus className="h-4 w-4" /> {t("addService")}</Button>}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={tc("search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="relative">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("duration")}</TableHead>
                <TableHead>{t("price")}</TableHead>
                <TableHead>{tc("status")}</TableHead>
                {isAdmin && <TableHead className="w-24">{tc("actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filtered.map((service) => {
                  const isItemDeleting = deletingId === service.id;
                  return (
                    <motion.tr key={service.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: isItemDeleting ? 0.4 : 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0 }} transition={{ duration: 0.2 }} className={cn("border-b transition-colors hover:bg-muted/50", isItemDeleting && "pointer-events-none")}>
                      <TableCell><div><p className="font-medium">{service.name}</p>{service.description && <p className="text-xs text-muted-foreground">{service.description}</p>}</div></TableCell>
                      <TableCell>{service.durationMinutes} min</TableCell>
                      <TableCell>${service.price}</TableCell>
                      <TableCell><Badge variant={service.isActive ? "success" : "secondary"}>{service.isActive ? tc("active") : tc("inactive")}</Badge></TableCell>
                      {isAdmin && <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => onOpen(service)} disabled={isItemDeleting}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(service.id)} disabled={isDeleting}>
                            {isItemDeleting ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                          </Button>
                        </div>
                      </TableCell>}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{tc("noData")}</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title={tc("deleteConfirmTitle")} description={tc("deleteConfirmDesc")} confirmLabel={tc("delete")} cancelLabel={tc("cancel")} onConfirm={handleDelete} isLoading={isDeleting} />

      <Dialog open={open} onOpenChange={(v) => !isSaving && setOpen(v)}>
        <DialogContent>
          <LoadingOverlay visible={isSaving} text={editing ? "Updating..." : "Creating..."} />
          <DialogHeader><DialogTitle>{editing ? t("editService") : t("addService")}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2"><Label>{t("name")}</Label><Input {...form.register("name")} disabled={isSaving} />{form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}</div>
            <div className="space-y-2"><Label>{t("description")}</Label><Textarea {...form.register("description")} disabled={isSaving} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("duration")}</Label><Input type="number" {...form.register("durationMinutes", { valueAsNumber: true })} disabled={isSaving} /></div>
              <div className="space-y-2"><Label>{t("price")}</Label><Input {...form.register("price")} disabled={isSaving} /></div>
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
