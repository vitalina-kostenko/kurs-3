import { db } from "@/pkg/db";
import { clients, appointments, specialists, services } from "@/pkg/db/schema";
import { and, eq, gte, inArray, sql, count } from "drizzle-orm";
import { jsonOk, jsonError } from "@/app/shared/lib/api-helpers";
import { requireAuth } from "@/app/shared/lib/auth-guard";

export async function GET() {
  const { session, error } = await requireAuth();
 
  if (error) return error;
 
  try {
    const today = new Date().toISOString().split("T")[0];
    const isAdmin = session.user.role === "admin";

    if (!isAdmin) {
      const userClients = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.email, session.user.email));

      const clientIds = userClients.map((client) => client.id);

      if (clientIds.length === 0) {
        return jsonOk({
          role: "user",
          userAppointmentsCount: 0,
          nextAppointment: null,
        });
      }

      const [userAppointmentsCount] = await db
        .select({ value: count() })
        .from(appointments)
        .where(inArray(appointments.clientId, clientIds));

      const [nextAppointment] = await db
        .select({
          id: appointments.id,
          appointmentDate: appointments.appointmentDate,
          startTime: appointments.startTime,
          status: appointments.status,
          serviceName: services.name,
          specialistFirstName: specialists.firstName,
          specialistLastName: specialists.lastName,
        })
        .from(appointments)
        .leftJoin(services, eq(appointments.serviceId, services.id))
        .leftJoin(specialists, eq(appointments.specialistId, specialists.id))
        .where(
          and(
            inArray(appointments.clientId, clientIds),
            gte(appointments.appointmentDate, today),
            eq(appointments.status, "scheduled"),
          ),
        )
        .orderBy(appointments.appointmentDate, appointments.startTime)
        .limit(1);

      return jsonOk({
        role: "user",
        userAppointmentsCount: userAppointmentsCount.value,
        nextAppointment: nextAppointment ?? null,
      });
    }

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
      role: "admin",
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
