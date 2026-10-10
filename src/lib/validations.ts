import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Username wajib diisi')
    .max(50, 'Username maksimal 50 karakter'),
  password: z
    .string()
    .min(1, 'Password wajib diisi'),
});

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username hanya boleh huruf, angka, titik, minus, atau garis bawah'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter'),
  name: z
    .string()
    .trim()
    .max(60, 'Nama maksimal 60 karakter')
    .optional(),
  email: z
    .string()
    .trim()
    .email('Format email tidak valid')
    .optional()
    .or(z.literal('')),
});

export const addDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(1, 'Nama domain atau URL wajib diisi'),
  port: z
    .coerce
    .number()
    .int('Port harus berupa bilangan bulat')
    .min(1, 'Port minimal 1')
    .max(65535, 'Port maksimal 65535')
    .default(443),
  alias: z
    .string()
    .trim()
    .max(100, 'Alias maksimal 100 karakter')
    .optional(),
});

export const batchDomainSchema = z.object({
  domains: z
    .array(z.string().trim().min(1, 'Domain tidak boleh kosong'))
    .min(1, 'Minimal masukkan 1 domain'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AddDomainInput = z.infer<typeof addDomainSchema>;
export type BatchDomainInput = z.infer<typeof batchDomainSchema>;
