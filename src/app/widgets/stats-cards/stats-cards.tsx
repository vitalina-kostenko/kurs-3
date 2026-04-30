"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/app/shared/ui";
import { Users, CalendarDays, UserCircle, DollarSign } from "lucide-react";
import { motion } from "motion/react";

interface StatsCardsProps {
  totalClients: number;
  todayAppointments: number;
  activeSpecialists: number;
  monthlyRevenue: string;
}

const cardColors = [
  "from-violet-100 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/20",
  "from-rose-100 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/20",
  "from-amber-100 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20",
  "from-emerald-100 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20",
];

export function StatsCards({
  totalClients,
  todayAppointments,
  activeSpecialists,
  monthlyRevenue,
}: StatsCardsProps) {
  const t = useTranslations("dashboard");

  const stats = [
    { label: t("totalClients"), value: totalClients, icon: UserCircle, color: cardColors[0] },
    { label: t("totalAppointments"), value: todayAppointments, icon: CalendarDays, color: cardColors[1] },
    { label: t("activeSpecialists"), value: activeSpecialists, icon: Users, color: cardColors[2] },
    { label: t("revenue"), value: `$${Number(monthlyRevenue).toFixed(2)}`, icon: DollarSign, color: cardColors[3] },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <Card className={`bg-gradient-to-br ${stat.color} border-0`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="rounded-xl bg-white/60 dark:bg-white/10 p-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
