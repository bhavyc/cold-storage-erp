import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";
/**
 * Utility to merge tailwind classes safely
 * Prevents class conflicts (e.g., px-2 px-4 -> px-4)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}


// Add to lib/utils.ts
export const exportToJSON = (data: any, fileName: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.json`;
  a.click();
};





export const formatDate = (dateInput: any, formatStr: string = "dd-MM-yyyy") => {
  if (!dateInput) return "N/A";
  
  // Agar date string hai toh usse convert karein
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  
  // Check karein ki date sahi hai ya nahi (Invalid Date error se bachne ke liye)
  if (!isValid(date)) return "Invalid Date";
  
  return format(date, formatStr);
};
