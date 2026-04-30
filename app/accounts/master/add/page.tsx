"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Save, ShieldAlert, BadgeCheck, RotateCcw, Loader2, Landmark } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";

export default function AccountEntryPage() {
  const router = useRouter();
  const params = useParams(); // URL se ID nikalne ke liye
  const editingId = params?.id as string; // Agar URL mein ID hai toh edit mode

  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initial State - All Fields from Image 77
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

  // 1. LOAD MASTER DATA (Groups & Existing Ledger if Editing)
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // Load Groups
      const groupRes = await fetch("/api/accounting/groups");
      const groupData = await groupRes.json();
      setGroups(groupData || []);

      // If Editing, Load Ledger Details
      if (editingId) {
        const ledgerRes = await fetch(`/api/accounting/ledgers/${editingId}`);
        const ledgerData = await ledgerRes.json();
        if (ledgerRes.ok) {
          setFormData({
            ...ledgerData,
            openingAmt: Number(ledgerData.openingBalance),
            // Map any nested group data if necessary
            groupId: ledgerData.groupId
          });
        }
      } else {
        // Auto-generate next code for New Entry
        const nextCodeRes = await fetch("/api/accounting/ledgers/next-code");
        const nextCodeData = await nextCodeRes.json();
        setFormData(prev => ({ ...prev, code: nextCodeData.nextCode || "A001" }));
      }
    } catch (err) {
      toast.error("Failed to sync with master records");
    } finally {
      setLoading(false);
    }
  }, [editingId]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  // 2. AUTOMATION: GST No se PAN extract karna (Image 77 Logic)
  const handleGSTChange = (val: string) => {
    const uppercaseVal = val.toUpperCase();
    let pan = formData.panNo;
    if (uppercaseVal.length >= 12) {
      // Logic: GST ke character index 2 se 12 tak PAN hota hai (Total 10 digits)
      pan = uppercaseVal.substring(2, 12); 
    }
    setFormData({...formData, gstNo: uppercaseVal, panNo: pan});
  };

  // 3. SAVE OR UPDATE HANDLER
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.groupId || !formData.name) return toast.error("Kripya mandatory fields bharein!");
    
    setIsSaving(true);
    const loadId = toast.loading(editingId ? "Updating ledger..." : "Creating new ledger...");
    
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/accounting/ledgers/${editingId}` : "/api/accounting/ledgers";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(editingId ? "Ledger updated successfully!" : "New Account Created!", { id: loadId });
        router.push("/accounts/master");
        router.refresh();
      } else {
        toast.error(result.error || "Save fail ho gaya!", { id: loadId });
      }
    } catch (err) {
      toast.error("Network Error! Server check karein.", { id: loadId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold animate-pulse uppercase tracking-widest">Opening Master Registry...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-4 text-[11px] animate-in slide-in-from-right-4 duration-500">
      
      {/* ACTION TOP BAR */}
      <div className="flex gap-2">
        <button onClick={() => router.push('/accounts/master')} className="bg-red-500 text-white px-6 py-2 rounded font-black flex items-center gap-2 shadow-lg uppercase transition-all active:scale-95">
          <ArrowLeft size={16}/> Back To Registry
        </button>
      </div>

      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg font-black uppercase text-center tracking-[3px] shadow-md italic border-b-2 border-indigo-300">
        Account Master | {editingId ? "Update Ledger Details" : "Ledger Creation Interface"}
      </div>

      <form onSubmit={handleSave} className="bg-white p-10 border rounded-b-lg shadow-2xl space-y-10">
        
        {/* ROW 1: CORE IDENTITY (Mapping Image 77) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-1">
            <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest">Account Code</label>
            <input 
                required 
                className="w-full border-2 border-slate-100 p-2.5 rounded bg-slate-50 font-black text-indigo-700 outline-none focus:border-indigo-400" 
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
            />
          </div>
          <div className="md:col-span-1 space-y-1">
            <label className="font-black text-indigo-600 uppercase text-[9px] tracking-widest">Account Group *</label>
            <select 
                required 
                className="w-full border-2 border-indigo-50 p-2.5 rounded bg-white font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-sm" 
                value={formData.groupId} 
                onChange={e => setFormData({...formData, groupId: e.target.value})}
            >
              <option value="">-- Choose Group --</option>
              {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.code})</option>
              ))}
              {/* Fallback hardcoded if groups don't load */}
              {groups.length === 0 && (
                <>
                    <option value="G01">SUNDRY DEBTORS (PARTIES)</option>
                    <option value="G07">CASH IN HAND</option>
                    <option value="G08">BANK ACCOUNTS</option>
                </>
              )}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest">Full Account Name / Merchant Title *</label>
            <input 
                required 
                placeholder="e.g. ABHISHEK KISAN OR OFFICE RENT" 
                className="w-full border-2 border-slate-100 p-2.5 rounded font-black text-slate-800 uppercase outline-none focus:border-indigo-400 shadow-sm" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} 
            />
          </div>
        </div> 
        
        {/* ROW 2: CONTACT & TAX COMPLIANCE */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-4 space-y-1">
            <label className="font-black text-gray-400 uppercase text-[9px]">Registered Office Address</label>
            <input className="w-full border-2 border-slate-100 p-2.5 rounded outline-none focus:border-indigo-400" placeholder="Street, Village, Tehsil, District..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="font-black text-gray-400 uppercase text-[9px]">Mobile / WhatsApp</label>
            <input className="w-full border-2 border-slate-100 p-2.5 rounded font-bold outline-none focus:border-indigo-400" placeholder="10 Digit Mobile" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="font-black text-gray-400 uppercase text-[9px] flex items-center gap-1 italic">PAN (Auto-Extract) <ShieldAlert size={10}/></label>
            <input className="w-full border-2 border-slate-100 p-2.5 rounded uppercase font-mono font-black text-blue-600 outline-none" value={formData.panNo} onChange={e => setFormData({...formData, panNo: e.target.value.toUpperCase()})} />
          </div>
          <div className="space-y-1">
            <label className="font-black text-gray-400 uppercase text-[9px]">GST Registration</label>
            <select className="w-full border-2 border-slate-100 p-2.5 rounded bg-white font-bold outline-none focus:border-indigo-500" value={formData.gstType} onChange={e => setFormData({...formData, gstType: e.target.value})}>
              <option>NA</option><option>Registered</option><option>Unregistered</option><option>Composition</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="font-black text-gray-400 uppercase text-[9px] tracking-tighter">State</label>
              <input className="w-full border-2 border-slate-100 p-2.5 rounded bg-slate-50 uppercase font-black" value={formData.stateName} onChange={e => setFormData({...formData, stateName: e.target.value})} />
            </div>
            <div className="w-16 space-y-1">
              <label className="font-black text-gray-400 uppercase text-[9px] tracking-tighter">Code</label>
              <input className="w-full border-2 border-slate-100 p-2.5 rounded bg-slate-100 text-center font-black text-indigo-700" value={formData.stateCode} readOnly />
            </div>
          </div>
        </div>

        {/* ROW 3: FINANCIALS & CREDIT LIMIT */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 bg-indigo-50/50 p-8 rounded-2xl border-2 border-dashed border-indigo-100 shadow-inner">
           <div className="space-y-1">
             <label className="font-black text-indigo-700 uppercase text-[9px] flex items-center gap-2 tracking-widest">
                <BadgeCheck size={14}/> GSTIN Number *
             </label>
             <input 
                className="w-full border-2 border-indigo-200 p-3 rounded-lg uppercase font-mono font-black text-indigo-900 outline-none focus:border-indigo-600 shadow-sm" 
                placeholder="06XXXXX0000X1ZX"
                value={formData.gstNo} 
                onChange={e => handleGSTChange(e.target.value)} 
             />
           </div>
           <div className="space-y-1">
             <label className="font-black text-gray-400 uppercase text-[9px]">Opening Balance (₹)</label>
             <input type="number" className="w-full border-2 border-slate-200 p-3 rounded-lg font-black text-blue-700 text-xl shadow-sm outline-none focus:border-blue-400" value={formData.openingAmt} onChange={e => setFormData({...formData, openingAmt: parseFloat(e.target.value) || 0})} />
           </div>
           <div className="space-y-1">
             <label className="font-black text-gray-400 uppercase text-[9px]">Balance Type</label>
             <select className="w-full border-2 border-slate-200 p-3 rounded-lg bg-white font-black text-sm shadow-sm outline-none" value={formData.openingMode} onChange={e => setFormData({...formData, openingMode: e.target.value})}>
               <option className="text-red-600" value="Debit">DEBIT (Dr) - Receivables</option>
               <option className="text-green-600" value="Credit">CREDIT (Cr) - Payables</option>
             </select>
           </div>
           <div className="space-y-1">
             <label className="font-black text-red-600 uppercase text-[9px] italic flex items-center gap-1">Credit Limit Wall <ShieldAlert size={14}/></label>
             <input type="number" className="w-full border-2 border-red-100 p-3 rounded-lg font-black text-red-600 text-xl outline-none focus:border-red-500 shadow-sm" value={formData.maxAllowedCredit} onChange={e => setFormData({...formData, maxAllowedCredit: parseFloat(e.target.value) || 0})} />
           </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-center pt-6">
          <button 
            type="submit" 
            disabled={isSaving}
            className="bg-red-600 hover:bg-red-700 text-white font-black px-40 py-4 rounded-xl shadow-2xl transition-all uppercase text-sm tracking-widest flex items-center gap-4 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>}
            {editingId ? "Synchronize Ledger Details" : "Finalize Account Creation"}
          </button>
        </div>
      </form>

      {/* FOOTER INFO */}
      <div className="text-center opacity-40 italic text-[9px] font-bold uppercase tracking-[10px] mt-4">
        Cold Storage Intelligence
      </div>
    </div>
  );
}
