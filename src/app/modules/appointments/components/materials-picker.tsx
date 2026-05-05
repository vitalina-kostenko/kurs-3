"use client";

import { type Material } from "@/app/entities/material/api";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/shared/ui";
import { Package, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { type SelectedMaterial } from "../types";

interface MaterialsPickerProps {
  materialsList: Material[];
  selectedMaterials: SelectedMaterial[];
  onChange: (materials: SelectedMaterial[]) => void;
  disabled: boolean;
}

export function MaterialsPicker({
  materialsList,
  selectedMaterials,
  onChange,
  disabled,
}: MaterialsPickerProps) {
  const t = useTranslations("appointments");

  const availableMaterials = materialsList.filter(
    (m) => !selectedMaterials.some((s) => s.materialId === m.id),
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
        m.materialId === materialId ? { ...m, quantity } : m,
      ),
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
                      onChange={(e) =>
                        updateQuantity(sm.materialId, e.target.value || "1")
                      }
                      disabled={disabled}
                      className="w-20 h-8 text-sm"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      = $
                      {(Number(mat.pricePerUnit) * Number(sm.quantity)).toFixed(
                        2,
                      )}
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
        <p className="text-xs text-muted-foreground text-center py-2">
          {t("noMaterialsAvailable")}
        </p>
      )}
    </div>
  );
}
