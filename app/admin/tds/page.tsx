"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Save, ArrowLeft, ShieldCheck, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function TDSMasterPage() {
  const [view, setView] = useState<"list" | "add">("list");
  const [tdsList, setTdsList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    section: "", description: "", panStatus: "Yes", minThreshold: 0, tdsPercentage: 0
  });

  const fetchTDS = () => fetch("/api/masters/tds").then(res => res.json()).then(setTdsList);
  useEffect(() => { fetchTDS(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/masters/tds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      toast.success("TDS Master Updated");
      setView("list");
      fetchTDS();
    }
  };

  if (view === "list") {
    return (
      <div className="space-y-4 text-xs animate-in fade-in duration-500">
        <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
          <h2 className="font-bold uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={16}/> TDS Master | List</h2>
          <button onClick={() => setView("add")} className="bg-orange-500 hover:bg-orange-600 px-4 py-1 rounded font-bold shadow">+ Add New</button>
        </div>
        <div className="bg-white border rounded shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b font-black text-slate-600 uppercase text-[9px]">
              <tr>
                <th className="p-3 border-r w-16">ID</th>
                <th className="p-3 border-r w-32">Pan Status</th>
                <th className="p-3 border-r text-right">Min Payment</th>
                <th className="p-3 border-r text-center">TDS %</th>
                <th className="p-3 border-r">TDS Description</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tdsList.map((t, idx) => (
                <tr key={t.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 border-r font-bold text-gray-500">{idx + 1}</td>
                  <td className="p-3 border-r">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${t.panStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.panStatus ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="p-3 border-r text-right font-bold text-slate-700">{Number(t.minThreshold).toLocaleString()}</td>
                  <td className="p-3 border-r text-center font-black text-blue-600">{Number(t.tdsPercentage)}%</td>
                  <td className="p-3 border-r font-medium uppercase">{t.description} ({t.section})</td>
                  <td className="p-3 text-center flex justify-center gap-3">
                    <Edit size={14} className="text-blue-500 cursor-pointer"/>
                    <Trash2 size={14} className="text-red-400 cursor-pointer"/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in slide-in-from-bottom-4 text-xs">
      <button onClick={() => setView("list")} className="bg-red-500 text-white px-4 py-1.5 rounded font-bold flex items-center gap-1 uppercase"><ArrowLeft size={14}/> Back</button>
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg font-black uppercase text-center shadow-md">TDS Master | Entry</div>
      <form onSubmit={handleSave} className="bg-white p-8 border rounded-b shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="font-bold text-gray-500 uppercase block mb-1">TDS Section (Code)</label>
          <input required className="w-full border p-2 rounded font-bold" placeholder="e.g. 194J" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} />
        </div>
        <div>
          <label className="font-bold text-gray-500 uppercase block mb-1">Pan Status</label>
          <select className="w-full border p-2 rounded bg-white font-bold" value={formData.panStatus} onChange={e => setFormData({...formData, panStatus: e.target.value})}>
            <option>Yes</option><option>No</option>
          </select>
        </div>
        <div>
          <label className="font-bold text-gray-500 uppercase block mb-1">Min Payment Threshold</label>
          <input type="number" className="w-full border p-2 rounded font-bold text-blue-600" value={formData.minThreshold} onChange={e => setFormData({...formData, minThreshold: parseFloat(e.target.value)})} />
        </div>
        <div>
          <label className="font-bold text-gray-500 uppercase block mb-1">TDS Percentage (%)</label>
          <input type="number" step="0.01" className="w-full border p-2 rounded font-black text-red-600" value={formData.tdsPercentage} onChange={e => setFormData({...formData, tdsPercentage: parseFloat(e.target.value)})} />
        </div>
        <div className="md:col-span-2">
          <label className="font-bold text-gray-500 uppercase block mb-1">TDS Description</label>
          <input required className="w-full border p-2 rounded font-medium" placeholder="Description of TDS section..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>
        <div className="md:col-span-2 pt-4">
          <button type="submit" className="w-full bg-red-600 text-white font-black py-3 rounded uppercase tracking-widest shadow-lg">Submit TDS Data</button>
        </div>
      </form>
    </div>
  );
}