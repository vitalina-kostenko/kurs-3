import ky from "ky";

const api = ky.create({ prefix: "/api" });

export interface Specialist {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  specialization: string | null;
  isActive: boolean;
  workStartTime: string;
  workEndTime: string;
  breakStartTime: string;
  breakEndTime: string;
  createdAt: string;
  updatedAt: string;
}

export const specialistApi = {
  getAll: () => api.get("specialists").json<Specialist[]>(),

  create: (data: Record<string, unknown>) => api.post("specialists", { json: data }).json<Specialist>(),

  update: (data: Record<string, unknown>) => api.put("specialists", { json: data }).json<Specialist>(),
  
  delete: (id: string) => api.delete("specialists", { searchParams: { id } }).json(),
};
