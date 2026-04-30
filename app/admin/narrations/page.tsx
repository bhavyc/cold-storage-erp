"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit, Save, ArrowLeft, MessageSquare, X, Loader2, ListChecks } from "lucide-react";
import { toast } from "react-hot-toast";

export default function NarrationMasterPage() {
  const [view, setView] = useState<"list" | "add">("list");
  const [narrations, setNarrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Initial Form State
  const initialForm = {
    code: "", 
    group: "Cash", 
    vocType: "Payment", 
    description: ""
  };

  const [formData, setFormData] = useState(initialForm);

  // 1. FETCH NARRATIONS LIST
  const fetchNarrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/masters/narrations");
      const data = await res.json();
      setNarrations(data || []);
    } catch (err) {
      toast.error("Failed to load narrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNarrations(); }, [fetchNarrations]);

  // 2. SAVE OR UPDATE LOGIC
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.description) return toast.error("Code aur Description bharna zaroori hai!");

    setIsSaving(true);
    const loadId = toast.loading(editingId ? "Updating narration..." : "Adding new narration...");
    
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/masters/narrations/${editingId}` : "/api/masters/narrations";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(editingId ? "Narration Updated!" : "Narration Added!", { id: loadId });
        setView("list");
        setEditingId(null);
        setFormData(initialForm);
        fetchNarrations();
      } else {
        toast.error(result.error || "Save failed", { id: loadId });
      }
    } catch (err) {
      toast.error("Network Error!", { id: loadId });
    } finally {
      setIsSaving(false);
    }
  };

  // 3. EDIT TRIGGER
  const handleEdit = (n: any) => {
    setEditingId(n.id);
    setFormData({
      code: n.code,
      group: n.group,
      vocType: n.vocType,
      description: n.description
    });
    setView("add");
  };

  // 4. DELETE LOGIC
  const handleDelete = async (id: string) => {
    if (!confirm("Bhai, kya aap is narration ko delete karna chahte hain?")) return;
    
    const loadId = toast.loading("Deleting record...");
    try {
      const res = await fetch(`/api/masters/narrations/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Narration deleted!", { id: loadId });
        fetchNarrations();
      } else {
        const err = await res.json();
        toast.error(err.error || "Uda nahi paye!", { id: loadId });
      }
    } catch (err) {
      toast.error("Server connection error!", { id: loadId });
    }
  };

  if (view === "list") {
    return (
      <div className="space-y-4 text-xs animate-in fade-in duration-500">
        <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-lg border-b-4 border-indigo-300">
          <h2 className="font-bold uppercase tracking-widest flex items-center gap-2 italic">
            <MessageSquare size={18}/> Accountant Registry | Standard Narrations
          </h2>
          <button onClick={() => { setEditingId(null); setFormData(initialForm); setView("add"); }} className="bg-orange-500 hover:bg-orange-600 px-6 py-1.5 rounded font-black shadow-md transition-all active:scale-95 text-[10px] uppercase">
            + New Narration Template
          </button>
        </div>

        <div className="bg-white border rounded-b-lg shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f8f9fa] border-b font-black text-slate-600 uppercase text-[9px]">
              <tr>
                <th className="p-4 border-r w-32">VOUCHER GROUP</th>
                <th className="p-4 border-r w-32 text-center">TEMPLATE CODE</th>
                <th className="p-4 border-r">NARRATION CONTENT (PRESET)</th>
                <th className="p-4 border-r w-32 text-center">DEFAULT TYPE</th>
                <th className="p-4 text-center w-32">MANAGEMENT</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center font-bold text-indigo-700 animate-pulse uppercase tracking-widest">Initialising Narrative Database...</td></tr>
              ) : narrations.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-gray-400 italic">No standard narrations configured for account vouchers.</td></tr>
              ) : narrations.map((n) => (
                <tr key={n.id} className="border-b hover:bg-indigo-50/40 transition-colors font-bold group">
                  <td className="p-4 border-r font-black text-indigo-700 uppercase">{n.group}</td>
                  <td className="p-4 border-r text-center font-mono text-slate-500">{n.code}</td>
                  <td className="p-4 border-r font-medium text-slate-700 uppercase italic">
                    <span className="text-slate-300 mr-2 text-[14px]">"</span>
                    {n.description}
                    <span className="text-slate-300 ml-2 text-[14px]">"</span>
                  </td>
                  <td className="p-4 border-r text-center">
                     <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${n.vocType === 'Payment' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {n.vocType}
                     </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-4">
                        <button onClick={() => handleEdit(n)} className="text-blue-600 hover:scale-125 transition-transform"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(n.id)} className="text-red-500 hover:scale-125 transition-transform"><Trash2 size={16}/></button>
                    </div>
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
    <div className="max-w-xl mx-auto space-y-4 animate-in slide-in-from-right-4 duration-300 text-xs pb-10">
      <button onClick={() => setView("list")} className="bg-red-500 text-white px-6 py-2 rounded-full font-black flex items-center gap-2 shadow-lg uppercase transition-all active:scale-95 text-[10px]">
        <ArrowLeft size={16}/> Back to Narration Library
      </button>

      <div className="bg-[#4a4ea3] text-white p-4 rounded-t-2xl font-black uppercase text-center shadow-xl tracking-widest italic border-b-4 border-indigo-400">
        {editingId ? "Update Standard Narration" : "Configure New Narration Preset"}
      </div>

      <form onSubmit={handleSave} className="bg-white p-10 border rounded-b-2xl shadow-2xl space-y-8">
        <div>
          <label className="font-black text-gray-500 uppercase block mb-1 tracking-widest text-[9px]">Template Identifier Code *</label>
          <input 
            required 
            className="w-full border-2 border-slate-100 p-3 rounded-xl font-black text-indigo-700 outline-none focus:border-indigo-400 bg-slate-50 shadow-sm uppercase" 
            placeholder="e.g. CASH_PAY_01"
            value={formData.code} 
            onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
          />
        </div>
        <div className="grid grid-cols-2 gap-6">
            <div>
                <label className="font-black text-gray-500 uppercase block mb-1 tracking-widest text-[9px]">Voucher Group</label>
                <select className="w-full border-2 border-slate-100 p-3 rounded-xl bg-white font-bold outline-none focus:border-indigo-400 shadow-sm" value={formData.group} onChange={e => setFormData({...formData, group: e.target.value})}>
                    <option>Cash</option><option>Bank</option><option>Journal</option><option>Contra</option>
                </select>
            </div>
            <div>
                <label className="font-black text-gray-500 uppercase block mb-1 tracking-widest text-[9px]">Voucher Type</label>
                <select className="w-full border-2 border-slate-100 p-3 rounded-xl bg-white font-bold outline-none focus:border-indigo-400 shadow-sm" value={formData.vocType} onChange={e => setFormData({...formData, vocType: e.target.value})}>
                    <option>Payment</option><option>Receipt</option><option>Journal</option>
                </select>
            </div>
        </div>
        <div>
          <label className="font-black text-gray-500 uppercase block mb-1 tracking-widest text-[9px]">Standard Narrative Content *</label>
          <textarea 
            required 
            className="w-full border-2 border-slate-100 p-4 rounded-2xl h-32 font-bold uppercase outline-none focus:border-indigo-400 placeholder:italic shadow-inner" 
            placeholder="Type standard descriptive text here (e.g., BEING CASH PAID TOWARDS...)" 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value.toUpperCase()})} 
          />
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
            {editingId ? "Commit Changes to Library" : "Register Narration Template"}
          </button>
        </div>
      </form>
    </div>
  );
}
