"use client";

import { cabinetApi } from "@/app/entities/cabinet/api";
import { clientApi, type Client } from "@/app/entities/client/api";
import {
  clientSchema,
  type ClientFormData,
} from "@/app/entities/client/schema";
import { useCrud } from "@/app/shared/hooks/use-crud";
import { useRole } from "@/app/shared/hooks/use-role";
import { exportToCsv } from "@/app/shared/lib/csv-export";
import { Button, ConfirmDialog, Input, Spinner } from "@/app/shared/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Download, Plus, Search } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ClientDialog } from "./elements/client-dialog";
import { ClientsLoading } from "./elements/clients-loading";
import { ClientsTable } from "./elements/clients-table";

export function ClientsModule() {
  const t = useTranslations("clients");
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
  } = useCrud<Client>("clients", clientApi);

  const { data: cabinetsList } = useQuery({
    queryKey: ["cabinets"],
    queryFn: cabinetApi.getAll,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;

    const q = search.toLowerCase();

    return data.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email?.toLowerCase().includes(q),
    );
  }, [data, search]);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      preferredCabinetId: "",
      notes: "",
    },
  });

  const onOpen = (item?: Client) => {
    if (item) {
      setEditing(item);

      form.reset({
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email ?? "",
        phone: item.phone,
        preferredCabinetId: item.preferredCabinetId ?? "",
        notes: item.notes ?? "",
      });
    } else {
      setEditing(null);
      form.reset();
    }
    setOpen(true);
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      const payload: Record<string, unknown> = { ...data };

      if (!payload.preferredCabinetId) payload.preferredCabinetId = null;

      if (editing) {
        await update({ id: editing.id, ...payload });
      } else {
        await create(payload);
      }

      setOpen(false);
    } catch {
      toast.error("Failed to save client.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await remove(deleteTarget);
    } catch {
      toast.error("Failed to delete client.");
    }

    setDeleteTarget(null);
  };

  const getCabinetName = (id: string | null) => {
    if (!id) return "—";

    return cabinetsList?.find((c) => c.id === id)?.name ?? "—";
  };

  const handleExport = () => {
    exportToCsv(
      filtered,
      [
        { key: "firstName", label: "First Name" },
        { key: "lastName", label: "Last Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "notes", label: "Notes" },
      ],
      "clients",
    );
  };

  if (isLoading) {
    return <ClientsLoading />;
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

          {isAdmin && (
            <Button onClick={() => onOpen()} className="gap-2">
              <Plus className="h-4 w-4" /> {t("addClient")}
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

        <Input
          placeholder={tc("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <ClientsTable
        items={filtered}
        isAdmin={isAdmin}
        deletingId={deletingId}
        isDeleting={isDeleting}
        onEdit={onOpen}
        onDelete={setDeleteTarget}
        getCabinetName={getCabinetName}
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

      <ClientDialog
        open={open}
        isSaving={isSaving}
        editing={editing}
        form={form}
        cabinetsList={cabinetsList}
        t={t}
        tc={tc}
        onOpenChange={(value) => !isSaving && setOpen(value)}
        onSubmit={onSubmit}
        onCancel={() => setOpen(false)}
      />
    </motion.div>
  );
}
