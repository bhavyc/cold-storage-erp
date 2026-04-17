"use client";

import React, { useState } from "react";
import { Search, Printer, FileSpreadsheet, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function InDepthLedgerPage() {
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [analysisData, setAnalysisData] = useState<any[]>([]);

  // Filters State
  const [filters, setFilters] = useState({
    fromDate: "2025-04-01",
    toDate: "2026-03-31",
    analysisType: "Month Wise",
    module: "All",
    diffType: "diff != 0"
  });

  // 1. REFRESH BUTTONS LOGIC (Connecting to /api/audit/sync-ledgers)
  const handleRefresh = async (type: string) => {
    setLoading(true);
    const loadId = toast.loading(`Requesting ${type} Ledger Sync...`);
    try {
      // ✅ Real API Call
      const res = await fetch(`/api/audit/sync-ledgers?type=${type}`, { 
        method: 'POST' 
      });
      const result = await res.json();

      if (res.ok) {
        toast.success(result.message, { id: loadId });
        handleSearch(); // Sync ke baad table refresh karein
      } else {
        toast.error(result.error || "Sync failed", { id: loadId });
      }
    } catch (err) {
      toast.error("Network error: Backend unreachable", { id: loadId });
    } finally {
      setLoading(false);
    }
  };

  // 2. SEARCH ANALYSIS LOGIC (Connecting to /api/audit/difference-analysis)
  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/audit/difference-analysis?${query}`);
      const json = await res.json();
      
      if (res.ok) {
        setAnalysisData(json);
        if (json.length === 0) toast.success("Ledgers are perfectly in sync!");
      } else {
        toast.error("Audit fetch failed");
      }
    } catch (err) {
      toast.error("Connection Error!");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4 text-[10px] animate-in slide-in-from-top-4">
      {/* 4 BADE RED BUTTONS (Exact Replication of Image 72 & 79) */}
      <div className="bg-white p-6 border rounded shadow-lg">
        <p className="text-xs font-black text-red-600 mb-4 uppercase flex items-center gap-2 tracking-widest">
          <AlertCircle size={16}/> Ledger Synchronization & Difference Analysis
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            disabled={loading}
            onClick={() => handleRefresh("Rent")} 
            className="bg-red-600 hover:bg-red-700 text-white py-3 rounded font-black uppercase shadow-xl transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Refresh Rent Ledger"}
          </button>
          <button 
            disabled={loading}
            onClick={() => handleRefresh("Purchase")} 
            className="bg-red-600 hover:bg-red-700 text-white py-3 rounded font-black uppercase shadow-xl transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Refresh Purchase Ledger"}
          </button>
          <button 
            disabled={loading}
            onClick={() => handleRefresh("Sale")} 
            className="bg-red-600 hover:bg-red-700 text-white py-3 rounded font-black uppercase shadow-xl transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Refresh Sale Ledger"}
          </button>
          <button 
            disabled={loading}
            onClick={() => handleRefresh("Voucher")} 
            className="bg-red-600 hover:bg-red-700 text-white py-3 rounded font-black uppercase shadow-xl transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Refresh Voucher Ledger"}
          </button>
        </div>
      </div>

      {/* FILTER BOX */}
      <div className="bg-[#b4b6e4]/20 p-4 border rounded shadow-sm flex flex-wrap items-end gap-6 font-bold text-slate-600">
        <div><label>From Date</label><input type="date" className="w-full border p-1.5 rounded bg-white" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} /></div>
        <div><label>To Date</label><input type="date" className="w-full border p-1.5 rounded bg-white" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} /></div>
        <div><label>Module</label>
          <select className="w-full border p-1.5 rounded bg-white" value={filters.module} onChange={e => setFilters({...filters, module: e.target.value})}>
            <option>All</option><option>Stock</option><option>Accounts</option>
          </select>
        </div>
        <div><label>Diff</label>
          <select className="w-full border p-1.5 rounded bg-white font-black text-red-600" value={filters.diffType} onChange={e => setFilters({...filters, diffType: e.target.value})}>
            <option value="diff != 0">diff != 0</option><option value="diff = 0">diff = 0</option>
          </select>
        </div>
        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="bg-red-600 text-white px-10 py-2 rounded font-black uppercase shadow hover:bg-red-700 transition-all flex items-center gap-2"
        >
          {isSearching ? <Loader2 className="animate-spin" size={14}/> : <Search size={14}/>}
          Search Analysis
        </button>
      </div>

      {/* DATA TABLE (Real results from /api/audit/difference-analysis) */}
      <div className="bg-white border rounded shadow-sm overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f1f5f9] text-slate-800 uppercase font-black text-[9px] border-b">
            <tr>
              <th className="p-3 border-r">Account Head / Party Name</th>
              <th className="p-3 border-r text-center">Stock Module Bal (Bags)</th>
              <th className="p-3 border-r text-center">Accounting Bal (Bags)</th>
              <th className="p-3 border-r text-center text-red-600">Difference</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {analysisData.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center text-gray-400 italic">Everything is synchronized. No differences found between Stock and Accounts.</td></tr>
            ) : (
              analysisData.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-red-50/30 transition-colors font-bold group">
                  <td className="p-3 border-r uppercase text-slate-700">{row.partyName} ({row.partyCode})</td>
                  <td className="p-3 border-r text-center text-blue-600 font-mono">{row.totalInQty}</td>
                  <td className="p-3 border-r text-center text-indigo-600 font-mono">{row.totalBilledQty}</td>
                  <td className={`p-3 border-r text-center font-black ${row.difference !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {row.difference}
                  </td>
                  <td className="p-3 text-center">
                    <button className="text-blue-600 underline text-[9px] font-black uppercase tracking-tighter">View Vouchers</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}