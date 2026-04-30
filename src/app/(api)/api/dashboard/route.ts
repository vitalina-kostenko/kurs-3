import { db } from "@/pkg/db";
import { clients, appointments, specialists, services } from "@/pkg/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { jsonOk, jsonError } from "@/app/shared/lib/api-helpers";
import { requireAuth } from "@/app/shared/lib/auth-guard";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const today = new Date().toISOString().split("T")[0];

    const [totalClients] = await db.select({ value: count() }).from(clients);
    const [activeSpecialists] = await db
      .select({ value: count() })
      .from(specialists)
      .where(eq(specialists.isActive, true));
    const [todayAppointments] = await db
      .select({ value: count() })
      .from(appointments)
      .where(eq(appointments.appointmentDate, today));
    const [monthlyRevenue] = await db
      .select({
        value: sql<string>`COALESCE(SUM(${services.price}::numeric), 0)`,
      })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(
        sql`${appointments.status} = 'completed' AND EXTRACT(MONTH FROM ${appointments.appointmentDate}::date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM ${appointments.appointmentDate}::date) = EXTRACT(YEAR FROM CURRENT_DATE)`
      );

    const recentAppointments = await db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        status: appointments.status,
        clientFirstName: clients.firstName,
        clientLastName: clients.lastName,
        serviceName: services.name,
        specialistFirstName: specialists.firstName,
        specialistLastName: specialists.lastName,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .leftJoin(specialists, eq(appointments.specialistId, specialists.id))
      .orderBy(sql`${appointments.appointmentDate} DESC, ${appointments.startTime} DESC`)
      .limit(10);

    return jsonOk({
      totalClients: totalClients.value,
      activeSpecialists: activeSpecialists.value,
      todayAppointments: todayAppointments.value,
      monthlyRevenue: monthlyRevenue.value,
      recentAppointments,
    });
  } catch {
    return jsonError("Failed to fetch dashboard data", 500);
  }
}
