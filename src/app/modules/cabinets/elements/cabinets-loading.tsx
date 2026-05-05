"use client";

import { CardSkeleton } from "@/app/shared/ui";
import { motion } from "motion/react";

export function CabinetsLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >

      <div className="flex justify-between items-center">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        
        <div className="h-10 w-36 animate-pulse rounded-xl bg-muted" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </motion.div>
  );
}
