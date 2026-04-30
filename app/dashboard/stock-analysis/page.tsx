"use client";

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// 1. STRICT INTERFACE (No 'any')
interface StockChartData {
  name: string;
  arrival: number;
  dispatch: number;
}

export default function StockAnalysisPage() {
  const [chartData, setChartData] = useState<StockChartData[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. FETCH REAL DATA FROM API
  useEffect(() => {
    async function getLiveData() {
      try {
        const response = await fetch("/api/dashboard/stock-analysis");
        const data = await response.json();
        setChartData(data);
      } catch (err) {
        console.error("Error fetching live data:", err);
      } finally {
        setLoading(false);
      }
    }
    getLiveData();
  }, []);

  // if (loading) return <div className="p-10 text-center font-bold animate-bounce text-blue-600">Syncing with Cold Storage Database...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-[#2c3e50] text-white p-3 rounded-t-lg font-bold text-sm">
        STOCK ANALYSIS - REAL TIME DATA (FY 2025-26)
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arrival Chart using REAL DATA */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-pink-600 font-bold text-sm mb-6 border-b pb-2 uppercase tracking-tighter italic">Live Inward Arrival (Qty)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f8f9fa'}} />
                <Bar dataKey="arrival" fill="#d81b60" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dispatch Chart using REAL DATA */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-blue-600 font-bold text-sm mb-6 border-b pb-2 uppercase tracking-tighter italic">Live Outward Dispatch (Qty)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f8f9fa'}} />
                <Bar dataKey="dispatch" fill="#1e88e5" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Logic for item leaderboards should also fetch from a real API like /api/reports/item-summary */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded text-blue-700 text-xs">
        <b>System Note:</b> Charts are automatically synced with current Material Receipts and Gate Passes.
      </div>
    </div>
  );
}
