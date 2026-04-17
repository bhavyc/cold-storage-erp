"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, ShieldAlert, BadgeCheck, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function AccountEntryPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: "A001", name: "", groupId: "", address: "",
    mobile: "", panNo: "", gstType: "NA", 
    stateName: "Haryana", stateCode: "06", gstNo: "",
    openingAmt: 0, openingMode: "Debit", maxAllowedCredit: 0
  });

  // AUTOMATION: GST No se PAN extract karna (First 10 chars after first 2)
  const handleGSTChange = (val: string) => {
    const uppercaseVal = val.toUpperCase();
    let pan = formData.panNo;
    if (uppercaseVal.length >= 12) {
      pan = uppercaseVal.substring(2, 12); // Logic: GST ke beech ke 10 digit PAN hote hain
    }
    setFormData({...formData, gstNo: uppercaseVal, panNo: pan});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.groupId) return toast.error("Bhai, Group select karna zaroori hai!");
    
    const loadId = toast.loading("Ledger create ho raha hai...");
    try {
      const res = await fetch("/api/accounting/ledgers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("Mubarak ho! Naya Ledger taiyar hai.", { id: loadId });
        router.push("/accounts/master");
      } else {
        toast.error("Kuch gadbad hui!", { id: loadId });
      }
    } catch (err) {
      toast.error("Network Error!", { id: loadId });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 text-[11px] animate-in slide-in-from-right-4 duration-500">
      <div className="flex gap-2">
        <button onClick={() => router.back()} className="bg-red-500 text-white px-6 py-2 rounded font-black flex items-center gap-1 shadow-lg uppercase transition-all active:scale-95">
          <ArrowLeft size={14}/> Back To List
        </button>
      </div>

      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg font-black uppercase text-center tracking-widest shadow-md italic">
        Account Master | Ledger Creation Form
      </div>

      <form onSubmit={handleSave} className="bg-white p-8 border rounded-b-lg shadow-2xl space-y-8">
        {/* ROW 1: CORE DETAILS (Image 77) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="font-bold text-gray-400 uppercase block mb-1">Account Code</label>
            <input required className="w-full border p-2.5 rounded bg-slate-50 font-black text-indigo-700" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
          </div>
          <div className="md:col-span-1">
            <label className="font-black text-indigo-600 uppercase block mb-1">Account Group *</label>
            <select required className="w-full border-2 border-indigo-100 p-2.5 rounded bg-white font-bold text-slate-700 outline-none focus:border-indigo-500" value={formData.groupId} onChange={e => setFormData({...formData, groupId: e.target.value})}>
              <option value="">-- Select Group --</option>
              <option value="G01">(G01) SUNDRY DEBTORS (PARTIES)</option>
              <option value="G07">(G07) CASH IN HAND</option>
              <option value="G08">(G08) BANK ACCOUNTS</option>
              <option value="G05">(G05) INDIRECT EXPENSES</option>
            </select>

          </div>
          <div className="md:col-span-2">
            <label className="font-bold text-gray-400 uppercase block mb-1">Full Account Name *</label>
            <input required placeholder="e.g. ABHISHEK KISAN or OFFICE RENT" className="w-full border p-2.5 rounded font-black text-slate-800 uppercase outline-none focus:ring-1 focus:ring-indigo-400" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
        </div> 
        
        {/* ROW 2: CONTACT & TAX (Image 77) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-4">
            <label className="font-bold text-gray-400 uppercase block mb-1">Address</label>
            <input className="w-full border p-2 rounded" placeholder="Complete Location Address..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div>
            <label className="font-bold text-gray-400 uppercase block mb-1">Mobile Number</label>
            <input className="w-full border p-2 rounded font-bold" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
          </div>
          <div>
            <label className="font-bold text-gray-400 uppercase block mb-1 flex items-center gap-1 italic">PAN Number <ShieldAlert size={10}/></label>
            <input className="w-full border p-2 rounded uppercase font-mono font-bold text-blue-600" value={formData.panNo} onChange={e => setFormData({...formData, panNo: e.target.value.toUpperCase()})} />
          </div>
          <div>

            <label className="font-bold text-gray-400 uppercase block mb-1">GST Registration Type</label>
            <select className="w-full border p-2 rounded bg-white font-medium" value={formData.gstType} onChange={e => setFormData({...formData, gstType: e.target.value})}>
              <option>NA</option><option>Registered</option><option>Unregistered</option><option>Composition</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="font-bold text-gray-400 uppercase block mb-1 tracking-tighter">State</label>
              <input className="w-full border p-2 rounded bg-slate-50 uppercase font-bold" value={formData.stateName} readOnly />
            </div>
            <div className="w-12">
              <label className="font-bold text-gray-400 uppercase block mb-1 tracking-tighter">Code</label>
              <input className="w-full border p-2 rounded bg-slate-100 text-center font-black text-indigo-700" value={formData.stateCode} readOnly />
            </div>
          </div>
        </div>

        {/* ROW 3: FINANCIALS & LIMITS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-200">
           <div>
             <label className="font-black text-indigo-700 uppercase block mb-1 flex items-center gap-1 tracking-widest">GSTIN Number <BadgeCheck size={12}/></label>
             <input className="w-full border-2 border-indigo-100 p-2.5 rounded uppercase font-mono font-black text-indigo-800 outline-none focus:border-indigo-500" value={formData.gstNo} onChange={e => handleGSTChange(e.target.value)} />
           </div>
           <div>
             <label className="font-bold text-gray-400 uppercase block mb-1">Opening Balance</label>
             <input type="number" className="w-full border p-2.5 rounded font-black text-blue-600 text-lg" value={formData.openingAmt} onChange={e => setFormData({...formData, openingAmt: parseFloat(e.target.value)})} />
           </div>
           <div>
             <label className="font-bold text-gray-400 uppercase block mb-1">Balance Type</label>
             <select className="w-full border p-2.5 rounded bg-white font-black text-sm" value={formData.openingMode} onChange={e => setFormData({...formData, openingMode: e.target.value})}>
               <option className="text-red-600" value="Debit">DEBIT (Dr)</option>
               <option className="text-green-600" value="Credit">CREDIT (Cr)</option>
             </select>
           </div>
           <div>
             <label className="font-bold text-red-600 uppercase block mb-1 italic flex items-center gap-1">Credit Limit Wall <ShieldAlert size={12}/></label>
             <input type="number" className="w-full border-2 border-red-100 p-2.5 rounded font-black text-red-600 text-lg outline-none focus:border-red-500" value={formData.maxAllowedCredit} onChange={e => setFormData({...formData, maxAllowedCredit: parseFloat(e.target.value)})} />
           </div>
        </div>

        <div className="flex justify-center pt-4">
          <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-black px-32 py-3 rounded-md shadow-2xl transition-all uppercase text-sm tracking-widest flex items-center gap-3 active:scale-95">
            <Save size={20}/> Submit Account Details
          </button>
        </div>
      </form>
    </div>
  );
}