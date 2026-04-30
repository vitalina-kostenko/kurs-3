import { z } from "zod/v4";

export const materialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  quantity: z.string(),
  minQuantity: z.string(),
  pricePerUnit: z.string(),
});

export type MaterialFormData = z.infer<typeof materialSchema>;
