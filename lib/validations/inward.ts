import { z } from "zod";

const MRLotItemSchema = z.object({
  itemId: z.string().uuid(),
  unitId: z.string().uuid(), // Packaging (Bag, Peti etc)
  qty: z.number().int().positive(),
  marka: z.string().optional(),
  pMarka: z.string().optional(),
  chamberId: z.string().uuid(),
  floor: z.string().optional(),
  pole: z.string().optional(),
  palletNo: z.string().optional(),
  variety: z.string().optional(),
  perUnitWgt: z.number().min(0), // Standard weight for this lot
});

export const MRHeaderSchema = z.object({
  partyId: z.string().uuid(),
  mrDate: z.string().transform((str) => new Date(str)),
  truckNo: z.string().optional(),
  deliveryPerson: z.string().optional(),
  billingType: z.string().default("General"),
  remarks: z.string().optional(),
  items: z.array(MRLotItemSchema).min(1, "At least one item is required"),
});

export type MRInput = z.infer<typeof MRHeaderSchema>;