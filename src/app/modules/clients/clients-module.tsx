"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useCrud } from "@/app/shared/hooks/use-crud";
import { clientApi, type Client } from "@/app/entities/client/api";
import { clientSchema, type ClientFormData } from "@/app/entities/client/schema";
import { cabinetApi } from "@/app/entities/cabinet/api";
import { exportToCsv } from "@/app/shared/lib/csv-export";
import {
  Button, Input, Label, Card, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Textarea,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Spinner, TableSkeleton, LoadingOverlay, ConfirmDialog,
} from "@/app/shared/ui";
import { Plus, Pencil, Trash2, Search, Download } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/pkg/theme/utils";
import { useRole } from "@/app/shared/hooks/use-role";

export function ClientsModule() {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const { isAdmin } = useRole();
  const { data, isLoading, isFetching, create, update, remove, isSaving, isDeleting, deletingId } = useCrud<Client>("clients", clientApi);
  const { data: cabinetsList } = useQuery({ queryKey: ["cabinets"], queryFn: cabinetApi.getAll });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((c) =>
      c.firstName.toLowerCase().includes(q) || c.lastName.toLowerCase().includes(q) || c.phone.includes(q) || c.email?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", preferredCabinetId: "", notes: "" },
  });

  const onOpen = (item?: Client) => {
    if (item) { setEditing(item); form.reset({ firstName: item.firstName, lastName: item.lastName, email: item.email ?? "", phone: item.phone, preferredCabinetId: item.preferredCabinetId ?? "", notes: item.notes ?? "" }); }
    else { setEditing(null); form.reset(); }
    setOpen(true);
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      const payload: Record<string, unknown> = { ...data };
      if (!payload.preferredCabinetId) payload.preferredCabinetId = null;
      if (editing) { await update({ id: editing.id, ...payload }); } else { await create(payload); }
      setOpen(false);
    } catch { /* handled */ }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await remove(deleteTarget); } catch { /* toast */ }
    setDeleteTarget(null);
  };

  const getCabinetName = (id: string | null) => {
    if (!id) return "—";
    return cabinetsList?.find((c) => c.id === id)?.name ?? "—";
  };

  const handleExport = () => {
    exportToCsv(filtered, [
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "notes", label: "Notes" },
    ], "clients");
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex justify-between items-center"><div className="h-5 w-32 animate-pulse rounded bg-muted" /><div className="h-10 w-32 animate-pulse rounded-xl bg-muted" /></div>
        <Card><TableSkeleton rows={5} cols={6} /></Card>
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
          {isAdmin && <Button onClick={() => onOpen()} className="gap-2"><Plus className="h-4 w-4" /> {t("addClient")}</Button>}
        </div>
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
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("preferredCabinet")}</TableHead>
                <TableHead>{t("notes")}</TableHead>
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
                      <TableCell>{item.email || "—"}</TableCell>
                      <TableCell>{item.phone}</TableCell>
                      <TableCell>{getCabinetName(item.preferredCabinetId)}</TableCell>
                      <TableCell className="max-w-48 truncate">{item.notes || "—"}</TableCell>
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
              {filtered.length === 0 && (<TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{tc("noData")}</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title={tc("deleteConfirmTitle")} description={tc("deleteConfirmDesc")} confirmLabel={tc("delete")} cancelLabel={tc("cancel")} onConfirm={handleDelete} isLoading={isDeleting} />

      <Dialog open={open} onOpenChange={(v) => !isSaving && setOpen(v)}>
        <DialogContent>
          <LoadingOverlay visible={isSaving} text={editing ? "Updating..." : "Creating..."} />
          <DialogHeader><DialogTitle>{editing ? t("editClient") : t("addClient")}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("firstName")}</Label><Input {...form.register("firstName")} disabled={isSaving} /></div>
              <div className="space-y-2"><Label>{t("lastName")}</Label><Input {...form.register("lastName")} disabled={isSaving} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("email")}</Label><Input type="email" {...form.register("email")} disabled={isSaving} /></div>
              <div className="space-y-2"><Label>{t("phone")}</Label><Input {...form.register("phone")} disabled={isSaving} /></div>
            </div>
            <div className="space-y-2">
              <Label>{t("preferredCabinet")}</Label>
              <Select value={form.watch("preferredCabinetId") || ""} onValueChange={(v) => form.setValue("preferredCabinetId", v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder={t("selectCabinet")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("noCabinetPreference")}</SelectItem>
                  {cabinetsList?.filter((c) => c.isAvailable).map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{t("notes")}</Label><Textarea {...form.register("notes")} disabled={isSaving} /></div>
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
