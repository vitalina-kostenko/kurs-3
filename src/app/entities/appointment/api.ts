import ky from "ky";

const api = ky.create({ prefix: "/api" });

export interface Appointment {
  id: string;
  clientId: string;
  specialistId: string;
  serviceId: string;
  cabinetId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
  createdAt: string;
  clientFirstName?: string;
  clientLastName?: string;
  specialistFirstName?: string;
  specialistLastName?: string;
  serviceName?: string;
  cabinetName?: string;
  servicePrice?: string;
}

export interface SpecialistAvailability {
  specialistId: string;
  date: string;
  workStart: string;
  workEnd: string;
  breakStart: string;
  breakEnd: string;
  appointmentCount: number;
  totalBookedMinutes: number;
  totalWorkMinutes: number;
  freeMinutes: number;
  busySlots: { start: string; end: string; service: string }[];
  freeSlots: { start: string; end: string }[];
  isFull: boolean;
}

export interface AppointmentMaterial {
  id: string;
  materialId: string;
  quantity: string;
  materialName: string | null;
  materialUnit: string | null;
  pricePerUnit: string | null;
}

export const appointmentApi = {
  getAll: () => api.get("appointments").json<Appointment[]>(),
  create: (data: Record<string, unknown>) => api.post("appointments", { json: data }).json<Appointment>(),
  update: (data: Record<string, unknown>) => api.put("appointments", { json: data }).json<Appointment>(),
  delete: (id: string) => api.delete("appointments", { searchParams: { id } }).json(),
  getAvailability: (specialistId: string, date: string, excludeId?: string) =>
    api
      .get("appointments/availability", {
        searchParams: { specialistId, date, ...(excludeId ? { excludeId } : {}) },
      })
      .json<SpecialistAvailability>(),
  getMaterials: (appointmentId: string) =>
    api.get("appointments/materials", { searchParams: { appointmentId } }).json<AppointmentMaterial[]>(),
  saveMaterials: (appointmentId: string, materialIds: { materialId: string; quantity: string }[]) =>
    api.post("appointments/materials", { json: { appointmentId, materialIds } }).json<AppointmentMaterial[]>(),
};
