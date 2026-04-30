import { z } from "zod";

const InvoiceItemSchema = z.object({
  lotId: z.string().uuid(),
  gpNo: z.string().optional(),
  qty: z.number().int().positive(),
  period: z.number().int().min(0), // Calculated days
  rentRate: z.number().min(0),
  labourRate: z.number().min(0), // Customer Rate (₹20)
  rentAmt: z.number().min(0),
  labourAmt: z.number().min(0),
});

export const InvoiceSchema = z.object({
  partyId: z.string().uuid(),
  invoiceDate: z.string().transform((str) => new Date(str)),
  billingType: z.enum(["Nill Lot", "Balance", "Monthly", "CA", "Fixed"]),
  isProforma: z.boolean().default(false),
  
  // Totals
  totalQty: z.number().int(),
  totalRent: z.number(),
  totalLabour: z.number(),
  discount: z.number().default(0),
  taxableValue: z.number(),
  cgst: z.number().default(0),
  sgst: z.number().default(0),
  igst: z.number().default(0),
  roundOff: z.number().default(0),
  netAmount: z.number(),

  items: z.array(InvoiceItemSchema).min(1),
});

export type InvoiceInput = z.infer<typeof InvoiceSchema>;
