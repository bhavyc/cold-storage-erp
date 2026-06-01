"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, Users, Phone, ShieldCheck, Landmark, FileText, X, Edit, Trash2, Loader2, Save, Info ,FileSpreadsheet,Printer , ClipboardList, IndianRupee,Tag} from "lucide-react";
import { toast } from "react-hot-toast";

interface Party {
  id: string;
  partyCode: string;
  tradeName: string;
  proprietor?: string;
  address?: string;
  pincode?: string;
  contactPerson?: string;
  designation?: string;
  email?: string;
  mobiles: string[];
  gstType?: string;
  stateName?: string;
  stateCode?: string;
  panNo?: string;
  gstNo?: string;
  aadharNo?: string;
  bankName?: string;
  branch?: string;
  accountNo?: string;
  ifsc?: string;
  holderName?: string;
  billNilLot: boolean;
  billMonthly: boolean;
  billTransport: boolean;
  billSpace: boolean;
  billBalance: boolean;
  billItemDay: boolean;
  billFixed: boolean;
  billCyclic: boolean;
  billDispatch: boolean;
  billItem: boolean;
  billGeneral: boolean;
  billWeekly: boolean;
  billUntouched: boolean;
  billLabour: boolean;
  billCA: boolean;
  billSlip: boolean;
  graceDays: number;
  maxAllowedCredit: number;
  openingBalance: number;
  openingMode: string;
  _count?: { lots: number };
}

export default function PartyMasterPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 1. Initial State for Form
  const initialFormData = {
    partyCode: "", tradeName: "", proprietor: "", address: "", pincode: "",
    contactPerson: "", designation: "", email: "", mobiles: Array(10).fill(""),
    gstType: "Registered", stateName: "Haryana", stateCode: "06", panNo: "", gstNo: "", aadharNo: "",
    bankName: "", branch: "", accountNo: "", ifsc: "", holderName: "",
    billNilLot: false, billMonthly: false, billTransport: false, billSpace: false,
    billBalance: false, billItemDay: false, billFixed: false, billCyclic: false,
    billDispatch: false, billItem: false, billGeneral: false, billWeekly: false,
    billUntouched: false, billLabour: true, billCA: false, billSlip: false,
    graceDays: 10, maxAllowedCredit: 50000, openingAmt: 0, openingMode: "Debit"
  };

  const [formData, setFormData] = useState<any>(initialFormData);

  // 2. FETCH LIST
  const fetchParties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/masters/party");
      const data = await res.json();
      setParties(data || []);
    } catch (err) {
      toast.error("Failed to load parties!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchParties(); }, [fetchParties]);

  // 3. EDIT TRIGGER (Populate every single field from the Image 11 mapping)
  const handleEdit = (party: Party) => {
    setEditingId(party.id);
    setFormData({
      id: party.id,
      partyCode: party.partyCode,
      tradeName: party.tradeName,
      proprietor: party.proprietor || "",
      address: party.address || "",
      pincode: party.pincode || "",
      contactPerson: party.contactPerson || "",
      designation: party.designation || "",
      email: party.email || "",
      // Fix mobiles: Ensure it's always an array of 10
      mobiles: [...(party.mobiles || []), ...Array(10)].slice(0, 10),
      gstType: party.gstType || "Registered",
      stateName: party.stateName || "Haryana",
      stateCode: party.stateCode || "06",
      panNo: party.panNo || "",
      gstNo: party.gstNo || "",
      aadharNo: party.aadharNo || "",
      bankName: party.bankName || "",
      branch: party.branch || "",
      accountNo: party.accountNo || "",
      ifsc: party.ifsc || "",
      holderName: party.holderName || "",
      billNilLot: party.billNilLot,
      billMonthly: party.billMonthly,
      billTransport: party.billTransport,
      billSpace: party.billSpace,
      billBalance: party.billBalance,
      billItemDay: party.billItemDay,
      billFixed: party.billFixed,
      billCyclic: party.billCyclic,
      billDispatch: party.billDispatch,
      billItem: party.billItem,
      billGeneral: party.billGeneral,
      billWeekly: party.billWeekly,
      billUntouched: party.billUntouched,
      billLabour: party.billLabour,
      billCA: party.billCA,
      billSlip: party.billSlip,
      graceDays: party.graceDays,
      maxAllowedCredit: Number(party.maxAllowedCredit),
      openingAmt: Number(party.openingBalance),
      openingMode: party.openingMode
    });
    setIsModalOpen(true);
  };

  // 4. ADD NEW TRIGGER
  const handleAddNew = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  // 5. SUBMIT HANDLER (Handles both POST and UPDATE)
  // app/masters/party/page.tsx ke andar handleSubmit function update karein

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.partyCode || !formData.tradeName) return toast.error("Code and Name are mandatory!");

  setIsSaving(true);
  
  // ✅ FIX: Backend bhejne se pehle data sanitize karein
  const sanitizedData = {
    ...formData,
    mobiles: formData.mobiles.filter((m: any) => m !== null && m !== undefined && m !== "")
  };

  try {
    const res = await fetch("/api/masters/party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitizedData) // Sanitized data bhejein
    });

    const result = await res.json();

    if (res.ok) {
      toast.success(editingId ? "Merchant Profile Updated!" : "New Merchant Registered!");
      setIsModalOpen(false);
      fetchParties();
    } else {
      toast.error(result.error || "Operation failed");
    }
  } catch (err) {
    toast.error("Network Error!");
  } finally {
    setIsSaving(false);
  }
};

  // Filter logic
  const filtered = parties.filter(p => 
    p.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.partyCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500 text-[11px]">
      {/* HEADER */}
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg flex justify-between items-center shadow-lg">
        <h2 className="font-bold flex items-center gap-2 uppercase tracking-widest"><Users size={18}/> Merchant / Party Master (Debtors)</h2>
        <button onClick={handleAddNew} className="bg-orange-500 hover:bg-orange-600 px-6 py-1.5 rounded-md font-black shadow-md transition-all active:scale-95">+ ADD NEW MERCHANT</button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border-l-4 border-l-green-500 shadow-sm">
          <p className="text-[10px] text-gray-400 font-black uppercase">Total Accounts</p>
          <p className="text-2xl font-black text-slate-800">{parties.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border-l-4 border-l-indigo-500 shadow-sm">
          <p className="text-[10px] text-gray-400 font-black uppercase">Active Stock Items</p>
          <p className="text-2xl font-black text-slate-800">{parties.reduce((s, p) => s + (p._count?.lots || 0), 0)}</p>
        </div>
      </div>

      {/* SEARCH & TABLE */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-4 border-b bg-slate-50 flex justify-between">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input type="text" placeholder="Search Merchant Code or Name..." className="pl-10 pr-4 py-2 border-2 border-slate-100 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
           <div className="flex gap-2">
             <button className="bg-green-600 text-white p-2 rounded shadow"><FileSpreadsheet size={16}/></button>
             <button className="bg-red-500 text-white p-2 rounded shadow"><Printer size={16}/></button>
           </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f8f9fa] text-slate-600 uppercase font-black text-[10px] border-b">
            <tr>
              <th className="p-4 border-r">Code</th>
              <th className="p-4 border-r">Merchant / Trade Name</th>
              <th className="p-4 border-r">Primary Mobile</th>
              <th className="p-4 border-r text-center">GST No</th>
              <th className="p-4 border-r text-center">Grace</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-20 text-center animate-pulse text-indigo-700 font-black uppercase tracking-widest">Compiling Merchant Registry...</td></tr>
            ) : filtered.map((party) => (
              <tr key={party.id} className="border-b hover:bg-indigo-50/40 transition-colors font-bold group">
                <td className="p-4 border-r font-black text-indigo-700">{party.partyCode}</td>
                <td className="p-4 border-r uppercase text-slate-700">{party.tradeName}</td>
                <td className="p-4 border-r font-mono text-gray-500">{party.mobiles?.[0] || "---"}</td>
                <td className="p-4 border-r text-center font-mono text-blue-600">{party.gstNo || "UNREGISTERED"}</td>
                <td className="p-4 border-r text-center text-red-600 bg-red-50/20">{party.graceDays} Days</td>
                <td className="p-4 text-center">
                   <div className="flex justify-center gap-4">
                      <button onClick={() => handleEdit(party)} className="text-blue-600 hover:scale-125 transition-transform"><Edit size={16}/></button>
                      <button className="text-red-500 hover:scale-125 transition-transform"><Trash2 size={16}/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MASSIVE MODAL (Mapping Images 11, 12, 13) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#f8f9fa] w-full max-w-6xl h-[92vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#4a4ea3] text-white p-4 flex justify-between items-center shadow-lg border-b-4 border-indigo-400">
              <h3 className="font-black uppercase text-sm tracking-[5px] italic">
                {editingId ? "Update Merchant Profile" : "New Merchant Entry Form"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-all"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
              
              {/* SECTION 1: CORE PROFILE */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <div className="md:col-span-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Party Code *</label>
                   <input required className="w-full border-2 border-slate-100 p-2.5 rounded text-sm bg-slate-50 font-black text-indigo-700 outline-none focus:border-indigo-400" value={formData.partyCode} onChange={e => setFormData({...formData, partyCode: e.target.value.toUpperCase()})} />
                 </div>
                 <div className="md:col-span-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Full Trade Name / Kisan Name *</label>
                   <input required className="w-full border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-400 font-bold uppercase" value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value.toUpperCase()})} />
                 </div>
                 <div className="md:col-span-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Proprietor Name</label>
                   <input className="w-full border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-400 uppercase" value={formData.proprietor} onChange={e => setFormData({...formData, proprietor: e.target.value})} />
                 </div>
                 <div className="md:col-span-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Email Address</label>
                   <input type="email" className="w-full border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-400 font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                 </div>
                 <div className="md:col-span-4">
                   <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Permanent Address</label>
                   <input className="w-full border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-400" placeholder="Village, Tehsil, District..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                 </div>
              </div>

              {/* SECTION 2: 10 WHATSAPP NUMBERS (Image 12) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-black text-indigo-800 mb-4 flex items-center gap-2 uppercase italic border-b pb-2"><Phone size={14}/> WhatsApp Notification Registry (Max 10)</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {formData.mobiles.map((m: string, i: number) => (
                    <div key={i} className="relative">
                      <span className="absolute -top-2 left-2 bg-white px-1 text-[8px] font-bold text-gray-400">MOBILE {i+1}</span>
                      <input 
                        placeholder="Enter Number" 
                        className="w-full border-2 border-slate-100 p-2 rounded text-xs outline-none focus:border-indigo-400 font-mono font-bold"
                        value={m}
                        onChange={(e) => {
                          const newMobs = [...formData.mobiles];
                          newMobs[i] = e.target.value;
                          setFormData({...formData, mobiles: newMobs});
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: TAXATION (Image 11) */}
              <div className="bg-white p-6 rounded-xl border-l-4 border-l-indigo-500 shadow-sm">
                <p className="text-xs font-black text-indigo-700 mb-5 flex items-center gap-2 uppercase border-b pb-2"><ShieldCheck size={14}/> GST & Taxation Compliance</p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">GST Registration Type</label>
                    <select className="w-full border-2 border-slate-100 p-2 rounded text-sm bg-white outline-none focus:border-indigo-500 font-bold" value={formData.gstType} onChange={e => setFormData({...formData, gstType: e.target.value})}>
                      <option>Registered</option><option>Unregistered</option><option>Composition</option><option>Consumer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">State</label>
                    <input className="w-full border-2 border-slate-100 p-2 rounded text-sm outline-none font-bold" value={formData.stateName} onChange={e => setFormData({...formData, stateName: e.target.value})} />
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Code</label>
                    <input className="w-full border-2 border-slate-100 p-2 rounded text-sm text-center font-black bg-slate-50" value={formData.stateCode} onChange={e => setFormData({...formData, stateCode: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-1 italic">PAN Number</label>
                    <input className="w-full border-2 border-slate-100 p-2 rounded text-sm uppercase font-mono font-bold text-blue-600" value={formData.panNo} onChange={e => setFormData({...formData, panNo: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-red-600 uppercase block mb-1">GSTIN Number *</label>
                    <input className="w-full border-2 border-red-100 p-2 rounded text-sm uppercase font-mono font-black text-indigo-800" value={formData.gstNo} onChange={e => setFormData({...formData, gstNo: e.target.value.toUpperCase()})} />
                  </div>
                </div>
              </div>



{/* --- NEW SECTION: CASH VS CREDIT SELECTION --- */}
<div className="bg-white p-6 rounded-xl border-l-4 border-l-orange-500 shadow-sm mb-6">
  <p className="text-xs font-black text-orange-700 mb-4 flex items-center gap-2 uppercase italic">
    <Tag size={14}/> Payment Type / Billing Preference
  </p>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="flex gap-4">
      {/* CASH OPTION */}
      <div 
        onClick={() => setFormData({...formData, paymentPreference: 'Cash', maxAllowedCredit: 0})}
        className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${formData.paymentPreference === 'Cash' ? 'border-green-600 bg-green-50 shadow-inner' : 'border-slate-100 bg-white hover:border-green-200'}`}
      >
        <IndianRupee size={24} className={formData.paymentPreference === 'Cash' ? 'text-green-600' : 'text-slate-300'}/>
        <span className={`font-black uppercase text-[10px] ${formData.paymentPreference === 'Cash' ? 'text-green-700' : 'text-slate-400'}`}>Cash Party (Nagad)</span>
      </div>

      {/* CREDIT OPTION */}
      <div 
        onClick={() => setFormData({...formData, paymentPreference: 'Credit'})}
        className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${formData.paymentPreference === 'Credit' ? 'border-blue-600 bg-blue-50 shadow-inner' : 'border-slate-100 bg-white hover:border-blue-200'}`}
      >
        <ClipboardList size={24} className={formData.paymentPreference === 'Credit' ? 'text-blue-600' : 'text-slate-300'}/>
        <span className={`font-black uppercase text-[10px] ${formData.paymentPreference === 'Credit' ? 'text-blue-700' : 'text-slate-400'}`}>Credit Party (Udhaar)</span>
      </div>
    </div>

    {/* DYNAMIC HINT */}
    <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 flex items-center gap-3">
      <Info size={20} className="text-slate-400 shrink-0"/>
      <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
        {formData.paymentPreference === 'Cash' 
          ? "NOTE: Cash party ka Gate Pass tabhi katega jab purana bill paid hoga. Inka udhaar balance system allow nahi karega."
          : "NOTE: Credit party ko aap set ki gayi 'Credit Limit' tak ka udhaar de sakte hain. Limit cross hone par GP block ho jayega."}
      </p>
    </div>
  </div>
</div>

{/* Update existing Credit Limit Box to be disabled if Cash is selected */}
<div>
  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Credit Limit (₹)</label>
  <input 
    type="number" 
    disabled={formData.paymentPreference === 'Cash'}
    className={`w-full border-2 p-2.5 rounded-lg text-lg font-black ${formData.paymentPreference === 'Cash' ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-white text-red-600 border-red-50'}`}
    value={formData.maxAllowedCredit} 
    onChange={e => setFormData({...formData, maxAllowedCredit: parseInt(e.target.value) || 0})} 
  />
</div>


              {/* SECTION 4: BILLING STRATEGY (Image 51 Logic) */}
              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 shadow-inner">
                <p className="text-xs font-black text-indigo-800 mb-6 flex items-center gap-2 uppercase tracking-widest italic"><FileText size={16}/> Automated Billing Configuration</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8">
                  {[
                    {id: 'billNilLot', label: 'Nill Lot Billing'}, {id: 'billMonthly', label: 'Monthly Cycle'},
                    {id: 'billTransport', label: 'Transport Billing'}, {id: 'billSpace', label: 'Space Occupancy'},
                    {id: 'billBalance', label: 'Balance Only'}, {id: 'billItemDay', label: 'Item/Day Logic'},
                    {id: 'billFixed', label: 'Fixed Rate'}, {id: 'billLabour', label: 'Auto Labour Bill'},
                    {id: 'billCA', label: 'CA Commission'}, {id: 'billWeekly', label: 'Weekly Cycle'}
                  ].map(check => (
                    <label key={check.id} className="flex items-center gap-3 cursor-pointer group bg-white/50 p-2 rounded-lg hover:bg-white transition-all">
                      <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={formData[check.id]} onChange={e => setFormData({...formData, [check.id]: e.target.checked})} />
                      <span className="text-[10px] font-black text-gray-600 group-hover:text-indigo-800 uppercase">{check.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* SECTION 5: BANK & LIMITS (Image 13) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                   <p className="text-xs font-black text-slate-700 mb-2 flex items-center gap-2 uppercase border-b pb-2"><Landmark size={14}/> Settlement Bank Info</p>
                   <div className="grid grid-cols-2 gap-4">
                     <input placeholder="Bank Name" className="col-span-2 border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-400" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} />
                     <input placeholder="A/c Number" className="border-2 border-slate-100 p-2.5 rounded text-sm font-mono" value={formData.accountNo} onChange={e => setFormData({...formData, accountNo: e.target.value})} />
                     <input placeholder="IFSC Code" className="border-2 border-slate-100 p-2.5 rounded text-sm uppercase" value={formData.ifsc} onChange={e => setFormData({...formData, ifsc: e.target.value})} />
                   </div>
                 </div>
                 <div className="bg-white p-6 rounded-xl border-t-4 border-t-red-500 shadow-sm space-y-4">
                   <p className="text-xs font-black text-red-700 mb-2 flex items-center gap-2 uppercase border-b pb-2"><ShieldCheck size={14}/> Credit Risk & KYC</p>
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Free Grace Days</label>
                        <input type="number" className="w-full border-2 border-slate-100 p-2.5 rounded text-lg font-black text-blue-600" value={formData.graceDays} onChange={e => setFormData({...formData, graceDays: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Credit Limit (₹)</label>
                        <input type="number" className="w-full border-2 border-red-50 p-2.5 rounded text-lg font-black text-red-600" value={formData.maxAllowedCredit} onChange={e => setFormData({...formData, maxAllowedCredit: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opening Bal Amount</label>
                        <input type="number" className="w-full border-2 border-slate-100 p-2.5 rounded text-lg font-black text-slate-700" value={formData.openingAmt} onChange={e => setFormData({...formData, openingAmt: parseInt(e.target.value) || 0})} />
                      </div>
                   </div>
                 </div>
              </div>

            </form>

            {/* MODAL FOOTER ACTIONS */}
            <div className="bg-white border-t-2 p-6 flex justify-end gap-5 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-20">
              <button onClick={() => setIsModalOpen(false)} className="px-10 py-3 rounded-lg text-sm font-black text-gray-500 hover:bg-gray-100 transition-all uppercase tracking-widest">Cancel</button>
              <button 
                onClick={handleSubmit} 
                disabled={isSaving}
                className="bg-[#4a4ea3] hover:bg-indigo-700 px-16 py-3 rounded-lg text-sm font-black text-white transition-all shadow-2xl active:scale-95 flex items-center gap-3 uppercase tracking-widest disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                {editingId ? "Update Merchant Profile" : "Register Merchant Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
