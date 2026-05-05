"use client";

import { materialApi, type Material } from "@/app/entities/material/api";
import {
  materialSchema,
  type MaterialFormData,
} from "@/app/entities/material/schema";
import { useCrud } from "@/app/shared/hooks/use-crud";
import { useRole } from "@/app/shared/hooks/use-role";
import { exportToCsv } from "@/app/shared/lib/csv-export";
import { Button, ConfirmDialog, Input, Spinner } from "@/app/shared/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Plus, Search } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { MaterialDialog } from "./elements/material-dialog";
import { MaterialsLoading } from "./elements/materials-loading";
import { MaterialsTable } from "./elements/materials-table";

export function MaterialsModule() {
  const t = useTranslations("materials");
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
  } = useCrud<Material>("materials", materialApi);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;

    const q = search.toLowerCase();

    return data.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q),
    );
  }, [data, search]);

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: "",
      description: "",
      unit: "pcs",
      quantity: "0",
      minQuantity: "0",
      pricePerUnit: "0",
    },
  });

  const onOpen = (item?: Material) => {
    if (item) {
      setEditing(item);
      form.reset({
        name: item.name,
        description: item.description ?? "",
        unit: item.unit,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        pricePerUnit: item.pricePerUnit,
      });
    } else {
      setEditing(null);
      form.reset();
    }

    setOpen(true);
  };

  const onSubmit = async (data: MaterialFormData) => {
    try {
      if (editing) {
        await update({ id: editing.id, ...data });
      } else {
        await create(data as unknown as Record<string, unknown>);
      }

      setOpen(false);
    } catch {
      toast.error("Failed to save material.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await remove(deleteTarget);
    } catch {
      toast.error("Failed to delete material.");
    }

    setDeleteTarget(null);
  };

  const isLowStock = (item: Material) =>
    Number(item.quantity) <= Number(item.minQuantity);

  const handleExport = () => {
    exportToCsv(
      filtered,
      [
        { key: "name", label: "Name" },
        { key: "unit", label: "Unit" },
        { key: "quantity", label: "Quantity" },
        { key: "minQuantity", label: "Min Quantity" },
        { key: "pricePerUnit", label: "Price per Unit" },
      ],
      "materials",
    );
  };

  if (isLoading) {
    return <MaterialsLoading />;
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
              <Plus className="h-4 w-4" /> {t("addMaterial")}
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

      <MaterialsTable
        items={filtered}
        isAdmin={isAdmin}
        deletingId={deletingId}
        isDeleting={isDeleting}
        onEdit={onOpen}
        onDelete={setDeleteTarget}
        isLowStock={isLowStock}
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

      <MaterialDialog
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
