import ky from "ky";

const api = ky.create({ prefix: "/api" });

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  preferredCabinetId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const clientApi = {
  getAll: () => api.get("clients").json<Client[]>(),

  create: (data: Record<string, unknown>) => api.post("clients", { json: data }).json<Client>(),

  update: (data: Record<string, unknown>) => api.put("clients", { json: data }).json<Client>(),
  
  delete: (id: string) => api.delete("clients", { searchParams: { id } }).json(),
};
