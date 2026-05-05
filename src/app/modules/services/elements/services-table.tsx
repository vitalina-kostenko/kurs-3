"use client";

import { type Service } from "@/app/entities/service/api";
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

interface ServicesTableProps {
  items: Service[];
  isAdmin: boolean;
  deletingId: string | null;
  isDeleting: boolean;
  onEdit: (item: Service) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
  tc: (key: string) => string;
}

export function ServicesTable({
  items,
  isAdmin,
  deletingId,
  isDeleting,
  onEdit,
  onDelete,
  t,
  tc,
}: ServicesTableProps) {
  return (
    <Card className="relative">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("duration")}</TableHead>
              <TableHead>{t("price")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
              {isAdmin && (
                <TableHead className="w-24">{tc("actions")}</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            <AnimatePresence mode="popLayout">
              {items.map((service) => {
                const isItemDeleting = deletingId === service.id;

                return (
                  <motion.tr
                    key={service.id}
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
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>{service.durationMinutes} min</TableCell>
                    <TableCell>${service.price}</TableCell>
                    <TableCell>
                      <Badge
                        variant={service.isActive ? "success" : "secondary"}
                      >
                        {service.isActive ? tc("active") : tc("inactive")}
                      </Badge>
                    </TableCell>

                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(service)}
                            disabled={isItemDeleting}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(service.id)}
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
                  colSpan={5}
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
