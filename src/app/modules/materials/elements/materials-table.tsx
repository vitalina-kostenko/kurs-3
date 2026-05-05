"use client";

import { type Material } from "@/app/entities/material/api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/shared/ui";
import { cn } from "@/pkg/theme/utils";
import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface MaterialsTableProps {
  items: Material[];
  isAdmin: boolean;
  deletingId: string | null;
  isDeleting: boolean;
  onEdit: (item: Material) => void;
  onDelete: (id: string) => void;
  isLowStock: (item: Material) => boolean;
  t: (key: string) => string;
  tc: (key: string) => string;
}

export function MaterialsTable({
  items,
  isAdmin,
  deletingId,
  isDeleting,
  onEdit,
  onDelete,
  isLowStock,
  t,
  tc,
}: MaterialsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("unit")}</TableHead>
              <TableHead>{t("quantity")}</TableHead>
              <TableHead>{t("minQuantity")}</TableHead>
              <TableHead>{t("pricePerUnit")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
              {isAdmin && (
                <TableHead className="w-24">{tc("actions")}</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            <AnimatePresence mode="popLayout">
              {items.map((item) => {
                const isItemDeleting = deletingId === item.id;

                return (
                  <motion.tr
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: isItemDeleting ? 0.4 : 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/50",
                      isItemDeleting && "pointer-events-none",
                    )}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.minQuantity}</TableCell>
                    <TableCell>${item.pricePerUnit}</TableCell>

                    <TableCell>
                      {isLowStock(item) ? (
                        <Badge variant="warning" className="gap-1">
                          <AlertTriangle className="h-3 w-3" /> {t("lowStock")}
                        </Badge>
                      ) : (
                        <Badge variant="success">{tc("active")}</Badge>
                      )}
                    </TableCell>

                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            disabled={isItemDeleting}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(item.id)}
                            disabled={isDeleting}
                          >
                            {isItemDeleting ? (
                              <Spinner size="sm" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </motion.tr>
                );
              })}
            </AnimatePresence>

            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  {tc("noData")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
