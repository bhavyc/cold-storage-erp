"use client";

import React, { useState } from "react";
import { Search, Edit3, Save, ArrowLeft, RefreshCcw, X, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function UpdateMRDetailsPage() {
  const [range, setRange] = useState({ from: "", to: "" });
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  // 1. Search Function
  const handleSearch = async () => {
    if (!range.from || !range.to) return toast.error("Bhai, Slip range toh daalo!");
    setLoading(true);
    try {
      const res = await fetch(`/api/inward/update-mr?fromSlip=${range.from}&toSlip=${range.to}`);
      const data = await res.json();
      if (res.ok) {
        setRecords(data);
        if (data.length === 0) toast.error("Is range mein koi MR nahi mili!");
      }
    } catch (err) {
      toast.error("Search fail ho gaya!");
    } finally {
      setLoading(false);
    }
  };

  // 2. Individual Row Update
  const handleUpdate = async (id: string) => {
    const loadId = toast.loading("Details update ho rahi hain...");
    try {
      const res = await fetch(`/api/inward/update-mr`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editData }),
      });
      if (res.ok) {
        toast.success("MR Details updated!", { id: loadId });
        setEditingRow(null);
        handleSearch(); // Refresh list
      } else {
        toast.error("Update nahi ho paya!", { id: loadId });
      }
    } catch (err) {
      toast.error("Network error!", { id: loadId });
    }
  };

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      {/* Visual Header */}
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
        <h2 className="font-bold uppercase flex items-center gap-2">
          FOR MINOR CHANGES IN INWARD ENTRY
        </h2>
        <button className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded font-bold flex items-center gap-1 uppercase transition-all shadow-md active:scale-95">
          <Edit3 size={14}/> UPDATE ALL
        </button>
      </div>

      {/* SEARCH BOX */}
      <div className="bg-white p-6 border rounded shadow-sm flex items-end gap-6">
        <div className="space-y-1">
          <label className="font-bold text-gray-500 uppercase block">From Slip No</label>
          <input 
            className="border p-2 rounded w-40 outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-700" 
            value={range.from} 
            onChange={e => setRange({...range, from: e.target.value})} 
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <label className="font-bold text-gray-500 uppercase block">To Slip No</label>
          <input 
            className="border p-2 rounded w-40 outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-700" 
            value={range.to} 
            onChange={e => setRange({...range, to: e.target.value})} 
            placeholder="9999"
          />
        </div>
        <button 
          onClick={handleSearch}
          disabled={loading}
          className="bg-red-600 text-white px-8 py-2 rounded font-bold uppercase hover:bg-red-700 flex items-center gap-2 shadow-md transition-all"
        >
          {loading ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>} Search
        </button>
      </div>

      {/* DATA GRID */}
      <div className="bg-white border rounded shadow-sm overflow-x-auto min-h-[300px]">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[10px]">
            <tr>
              <th className="p-3 border-r border-slate-300">Slip No</th>
              <th className="p-3 border-r border-slate-300">MR Date</th>
              <th className="p-3 border-r border-slate-300">Party Name</th>
              <th className="p-3 border-r border-slate-300">Billing Type</th>
              <th className="p-3 border-r border-slate-300">Truck No</th>
              <th className="p-3 border-r border-slate-300">Delivery Person</th>
              <th className="p-3 border-r border-slate-300">Remarks</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={8} className="p-20 text-center text-gray-400 italic font-medium uppercase tracking-widest">No Data Available. Enter Range and Search.</td></tr>
            ) : records.map((row) => (
              <tr key={row.id} className={`border-b transition-colors ${editingRow === row.id ? 'bg-yellow-50' : 'hover:bg-slate-50'}`}>
                <td className="p-3 border-r font-black text-indigo-700">{row.lot.mrNo}</td>
                
                {/* MR DATE EDIT */}
                <td className="p-2 border-r">
                  {editingRow === row.id ? (
                    <input type="date" className="w-full border p-1 rounded font-bold" defaultValue={row.mrDate.split('T')[0]} onChange={e => setEditData({...editData, mrDate: e.target.value})} />
                  ) : new Date(row.mrDate).toLocaleDateString('en-GB')}
                </td>

                <td className="p-3 border-r font-bold uppercase text-slate-700">{row.lot.party.tradeName}</td>

                {/* BILLING TYPE EDIT */}
                <td className="p-2 border-r">
                  {editingRow === row.id ? (
                    <select className="w-full border p-1 rounded font-bold" defaultValue={row.billingType} onChange={e => setEditData({...editData, billingType: e.target.value})}>
                      <option value="NA">NA</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Nill Lot">Nill Lot</option>
                    </select>
                  ) : <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{row.billingType}</span>}
                </td>

                {/* TRUCK NO EDIT */}
                <td className="p-2 border-r">
                  {editingRow === row.id ? (
                    <input className="w-full border p-1 rounded font-mono uppercase" defaultValue={row.truckNo} onChange={e => setEditData({...editData, truckNo: e.target.value})} />
                  ) : <span className="font-mono">{row.truckNo}</span>}
                </td>

                {/* PERSON EDIT */}
                <td className="p-2 border-r">
                  {editingRow === row.id ? (
                    <input className="w-full border p-1 rounded" defaultValue={row.deliveryPerson} onChange={e => setEditData({...editData, deliveryPerson: e.target.value})} />
                  ) : row.deliveryPerson}
                </td>

                {/* REMARKS EDIT */}
                <td className="p-2 border-r">
                  {editingRow === row.id ? (
                    <input className="w-full border p-1 rounded" defaultValue={row.remarks || ""} onChange={e => setEditData({...editData, remarks: e.target.value})} />
                  ) : <span className="text-gray-400 italic">{row.remarks || "No remarks"}</span>}
                </td>

                {/* ACTIONS */}
                <td className="p-2 text-center">
                  {editingRow === row.id ? (
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleUpdate(row.id)} className="bg-green-600 text-white p-1 rounded shadow hover:bg-green-700"><Save size={14}/></button>
                      <button onClick={() => setEditingRow(null)} className="bg-red-500 text-white p-1 rounded shadow hover:bg-red-600"><X size={14}/></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setEditingRow(row.id); setEditData(row); }}
                      className="text-blue-600 hover:scale-125 transition-all p-1"
                    >
                      <Edit3 size={16}/>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}