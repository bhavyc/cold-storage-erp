import { z } from "zod";

export const CategorySchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  // coerce automatically strings ko numbers mein badal deta hai
  minLot: z.coerce.number().nullable().optional(),
  maxLot: z.coerce.number().nullable().optional(),
  minMrGpNo: z.coerce.number().nullable().optional(),
  maxMrGpNo: z.coerce.number().nullable().optional(),
});

export type CategoryInput = z.infer<typeof CategorySchema>;
