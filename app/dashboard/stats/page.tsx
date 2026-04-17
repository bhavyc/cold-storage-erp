"use client";

import React, { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { 
  ArrowDownLeft, ArrowUpRight, Scale, ReceiptIndianRupee, 
  Search, PackageSearch 
} from "lucide-react";

// Strict Interface: No 'any'
interface DashboardData {
  mrCount: number;
  gpCount: number;
  totalBal: number;
  billCount: number;
  lastMrDate: string;
  lastGpDate: string;
}

export default function TodayStatsPage() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/summary");
        const data: DashboardData = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="p-10 text-center font-bold text-blue-900 animate-pulse">Loading Todays Stats...</div>;

  return (
    <div className="space-y-8">
      {/* 1. Page Header with Quick Search (As per Image 1) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-lg font-bold text-slate-700">Todays Stats Summary</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input type="text" placeholder="Enter Lot No..." className="pl-9 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none w-48" />
          </div>
          <div className="relative">
            <PackageSearch className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input type="text" placeholder="Lot Balance..." className="pl-9 pr-4 py-2 border rounded-md text-sm bg-gray-50 w-48" readOnly />
          </div>
        </div>
      </div>

      {/* 2. Top 4 Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's MR" 
          value={stats?.mrCount || 0} 
          subValue={`Last MR: ${stats?.lastMrDate || "N/A"}`}
          icon={ArrowDownLeft} 
          colorClass="bg-[#2ecc71]" // Emerald Green
        />
        <StatCard 
          title="Today's GP" 
          value={stats?.gpCount || 0} 
          subValue={`Last GP: ${stats?.lastGpDate || "N/A"}`}
          icon={ArrowUpRight} 
          colorClass="bg-[#3498db]" // Sky Blue
        />
        <StatCard 
          title="Total Bal Qty" 
          value={stats?.totalBal.toLocaleString() || 0} 
          subValue="Real-time Stock"
          icon={Scale} 
          colorClass="bg-[#f39c12]" // Orange
        />
        <StatCard 
          title="Today's Bills" 
          value={stats?.billCount || 0} 
          subValue="Pending Collection"
          icon={ReceiptIndianRupee} 
          colorClass="bg-[#e67e22]" // Deep Orange
        />
      </div>

      {/* 3. Lower Summary Tables Placeholder (Image 4 reference) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border min-h-[300px]">
          <h3 className="font-bold text-slate-700 border-b pb-3 mb-4 flex justify-between">
            Todays Arrival <span className="text-blue-600 text-sm">TOTAL QTY: 0</span>
          </h3>
          <div className="text-center text-gray-400 mt-10">No Arrivals Today</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border min-h-[300px]">
          <h3 className="font-bold text-slate-700 border-b pb-3 mb-4 flex justify-between">
            Todays Dispatch <span className="text-red-600 text-sm">TOTAL QTY: 0</span>
          </h3>
          <div className="text-center text-gray-400 mt-10">No Dispatch Today</div>
        </div>
      </div>
    </div>
  );
}