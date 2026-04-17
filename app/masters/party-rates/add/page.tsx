"use client";

import React, { useState, useEffect } from "react";
import { Save, Plus, X, ArrowLeft, Database } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function PartyRateEntryPage() {
  const router = useRouter();
  const [parties, setParties] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  
  const [selectedParty, setSelectedParty] = useState("");
  const [rows, setRows] = useState<any[]>([
    { itemId: "", unitId: "", csRent: 0, csLab: 0, caRent: 0, caLab: 0, freight: 0, period: 0 }
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/masters/party").then(res => res.json()),
      fetch("/api/masters/items").then(res => res.json()),
      fetch("/api/masters/units").then(res => res.json())
    ]).then(([p, i, u]) => { setParties(p); setItems(i); setUnits(u); });
  }, []);

  const addRow = () => setRows([...rows, { itemId: "", unitId: "", csRent: 0, csLab: 0, caRent: 0, caLab: 0, freight: 0, period: 0 }]);
  
  const handleSave = async () => {
    if (!selectedParty) return toast.error("Select Party first");
    const res = await fetch("/api/masters/party-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partyId: selectedParty, rows })
    });
    if (res.ok) {
      toast.success("Party Specific Rates Locked!");
      router.push("/masters/party-rates");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 text-[10px] animate-in slide-in-from-right-4">
      <button onClick={() => router.back()} className="bg-red-500 text-white px-4 py-1.5 rounded font-bold flex items-center gap-1 shadow uppercase"><ArrowLeft size={14}/> Back</button>
      
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg font-black uppercase text-center tracking-widest flex justify-between items-center">
        <span>Party Item Rate Master Entry</span>
        <button onClick={handleSave} className="bg-green-600 px-6 py-1 rounded text-[10px] flex items-center gap-1"><Save size={14}/> Save All</button>
      </div>

      <div className="bg-white p-6 border rounded-b shadow-xl space-y-6">
        {/* PARTY SELECTION (Image 49) */}
        <div className="w-1/3">
          <label className="font-bold text-gray-500 uppercase block mb-1">Select Party</label>
          <select className="w-full border-2 border-indigo-100 p-2 rounded bg-white font-black text-indigo-700 text-xs" value={selectedParty} onChange={e => setSelectedParty(e.target.value)}>
            <option value="">-- Select Party --</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
          </select>
        </div>

        {/* DYNAMIC GRID (Image 50 Columns) */}
        <div className="overflow-x-auto border rounded shadow-inner">
          <table className="w-full border-collapse text-left min-w-[1000px]">
            <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px]">
              <tr>
                <th className="p-2 border-r border-slate-300">Item</th>
                <th className="p-2 border-r border-slate-300">Unit</th>
                <th className="p-2 border-r border-slate-300 text-center">CS Rent</th>
                <th className="p-2 border-r border-slate-300 text-center">CS Lab</th>
                <th className="p-2 border-r border-slate-300 text-center">CA Rent</th>
                <th className="p-2 border-r border-slate-300 text-center">CA Lab</th>
                <th className="p-2 border-r border-slate-300 text-center">Freight</th>
                <th className="p-2 border-r border-slate-300 text-center w-24">Period</th>
                <th className="p-2 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50 transition-all">
                  <td className="p-1 border-r"><select className="w-full p-1.5 outline-none font-bold" value={row.itemId} onChange={e => {const n=[...rows]; n[idx].itemId=e.target.value; setRows(n);}}>
                    <option value="">Select Item</option>{items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select></td>
                  <td className="p-1 border-r"><select className="w-full p-1.5 outline-none" value={row.unitId} onChange={e => {const n=[...rows]; n[idx].unitId=e.target.value; setRows(n);}}>
                    <option value="">Select Unit</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select></td>
                  <td className="p-1 border-r"><input type="number" className="w-full p-1.5 text-center font-bold text-indigo-600" value={row.csRent} onChange={e => {const n=[...rows]; n[idx].csRent=e.target.value; setRows(n);}} /></td>
                  <td className="p-1 border-r"><input type="number" className="w-full p-1.5 text-center font-bold text-green-600" value={row.csLab} onChange={e => {const n=[...rows]; n[idx].csLab=e.target.value; setRows(n);}} /></td>
                  <td className="p-1 border-r"><input type="number" className="w-full p-1.5 text-center" value={row.caRent} onChange={e => {const n=[...rows]; n[idx].caRent=e.target.value; setRows(n);}} /></td>
                  <td className="p-1 border-r"><input type="number" className="w-full p-1.5 text-center" value={row.caLab} onChange={e => {const n=[...rows]; n[idx].caLab=e.target.value; setRows(n);}} /></td>
                  <td className="p-1 border-r"><input type="number" className="w-full p-1.5 text-center font-bold text-orange-600" value={row.freight} onChange={e => {const n=[...rows]; n[idx].freight=e.target.value; setRows(n);}} /></td>
                  <td className="p-1 border-r bg-yellow-50"><input type="number" className="w-full p-1.5 text-center font-black" value={row.period} onChange={e => {const n=[...rows]; n[idx].period=e.target.value; setRows(n);}} /></td>
                  <td className="p-1 text-center"><button onClick={addRow} className="text-blue-600 font-bold text-lg mr-2">+</button><button onClick={() => setRows(rows.filter((_,i)=>i!==idx))} className="text-red-500 font-bold text-lg">×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[9px] text-gray-400 italic flex items-center gap-1"><Database size={10}/> All rates defined here will strictly override the Item Master default rates for this specific party.</p>
      </div>
    </div>
  );
}