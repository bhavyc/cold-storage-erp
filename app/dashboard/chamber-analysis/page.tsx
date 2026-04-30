"use client";

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// STRICT TYPES
interface ChamberAnalysis {
  id: string;
  code: string;
  name: string;
  type: string;
  capacity: number;
  holding: number;
  available: number;
  percent: number;
  floors: Record<string, number>;
}

export default function ChamberAnalysisPage() {
  const [data, setData] = useState<ChamberAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/chamber-analysis");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load chamber analysis");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // if (loading) return <div className="p-10 text-center font-bold text-indigo-600 animate-pulse text-lg">Calculating Warehouse Occupancy...</div>;

  return (
    <div className="space-y-6">
      {/* Header Bar (Image 8 Style) */}
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg font-bold text-sm flex justify-between">
        <span>CHAMBER ANALYSIS - LIVE STORAGE STATUS</span>
        <span className="bg-white/20 px-2 rounded text-[10px]">REAL-TIME SYNC</span>
      </div>

      {/* 1. Occupancy Bar Chart (Visual Summary) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-gray-700 font-bold text-sm mb-6 uppercase">Chamber Wise Storage (Qty)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip cursor={{fill: '#fcfcfc'}} />
              <Bar dataKey="holding" name="Occupied Qty">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.percent > 90 ? "#ef4444" : entry.percent > 70 ? "#f59e0b" : "#10b981"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Detailed Summary Table (Image 38) */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#f8f9fa] border-b">
              <th className="p-4 font-bold text-slate-600">CHAMBER CODE</th>
              <th className="p-4 font-bold text-slate-600">CHAMBER NAME</th>
              <th className="p-4 font-bold text-slate-600 text-center">TOTAL CAPACITY</th>
              <th className="p-4 font-bold text-slate-600 text-center">CURRENT HOLDING</th>
              <th className="p-4 font-bold text-slate-600 text-center">AVAILABLE SPACE</th>
              <th className="p-4 font-bold text-slate-600">OCCUPANCY %</th>
            </tr>
          </thead>
          <tbody>
            {data.map((ch) => (
              <tr key={ch.id} className="border-b hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-indigo-600">{ch.code}</td>
                <td className="p-4 font-medium">{ch.name} <span className="text-[10px] text-gray-400">({ch.type})</span></td>
                <td className="p-4 text-center font-mono">{ch.capacity.toLocaleString()}</td>
                <td className="p-4 text-center font-mono text-blue-600">{ch.holding.toLocaleString()}</td>
                <td className="p-4 text-center font-mono text-green-600">{ch.available.toLocaleString()}</td>
                <td className="p-4 w-48">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${ch.percent > 90 ? 'bg-red-500' : ch.percent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                        style={{ width: `${ch.percent}%` }}
                      ></div>
                    </div>
                    <span className="font-bold min-w-[30px]">{ch.percent}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Chamber Floor Matrix (Image 41 Logic) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {data.map((ch) => (
          <div key={ch.id} className="bg-white p-4 rounded-lg border shadow-sm">
            <h4 className="font-bold text-xs text-indigo-700 mb-3 flex justify-between uppercase">
              {ch.name} - Floor Wise <span className="text-gray-400"># {ch.code}</span>
            </h4>
            <div className="space-y-2">
              {Object.entries(ch.floors).length > 0 ? (
                Object.entries(ch.floors).map(([floor, qty]) => (
                  <div key={floor} className="flex justify-between items-center bg-slate-50 p-2 rounded text-[11px] border border-slate-100">
                    <span className="font-medium text-gray-600">Floor: {floor}</span>
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">{qty.toLocaleString()} Bags</span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-gray-400 italic text-center py-4">No stock allocated to specific floors</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
