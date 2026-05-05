"use client";

import { specialistApi, type Specialist } from "@/app/entities/specialist/api";
import {
  specialistSchema,
  type SpecialistFormData,
} from "@/app/entities/specialist/schema";
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
import { SpecialistDialog } from "./elements/specialist-dialog";
import { SpecialistsLoading } from "./elements/specialists-loading";
import { SpecialistsTable } from "./elements/specialists-table";

export function SpecialistsModule() {
  const t = useTranslations("specialists");
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
  } = useCrud<Specialist>("specialists", specialistApi);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Specialist | null>(null);
  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;

    const q = search.toLowerCase();

    return data.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.specialization?.toLowerCase().includes(q),
    );
  }, [data, search]);

  const form = useForm<SpecialistFormData>({
    resolver: zodResolver(specialistSchema),

    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialization: "",
      isActive: true,
      workStartTime: "09:00",
      workEndTime: "18:00",
      breakStartTime: "13:00",
      breakEndTime: "15:00",
    },
  });

  const onOpen = (item?: Specialist) => {
    if (item) {
      setEditing(item);

      form.reset({
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email ?? "",
        phone: item.phone ?? "",
        specialization: item.specialization ?? "",
        isActive: item.isActive,
        workStartTime: item.workStartTime,
        workEndTime: item.workEndTime,
        breakStartTime: item.breakStartTime,
        breakEndTime: item.breakEndTime,
      });
    } else {
      setEditing(null);
      form.reset();
    }

    setOpen(true);
  };

  const onSubmit = async (data: SpecialistFormData) => {
    try {
      if (editing) {
        await update({ id: editing.id, ...data });
      } else {
        await create(data as unknown as Record<string, unknown>);
      }

      setOpen(false);
    } catch {
      toast.error("Failed to save specialist.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await remove(deleteTarget);
    } catch {
      toast.error("Failed to delete specialist.");
    }
    setDeleteTarget(null);
  };

  if (isLoading) {
    return <SpecialistsLoading />;
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
            <Plus className="h-4 w-4" /> {t("addSpecialist")}
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

      <SpecialistsTable
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

      <SpecialistDialog
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
