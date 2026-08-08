import { z } from "zod";

export const currencySchema = z.enum(["NGN", "USD"]);

/** Payload for POST /api/donations/init. Amount is in MAJOR units from the
 * form (e.g. naira, dollars) — converted + clamped to subunits server-side,
 * never trusted as-is. */
export const donationInitSchema = z.object({
  hallSlug: z.string().min(1).max(120),
  amountMajor: z.number().positive().finite(),
  currency: currencySchema,
  donorName: z.string().trim().max(120).optional().nullable(),
  donorEmail: z.string().trim().email().max(255),
  isAnonymous: z.boolean().default(false),
  turnstileToken: z.string().max(4000).optional().nullable(),
});

export type DonationInitInput = z.infer<typeof donationInitSchema>;

export const mockConfirmSchema = z.object({
  initToken: z.string().min(1),
  outcome: z.enum(["success", "failed"]).default("success"),
});

export const fundMovementSchema = z.object({
  hallId: z.string().uuid(),
  amountMajor: z.number().positive().finite(),
  currency: currencySchema,
  note: z.string().trim().min(3).max(500),
});

export type FundMovementInput = z.infer<typeof fundMovementSchema>;

export const authPasswordSignupSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  fullName: z.string().trim().max(120).optional(),
});

export const authMagicLinkSchema = z.object({
  email: z.string().trim().email(),
});
