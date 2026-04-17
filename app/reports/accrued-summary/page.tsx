"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Search, Printer, FileSpreadsheet, TrendingUp, Loader2, IndianRupee } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AccruedSummaryPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParty, setSearchParty] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/accrued-summary?partyName=${searchParty}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      toast.error("Data load nahi hua!");
    } finally {
      setLoading(false);
    }
  };

  // Live Totals for Header and Footer
  const grandTotals = useMemo(() => {
    return data.reduce((acc, row) => ({
      lotCount: acc.lotCount + row.lotCount,
      balQty: acc.balQty + row.totalBalQty,
      revenue: acc.revenue + row.totalRevenue
    }), { lotCount: 0, balQty: 0, revenue: 0 });
  }, [data]);

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* Visual Header (Purple Bar) */}
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-widest text-xs">
          <TrendingUp size={16}/> Accrued Rent Report (Summary)
        </h2>
        <div className="flex gap-2">
           <button className="bg-green-600 p-1.5 rounded hover:bg-green-700 shadow-sm"><FileSpreadsheet size={18}/></button>
           <button className="bg-red-600 p-1.5 rounded hover:bg-red-700 shadow-sm"><Printer size={18}/></button>
        </div>
      </div>

      {/* SEARCH & REVENUE HEADER (Exact Replication of Image 110) */}
      <div className="bg-white p-6 border rounded shadow-sm relative">
        <div className="flex justify-between items-end">
           {/* Left Search */}
           <div className="flex gap-2">
              <input 
                placeholder="Search Party..." 
                className="border-2 border-slate-100 p-2 rounded-md w-72 outline-none focus:border-blue-500 font-bold"
                value={searchParty}
                onChange={e => setSearchParty(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={handleSearch}
                className="bg-blue-600 text-white px-8 py-2 rounded-md font-bold uppercase shadow-md hover:bg-blue-700 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" size={16}/> : "SEARCH"}
              </button>
           </div>

           {/* Right Big Revenue Display */}
           <div className="text-right space-y-1">
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Grand Total Unbilled Revenue</p>
              <div className="flex items-center justify-end gap-2 text-[#4a4ea3]">
                 <span className="text-3xl font-black italic">₹</span>
                 <span className="text-5xl font-black tracking-tighter">
                   {grandTotals.revenue.toLocaleString('en-IN')}
                 </span>
              </div>
           </div>
        </div>
      </div>

      {/* SUMMARY TABLE (Image 110 Columns) */}
      <div className="bg-white border rounded shadow-lg overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f1f5f9] text-slate-700 uppercase font-black text-[10px]">
            <tr>
              <th className="p-4 border-r border-slate-200">Party Name</th>
              <th className="p-4 border-r border-slate-200 text-center">Lot Qty (Count)</th>
              <th className="p-4 border-r border-slate-200 text-center">Total Balance Qty</th>
              <th className="p-4 text-right pr-10 italic">Estimated Revenue (₹)</th>
            </tr>
          </thead>
          <tbody className="font-bold text-sm">
            {data.length === 0 ? (
              <tr><td colSpan={4} className="p-20 text-center text-gray-400 italic">Click Search to calculate total accrued income.</td></tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-indigo-50/50 transition-colors">
                  <td className="p-4 border-r border-slate-100 font-black text-slate-700 uppercase tracking-tighter">{row.partyName}</td>
                  <td className="p-4 border-r border-slate-100 text-center font-mono text-gray-500">{row.lotCount}</td>
                  <td className="p-4 border-r border-slate-100 text-center font-black text-blue-600">{row.totalBalQty}</td>
                  <td className="p-4 text-right pr-10 font-black text-green-700 bg-green-50/20">
                    {row.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* RED GRAND TOTAL FOOTER (Exact Replication) */}
          {data.length > 0 && (
            <tfoot className="bg-red-600 text-white font-black text-lg">
               <tr>
                 <td className="p-4 border-r border-red-500 text-center uppercase italic tracking-tighter">Grand Total</td>
                 <td className="p-4 border-r border-red-500 text-center">---</td>
                 <td className="p-4 border-r border-red-500 text-center">---</td>
                 <td className="p-4 text-right pr-10 italic">
                   ₹ {grandTotals.revenue.toLocaleString('en-IN')}
                 </td>
               </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer Branding */}
      <div className="p-2 text-center opacity-30 text-[8px] font-bold uppercase tracking-[10px]">
        Visual Softech Intelligence Report
      </div>
    </div>
  );
}