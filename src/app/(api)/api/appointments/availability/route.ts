import { jsonError, jsonOk } from "@/app/shared/lib/api-helpers";
import { requireAuth } from "@/app/shared/lib/auth-guard";
import { db } from "@/pkg/db";
import { appointments, services, specialists } from "@/pkg/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { NextRequest } from "next/server";

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minToTime(m: number): string {
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const { error: authErr } = await requireAuth();
  if (authErr) return authErr;
  try {
    const { searchParams } = new URL(req.url);
    const specialistId = searchParams.get("specialistId");
    const date = searchParams.get("date");
    const excludeId = searchParams.get("excludeId");

    if (!specialistId || !date) {
      return jsonError("specialistId and date are required");
    }

    const specialist = await db
      .select()
      .from(specialists)
      .where(eq(specialists.id, specialistId))
      .then((r) => r[0]);

    if (!specialist) return jsonError("Specialist not found", 404);

    const conditions = [
      eq(appointments.specialistId, specialistId),
      eq(appointments.appointmentDate, date),
      ne(appointments.status, "cancelled"),
    ];

    if (excludeId) {
      conditions.push(ne(appointments.id, excludeId));
    }

    const dayAppointments = await db
      .select({
        id: appointments.id,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        serviceName: services.name,
        durationMinutes: services.durationMinutes,
      })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(and(...conditions));

    let totalBookedMinutes = 0;
    
    const busySlots: { start: string; end: string; service: string }[] = [];

    for (const apt of dayAppointments) {
      const duration = timeToMin(apt.endTime) - timeToMin(apt.startTime);
      totalBookedMinutes += duration;
      busySlots.push({
        start: apt.startTime.slice(0, 5),
        end: apt.endTime.slice(0, 5),
        service: apt.serviceName ?? "",
      });
    }

    busySlots.sort((a, b) => a.start.localeCompare(b.start));

    const workStart = timeToMin(specialist.workStartTime);
    const workEnd = timeToMin(specialist.workEndTime);
    const breakStart = timeToMin(specialist.breakStartTime);
    const breakEnd = timeToMin(specialist.breakEndTime);
    const breakDuration = breakEnd - breakStart;

    const totalWorkMinutes = (workEnd - workStart) - breakDuration;
    const freeMinutes = totalWorkMinutes - totalBookedMinutes;
    const appointmentCount = dayAppointments.length;

    const allBusySlots = [
      ...busySlots.map((s) => ({ start: timeToMin(s.start), end: timeToMin(s.end) })),
      { start: breakStart, end: breakEnd },
    ].sort((a, b) => a.start - b.start);

    const freeSlots: { start: string; end: string }[] = [];
    let cursor = workStart;

    for (const slot of allBusySlots) {
      if (cursor < slot.start) {
        freeSlots.push({ start: minToTime(cursor), end: minToTime(slot.start) });
      }
      cursor = Math.max(cursor, slot.end);
    }

    if (cursor < workEnd) {
      freeSlots.push({ start: minToTime(cursor), end: minToTime(workEnd) });
    }

    return jsonOk({
      specialistId,
      date,
      workStart: specialist.workStartTime.slice(0, 5),
      workEnd: specialist.workEndTime.slice(0, 5),
      breakStart: specialist.breakStartTime.slice(0, 5),
      breakEnd: specialist.breakEndTime.slice(0, 5),
      appointmentCount,
      totalBookedMinutes,
      totalWorkMinutes,
      freeMinutes,
      busySlots,
      freeSlots,
      isFull: freeMinutes <= 0,
    });
  } catch {
    return jsonError("Failed to check availability", 500);
  }
}
