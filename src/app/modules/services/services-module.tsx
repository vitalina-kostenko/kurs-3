"use client";

import { serviceApi, type Service } from "@/app/entities/service/api";
import {
  serviceSchema,
  type ServiceFormData,
} from "@/app/entities/service/schema";
import { useCrud } from "@/app/shared/hooks/use-crud";
import { useRole } from "@/app/shared/hooks/use-role";
import { Button, ConfirmDialog, Input, Spinner } from "@/app/shared/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ServiceDialog } from "./elements/service-dialog";
import { ServicesLoading } from "./elements/services-loading";
import { ServicesTable } from "./elements/services-table";

export function ServicesModule() {
  const t = useTranslations("services");
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
  } = useCrud<Service>("services", serviceApi);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;

    const q = search.toLowerCase();

    return data.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q),
    );
  }, [data, search]);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),

    defaultValues: {
      name: "",
      description: "",
      durationMinutes: 60,
      price: "",
      isActive: true,
    },
  });

  const onOpen = (service?: Service) => {
    if (service) {
      setEditing(service);

      form.reset({
        name: service.name,
        description: service.description ?? "",
        durationMinutes: service.durationMinutes,
        price: service.price,
        isActive: service.isActive,
      });
    } else {
      setEditing(null);

      form.reset({
        name: "",
        description: "",
        durationMinutes: 60,
        price: "",
        isActive: true,
      });
    }
    setOpen(true);
  };

  const onSubmit = async (data: ServiceFormData) => {
    try {
      if (editing) {
        await update({ id: editing.id, ...data });
      } else {
        await create(data as unknown as Record<string, unknown>);
      }

      setOpen(false);
    } catch {
      toast.error("Failed to save service.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await remove(deleteTarget);
    } catch {
      toast.error("Failed to delete service.");
    }

    setDeleteTarget(null);
  };

  if (isLoading) {
    return <ServicesLoading />;
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
        
        {isAdmin && (
          <Button onClick={() => onOpen()} className="gap-2">
            <Plus className="h-4 w-4" /> {t("addService")}
          </Button>
        )}
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

      <ServicesTable
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

      <ServiceDialog
        open={open}
        isSaving={isSaving}
        editing={editing}
        form={form}
        t={t}
        tc={tc}
        onOpenChange={(value) => !isSaving && setOpen(value)}
        onSubmit={onSubmit}
        onCancel={() => setOpen(false)}
      />
    </motion.div>
  );
}
