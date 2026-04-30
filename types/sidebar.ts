import { LucideIcon } from "lucide-react";

export interface SubMenuItem {
  title: string;
  href: string;
}

export interface SidebarGroup {
  title: string;
  icon: LucideIcon;
  href?: string; // Optional if it's just a group header
  items?: SubMenuItem[];
}
