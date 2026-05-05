"use client";

import { type Appointment } from "@/app/entities/appointment/api";
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
import { Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { statusVariant } from "../types";

interface AppointmentsTableProps {
  items: Appointment[];
  isAdmin: boolean;
  deletingId: string | null;
  isDeleting: boolean;
  onEdit: (item: Appointment) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
  tc: (key: string) => string;
}

export function AppointmentsTable({
  items,
  isAdmin,
  deletingId,
  isDeleting,
  onEdit,
  onDelete,
  t,
  tc,
}: AppointmentsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("client")}</TableHead>
              <TableHead>{t("service")}</TableHead>
              <TableHead>{t("specialist")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("startTime")}</TableHead>
              <TableHead>{t("status")}</TableHead>
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
                    <TableCell className="font-medium">
                      {item.clientFirstName} {item.clientLastName}
                    </TableCell>

                    <TableCell>{item.serviceName}</TableCell>
                    <TableCell>
                      {item.specialistFirstName} {item.specialistLastName}
                    </TableCell>

                    <TableCell>{item.appointmentDate}</TableCell>
                    <TableCell>
                      {item.startTime} - {item.endTime}
                    </TableCell>

                    <TableCell>
                      <Badge variant={statusVariant[item.status] ?? "default"}>
                        {t(
                          item.status === "in_progress"
                            ? "inProgress"
                            : item.status,
                        )}
                      </Badge>
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
