import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ─── Attendance ───────────────────────────────────────────────────────────────

export const CheckInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  photoBase64: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type CheckInInput = z.infer<typeof CheckInSchema>;

export const CheckOutSchema = CheckInSchema;
export type CheckOutInput = z.infer<typeof CheckOutSchema>;
