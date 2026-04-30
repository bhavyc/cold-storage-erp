"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit, Save, ArrowLeft, ShieldCheck, X, Loader2, Bookmark } from "lucide-react";
import { toast } from "react-hot-toast";

export default function TDSMasterPage() {
  const [view, setView] = useState<"list" | "add">("list");
  const [tdsList, setTdsList] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const initialForm = {
    section: "", 
    description: "", 
    panStatus: "Yes", 
    minThreshold: 0, 
    tdsPercentage: 0,
    ledgerId: ""
  };
  const [formData, setFormData] = useState(initialForm);

  // 1. FETCH DATA (TDS & Ledgers)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tdsRes, ledgerRes] = await Promise.all([
        fetch("/api/masters/tds"),
        fetch("/api/accounting/ledgers")
      ]);
      const tdsData = await tdsRes.json();
      const ledgerData = await ledgerRes.json();
      setTdsList(tdsData || []);
      setLedgers(ledgerData || []);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 2. SAVE OR UPDATE LOGIC
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.section || !formData.description) return toast.error("Section aur Description bharna zaroori hai!");

    setIsSaving(true);
    const loadId = toast.loading(editingId ? "Updating TDS rule..." : "Saving new TDS rule...");
    
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/masters/tds/${editingId}` : "/api/masters/tds";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(editingId ? "TDS Master Updated!" : "New TDS Rule added!", { id: loadId });
        setView("list");
        setEditingId(null);
        setFormData(initialForm);
        fetchData();
      } else {
        toast.error(result.error || "Operation failed", { id: loadId });
      }
    } catch (err) {
      toast.error("Network Error!", { id: loadId });
    } finally {
      setIsSaving(false);
    }
  };

  // 3. EDIT TRIGGER
  const handleEdit = (tds: any) => {
    setEditingId(tds.id);
    setFormData({
      section: tds.section,
      description: tds.description,
      panStatus: tds.panStatus ? "Yes" : "No",
      minThreshold: Number(tds.minThreshold),
      tdsPercentage: Number(tds.tdsPercentage),
      ledgerId: tds.ledgerId || ""
    });
    setView("add");
  };

  // 4. DELETE LOGIC
  const handleDelete = async (id: string) => {
    if (!confirm("Bhai, kya aap is TDS rate ko delete karna chahte hain?")) return;
    
    const loadId = toast.loading("Deleting TDS record...");
    try {
      const res = await fetch(`/api/masters/tds/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Record deleted successfully!", { id: loadId });
        fetchData();
      } else {
        toast.error("Delete failed!", { id: loadId });
      }
    } catch (err) {
      toast.error("Server connection error!", { id: loadId });
    }
  };

  if (view === "list") {
    return (
      <div className="space-y-4 text-xs animate-in fade-in duration-500">
        <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg flex justify-between items-center shadow-lg border-b-4 border-indigo-400">
          <h2 className="font-bold uppercase tracking-widest flex items-center gap-2 italic">
            <ShieldCheck size={18}/> Statutory | TDS Master Registry
          </h2>
          <button onClick={() => { setEditingId(null); setFormData(initialForm); setView("add"); }} className="bg-orange-500 hover:bg-orange-600 px-6 py-1.5 rounded font-black shadow-md transition-all active:scale-95 text-[10px] uppercase">
            + Add New Statutory Rule
          </button>
        </div>

        <div className="bg-white border rounded-b-lg shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b font-black text-slate-600 uppercase text-[9px]">
              <tr>
                <th className="p-4 border-r w-16 text-center">SR.</th>
                <th className="p-4 border-r w-32">Section</th>
                <th className="p-4 border-r w-24 text-center">PAN Status</th>
                <th className="p-4 border-r text-right w-40">Threshold (₹)</th>
                <th className="p-4 border-r text-center w-24">Rate %</th>
                <th className="p-4 border-r">Linked Ledger (Posting)</th>
                <th className="p-4 text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-20 text-center font-bold text-indigo-700 animate-pulse uppercase tracking-widest">Loading Statutory Data...</td></tr>
              ) : tdsList.length === 0 ? (
                <tr><td colSpan={7} className="p-20 text-center text-gray-400 italic">No TDS rules configured.</td></tr>
              ) : tdsList.map((t, idx) => (
                <tr key={t.id} className="border-b hover:bg-indigo-50/30 transition-colors font-bold group">
                  <td className="p-4 border-r text-center text-gray-400 font-mono">{idx + 1}</td>
                  <td className="p-4 border-r font-black text-indigo-800 uppercase">{t.section}</td>
                  <td className="p-4 border-r text-center">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${t.panStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.panStatus ? "PAN Reqd" : "General"}
                    </span>
                  </td>
                  <td className="p-4 border-r text-right font-black text-slate-700 bg-slate-50/50">
                    {Number(t.minThreshold).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 border-r text-center font-black text-blue-600 bg-blue-50/20">{Number(t.tdsPercentage)}%</td>
                  <td className="p-4 border-r uppercase text-[10px]">
                     {t.ledger ? (
                        <div className="flex flex-col">
                           <span className="text-indigo-700 font-black">{t.ledger.name}</span>
                           <span className="text-[8px] text-gray-400">Code: {t.ledger.code}</span>
                        </div>
                     ) : <span className="text-red-400 italic">Not Mapped</span>}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-4">
                        <button onClick={() => handleEdit(t)} className="text-blue-600 hover:scale-125 transition-transform"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:scale-125 transition-transform"><Trash2 size={16}/></button>
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
    <div className="max-w-2xl mx-auto space-y-4 animate-in slide-in-from-bottom-4 text-xs pb-10">
      <button onClick={() => setView("list")} className="bg-red-500 text-white px-5 py-2 rounded-full font-black flex items-center gap-2 shadow-lg uppercase transition-all active:scale-95 text-[10px]">
        <ArrowLeft size={16}/> Back to Registry
      </button>

      <div className="bg-[#4a4ea3] text-white p-4 rounded-t-2xl font-black uppercase text-center shadow-xl tracking-widest italic border-b-4 border-indigo-500">
        {editingId ? "Update TDS Statutory Rule" : "Create New TDS Statutory Rule"}
      </div>

      <form onSubmit={handleSave} className="bg-white p-10 border rounded-b-2xl shadow-2xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
                <label className="font-black text-gray-500 uppercase block tracking-widest text-[9px]">TDS Section Code *</label>
                <input required className="w-full border-2 border-slate-100 p-3 rounded-lg font-black text-indigo-700 outline-none focus:border-indigo-400 uppercase shadow-sm" placeholder="e.g. 194J" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value.toUpperCase()})} />
            </div>
            <div className="space-y-1">
                <label className="font-black text-gray-500 uppercase block tracking-widest text-[9px]">PAN Status Mandatory?</label>
                <select className="w-full border-2 border-slate-100 p-3 rounded-lg bg-white font-bold outline-none focus:border-indigo-400 shadow-sm" value={formData.panStatus} onChange={e => setFormData({...formData, panStatus: e.target.value})}>
                    <option>Yes</option><option>No</option>
                </select>
            </div>
            <div className="space-y-1">
                <label className="font-black text-gray-500 uppercase block tracking-widest text-[9px]">Min Payment Threshold (₹)</label>
                <input type="number" required className="w-full border-2 border-slate-100 p-3 rounded-lg font-black text-blue-600 outline-none focus:border-blue-400 shadow-sm" value={formData.minThreshold} onChange={e => setFormData({...formData, minThreshold: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-1">
                <label className="font-black text-gray-500 uppercase block tracking-widest text-[9px]">TDS Percentage (%)</label>
                <input type="number" step="0.01" required className="w-full border-2 border-slate-100 p-3 rounded-lg font-black text-red-600 outline-none focus:border-red-400 shadow-sm" value={formData.tdsPercentage} onChange={e => setFormData({...formData, tdsPercentage: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="md:col-span-2 space-y-1">
                <label className="font-black text-indigo-700 uppercase block tracking-widest text-[9px] flex items-center gap-1"><Bookmark size={10}/> Linked TDS Payable Ledger *</label>
                <select 
                  required
                  className="w-full border-2 border-indigo-100 p-3 rounded-lg bg-white font-black text-indigo-900 outline-none focus:border-indigo-500 shadow-sm"
                  value={formData.ledgerId}
                  onChange={e => setFormData({...formData, ledgerId: e.target.value})}
                >
                  <option value="">-- Select TDS Ledger for Auto-Posting --</option>
                  {ledgers.map(l => <option key={l.id} value={l.id}>{l.name} [{l.code}]</option>)}
                </select>
                <p className="text-[8px] text-gray-400 italic">Voucher entry ke waqt isi ledger mein tax credit hoga.</p>
            </div>
            <div className="md:col-span-2 space-y-1">
                <label className="font-black text-gray-500 uppercase block tracking-widest text-[9px]">Statutory Description *</label>
                <input required className="w-full border-2 border-slate-100 p-3 rounded-lg font-bold outline-none focus:border-indigo-400 shadow-sm" placeholder="e.g. Fees for Professional or Technical Services" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value.toUpperCase()})} />
            </div>
        </div>

        <div className="pt-6">
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
            {editingId ? "Update TDS Configuration" : "Post Statutory Rule"}
          </button>
        </div>
      </form>
    </div>
  );
}
