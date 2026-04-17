import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils"; // Standard shadcn utility

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  colorClass: string; // Tailwind bg color
}

export function StatCard({ title, value, subValue, icon: Icon, colorClass }: StatCardProps) {
  return (
    <div className={cn("p-5 rounded-lg shadow-md text-white flex justify-between items-center transition-transform hover:scale-105", colorClass)}>
      <div>
        <p className="text-sm font-medium opacity-80 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold mt-1">{value}</h3>
        {subValue && <p className="text-[10px] mt-2 bg-black/20 inline-block px-2 py-1 rounded">{subValue}</p>}
      </div>
      <div className="bg-white/20 p-3 rounded-full">
        <Icon size={32} />
      </div>
    </div>
  );
}