"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Toaster } from "react-hot-toast";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  // Routes where Sidebar/Header should be hidden
  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/register" || pathname === "/unauthorized";

  if (isAuthPage) {
    return (
      <>
        {children}
        <Toaster position="top-right" />
      </>
    );
  }

  // Show loading skeleton while checking session
  if (status === "loading") {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-gray-400 font-medium">Verifying Session...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Permanent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              placeholder="Quick Lot Search..." 
              className="bg-gray-100 border-none rounded-md px-4 py-1 text-sm w-64 focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
            <div className="flex items-center gap-2">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">Server Online</span>
            </div>
            
            <div className="flex items-center gap-3 border-l pl-6">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-gray-800">{session?.user?.name || "System User"}</span>
              </div>
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
                {session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : "US"}
              </div>
              <button 
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
          {children}
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
