import { z } from "zod/v4";

export const serviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  durationMinutes: z.number().min(1, "Duration must be at least 1 minute"),
  price: z.string().min(1, "Price is required"),
  isActive: z.boolean(),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
