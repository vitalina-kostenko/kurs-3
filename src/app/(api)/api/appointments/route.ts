import { jsonError, jsonOk } from "@/app/shared/lib/api-helpers";
import { requireAuth, requireRole } from "@/app/shared/lib/auth-guard";
import { db } from "@/pkg/db";
import { appointments, cabinets, clients, services, specialists } from "@/pkg/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { NextRequest } from "next/server";

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function slotsOverlap(
  aStart: number, aEnd: number,
  bStart: number, bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

async function validateAppointment(body: {
  specialistId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  serviceId: string;
  excludeId?: string;
}) {
  const newStart = timeToMin(body.startTime);
  const newEnd = timeToMin(body.endTime);

  if (newEnd <= newStart) {
    return "End time must be after start time";
  }

  const specialist = await db
    .select()
    .from(specialists)
    .where(eq(specialists.id, body.specialistId))
    .then((r) => r[0]);

  if (!specialist) return "Specialist not found";

  const workStart = timeToMin(specialist.workStartTime);
  const workEnd = timeToMin(specialist.workEndTime);
  const breakStart = timeToMin(specialist.breakStartTime);
  const breakEnd = timeToMin(specialist.breakEndTime);

  if (newStart < workStart || newEnd > workEnd) {
    return `Appointment must be within specialist working hours (${specialist.workStartTime.slice(0, 5)}–${specialist.workEndTime.slice(0, 5)})`;
  }

  if (slotsOverlap(newStart, newEnd, breakStart, breakEnd)) {
    return `Appointment overlaps with specialist break time (${specialist.breakStartTime.slice(0, 5)}–${specialist.breakEndTime.slice(0, 5)})`;
  }

  const conditions = [
    eq(appointments.specialistId, body.specialistId),
    eq(appointments.appointmentDate, body.appointmentDate),
    ne(appointments.status, "cancelled"),
  ];

  if (body.excludeId) {
    conditions.push(ne(appointments.id, body.excludeId));
  }

  const dayAppointments = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
    })
    .from(appointments)
    .where(and(...conditions));

  for (const apt of dayAppointments) {
    const existStart = timeToMin(apt.startTime);
    const existEnd = timeToMin(apt.endTime);

    if (slotsOverlap(newStart, newEnd, existStart, existEnd)) {
      return `Time slot ${body.startTime}–${body.endTime} overlaps with an existing appointment (${apt.startTime.slice(0, 5)}–${apt.endTime.slice(0, 5)})`;
    }
  }

  let totalBookedMinutes = 0;
  
  for (const apt of dayAppointments) {
    totalBookedMinutes += timeToMin(apt.endTime) - timeToMin(apt.startTime);
  }

  const breakDuration = breakEnd - breakStart;
  const totalWorkMinutes = (workEnd - workStart) - breakDuration;
  const newDuration = newEnd - newStart;

  if (totalBookedMinutes + newDuration > totalWorkMinutes) {
    const remainingMin = totalWorkMinutes - totalBookedMinutes;
    const workHours = Math.floor(totalWorkMinutes / 60);
    const workMins = totalWorkMinutes % 60;
    const workTimeStr = workMins > 0 ? `${workHours}h ${workMins}min` : `${workHours}h`;
    return `Specialist has only ${remainingMin} minutes free on this day (${workTimeStr} work day, ${breakDuration}min break). This service requires ${newDuration} minutes`;
  }

  return null;
}

export async function GET() {
  const { error: authErr } = await requireAuth();
  if (authErr) return authErr;
  try {
    const all = await db
      .select({
        id: appointments.id,
        clientId: appointments.clientId,
        specialistId: appointments.specialistId,
        serviceId: appointments.serviceId,
        cabinetId: appointments.cabinetId,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        clientFirstName: clients.firstName,
        clientLastName: clients.lastName,
        specialistFirstName: specialists.firstName,
        specialistLastName: specialists.lastName,
        serviceName: services.name,
        cabinetName: cabinets.name,
        servicePrice: services.price,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(specialists, eq(appointments.specialistId, specialists.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .leftJoin(cabinets, eq(appointments.cabinetId, cabinets.id))
      .orderBy(appointments.appointmentDate);
    return jsonOk(all);
  } catch {
    return jsonError("Failed to fetch appointments", 500);
  }
}

export async function POST(req: NextRequest) {
  const { error: authErr } = await requireAuth();
  if (authErr) return authErr;
  try {
    const body = await req.json();

    const validationError = await validateAppointment(body);

    if (validationError) {
      return jsonError(validationError, 400);
    }

    const [created] = await db.insert(appointments).values(body).returning();

    return jsonOk(created, 201);
  } catch {
    return jsonError("Failed to create appointment", 500);
  }
}

export async function PUT(req: NextRequest) {
  const { error: authErr } = await requireRole("admin");
  if (authErr) return authErr;
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (data.specialistId && data.appointmentDate && data.startTime && data.endTime) {
      const validationError = await validateAppointment({
        ...data,
        excludeId: id,
      });

      if (validationError) {
        return jsonError(validationError, 400);
      }
    }

    const [updated] = await db
      .update(appointments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();

    return jsonOk(updated);
  } catch {
    return jsonError("Failed to update appointment", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { error: authErr } = await requireRole("admin");
  if (authErr) return authErr;
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");

    if (!id) return jsonError("ID is required");

    await db.delete(appointments).where(eq(appointments.id, id));
    
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete appointment", 500);
  }
}
