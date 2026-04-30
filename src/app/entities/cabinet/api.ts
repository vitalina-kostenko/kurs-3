import ky from "ky";

const api = ky.create({ prefix: "/api" });

export interface Cabinet {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export const cabinetApi = {
  getAll: () => api.get("cabinets").json<Cabinet[]>(),
  create: (data: Record<string, unknown>) => api.post("cabinets", { json: data }).json<Cabinet>(),
  update: (data: Record<string, unknown>) => api.put("cabinets", { json: data }).json<Cabinet>(),
  delete: (id: string) => api.delete("cabinets", { searchParams: { id } }).json(),
};
