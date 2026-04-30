import { z } from "zod/v4";

export const cabinetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  isAvailable: z.boolean(),
});

export type CabinetFormData = z.infer<typeof cabinetSchema>;
