"use client";

import { Card, TableSkeleton } from "@/app/shared/ui";
import { motion } from "motion/react";

export function ClientsLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />

        <div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />
      </div>

      <Card>
        <TableSkeleton rows={5} cols={6} />
      </Card>
    </motion.div>
  );
}
