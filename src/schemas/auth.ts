import { z } from "zod";

// ASVS 5.0 6.2: at least 8 characters, long passphrases allowed, no
// composition rules. 72 bytes is the bcrypt limit of the auth provider.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .refine((value) => new TextEncoder().encode(value).length <= PASSWORD_MAX_LENGTH);

export const signUpSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  email,
  password: newPassword,
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1).max(1024),
});

export const emailOnlySchema = z.object({ email });

export const newPasswordSchema = z.object({ password: newPassword });
