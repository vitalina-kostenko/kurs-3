"use client";

import { useQuery } from "@tanstack/react-query";
import ky from "ky";
import { useTranslations } from "next-intl";
import { StatsCards } from "@/app/widgets/stats-cards/stats-cards";
import { Card, CardContent, CardHeader, CardTitle, Badge, DashboardSkeleton, Spinner } from "@/app/shared/ui";
import { motion } from "motion/react";

interface DashboardData {
  totalClients: number;
  activeSpecialists: number;
  todayAppointments: number;
  monthlyRevenue: string;
  recentAppointments: {
    id: string;
    appointmentDate: string;
    startTime: string;
    status: string;
    clientFirstName: string;
    clientLastName: string;
    serviceName: string;
    specialistFirstName: string;
    specialistLastName: string;
  }[];
}

const statusVariant: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  scheduled: "secondary",
  in_progress: "warning",
  completed: "success",
  cancelled: "destructive",
};

export function DashboardModule() {
  const t = useTranslations("dashboard");
  const tApp = useTranslations("appointments");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => ky.get("/api/dashboard").json<DashboardData>(),
  });

  if (isLoading || !data) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <DashboardSkeleton />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsCards
        totalClients={data.totalClients}
        todayAppointments={data.todayAppointments}
        activeSpecialists={data.activeSpecialists}
        monthlyRevenue={data.monthlyRevenue}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{t("recentAppointments")}</CardTitle>
              {isFetching && <Spinner size="sm" className="text-muted-foreground" />}
            </div>
          </CardHeader>
          <CardContent>
            {data.recentAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No appointments yet
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentAppointments.map((apt, i) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="flex items-center justify-between rounded-xl bg-muted/50 p-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {apt.clientFirstName} {apt.clientLastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {apt.serviceName} — {apt.specialistFirstName} {apt.specialistLastName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm">{apt.appointmentDate}</p>
                        <p className="text-xs text-muted-foreground">{apt.startTime}</p>
                      </div>
                      <Badge variant={statusVariant[apt.status] ?? "default"}>
                        {tApp(apt.status === "in_progress" ? "inProgress" : apt.status)}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
