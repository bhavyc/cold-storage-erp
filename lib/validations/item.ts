import { z } from "zod";

// Ek Item ke multiple Packaging Units ho sakte hain
const ItemUnitConfigSchema = z.object({
  unitId: z.string().uuid("Invalid Unit ID"),
  rentRate: z.number().min(0),   // Default Rent
  labourRate: z.number().min(0), // Total Labour (₹20 logic)
  weight: z.number().min(0),      // Standard Weight (in Kg)
  lotValue: z.number().default(0),
  period: z.number().int().default(0),
});

export const ItemSchema = z.object({
  code: z.string().min(1, "Item Code is required"),
  name: z.string().min(1, "Item Name is required"),
  categoryId: z.string().uuid("Invalid Category ID"),
  hsnCode: z.string().optional(),
  gstRate: z.number().default(18.0),
  // Array of configurations (Bag, Peti, Katta etc.)
  unitConfigs: z.array(ItemUnitConfigSchema).min(1, "At least one unit configuration is required"),
});

export type ItemInput = z.infer<typeof ItemSchema>;
