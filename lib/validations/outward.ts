import { z } from "zod";

// Party Demand Item (Booking)
const DemandItemSchema = z.object({
  lotId: z.string().uuid(),
  qty: z.number().int().positive(),
});

export const DemandSchema = z.object({
  partyId: z.string().uuid(),
  demandDate: z.string().transform((str) => new Date(str)),
  items: z.array(DemandItemSchema).min(1),
});

// Gate Pass (Final Release)
const GPItemSchema = z.object({
  lotId: z.string().uuid(),
  qty: z.number().int().positive(),
  demandId: z.string().uuid().optional(), // If importing from demand
});

export const GPSchema = z.object({
  partyId: z.string().uuid(),
  gpDate: z.string().transform((str) => new Date(str)),
  truckNo: z.string().optional(),
  personName: z.string().optional(),
  transportRequired: z.boolean().default(false),
  items: z.array(GPItemSchema).min(1),
});

export type DemandInput = z.infer<typeof DemandSchema>;
export type GPInput = z.infer<typeof GPSchema>;
