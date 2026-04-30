import { z } from "zod/v4";

export const specialistSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  isActive: z.boolean(),
  workStartTime: z.string(),
  workEndTime: z.string(),
  breakStartTime: z.string(),
  breakEndTime: z.string(),
});

export type SpecialistFormData = z.infer<typeof specialistSchema>;
