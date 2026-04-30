import { z } from "zod/v4";

export const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required"),
  preferredCabinetId: z.string().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
