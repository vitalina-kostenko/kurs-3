import ky from "ky";

const api = ky.create({ prefix: "/api" });

export interface Material {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  quantity: string;
  minQuantity: string;
  pricePerUnit: string;
  createdAt: string;
  updatedAt: string;
}

export const materialApi = {
  getAll: () => api.get("materials").json<Material[]>(),
  create: (data: Record<string, unknown>) => api.post("materials", { json: data }).json<Material>(),
  update: (data: Record<string, unknown>) => api.put("materials", { json: data }).json<Material>(),
  delete: (id: string) => api.delete("materials", { searchParams: { id } }).json(),
};
