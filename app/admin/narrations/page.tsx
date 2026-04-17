"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Save, ArrowLeft, MessageSquare, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function NarrationMasterPage() {
  const [view, setView] = useState<"list" | "add">("list");
  const [narrations, setNarrations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    code: "1", group: "Cash", vocType: "Payment", description: ""
  });

  const fetchNarrations = () => fetch("/api/masters/narrations").then(res => res.json()).then(setNarrations);
  useEffect(() => { fetchNarrations(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/masters/narrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      toast.success("Narration Added");
      setView("list");
      fetchNarrations();
    }
  };

  if (view === "list") {
    return (
      <div className="space-y-4 text-xs animate-in fade-in duration-500">
        <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
          <h2 className="font-bold uppercase tracking-widest flex items-center gap-2"><MessageSquare size={16}/> Narration Master</h2>
          <button onClick={() => setView("add")} className="bg-orange-500 hover:bg-orange-600 px-4 py-1 rounded font-bold shadow">+ Add New</button>
        </div>
        <div className="bg-white border rounded shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b font-black text-slate-600 uppercase text-[9px]">
              <tr>
                <th className="p-3 border-r w-32">GROUP</th>
                <th className="p-3 border-r w-32">NARRATION CODE</th>
                <th className="p-3 border-r">NARRATION</th>
                <th className="p-3 border-r w-32">TYPE</th>
                <th className="p-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {narrations.map((n) => (
                <tr key={n.id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="p-3 border-r font-black text-indigo-700 uppercase">{n.group}</td>
                  <td className="p-3 border-r text-center font-bold text-slate-500">{n.code}</td>
                  <td className="p-3 border-r font-medium text-slate-700">{n.description}</td>
                  <td className="p-3 border-r text-center italic">{n.vocType}</td>
                  <td className="p-3 text-center flex justify-center gap-3">
                    <Edit size={14} className="text-blue-500 cursor-pointer"/>
                    <Trash2 size={14} className="text-red-400 cursor-pointer"/>
                  </td>
                </tr>
              ))}
              {narrations.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">No data available in table</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-in slide-in-from-right-4 text-xs">
      <button onClick={() => setView("list")} className="bg-red-500 text-white px-4 py-1.5 rounded font-bold flex items-center gap-1 uppercase"><ArrowLeft size={14}/> Back</button>
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg font-black uppercase text-center shadow-md">Narration Master | Entry</div>
      <form onSubmit={handleSave} className="bg-white p-8 border rounded-b shadow-xl space-y-5">
        <div>
          <label className="font-bold text-gray-500 uppercase block mb-1">Narration Code</label>
          <input required className="w-full border p-2 rounded bg-slate-50 font-bold" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
        </div>
        <div>
          <label className="font-bold text-gray-500 uppercase block mb-1">Group</label>
          <select className="w-full border p-2 rounded bg-white font-bold" value={formData.group} onChange={e => setFormData({...formData, group: e.target.value})}>
            <option>Cash</option><option>Bank</option><option>Journal</option>
          </select>
        </div>
        <div>
          <label className="font-bold text-gray-500 uppercase block mb-1">Voc Type</label>
          <select className="w-full border p-2 rounded bg-white font-bold" value={formData.vocType} onChange={e => setFormData({...formData, vocType: e.target.value})}>
            <option>Payment</option><option>Receipt</option>
          </select>
        </div>
        <div>
          <label className="font-bold text-gray-500 uppercase block mb-1">Description</label>
          <textarea required className="w-full border p-2 rounded h-24 font-medium uppercase" placeholder="Enter standard narration..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>
        <button type="submit" className="w-full bg-red-600 text-white font-black py-3 rounded uppercase tracking-widest shadow-lg">Submit Narration</button>
      </form>
    </div>
  );
}