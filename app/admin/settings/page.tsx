"use client";

import React, { useEffect, useState } from "react";
import { Save, Settings2, ShieldCheck, Info, Loader2, Landmark } from "lucide-react";
import { toast } from "react-hot-toast";

// ERP ki zaroori keys jo backend use karta hai
const REQUIRED_SETTINGS = [
  { key: "CASH_LEDGER_ID", label: "Default Cash Ledger", desc: "Used for Quick Receipts" },
  { key: "RENT_INCOME_ID", label: "Rent Income Account", desc: "P&L account for storage revenue" }, // <--- Ye line add karo
  { key: "LABOUR_CONTRACTOR_ID", label: "Labour Contractor (Payable)", desc: "Liability for workers" },
  { key: "LABOUR_EXPENSE_ID", label: "Labour Expense Account", desc: "P&L account for labour cost" },
  { key: "CGST_OUTPUT_ID", label: "CGST Output Ledger", desc: "Tax account" },
  { key: "SGST_OUTPUT_ID", label: "SGST Output Ledger", desc: "Tax account" },
];

export default function SystemSettingsPage() {
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  // 1. Load data from API
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/masters/settings");
      const data = await res.json();
      
      setLedgers(data.ledgers || []);
      
      // Settings array ko object mein convert karein { key: value }
      const initialMappings: Record<string, string> = {};
      data.settings?.forEach((s: any) => {
        initialMappings[s.key] = s.value;
      });
      
      // Default to "8888" if ADMIN_RECOVERY_PIN is not in database
      if (initialMappings["ADMIN_RECOVERY_PIN"] === undefined) {
        initialMappings["ADMIN_RECOVERY_PIN"] = "8888";
      }
      
      setMappings(initialMappings);
    } catch (err) {
      toast.error("Settings load karne mein fail!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // 2. Save individual setting
  const saveSetting = async (key: string, value: string) => {
    if (key === "ADMIN_RECOVERY_PIN") {
      if (!value || value.length !== 4) {
        return toast.error("Admin Recovery PIN exactly 4 digits ka hona chahiye!");
      }
    } else {
      if (!value) return toast.error("Pehle Ledger select karein!");
    }
    
    setIsSaving(key);
    try {
      const res = await fetch("/api/masters/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      });

      if (res.ok) {
        const displayName = key === "ADMIN_RECOVERY_PIN" ? "Admin Recovery PIN" : key;
        toast.success(`${displayName} updated successfully!`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || "Save nahi ho paya.");
      }
    } catch (err) {
      toast.error("Network Error!");
    } finally {
      setIsSaving(null);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold animate-pulse">Initializing System Mappings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-[11px] animate-in fade-in duration-500">
      
      {/* Header Bar */}
      <div className="bg-[#5d5fb1] text-white p-4 rounded-t-lg shadow-lg flex justify-between items-center">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-widest">
          <Settings2 size={20}/> ERP System Configuration
        </h2>
        <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase italic">
          Master Mappings
        </span>
      </div>

      {/* Safety Warning */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm flex gap-4">
        <div className="text-amber-600"><Info size={24}/></div>
        <div>
          <p className="font-bold text-amber-800 text-xs">Crucial Configuration Area</p>
          
        </div>
      </div>

      {/* Settings Grid */}
      <div className="bg-white border rounded-b-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b font-black text-slate-500 uppercase text-[9px]">
            <tr>
              <th className="p-4 w-1/3">Function / Key</th>
              <th className="p-4">Linked Accounting Ledger</th>
              <th className="p-4 text-center w-32">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {REQUIRED_SETTINGS.map((item) => (
              <tr key={item.key} className="hover:bg-slate-50/50 transition-all">
                <td className="p-4">
                  <div className="font-black text-slate-700 uppercase tracking-tighter">{item.label}</div>
                  <div className="text-[9px] text-gray-400 italic mt-0.5">{item.desc}</div>
                  <code className="text-[8px] bg-slate-100 text-indigo-600 px-1 rounded mt-2 inline-block">{item.key}</code>
                </td>
                <td className="p-4">
                  <select 
                    className="w-full border-2 border-slate-100 p-2 rounded-md font-bold text-indigo-700 outline-none focus:border-indigo-400 bg-white"
                    value={mappings[item.key] || ""}
                    onChange={(e) => setMappings({...mappings, [item.key]: e.target.value})}
                  >
                    <option value="">-- Choose Account --</option>
                    {ledgers.map(l => (
                      <option key={l.id} value={l.id}>{l.name} [{l.code}]</option>
                    ))}
                  </select>
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => saveSetting(item.key, mappings[item.key])}
                    disabled={isSaving === item.key}
                    className="bg-[#10b981] hover:bg-green-700 text-white px-4 py-2 rounded font-black uppercase flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSaving === item.key ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}
                    Link
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Security Config */}
      <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs border-b pb-2 flex items-center gap-2">
          <ShieldCheck className="text-red-500" size={16}/> Admin Password Recovery Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-1">
            <label className="font-black text-gray-500 uppercase text-[9px] tracking-wider block">Admin Recovery PIN (4 Digits)</label>
            <input 
              type="text" 
              maxLength={4}
              pattern="[0-9]{4}"
              className="w-full border-2 border-slate-100 p-2 text-center font-black text-indigo-700 outline-none focus:border-indigo-400 bg-white"
              value={mappings["ADMIN_RECOVERY_PIN"] || ""}
              onChange={(e) => setMappings({...mappings, "ADMIN_RECOVERY_PIN": e.target.value.replace(/\D/g, "")})}
            />
          </div>
          <div className="text-gray-400 text-[9px] italic">
            Note: This 4-digit PIN is used on the Login page to reset the Admin account password. Keep it secure and do not share it.
          </div>
          <div className="text-right">
            <button 
              onClick={() => saveSetting("ADMIN_RECOVERY_PIN", mappings["ADMIN_RECOVERY_PIN"] || "")}
              disabled={isSaving === "ADMIN_RECOVERY_PIN"}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded font-black uppercase flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 ml-auto"
            >
              {isSaving === "ADMIN_RECOVERY_PIN" ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}
              Save PIN
            </button>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="flex justify-between items-center px-2 opacity-50">
        <p className="flex items-center gap-1 font-bold"><ShieldCheck size={14}/> All changes are logged for security</p>
        <p>Cold Storage v1.0.4</p>
      </div>

    </div>
  );
}
