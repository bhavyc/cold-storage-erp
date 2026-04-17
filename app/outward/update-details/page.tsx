"use client";

import React, { useState } from "react";
import { Search, Edit3, Save, Printer, ArrowLeft, RefreshCw, X } from "lucide-react";
import { toast } from "react-hot-toast";

// STRICT TYPES (No 'any')
interface GPUpdateRecord {
  id: string;
  gpNo: string;
  gpDate: string;
  transportRequired: boolean;
  grNo: string;
  vehicleNo: string;
  personName: string;
  remarks?: string;
}

export default function UpdateGPDetailsPage() {
  const [range, setRange] = useState({ from: "", to: "" });
  const [records, setRecords] = useState<GPUpdateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRows, setEditingRows] = useState<Record<string, GPUpdateRecord>>({});

  // 1. Search Logic (Image 84 Top Bar)
  const handleSearch = async () => {
    if (!range.from || !range.to) return toast.error("Enter GP Number Range");
    setLoading(true);
    try {
      const res = await fetch(`/api/outward/update-gp?fromGp=${range.from}&toGp=${range.to}`);
      const data = await res.json();
      setRecords(data);
      // Initialize editing state with current values
      const initialEditState: Record<string, GPUpdateRecord> = {};
      data.forEach((r: GPUpdateRecord) => { initialEditState[r.id] = r; });
      setEditingRows(initialEditState);
    } catch (err) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  // 2. Inline change handler
  const handleChange = (id: string, field: keyof GPUpdateRecord, value: any) => {
    setEditingRows(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  // 3. Automation: Bulk Update (Image 84 Red Button)
  const handleBulkUpdate = async () => {
    const updates = Object.values(editingRows);
    if (updates.length === 0) return;

    try {
      const res = await fetch("/api/outward/update-gp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });
      if (res.ok) {
        toast.success("GP Minor Details Synchronized!");
        handleSearch();
      }
    } catch (err) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      {/* Visual Header (Image 84 Style) */}
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
        <h2 className="font-bold uppercase flex items-center gap-2">
          For Minor Changes in Outward Entry
        </h2>
        <button 
          onClick={handleBulkUpdate}
          className="bg-red-600 hover:bg-red-700 px-6 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 uppercase transition-all shadow-lg active:scale-95"
        >
          <Save size={14}/> Update
        </button>
      </div>

      {/* SEARCH BOX (Image 84 Mapping) */}
      <div className="bg-white p-6 border rounded shadow-sm flex flex-wrap items-end gap-6">
        <div className="space-y-1">
          <label className="font-bold text-gray-500 uppercase block">From Gp</label>
          <input 
            className="border p-2 rounded w-40 outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-700" 
            value={range.from} 
            onChange={e => setRange({...range, from: e.target.value})} 
          />
        </div>
        <div className="space-y-1">
          <label className="font-bold text-gray-500 uppercase block">To Gp</label>
          <input 
            className="border p-2 rounded w-40 outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-700" 
            value={range.to} 
            onChange={e => setRange({...range, to: e.target.value})} 
          />
        </div>
        <button 
          onClick={handleSearch}
          className="bg-red-600 text-white px-8 py-2 rounded font-bold uppercase hover:bg-red-700 flex items-center gap-2 transition-all shadow"
        >
          <Search size={16}/> Search
        </button>
      </div>

      {/* BRANDING (Center of Image 84) */}
      <div className="text-center py-4 bg-white border rounded shadow-sm">
         <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Visual Softech</h1>
         <p className="text-[9px] text-gray-500 font-bold">Block B, Plot No A 26, Mohan Cooperative, South Delhi, New Delhi 110044</p>
         <div className="flex justify-center gap-4 text-[9px] font-bold text-indigo-600 mt-1">
           <span>PAN: AAXFV5416G</span>
           <span>GST: 07AAXFV5416G1ZO</span>
         </div>
         <p className="text-xs font-bold text-slate-600 mt-4 border-b border-dashed inline-block pb-1 italic">Documents Report</p>
      </div>

      {/* DATA GRID (Image 84 Exact Columns) */}
      <div className="bg-white border rounded shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-bold text-[10px]">
            <tr>
              <th className="p-3 border-r border-slate-300 w-32">GP NO</th>
              <th className="p-3 border-r border-slate-300 w-48 text-center">TRANSPORT REQUIRED</th>
              <th className="p-3 border-r border-slate-300 w-40">GR NO</th>
              <th className="p-3 border-r border-slate-300 w-40">TRUCK NO</th>
              <th className="p-3 border-r border-slate-300 w-40">DELIVERY PERSON</th>
              <th className="p-3 border-r border-slate-300">REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-10 text-center animate-pulse text-indigo-600 font-bold">RETRIVING OUTWARD LOGS...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-gray-400 italic">No Data Available. Search using GP range.</td></tr>
            ) : records.map((row) => (
              <tr key={row.id} className="border-b hover:bg-slate-50 transition-all">
                <td className="p-3 border-r border-slate-200 font-bold text-indigo-700">{row.gpNo}</td>
                
                <td className="p-2 border-r border-slate-200 text-center">
                  <select 
                    className="w-full border p-1 rounded bg-white font-bold text-blue-600"
                    value={editingRows[row.id]?.transportRequired ? "Yes" : "No"}
                    onChange={e => handleChange(row.id, "transportRequired", e.target.value === "Yes")}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </td>

                <td className="p-2 border-r border-slate-200">
                  <input 
                    className="w-full border p-1 rounded outline-none focus:border-indigo-400" 
                    value={editingRows[row.id]?.grNo || ""}
                    onChange={e => handleChange(row.id, "grNo", e.target.value)}
                  />
                </td>

                <td className="p-2 border-r border-slate-200">
                  <input 
                    className="w-full border p-1 rounded font-mono uppercase outline-none focus:border-indigo-400" 
                    value={editingRows[row.id]?.vehicleNo || ""}
                    onChange={e => handleChange(row.id, "vehicleNo", e.target.value)}
                  />
                </td>

                <td className="p-2 border-r border-slate-200">
                  <input 
                    className="w-full border p-1 rounded outline-none focus:border-indigo-400" 
                    value={editingRows[row.id]?.personName || ""}
                    onChange={e => handleChange(row.id, "personName", e.target.value)}
                  />
                </td>

                <td className="p-2 border-r border-slate-200">
                  <input 
                    className="w-full border p-1 rounded outline-none focus:border-indigo-400" 
                    value={editingRows[row.id]?.remarks || ""}
                    onChange={e => handleChange(row.id, "remarks", e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}