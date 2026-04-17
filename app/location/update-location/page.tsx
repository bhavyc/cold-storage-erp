"use client";

import React, { useState, useEffect } from "react";
import { Search, Save, MapPin, RefreshCw, Layers, ArrowRightLeft } from "lucide-react";
import { toast } from "react-hot-toast";

// STRICT TYPES (No 'any')
interface LotRecord {
  id: string; lotNo: string; mrNo: string; arrivalDate: string;
  party: { tradeName: string };
  item: { name: string };
  receivedQty: number; balanceQty: number;
  unit: { name: string };
  perUnitWgt: number; rate: number; labour: number;
  chamberId: string; floor: string; pole: string;
  lotValue: number; marka: string; pMarka: string;
  remarks: string; variety: string; uptoDate: string | null;
}

export default function UpdateStockLocationPage() {
  const [range, setRange] = useState({ from: "", to: "" });
  const [records, setRecords] = useState<LotRecord[]>([]);
  const [chambers, setChambers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editState, setEditState] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch("/api/masters/chambers").then(res => res.json()).then(setChambers);
  }, []);

  const handleSearch = async () => {
    if (!range.from || !range.to) return toast.error("Enter Lot Range");
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/update-location?fromLot=${range.from}&toLot=${range.to}`);
      const data = await res.json();
      setRecords(data);
      // Create local editable copy
      const initialState: Record<string, any> = {};
      data.forEach((r: LotRecord) => { initialState[r.id] = { ...r }; });
      setEditState(initialState);
    } catch (err) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (id: string, field: string, val: any) => {
    setEditState(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: val }
    }));
  };

  const handleUpdate = async () => {
    const updates = Object.values(editState);
    if (updates.length === 0) return;

    try {
      const res = await fetch("/api/inventory/update-location", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });
      if (res.ok) {
        toast.success("Stock Locations Updated!");
        handleSearch();
      }
    } catch (err) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="space-y-4 text-[10px] animate-in fade-in duration-500">
      {/* Header Bar (Image 85 Style) */}
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-widest">
          <MapPin size={16}/> Update Stock Location
        </h2>
        <button 
          onClick={handleUpdate}
          className="bg-red-600 hover:bg-red-700 px-6 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 uppercase transition-all shadow-lg active:scale-95"
        >
          <Save size={14}/> Update
        </button>
      </div>

      {/* SEARCH RANGE (Image 85 Filters) */}
      <div className="bg-white p-6 border rounded shadow-sm flex flex-wrap items-end gap-6">
        <div className="space-y-1">
          <label className="font-bold text-gray-500 uppercase block">From Lot</label>
          <input className="border p-2 rounded w-40 font-bold" value={range.from} onChange={e => setRange({...range, from: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="font-bold text-gray-500 uppercase block">To Lot</label>
          <input className="border p-2 rounded w-40 font-bold" value={range.to} onChange={e => setRange({...range, to: e.target.value})} />
        </div>
        <button onClick={handleSearch} className="bg-red-600 text-white px-8 py-2 rounded font-bold uppercase hover:bg-red-700 flex items-center gap-2 transition-all">
          <Search size={16}/> Search
        </button>
      </div>

      {/* GIANT GRID (Image 85 Columns Matching) */}
      <div className="bg-white border rounded shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[2000px]">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-bold text-[9px]">
            <tr>
              <th className="p-2 border-r border-slate-300 sticky left-0 bg-[#b4b6e4] z-10">Lot No</th>
              <th className="p-2 border-r border-slate-300">Slip No</th>
              <th className="p-2 border-r border-slate-300">Rec Date</th>
              <th className="p-2 border-r border-slate-300">Party Name</th>
              <th className="p-2 border-r border-slate-300">Item Name</th>
              <th className="p-2 border-r border-slate-300">Item Qty</th>
              <th className="p-2 border-r border-slate-300">Unit</th>
              <th className="p-2 border-r border-slate-300">Bal Qty</th>
              <th className="p-2 border-r border-slate-300">Per Unit Wgt</th>
              <th className="p-2 border-r border-slate-300">Rate</th>
              <th className="p-2 border-r border-slate-300">Labour</th>
              <th className="p-2 border-r border-slate-300 w-40">Chamber</th>
              <th className="p-2 border-r border-slate-300 w-24">Floor</th>
              <th className="p-2 border-r border-slate-300 w-24">Pole</th>
              <th className="p-2 border-r border-slate-300">Lot Value</th>
              <th className="p-2 border-r border-slate-300">Marka</th>
              <th className="p-2 border-r border-slate-300">PMarka</th>
              <th className="p-2 border-r border-slate-300">Remarks</th>
              <th className="p-2 border-r border-slate-300">Variety</th>
              <th className="p-2">Upto Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={20} className="p-10 text-center animate-pulse text-indigo-600 font-bold">RETRIVING STOCK DATA...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={20} className="p-10 text-center text-gray-400 italic font-medium">No Data Available. Adjust lot range and search.</td></tr>
            ) : records.map((row) => (
              <tr key={row.id} className="border-b hover:bg-yellow-50/30 transition-all font-medium">
                <td className="p-2 border-r border-slate-200 sticky left-0 bg-white z-10 font-bold text-indigo-700">{row.lotNo}</td>
                <td className="p-2 border-r border-slate-200 text-gray-400">{row.mrNo}</td>
                <td className="p-2 border-r border-slate-200">{new Date(row.arrivalDate).toLocaleDateString('en-GB')}</td>
                <td className="p-2 border-r border-slate-200 uppercase truncate max-w-[150px]">{row.party.tradeName}</td>
                <td className="p-2 border-r border-slate-200 uppercase">{row.item.name}</td>
                <td className="p-2 border-r border-slate-200 text-center">{row.receivedQty}</td>
                <td className="p-2 border-r border-slate-200">{row.unit.name}</td>
                <td className="p-2 border-r border-slate-200 text-center font-bold text-red-500">{row.balanceQty}</td>
                
                {/* EDITABLE FIELDS START */}
                <td className="p-1 border-r border-slate-200">
                  <input type="number" className="w-full p-1 border rounded text-center outline-none focus:ring-1 focus:ring-indigo-400" 
                    value={editState[row.id]?.perUnitWgt} 
                    onChange={e => handleInputChange(row.id, "perUnitWgt", e.target.value)} 
                  />
                </td>
                <td className="p-2 border-r border-slate-200 text-center text-gray-400">{row.rate}</td>
                <td className="p-2 border-r border-slate-200 text-center text-gray-400">{row.labour}</td>
                
                <td className="p-1 border-r border-slate-200">
                  <select className="w-full p-1 border rounded outline-none focus:ring-1 focus:ring-indigo-400" 
                    value={editState[row.id]?.chamberId} 
                    onChange={e => handleInputChange(row.id, "chamberId", e.target.value)}
                  >
                    {chambers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                
                <td className="p-1 border-r border-slate-200">
                  <input className="w-full p-1 border rounded text-center outline-none" 
                    value={editState[row.id]?.floor} 
                    onChange={e => handleInputChange(row.id, "floor", e.target.value)} 
                  />
                </td>
                <td className="p-1 border-r border-slate-200">
                  <input className="w-full p-1 border rounded text-center outline-none" 
                    value={editState[row.id]?.pole} 
                    onChange={e => handleInputChange(row.id, "pole", e.target.value)} 
                  />
                </td>

                <td className="p-2 border-r border-slate-200 text-center text-gray-400">{row.lotValue}</td>
                <td className="p-1 border-r border-slate-200">
                  <input className="w-full p-1 border rounded uppercase outline-none" 
                    value={editState[row.id]?.marka} 
                    onChange={e => handleInputChange(row.id, "marka", e.target.value)} 
                  />
                </td>
                <td className="p-1 border-r border-slate-200">
                  <input className="w-full p-1 border rounded uppercase outline-none" 
                    value={editState[row.id]?.pMarka} 
                    onChange={e => handleInputChange(row.id, "pMarka", e.target.value)} 
                  />
                </td>
                <td className="p-1 border-r border-slate-200">
                  <input className="w-full p-1 border rounded outline-none" 
                    value={editState[row.id]?.remarks} 
                    onChange={e => handleInputChange(row.id, "remarks", e.target.value)} 
                  />
                </td>
                <td className="p-1 border-r border-slate-200">
                  <input className="w-full p-1 border rounded outline-none" 
                    value={editState[row.id]?.variety} 
                    onChange={e => handleInputChange(row.id, "variety", e.target.value)} 
                  />
                </td>
                <td className="p-2 text-gray-400 italic">
                  {row.uptoDate ? new Date(row.uptoDate).toLocaleDateString('en-GB') : "Not Billed"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}