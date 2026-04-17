import { z } from "zod";

export const ChamberSchema = z.object({
  code: z.string().min(1, "Chamber Code is required"),
  name: z.string().min(1, "Chamber Name is required"),
  remarks: z.string().optional(),
  type: z.enum(["CS", "CA"]), // Cold Storage or Modified Atmosphere 
  
  capacityMode: z.enum(["Exact", "Theoretical", "LumpSum"]),
  
  // Dimensions mandatory if mode is Theoretical
  length: z.number().optional(),
  breadth: z.number().optional(),
  height: z.number().optional(),
  
  totalCapacity: z.number().int().min(0),
  totalPallets: z.number().int().default(0),
});

export type ChamberInput = z.infer<typeof ChamberSchema>;