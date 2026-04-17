"use client";

import React, { useEffect, useState } from "react";
import { Search, Printer, FileSpreadsheet, History, Plus, Loader2, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ShiftingRegisterPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Masters for dropdowns
  const [parties, setParties] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [chambers, setChambers] = useState<any[]>([]);

  // 1. FILTER STATES (Image 88 mapping)
  const [filters, setFilters] = useState({
    fromDate: "2025-04-01",
    toDate: new Date().toISOString().split('T')[0], // Default to today
    partyId: "All",
    itemId: "All",
    chamberId: "All"
  });

  // 2. Load Dropdown Masters
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [p, i, c] = await Promise.all([
          fetch("/api/masters/party").then(res => res.json()),
          fetch("/api/masters/items").then(res => res.json()),
          fetch("/api/masters/chambers").then(res => res.json())
        ]);
        setParties(p);
        setItems(i);
        setChambers(c);
      } catch (err) {
        toast.error("Masters load nahi ho paye!");
      }
    };
    loadMasters();
  }, []);

  // 3. SEARCH FUNCTION
  const handleSearch = async () => {
    setLoading(true);
    try {
      // Logic: Convert filter state to URL query string
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/reports/shifting?${query}`);
      const json = await res.json();
      
      if (res.ok) {
        setData(json);
        if (json.length === 0) {
          toast.error("Bhai, is criteria mein koi movement nahi mili!");
        } else {
          toast.success(`${json.length} Movement logs mil gaye.`);
        }
      } else {
        toast.error("Server se data lene mein galti hui.");
      }
    } catch (err) {
      toast.error("Fetch failed! Network check karein.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-[10px] animate-in fade-in duration-500">
      
      {/* Visual Header (Image Match) */}
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-widest text-xs">
          <History size={16}/> Material Shifting Report
        </h2>
        <button 
          onClick={() => router.push('/location/shifting-entry')}
          className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded font-bold uppercase text-[9px] shadow-lg flex items-center gap-1 transition-all active:scale-95"
        >
          <Plus size={12}/> Add New Shifting
        </button>
      </div>

      {/* FILTER BAR (Image 88 exact replication) */}
      <div className="bg-[#b4b6e4]/20 p-5 border rounded-b shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4 items-end font-bold text-slate-700">
        <div>
          <label className="text-[9px] text-indigo-900 block mb-1">From Date</label>
          <input type="date" className="w-full border p-1.5 rounded bg-white outline-none" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
        </div>

        <div>
          <label className="text-[9px] text-indigo-900 block mb-1">To Date</label>
          <input type="date" className="w-full border p-1.5 rounded bg-white outline-none" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
        </div>

        <div>
          <label className="text-[9px] text-indigo-900 block mb-1">Party Name</label>
          <select className="w-full border p-1.5 rounded bg-white font-medium" value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})}>
            <option value="All">All Parties</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[9px] text-indigo-900 block mb-1">Item Name</label>
          <select className="w-full border p-1.5 rounded bg-white font-medium" value={filters.itemId} onChange={e => setFilters({...filters, itemId: e.target.value})}>
            <option value="All">All Items</option>
            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[9px] text-indigo-900 block mb-1">Chamber</label>
            <select className="w-full border p-1.5 rounded bg-white font-medium" value={filters.chamberId} onChange={e => setFilters({...filters, chamberId: e.target.value})}>
              <option value="All">All Chambers</option>
              {chambers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button 
            disabled={loading}
            onClick={handleSearch}
            className="bg-red-600 text-white p-2 rounded shadow-md hover:bg-red-700 transition-all active:scale-90 flex items-center justify-center min-w-[40px]"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16}/>}
          </button>
        </div>
      </div>

      {/* DATA TABLE (Image 88 Columns) */}
      <div className="bg-white border rounded shadow-md overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 border-r border-slate-300 w-24">Date</th>
              <th className="p-3 border-r border-slate-300 w-24">Lot No</th>
              <th className="p-3 border-r border-slate-300">Party Name</th>
              <th className="p-3 border-r border-slate-300">Item Name</th>
              <th className="p-3 border-r border-slate-300 text-red-600 bg-red-50/20 font-black">FROM LOCATION</th>
              <th className="p-3 border-r border-slate-300 text-green-700 bg-green-50/20 font-black">TO LOCATION</th>
              <th className="p-3 border-r border-slate-300 text-center font-bold">QTY SHIFTED</th>
              <th className="p-3 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-20 text-center text-indigo-700 font-bold animate-pulse uppercase tracking-widest">Scanning internal movements...</td></tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-20 text-center text-gray-400 italic font-medium">
                  No records found. Select filters and search to view shifting history.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b hover:bg-indigo-50/30 transition-all font-medium even:bg-slate-50/30">
                  <td className="p-3 border-r border-slate-200">{new Date(row.date).toLocaleDateString('en-GB')}</td>
                  <td className="p-3 border-r border-slate-200 font-bold text-indigo-700">{row.lot?.lotNo || "N/A"}</td>
                  <td className="p-3 border-r border-slate-200 uppercase truncate max-w-[200px]">{row.lot?.party?.tradeName || "---"}</td>
                  <td className="p-3 border-r border-slate-200 uppercase">{row.lot?.item?.name || "---"}</td>
                  <td className="p-3 border-r border-slate-200 text-red-500 italic bg-red-50/10">{row.fromLocation}</td>
                  <td className="p-3 border-r border-slate-200 text-green-600 font-bold bg-green-50/10">{row.toLocation}</td>
                  <td className="p-3 border-r border-slate-200 text-center font-black text-slate-800 text-xs">
                    {row.qty} <span className="text-[7px] text-gray-400">Bags</span>
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

      {/* Footer Summary Info */}
      <div className="flex justify-between items-center px-4 opacity-40">
         <p className="font-bold uppercase tracking-widest italic text-[8px]">Visual Softech Internal Audit Report</p>
         <div className="flex gap-4">
            <FileSpreadsheet className="cursor-pointer hover:text-green-600" size={14}/>
            <Printer className="cursor-pointer hover:text-red-600" size={14}/>
         </div>
      </div>
    </div>
  );
}