import { z } from "zod";

// Unit Master Validation
export const UnitSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["Company", "Grower", "Peti"]),
  emptyWeight: z.number().default(0),
  rateToContractorIn: z.number().default(0),
  rateToContractorOut: z.number().default(0),
  opBalance: z.number().int().default(0),
});

// Party Master Validation (16 Checkboxes + 10 Mobiles)
export const PartySchema = z.object({
  partyCode: z.string().min(1),
  tradeName: z.string().min(1),
  type: z.string().default("Sundry Debtors"),
  proprietor: z.string().optional(),
  mobiles: z.array(z.string()).max(10), // Up to 10 WhatsApp numbers
  gstType: z.string().optional(),
  gstNo: z.string().optional(),
  panNo: z.string().optional(),
  maxAllowedCredit: z.number().default(0),
  graceDays: z.number().int().default(0),
  // Billing Variants (Checkboxes from Image 51)
  billNilLot: z.boolean().default(false),
  billMonthly: z.boolean().default(false),
  billBalance: z.boolean().default(false),
  billLabour: z.boolean().default(false),
  // ... baaki flags bhi isi tarah
});

export type UnitInput = z.infer<typeof UnitSchema>;
export type PartyInput = z.infer<typeof PartySchema>;
