"use client";

import { type Client } from "@/app/entities/client/api";
import {
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
import { Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface ClientsTableProps {
  items: Client[];
  isAdmin: boolean;
  deletingId: string | null;
  isDeleting: boolean;
  onEdit: (item: Client) => void;
  onDelete: (id: string) => void;
  getCabinetName: (id: string | null) => string;
  t: (key: string) => string;
  tc: (key: string) => string;
}

export function ClientsTable({
  items,
  isAdmin,
  deletingId,
  isDeleting,
  onEdit,
  onDelete,
  getCabinetName,
  t,
  tc,
}: ClientsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t("firstName")} / {t("lastName")}
              </TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("phone")}</TableHead>
              <TableHead>{t("preferredCabinet")}</TableHead>
              <TableHead>{t("notes")}</TableHead>
              {isAdmin && <TableHead className="w-24">{tc("actions")}</TableHead>}
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
                    <TableCell className="font-medium">
                      {item.firstName} {item.lastName}
                    </TableCell>

                    <TableCell>{item.email || "—"}</TableCell>
                    <TableCell>{item.phone}</TableCell>
                    <TableCell>{getCabinetName(item.preferredCabinetId)}</TableCell>
                    <TableCell className="max-w-48 truncate">{item.notes || "—"}</TableCell>

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
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
