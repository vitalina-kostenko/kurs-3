"use client";

import { type Specialist } from "@/app/entities/specialist/api";
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
import { X } from "lucide-react";

interface AppointmentsFiltersProps {
  filterDate: string;
  filterStatus: string;
  filterSpecialist: string;
  specialistsList?: Specialist[];
  tc: (key: string) => string;
  t: (key: string) => string;
  onFilterDateChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onFilterSpecialistChange: (value: string) => void;
  onClear: () => void;
}

export function AppointmentsFilters({
  filterDate,
  filterStatus,
  filterSpecialist,
  specialistsList,
  tc,
  t,
  onFilterDateChange,
  onFilterStatusChange,
  onFilterSpecialistChange,
  onClear,
}: AppointmentsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          {tc("filterByDate")}
        </Label>

        <Input
          type="date"
          value={filterDate}
          onChange={(e) => onFilterDateChange(e.target.value)}
          className="w-44 h-9"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          {tc("filterByStatus")}
        </Label>

        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder={tc("all")} />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="__all__">{tc("all")}</SelectItem>
            <SelectItem value="scheduled">{t("scheduled")}</SelectItem>
            <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
            <SelectItem value="completed">{t("completed")}</SelectItem>
            <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          {tc("filterBySpecialist")}
        </Label>

        <Select
          value={filterSpecialist}
          onValueChange={onFilterSpecialistChange}
        >
          <SelectTrigger className="w-48 h-9">
            <SelectValue placeholder={tc("all")} />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="__all__">{tc("all")}</SelectItem>
            {specialistsList?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(filterDate || filterStatus || filterSpecialist) && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-9">
          <X className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}
