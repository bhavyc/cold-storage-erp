"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Search, Printer, FileSpreadsheet, Loader2, Info } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AccruedRentDetailPage() {
  const [data, setData] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. FILTER STATES (Image 108 Mapping)
  const [filters, setFilters] = useState({
    fromLot: "",
    toLot: "",
    partyId: "All",
    itemId: "All"
  });

  // 2. Load Masters
  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
    fetch("/api/masters/items").then(res => res.json()).then(setItems);
  }, []);

  // 3. SEARCH FUNCTION
  const handleSearch = async () => {
    setLoading(true);
    const query = new URLSearchParams(filters).toString();
    try {
      const res = await fetch(`/api/reports/accrued-rent?${query}`);
      const json = await res.json();
      setData(json);
      if (json.length === 0) toast.error("Is filter mein koi active maal nahi mila!");
    } catch (err) {
      toast.error("Fetch failed!");
    } finally {
      setLoading(false);
    }
  };

  // 4. Grand Total Calculation
  const totalRevenue = useMemo(() => {
    return data.reduce((sum, row) => sum + row.rentAmount, 0);
  }, [data]);

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* Header Bar */}
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg shadow flex justify-between items-center font-bold uppercase tracking-widest">
        <span>Partywise Revenue Report (Detailed)</span>
        <div className="flex gap-2">
           <button className="bg-white/20 p-1.5 rounded hover:bg-white/30"><Printer size={16}/></button>
           <button className="bg-white/20 p-1.5 rounded hover:bg-white/30"><FileSpreadsheet size={16}/></button>
        </div>
      </div>

      {/* FILTER BAR (Exact Replication of Image 108) */}
      <div className="bg-white p-6 border rounded shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4 items-end font-bold">
        <div>
          <label className="text-[9px] text-gray-400 uppercase mb-1 block">From Lot No</label>
          <input className="w-full border-2 p-2 rounded outline-none focus:border-indigo-400" value={filters.fromLot} onChange={e => setFilters({...filters, fromLot: e.target.value})} />
        </div>
        <div>
          <label className="text-[9px] text-gray-400 uppercase mb-1 block">To Lot No</label>
          <input className="w-full border-2 p-2 rounded outline-none focus:border-indigo-400" value={filters.toLot} onChange={e => setFilters({...filters, toLot: e.target.value})} />
        </div>
        <div>
          <label className="text-[9px] text-gray-400 uppercase mb-1 block">Party Name</label>
          <select className="w-full border-2 p-2 rounded bg-white text-indigo-700" value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})}>
            <option value="All">-- Select Party --</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] text-gray-400 uppercase mb-1 block">Item Name</label>
          <select className="w-full border-2 p-2 rounded bg-white" value={filters.itemId} onChange={e => setFilters({...filters, itemId: e.target.value})}>
            <option value="All">All Items</option>
            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <button 
          onClick={handleSearch}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white font-black py-2.5 rounded shadow-lg uppercase tracking-widest transition-all active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin inline mr-2" size={14}/> : "SEARCH DETAILS"}
        </button>
      </div>

      {/* DATA TABLE (Image 108 Columns) */}
      <div className="bg-white border rounded shadow-md overflow-hidden min-h-[500px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px]">
            <tr>
              <th className="p-3 border-r border-slate-300">MR-Date</th>
              <th className="p-3 border-r border-slate-300">Lot-No</th>
              <th className="p-3 border-r border-slate-300">Item</th>
              <th className="p-3 border-r border-slate-300">Unit</th>
              <th className="p-3 border-r border-slate-300 text-center">Bal Qty</th>
              <th className="p-3 border-r border-slate-300 text-center">Rate</th>
              <th className="p-3 border-r border-slate-300 text-center bg-indigo-50">Period (Days)</th>
              <th className="p-3 text-right pr-6">Rent Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={8} className="p-20 text-center text-gray-400 italic">Select filters and click Search Details to view live revenue.</td></tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-indigo-50/50 transition-colors font-bold group">
                  <td className="p-3 border-r border-slate-200 text-gray-500">{new Date(row.mrDate).toLocaleDateString('en-GB')}</td>
                  <td className="p-3 border-r border-slate-200 font-black text-indigo-700">{row.lotNo}</td>
                  <td className="p-3 border-r border-slate-200 uppercase text-slate-700">{row.itemName}</td>
                  <td className="p-3 border-r border-slate-200 uppercase text-gray-500">{row.unitName}</td>
                  <td className="p-3 border-r border-slate-200 text-center text-red-600">{row.balQty}</td>
                  <td className="p-3 border-r border-slate-200 text-center">{Number(row.rate).toFixed(2)}</td>
                  <td className="p-3 border-r border-slate-200 text-center bg-indigo-50/50 text-indigo-900 font-black text-xs">{row.period}</td>
                  <td className="p-3 text-right pr-6 font-black text-indigo-800 text-sm">
                    {row.rentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot className="bg-[#1e293b] text-white font-black text-sm uppercase italic">
              <tr>
                <td colSpan={7} className="p-3 text-right tracking-widest">Total Accrued Revenue (Unbilled)</td>
                <td className="p-3 text-right pr-6 text-yellow-400">
                  ₹ {totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="flex items-center gap-2 text-gray-400 italic text-[9px] px-2">
        <Info size={12}/> 
        <span>Note: This report calculates rent based on the current system date and assumes no early withdrawals.</span>
      </div>
    </div>
  );
}