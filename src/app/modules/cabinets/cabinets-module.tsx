"use client";

import { cabinetApi, type Cabinet } from "@/app/entities/cabinet/api";
import {
  cabinetSchema,
  type CabinetFormData,
} from "@/app/entities/cabinet/schema";
import { useCrud } from "@/app/shared/hooks/use-crud";
import { useRole } from "@/app/shared/hooks/use-role";
import {
  Button,
  ConfirmDialog,
  Spinner,
} from "@/app/shared/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CabinetDialog } from "./elements/cabinet-dialog";
import { CabinetsGrid } from "./elements/cabinets-grid";
import { CabinetsLoading } from "./elements/cabinets-loading";

export function CabinetsModule() {
  const t = useTranslations("cabinets");
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
  } = useCrud<Cabinet>("cabinets", cabinetApi);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cabinet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const form = useForm<CabinetFormData>({
    resolver: zodResolver(cabinetSchema),
    defaultValues: {
      name: "",
      description: "",
      capacity: 1,
      isAvailable: true,
    },
  });

  const onOpen = (item?: Cabinet) => {
    if (item) {
      setEditing(item);
      form.reset({
        name: item.name,
        description: item.description ?? "",
        capacity: item.capacity,
        isAvailable: item.isAvailable,
      });
    } else {
      setEditing(null);
      form.reset();
    }

    setOpen(true);
  };

  const onSubmit = async (data: CabinetFormData) => {
    try {
      if (editing) {
        await update({ id: editing.id, ...data });
      } else {
        await create(data as unknown as Record<string, unknown>);
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save cabinet.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await remove(deleteTarget);
    } catch {
      toast.error("Failed to delete cabinet.");
    }
    setDeleteTarget(null);
  };

  if (isLoading) {
    return <CabinetsLoading />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">{data.length} cabinets</p>
          {isFetching && (
            <Spinner size="sm" className="text-muted-foreground" />
          )}
        </div>
        
        {isAdmin && (
          <Button onClick={() => onOpen()} className="gap-2">
            <Plus className="h-4 w-4" /> {t("addCabinet")}
          </Button>
        )}
      </div>

      <CabinetsGrid
        items={data}
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

      <CabinetDialog
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
