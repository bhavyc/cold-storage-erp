import { z } from "zod";

const VoucherItemSchema = z.object({
  ledgerId: z.string().uuid(),
  debit: z.number().default(0),
  credit: z.number().default(0),
  narration: z.string().optional(),
});

export const VoucherSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  vocType: z.enum(["Receipt", "Payment", "Journal", "Contra"]),
  group: z.enum(["Cash", "Bank", "Journal"]),
  partyId: z.string().uuid().optional(), // Null if internal expense
  remarks: z.string().optional(),
  items: z.array(VoucherItemSchema).min(2, "Accounting requires at least two entries (Debit & Credit)"),
});

export type VoucherInput = z.infer<typeof VoucherSchema>;
