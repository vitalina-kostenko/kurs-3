import { z } from "zod/v4";

export const appointmentSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  specialistId: z.string().min(1, "Specialist is required"),
  serviceId: z.string().min(1, "Service is required"),
  cabinetId: z.string().min(1, "Cabinet is required"),
  appointmentDate: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
  notes: z.string().optional(),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
