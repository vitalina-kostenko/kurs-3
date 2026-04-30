import ky from "ky";

const api = ky.create({ prefix: "/api" });

export interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const serviceApi = {
  getAll: () => api.get("services").json<Service[]>(),
  create: (data: Record<string, unknown>) => api.post("services", { json: data }).json<Service>(),
  update: (data: Record<string, unknown>) => api.put("services", { json: data }).json<Service>(),
  delete: (id: string) => api.delete("services", { searchParams: { id } }).json(),
};
