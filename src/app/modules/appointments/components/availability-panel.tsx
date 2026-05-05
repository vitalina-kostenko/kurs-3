"use client";

import { type SpecialistAvailability } from "@/app/entities/appointment/api";
import { Spinner } from "@/app/shared/ui";
import { cn } from "@/pkg/theme/utils";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);

  const m = min % 60;

  if (h === 0) return `${m} min`;

  if (m === 0) return `${h}h`;

  return `${h}h ${m}min`;
}

interface AvailabilityPanelProps {
  availability: SpecialistAvailability | null;
  isLoading: boolean;
}

export function AvailabilityPanel({
  availability,
  isLoading,
}: AvailabilityPanelProps) {
  const t = useTranslations("appointments");

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
        <Spinner size="sm" />

        <span className="text-sm text-muted-foreground">{t("availability")}...</span>
      </div>
    );
  }

  if (!availability) {
    return (
      <div className="p-3 rounded-lg bg-muted/30 border border-dashed">
        <p className="text-xs text-muted-foreground text-center">
          {t("selectSpecialistAndDate")}
        </p>
      </div>
    );
  }

  const totalWork = availability.totalWorkMinutes;
  const percentBooked =
    totalWork > 0 ? Math.round((availability.totalBookedMinutes / totalWork) * 100) : 0;
  const isFull = availability.isFull;
  const isAlmostFull = availability.freeMinutes <= 60 && !isFull;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-2 transition-colors",
        isFull && "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/40",
        isAlmostFull &&
          "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40",
        !isFull && !isAlmostFull && "bg-muted/30 border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isFull ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : isAlmostFull ? (
            <Clock className="h-4 w-4 text-amber-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          )}
          <span className="text-sm font-medium">{t("availability")}</span>
        </div>

        <span className="text-xs text-muted-foreground">
          {t("workingHours")}: {availability.workStart}–{availability.workEnd} (break:{" "}
          {availability.breakStart}–{availability.breakEnd})
        </span>
      </div>

      {isFull && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {t("specialistFull")}
        </p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isFull ? "bg-red-500" : isAlmostFull ? "bg-amber-500" : "bg-primary",
            )}
            style={{ width: `${Math.min(percentBooked, 100)}%` }}
          />
        </div>

        <span className="text-xs font-mono whitespace-nowrap">
          {formatMinutes(availability.totalBookedMinutes)} / {formatMinutes(totalWork)}
        </span>
      </div>

      <div className="flex gap-4 text-xs">
        <span>
          <span className="text-muted-foreground">{t("bookedMinutes")}:</span>{" "}
          
          <span className="font-medium">{formatMinutes(availability.totalBookedMinutes)}</span>{" "}
          ({availability.appointmentCount} {t("appointments")})
        </span>
        <span>
          <span className="text-muted-foreground">{t("freeMinutes")}:</span>{" "}
          
          <span className={cn("font-medium", isFull && "text-red-600 dark:text-red-400")}>
            {formatMinutes(availability.freeMinutes)}
          </span>
        </span>
      </div>

      {availability.busySlots.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">{t("busySlots")}:</p>
         
          <div className="flex flex-wrap gap-1">
            {availability.busySlots.map((slot, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              >
                {slot.start}–{slot.end}
                {slot.service && <span className="opacity-70">({slot.service})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {availability.freeSlots.length > 0 && !isFull && (
        <div className="space-y-1">
         
          <p className="text-xs text-muted-foreground font-medium">{t("freeSlots")}:</p>
          
          <div className="flex flex-wrap gap-1">
            {availability.freeSlots.map((slot, i) => (
              <span
                key={i}
                className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                {slot.start}–{slot.end}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
