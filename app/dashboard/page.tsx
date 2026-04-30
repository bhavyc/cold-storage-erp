"use client";

import React, { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ArrowDownCircle, ArrowUpCircle, Receipt, Box } from "lucide-react";
import { DashboardStats } from "@/types/dashboard";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Dashboard Fetch Error");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 font-medium animate-pulse">Loading System Data...</div>;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">Real-time Cold Storage Analytics</p>
        </div>
        <div className="text-right text-[11px] text-gray-400 font-mono">
          Last Updated: {stats?.lastUpdate ? new Date(stats.lastUpdate).toLocaleString() : "N/A"}
        </div>
      </div>

      {/* 4 Color Widgets - Exactly like Cold Storage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Arrival (MR)"
          value={stats?.totalMR || 0}
          icon={ArrowDownCircle}
          colorClass="bg-green-500"
          subValue="Total Receipts Generated Today"
        />
        <StatCard
          title="Today's Dispatch (GP)"
          value={stats?.totalGP || 0}
          icon={ArrowUpCircle}
          colorClass="bg-blue-500"
          subValue="Gate Passes Cleared Today"
        />
        <StatCard
          title="Billing Summary"
          value={stats?.totalBills || 0}
          icon={Receipt}
          colorClass="bg-yellow-500"
          subValue="Invoices Raised Today"
        />
        <StatCard
          title="Total Live Balance"
          value={stats?.totalStock?.toLocaleString() || 0}
          icon={Box}
          colorClass="bg-orange-500"
          subValue="Active Stock Currently in Chambers"
        />
      </div>

      {/* Placeholder for Graphs and Activity Tables (Next Step) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-64 flex items-center justify-center text-gray-300 italic">
          Arrival vs Dispatch Graph (Coming Soon)
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-64 flex items-center justify-center text-gray-300 italic">
          Recent Transactions Feed (Coming Soon)
        </div>
      </div>
    </div>
  );
}
