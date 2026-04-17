"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Printer, FileSpreadsheet, MapPin, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function PalletReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [chambers, setChambers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 1. Filter States
  const [filters, setFilters] = useState({
    chamberId: "All",
    palletNo: ""
  });

  // 2. Load Chambers for dropdown
  useEffect(() => {
    fetch("/api/masters/chambers").then(res => res.json()).then(setChambers);
  }, []);

  // 3. Search Logic
  const handleSearch = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/warehouse/pallet-report?${query}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.length === 0) toast.error("Is location par koi maal nahi mila!");
      }
    } catch (err) {
      toast.error("Fetch failed!");
    } finally {
      setLoading(false);
    }
  };

  // 4. Live Total Calculation for the Blue Pill
  const totalQtyOnPallets = useMemo(() => {
    return data.reduce((sum, item) => sum + (item.assignedQty || 0), 0);
  }, [data]);

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      {/* Visual Header */}
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg shadow font-bold text-center uppercase tracking-widest flex items-center justify-center gap-2">
        <MapPin size={16} /> Pallet Wise Material Location | Current Inventory
      </div>

      {/* FILTER BAR (Image 33 Replication) */}
      <div className="bg-[#b4b6e4]/20 p-6 border rounded shadow-sm flex flex-wrap items-end gap-8">
        <div className="space-y-1">
          <label className="font-bold text-slate-600 uppercase block">Chamber Name</label>
          <select 
            className="border p-2 rounded w-64 outline-none bg-white font-bold text-indigo-800"
            value={filters.chamberId}
            onChange={(e) => setFilters({...filters, chamberId: e.target.value})}
          >
            <option value="All">All Chambers</option>
            {chambers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-slate-600 uppercase block">Pallet No</label>
          <input 
            className="border p-2 rounded w-64 outline-none font-bold placeholder:font-normal" 
            placeholder="Enter Pallet No..." 
            value={filters.palletNo}
            onChange={(e) => setFilters({...filters, palletNo: e.target.value})}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <button 
          onClick={handleSearch}
          disabled={loading}
          className="bg-red-600 text-white px-10 py-2 rounded font-bold uppercase hover:bg-red-700 shadow-md flex items-center gap-2 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>}
          SEARCH
        </button>
      </div>

      {/* DYNAMIC TOTAL LABEL (The Blue Pill) */}
      <div className="text-center py-4">
        <p className="bg-indigo-50 text-indigo-700 inline-block px-10 py-2 rounded-full border border-indigo-200 font-black text-sm shadow-sm">
          TOTAL BALANCE QTY ON PALLETS = <span className="text-red-600 ml-1">{totalQtyOnPallets}</span>
        </p>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border rounded shadow-sm overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[10px]">
            <tr>
              <th className="p-3 border-r border-slate-300 w-16 text-center">SR. NO</th>
              <th className="p-3 border-r border-slate-300">CHAMBER</th>
              <th className="p-3 border-r border-slate-300">PALLET NO</th>
              <th className="p-3 border-r border-slate-300">LOT NO</th>
              <th className="p-3 border-r border-slate-300">ITEM NAME</th>
              <th className="p-3 border-r border-slate-300 text-center">ALLOCATED QTY</th>
              <th className="p-3 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-20 text-center text-gray-400 italic font-medium">
                  {loading ? "Fetching data..." : "Enter Pallet No or select Chamber to view material location."}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all font-medium even:bg-slate-50/30">
                  <td className="p-3 border-r border-slate-200 text-center text-gray-400">{idx + 1}</td>
                  <td className="p-3 border-r border-slate-200 font-bold">{row.chamber.name}</td>
                  <td className="p-3 border-r border-slate-200 font-black text-indigo-700">{row.palletNo}</td>
                  <td className="p-3 border-r border-slate-200 font-bold text-blue-600">{row.lot?.lotNo || "N/A"}</td>
                  <td className="p-3 border-r border-slate-200 uppercase">{row.lot?.item?.name || "---"}</td>
                  <td className="p-3 border-r border-slate-200 text-center font-black text-slate-700 bg-indigo-50/30">
                    {row.assignedQty} <span className="text-[8px] font-normal text-gray-400 uppercase">Bags</span>
                  </td>
                  <td className="p-3 text-center">
                     <button className="text-blue-600 hover:underline font-bold">View Detail</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Branding */}
      <div className="flex justify-between items-center px-2 opacity-50">
          <p>Visual Softech ERP</p>
          <div className="flex gap-4">
              <FileSpreadsheet className="cursor-pointer hover:text-green-600" size={16} />
              <Printer className="cursor-pointer hover:text-red-600" size={16} />
          </div>
      </div>
    </div>
  );
}