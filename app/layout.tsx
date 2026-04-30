import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cold Storage ERP",
  description: "Advanced Cold Storage Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
              <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">Server Online</span>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  DJ
                </div>
              </div>
            </header>

            {/* Dynamic Content */}
            <main className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
              {children}
            </main>
          </div>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>

  );
}

