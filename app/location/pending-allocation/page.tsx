"use client";

import React, { useState, useEffect } from "react";
import { Search, Printer, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

export default function PendingAllocationReport() {
  const [data, setData] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter States (Image 34 Mapping)
  const [filters, setFilters] = useState({
    fromLot: "",
    toLot: "",
    partyId: "All"
  });

  // Load Parties for dropdown
  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/reports/pending-allocation?${query}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.length === 0) toast.success("Sab kuch allocated hai! No pending stock.");
      }
    } catch (err) {
      toast.error("Fetch failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-[10px] animate-in fade-in duration-500">
      
      {/* FILTER BAR (Exact Replication of Image 34) */}
      <div className="bg-white border-2 border-slate-100 rounded-xl p-5 shadow-sm flex flex-wrap gap-6 items-end">
        <div className="space-y-1">
          <label className="font-black text-slate-500 uppercase tracking-tighter">From Lot</label>
          <input 
            className="border-2 p-2 rounded-md w-32 outline-none focus:border-orange-400 font-bold" 
            placeholder="From Lot" 
            value={filters.fromLot}
            onChange={e => setFilters({...filters, fromLot: e.target.value})}
          />
        </div>

        <div className="space-y-1">
          <label className="font-black text-slate-500 uppercase tracking-tighter">To Lot</label>
          <input 
            className="border-2 p-2 rounded-md w-32 outline-none focus:border-orange-400 font-bold" 
            placeholder="To Lot" 
            value={filters.toLot}
            onChange={e => setFilters({...filters, toLot: e.target.value})}
          />
        </div>

        <div className="space-y-1">
          <label className="font-black text-slate-500 uppercase tracking-tighter">Party Filter</label>
          <select 
            className="border-2 p-2 rounded-md w-52 bg-white font-bold text-slate-700 outline-none focus:border-orange-400"
            value={filters.partyId}
            onChange={e => setFilters({...filters, partyId: e.target.value})}
          >
            <option value="All">All Parties</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-md font-black uppercase flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={14}/> : <Search size={14}/>}
            Search
          </button>
          <button className="bg-red-500 text-white p-2 rounded-md shadow hover:bg-red-600 transition-colors"><Printer size={16}/></button>
          <button className="bg-green-600 text-white p-2 rounded-md shadow hover:bg-green-700 transition-colors"><FileSpreadsheet size={16}/></button>
        </div>
      </div>

      {/* DATA TABLE (Image 34 Columns Mapping) */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="bg-indigo-50/50 p-2 text-center font-black text-indigo-800 border-b italic uppercase tracking-widest flex items-center justify-center gap-2">
          <AlertCircle size={14}/> Pending Allocation Report
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px]">
              <tr>
                <th className="p-3 border-r border-slate-300">S.NO</th>
                <th className="p-3 border-r border-slate-300">PARTY CODE</th>
                <th className="p-3 border-r border-slate-300">PARTY NAME</th>
                <th className="p-3 border-r border-slate-300">LOT NO</th>
                <th className="p-3 border-r border-slate-300">ITEM CODE</th>
                <th className="p-3 border-r border-slate-300">ITEM NAME</th>
                <th className="p-3 border-r border-slate-300">UNIT CODE</th>
                <th className="p-3 border-r border-slate-300">UNIT NAME</th>
                <th className="p-3 border-r border-slate-300 text-center">RECEIVED QTY</th>
                <th className="p-3 border-r border-slate-300 text-center text-blue-700">ALLOCATED QTY</th>
                <th className="p-3 text-center font-black text-red-600 bg-red-50 animate-pulse">PENDING QTY</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-20 text-center text-gray-400 italic font-medium">
                    {loading ? "Searching for pending stock..." : "Please apply filters and click Search"}
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-slate-50 transition-all font-bold">
                    <td className="p-3 border-r border-slate-200 text-center text-gray-400">{idx + 1}</td>
                    <td className="p-3 border-r border-slate-200 font-mono">{row.partyCode}</td>
                    <td className="p-3 border-r border-slate-200 uppercase truncate max-w-[150px]">{row.partyName}</td>
                    <td className="p-3 border-r border-slate-200 text-indigo-700">{row.lotNo}</td>
                    <td className="p-3 border-r border-slate-200 text-gray-500">{row.itemCode}</td>
                    <td className="p-3 border-r border-slate-200 uppercase">{row.itemName}</td>
                    <td className="p-3 border-r border-slate-200 text-gray-500">{row.unitCode}</td>
                    <td className="p-3 border-r border-slate-200">{row.unitName}</td>
                    <td className="p-3 border-r border-slate-200 text-center bg-slate-50">{row.receivedQty}</td>
                    <td className="p-3 border-r border-slate-200 text-center text-blue-600 bg-blue-50/30">{row.allocatedQty}</td>
                    <td className="p-3 text-center font-black text-red-600 bg-red-100/50">{row.pendingQty}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Hint */}
      <div className="text-[9px] text-gray-400 italic px-2">
        * Note: This report only shows Lots where Received Qty is greater than Allocated Qty.
      </div>
    </div>
  );
}