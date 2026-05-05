"use client";

import { type Cabinet } from "@/app/entities/cabinet/api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Spinner,
} from "@/app/shared/ui";
import { cn } from "@/pkg/theme/utils";
import { DoorOpen, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface CabinetsGridProps {
  items: Cabinet[];
  isAdmin: boolean;
  deletingId: string | null;
  isDeleting: boolean;
  onEdit: (item: Cabinet) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
  tc: (key: string) => string;
}

export function CabinetsGrid({
  items,
  isAdmin,
  deletingId,
  isDeleting,
  onEdit,
  onDelete,
  t,
  tc,
}: CabinetsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {items.map((item, i) => {
          const isItemDeleting = deletingId === item.id;
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: isItemDeleting ? 0.4 : 1,
                y: 0,
                scale: isItemDeleting ? 0.97 : 1,
              }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
            >
              <Card className={cn(isItemDeleting && "pointer-events-none")}>
                <CardContent className="p-6 relative">
                  {isItemDeleting && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm">
                      <Spinner size="md" />
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2.5">
                        <DoorOpen className="h-5 w-5 text-primary" />
                      </div>

                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Capacity: {item.capacity}
                        </p>
                      </div>
                    </div>

                    <Badge variant={item.isAvailable ? "success" : "secondary"}>
                      {item.isAvailable ? t("isAvailable") : tc("inactive")}
                    </Badge>
                  </div>

                  {item.description && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}

                  {isAdmin && (
                    <div className="mt-4 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" /> {tc("edit")}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" />{" "}
                        {tc("delete")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        
      </AnimatePresence>
      {items.length === 0 && (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          {tc("noData")}
        </div>
      )}
    </div>
  );
}
