"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Save, ShieldAlert, BadgeCheck, RotateCcw, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";

export default function AccountEditPage() {
  const router = useRouter();
  const params = useParams();
  const editingId = params?.id as string; // URL se Ledger ID nikalna

  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: "", 
    name: "", 
    groupId: "", 
    address: "",
    mobile: "", 
    panNo: "", 
    gstType: "NA", 
    stateName: "Haryana", 
    stateCode: "06", 
    gstNo: "",
    openingAmt: 0, 
    openingMode: "Debit", 
    maxAllowedCredit: 0
  });

  // 1. LOAD DATA (Real Group aur Existing Ledger Details)
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // Load Account Groups
      const groupRes = await fetch("/api/accounting/groups");
      const groupData = await groupRes.json();
      setGroups(groupData || []);

      // Load Existing Ledger Details
      const ledgerRes = await fetch(`/api/accounting/ledgers/${editingId}`);
      if (!ledgerRes.ok) throw new Error("Ledger not found");
      const ledgerData = await ledgerRes.json();

      setFormData({
        ...ledgerData,
        openingAmt: Number(ledgerData.openingBalance),
        groupId: ledgerData.groupId
      });
    } catch (err) {
      toast.error("Account details load nahi ho payi!");
      router.push("/accounts/master");
    } finally {
      setLoading(false);
    }
  }, [editingId, router]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  // 2. AUTOMATION: GST to PAN extraction
  const handleGSTChange = (val: string) => {
    const uppercaseVal = val.toUpperCase();
    let pan = formData.panNo;
    if (uppercaseVal.length >= 12) {
      pan = uppercaseVal.substring(2, 12); 
    }
    setFormData({...formData, gstNo: uppercaseVal, panNo: pan});
  };

  // 3. UPDATE HANDLER
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const loadId = toast.loading("Updating ledger details...");

    try {
      const res = await fetch(`/api/accounting/ledgers/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Ledger updated successfully!", { id: loadId });
        router.push("/accounts/master");
        router.refresh();
      } else {
        const result = await res.json();
        toast.error(result.error || "Update failed", { id: loadId });
      }
    } catch (err) {
      toast.error("Network Error!", { id: loadId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold animate-pulse text-indigo-600 uppercase tracking-widest">Fetching Account Profile...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-4 text-[11px] animate-in slide-in-from-right-4 duration-500">
      <div className="flex gap-2">
        <button onClick={() => router.push('/accounts/master')} className="bg-red-500 text-white px-6 py-2 rounded font-black flex items-center gap-2 shadow-lg uppercase active:scale-95 transition-all">
          <ArrowLeft size={16}/> Back To Registry
        </button>
      </div>

      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg font-black uppercase text-center tracking-[5px] shadow-md italic border-b-4 border-indigo-300">
        Account Master | Edit Ledger Profile
      </div>

      <form onSubmit={handleUpdate} className="bg-white p-10 border rounded-b-lg shadow-2xl space-y-10">
        
        {/* ROW 1: CORE IDENTITY */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest block mb-1">Account Code</label>
            <input required className="w-full border-2 border-slate-100 p-2.5 rounded bg-slate-50 font-black text-indigo-700 outline-none focus:border-indigo-400" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
          </div>
          <div className="md:col-span-1">
            <label className="font-black text-indigo-600 uppercase text-[9px] tracking-widest block mb-1">Account Group head *</label>
            <select required className="w-full border-2 border-indigo-50 p-2.5 rounded bg-white font-bold text-slate-700 outline-none focus:border-indigo-500" value={formData.groupId} onChange={e => setFormData({...formData, groupId: e.target.value})}>
              <option value="">-- Choose Group --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.code})</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest block mb-1">Full Account Title *</label>
            <input required className="w-full border-2 border-slate-100 p-2.5 rounded font-black text-slate-800 uppercase outline-none focus:border-indigo-400" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
          </div>
        </div> 

        {/* ROW 2: CONTACT & ADDRESS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-4">
            <label className="font-black text-gray-400 uppercase text-[9px] block mb-1">Office / Residential Address</label>
            <input className="w-full border-2 border-slate-100 p-2.5 rounded outline-none focus:border-indigo-400 font-medium" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div>
            <label className="font-black text-gray-400 uppercase text-[9px] block mb-1">Mobile / WhatsApp</label>
            <input className="w-full border-2 border-slate-100 p-2.5 rounded font-bold outline-none focus:border-indigo-400" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
          </div>
          <div>
            <label className="font-black text-gray-400 uppercase text-[9px] block mb-1 italic">PAN Number (Auto)</label>
            <input className="w-full border-2 border-slate-100 p-2.5 rounded uppercase font-mono font-black text-blue-600 outline-none" value={formData.panNo} onChange={e => setFormData({...formData, panNo: e.target.value.toUpperCase()})} />
          </div>
          <div>
            <label className="font-black text-gray-400 uppercase text-[9px] block mb-1">GST Registration</label>
            <select className="w-full border-2 border-slate-100 p-2.5 rounded bg-white font-bold outline-none focus:border-indigo-500" value={formData.gstType} onChange={e => setFormData({...formData, gstType: e.target.value})}>
              <option>NA</option><option>Registered</option><option>Unregistered</option><option>Composition</option>
            </select>
          </div>
        </div>

        {/* ROW 3: FINANCIALS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 bg-indigo-50/50 p-8 rounded-2xl border-2 border-dashed border-indigo-100 shadow-inner">
           <div>
             <label className="font-black text-indigo-700 uppercase text-[9px] flex items-center gap-2 tracking-widest mb-1"><BadgeCheck size={14}/> GSTIN Number</label>
             <input className="w-full border-2 border-indigo-200 p-3 rounded-lg uppercase font-mono font-black text-indigo-900 outline-none focus:border-indigo-600 shadow-sm" value={formData.gstNo} onChange={e => handleGSTChange(e.target.value)} />
           </div>
           <div>
             <label className="font-black text-gray-400 uppercase text-[9px] block mb-1">Opening Balance (₹)</label>
             <input type="number" className="w-full border-2 border-slate-200 p-3 rounded-lg font-black text-blue-700 text-xl outline-none focus:border-blue-400" value={formData.openingAmt} onChange={e => setFormData({...formData, openingAmt: parseFloat(e.target.value) || 0})} />
           </div>
           <div>
             <label className="font-black text-gray-400 uppercase text-[9px] block mb-1">Balance Type</label>
             <select className="w-full border-2 border-slate-200 p-3 rounded-lg bg-white font-black text-sm shadow-sm outline-none" value={formData.openingMode} onChange={e => setFormData({...formData, openingMode: e.target.value})}>
               <option className="text-red-600" value="Debit">DEBIT (Dr)</option>
               <option className="text-green-600" value="Credit">CREDIT (Cr)</option>
             </select>
           </div>
           <div>
             <label className="font-black text-red-600 uppercase text-[9px] italic flex items-center gap-1 mb-1"><ShieldAlert size={14}/> Credit Limit Wall</label>
             <input type="number" className="w-full border-2 border-red-100 p-3 rounded-lg font-black text-red-600 text-xl outline-none focus:border-red-500 shadow-sm" value={formData.maxAllowedCredit} onChange={e => setFormData({...formData, maxAllowedCredit: parseFloat(e.target.value) || 0})} />
           </div>
        </div>

        <div className="flex justify-center pt-6">
          <button 
            type="submit" 
            disabled={isSaving}
            className="bg-[#10b981] hover:bg-green-700 text-white font-black px-40 py-4 rounded-xl shadow-2xl transition-all uppercase text-sm tracking-widest flex items-center gap-4 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>}
            Sync Ledger Updates
          </button>
        </div>
      </form>
    </div>
  );
}