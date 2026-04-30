"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarRoutes } from "@/config/sidebar-routes";
import { ChevronDown, ChevronRight, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils"; // Standard shadcn utility

export function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((i) => i !== title) : [...prev, title]
    );
  };

  return (
    <div className="w-64 bg-[#2c3e50] text-white h-screen flex flex-col shadow-xl overflow-y-auto scrollbar-hide">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-gray-700 bg-[#1a252f]">
        <Snowflake className="text-blue-400 animate-pulse" size={28} />
        <h1 className="font-bold text-lg tracking-tight">COLD STORE ERP</h1>
      </div>

      <nav className="flex-1 mt-4 px-3 space-y-1">
        {sidebarRoutes.map((route) => {
          const isOpen = openMenus.includes(route.title);
          const Icon = route.icon;

          return (
            <div key={route.title} className="mb-1">
              {/* Parent Menu */}
              <button
                onClick={() => toggleMenu(route.title)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg transition-all text-sm font-medium",
                  isOpen ? "bg-[#34495e] text-blue-300" : "hover:bg-[#34495e] text-gray-300"
                )}
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon size={18} />}
                  <span>{route.title}</span>
                </div>
                {route.submenu && (
                  isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                )}
              </button>

              {/* Submenu Items */}
              {isOpen && route.submenu && (
                <div className="ml-9 mt-1 space-y-1 border-l border-gray-600 pl-2">
                  {route.submenu.map((sub) => (
                    <Link
                      key={sub.title}
                      href={sub.href!}
                      className={cn(
                        "block p-2 rounded-md text-xs transition-all",
                        pathname === sub.href 
                          ? "bg-blue-600 text-white shadow-md font-semibold" 
                          : "text-gray-400 hover:text-white hover:bg-gray-700"
                      )}
                    >
                      {sub.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Status Footer */}
      <div className="p-4 bg-[#1a252f] text-[10px] text-gray-500 border-t border-gray-700">
        Logged in as: <span className="text-blue-400 font-bold uppercase">Admin</span>
        <br />
        Financial Year: <span className="text-white">2025-26</span>
      </div>
    </div>
  );
}
