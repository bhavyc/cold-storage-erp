"use client";

import React, { useState, useMemo } from "react";
import { Search, Printer, FileSpreadsheet, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { exportToJSON } from "@/lib/utils"; // Download utility function

export default function AccruedSummaryPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParty, setSearchParty] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/accrued-summary?partyName=${searchParty}`);
      
      if (!res.ok) throw new Error("Failed to fetch report");
      
      const json = await res.json();
      setData(json);

      if (json.length === 0) {
        toast.error("No active stock/revenue found for this search criteria.");
      } else {
        toast.success("Revenue report calculated successfully!");
      }
    } catch (err) {
      toast.error("Network Error! Could not load summary.");
    } finally {
      setLoading(false);
    }
  };

  // Live Totals for Header and Footer
  const grandTotals = useMemo(() => {
    return data.reduce((acc, row) => ({
      lotCount: acc.lotCount + (Number(row.lotCount) || 0),
      balQty: acc.balQty + (Number(row.totalBalQty) || 0),
      revenue: acc.revenue + (Number(row.totalRevenue) || 0)
    }), { lotCount: 0, balQty: 0, revenue: 0 });
  }, [data]);

  // Export to Excel / CSV / JSON logic
  const handleExport = () => {
    if (data.length === 0) return toast.error("No data to export!");
    exportToJSON(data, `Accrued_Revenue_Summary_${new Date().toISOString().split('T')[0]}`);
    toast.success("Export Downloaded!");
  };

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* Visual Header (Purple Bar) */}
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md no-print">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-widest text-xs">
          <TrendingUp size={16}/> Accrued Rent Report (Summary)
        </h2>
        <div className="flex gap-2">
           <button 
             onClick={handleExport} 
             className="bg-green-600 p-1.5 rounded hover:bg-green-700 shadow-sm transition-all active:scale-95"
             title="Export Data"
           >
             <FileSpreadsheet size={18}/>
           </button>
           <button 
             onClick={() => window.print()} 
             className="bg-red-600 p-1.5 rounded hover:bg-red-700 shadow-sm transition-all active:scale-95"
             title="Print Report"
           >
             <Printer size={18}/>
           </button>
        </div>
      </div>

      {/* SEARCH & REVENUE HEADER (Image 110) */}
      <div className="bg-white p-6 border rounded shadow-sm relative no-print">
        <div className="flex justify-between items-end">
           {/* Left Search */}
           <div className="flex gap-2">
              <input 
                placeholder="Search Party Name..." 
                className="border-2 border-slate-100 p-2 rounded-md w-72 outline-none focus:border-blue-500 font-bold text-indigo-700"
                value={searchParty}
                onChange={e => setSearchParty(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-2 rounded-md font-bold uppercase shadow-md hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>}
                SEARCH
              </button>
           </div>

           {/* Right Big Revenue Display */}
           <div className="text-right space-y-1">
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Grand Total Unbilled Revenue</p>
              <div className="flex items-center justify-end gap-2 text-[#4a4ea3]">
                 <span className="text-3xl font-black italic">₹</span>
                 <span className="text-5xl font-black tracking-tighter">
                   {grandTotals.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </span>
              </div>
           </div>
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block text-center mb-6 space-y-2">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Cold Storage</h1>
        <p className="font-bold text-gray-500 uppercase tracking-widest text-xs">Accrued Revenue Statement (Summary)</p>
        <p className="text-xs font-bold">Report Generated On: {new Date().toLocaleString()}</p>
      </div>

      {/* SUMMARY TABLE (Image 110 Columns) */}
      <div className="bg-white border rounded shadow-lg overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f1f5f9] text-slate-700 uppercase font-black text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-4 border-r border-slate-200 w-1/2">Party Name</th>
              <th className="p-4 border-r border-slate-200 text-center w-32">Lot Qty (Count)</th>
              <th className="p-4 border-r border-slate-200 text-center w-40">Total Balance Qty</th>
              <th className="p-4 text-right pr-10 italic text-indigo-700 bg-indigo-50/30">Estimated Revenue (₹)</th>
            </tr>
          </thead>
          <tbody className="font-bold text-sm">
            {loading ? (
              <tr><td colSpan={4} className="p-20 text-center text-indigo-600 animate-pulse font-black uppercase tracking-widest">Calculating Live Revenue...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={4} className="p-20 text-center text-gray-400 italic text-xs">Click Search to calculate total accrued income across the warehouse.</td></tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-indigo-50/40 transition-colors even:bg-slate-50/30">
                  <td className="p-4 border-r border-slate-100 font-black text-slate-700 uppercase tracking-tighter truncate">{row.partyName}</td>
                  <td className="p-4 border-r border-slate-100 text-center font-mono text-gray-500">{row.lotCount}</td>
                  <td className="p-4 border-r border-slate-100 text-center font-black text-blue-600">{row.totalBalQty}</td>
                  <td className="p-4 text-right pr-10 font-black text-green-700 bg-green-50/10">
                    {Number(row.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* RED GRAND TOTAL FOOTER (Exact Replication) */}
          {data.length > 0 && (
            <tfoot className="bg-red-600 text-white font-black text-lg">
               <tr>
                 <td className="p-4 border-r border-red-500 text-center uppercase italic tracking-tighter">Grand Total Aggregate</td>
                 <td className="p-4 border-r border-red-500 text-center text-base">{grandTotals.lotCount}</td>
                 <td className="p-4 border-r border-red-500 text-center text-base">{grandTotals.balQty} Bags</td>
                 <td className="p-4 text-right pr-10 italic text-yellow-300">
                   ₹ {grandTotals.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </td>
               </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer Branding */}
      <div className="p-3 text-center opacity-40 text-[8px] font-bold uppercase tracking-[10px] bg-slate-50 border rounded mt-4 no-print">
        Cold Storage Intelligence Report - Live Estimate
      </div>
    </div>
  );
}
