"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, Users, Phone, ShieldCheck, CreditCard, Landmark, FileText, X } from "lucide-react";
import { toast } from "react-hot-toast";

interface Party {
  id: string;
  partyCode: string;
  tradeName: string;
  mobiles: string[];
  gstNo?: string;
  graceDays: number;
  maxAllowedCredit: number;
  _count?: { lots: number };
}

export default function PartyMasterPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form State with 16 Checkboxes (As per Image 11)
  const [formData, setFormData] = useState<any>({
    partyCode: "", tradeName: "", mobiles: ["", ""],
    gstType: "Registered", stateName: "Haryana", stateCode: "06",
    billNilLot: false, billMonthly: false, billLabour: true, // Defaults
    graceDays: 10, maxAllowedCredit: 50000
  });

  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/masters/party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      toast.success("Party Saved");
      setIsModalOpen(false);
      // refresh list logic
    }
  };

  return (
    <div className="space-y-4">
      {/* Visual Softech Header */}
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg flex justify-between items-center shadow-lg">
        <h2 className="font-bold text-sm flex items-center gap-2 uppercase"><Users size={18}/> Party Master (Sundry Debtors)</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 px-4 py-1.5 rounded-md text-xs font-bold transition-all shadow-md"
        >
          + Add New Party
        </button>
      </div>

      {/* Stats Summary from Dashboard integration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg border border-l-4 border-l-green-500 shadow-sm">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Total Registered Parties</p>
          <p className="text-2xl font-bold">{parties.length}</p>
        </div>
        {/* ... More Stats */}
      </div>

      {/* Main Grid View */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex gap-4">
           <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input 
                type="text" placeholder="Search by Code or Trade Name..." 
                className="pl-9 pr-4 py-2 border rounded-md text-sm w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f1f5f9] text-slate-600 uppercase font-bold">
            <tr>
              <th className="p-4">Party Code</th>
              <th className="p-4">Trade Name</th>
              <th className="p-4">WhatsApp Numbers</th>
              <th className="p-4">GST No</th>
              <th className="p-4 text-center">Grace Days</th>
              <th className="p-4 text-right">Active Lots</th>
            </tr>
          </thead>
          <tbody>
            {parties.filter(p => p.tradeName.toLowerCase().includes(searchTerm.toLowerCase())).map((party) => (
              <tr key={party.id} className="border-b hover:bg-slate-50 transition-colors cursor-pointer">
                <td className="p-4 font-bold text-indigo-700">{party.partyCode}</td>
                <td className="p-4 font-semibold text-gray-700">{party.tradeName}</td>
                <td className="p-4 text-gray-500">{party.mobiles.filter(m => m).join(", ")}</td>
                <td className="p-4 font-mono">{party.gstNo || "N/A"}</td>
                <td className="p-4 text-center bg-blue-50 font-bold text-blue-600">{party.graceDays}</td>
                <td className="p-4 text-right font-bold">{party._count?.lots || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Massive Party Modal (Replicating Image 11-12) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#f8f9fa] w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#4a4ea3] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold uppercase text-sm tracking-widest">Party Master Entry Form</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X/></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              
              {/* Section 1: Basic Profile */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="md:col-span-1">
                   <label className="text-[10px] font-bold text-gray-500 uppercase">Party Code *</label>
                   <input required className="w-full border p-2 rounded text-sm bg-white" value={formData.partyCode} onChange={e => setFormData({...formData, partyCode: e.target.value})} />
                 </div>
                 <div className="md:col-span-2">
                   <label className="text-[10px] font-bold text-gray-500 uppercase">Trade Name / Kisan Name *</label>
                   <input required className="w-full border p-2 rounded text-sm bg-white" value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value})} />
                 </div>
                 <div className="md:col-span-1">
                   <label className="text-[10px] font-bold text-gray-500 uppercase">Proprietor</label>
                   <input className="w-full border p-2 rounded text-sm bg-white" value={formData.proprietor} onChange={e => setFormData({...formData, proprietor: e.target.value})} />
                 </div>
              </div>

              {/* Section 2: 10 WhatsApp Mobiles (Image 12 Reference) */}
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <p className="text-xs font-bold text-indigo-700 mb-3 flex items-center gap-2 uppercase border-b pb-2"><Phone size={14}/> WhatsApp Alert Numbers (Max 10)</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[...Array(10)].map((_, i) => (
                    <input 
                      key={i} 
                      placeholder={`Mobile ${i+1}`} 
                      className="border p-2 rounded text-xs outline-none focus:border-indigo-400"
                      value={formData.mobiles?.[i] || ""}
                      onChange={(e) => {
                        const newMobiles = [...(formData.mobiles || [])];
                        newMobiles[i] = e.target.value;
                        setFormData({...formData, mobiles: newMobiles});
                      }}
                    />
                  ))}
                </div>
              </div>



{/* Section: GST & Tax Details (Image 11 Reference) */}
<div className="bg-white p-4 rounded-lg border shadow-sm border-l-4 border-l-indigo-500">
  <p className="text-xs font-bold text-indigo-700 mb-3 flex items-center gap-2 uppercase border-b pb-2">
    <ShieldCheck size={14}/> GST & Taxation Details
  </p>
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
    <div>
      <label className="text-[10px] font-bold text-gray-500 uppercase">GST Type</label>
      <select 
        className="w-full border p-2 rounded text-sm bg-white outline-none focus:border-indigo-500"
        value={formData.gstType}
        onChange={e => setFormData({...formData, gstType: e.target.value})}
      >
        <option value="Registered">Registered</option>
        <option value="Unregistered">Unregistered</option>
        <option value="Composition">Composition</option>
        <option value="Consumer">Consumer</option>
      </select>
    </div>
    
    <div className="md:col-span-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">State Name</label>
      <input 
        placeholder="e.g. Haryana" 
        className="w-full border p-2 rounded text-sm outline-none focus:border-indigo-500" 
        value={formData.stateName}
        onChange={e => setFormData({...formData, stateName: e.target.value})}
      />
    </div>

    <div className="w-16">
      <label className="text-[10px] font-bold text-gray-500 uppercase">Code</label>
      <input 
        placeholder="06" 
        className="w-full border p-2 rounded text-sm text-center font-bold bg-gray-50 outline-none" 
        value={formData.stateCode}
        onChange={e => setFormData({...formData, stateCode: e.target.value})}
      />
    </div>

    <div className="md:col-span-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase italic">PAN Number</label>
      <input 
        placeholder="ABCDE1234F" 
        className="w-full border p-2 rounded text-sm uppercase outline-none focus:border-indigo-500 font-mono" 
        value={formData.panNo}
        onChange={e => setFormData({...formData, panNo: e.target.value.toUpperCase()})}
      />
    </div>

    <div className="md:col-span-1">
      <label className="text-[10px] font-bold text-red-600 uppercase">GST Number *</label>
      <div className="flex gap-1">
        <input 
          required={formData.gstType === "Registered"}
          placeholder="06ABCDE1234F1Z5" 
          className="w-full border border-red-200 p-2 rounded text-sm uppercase outline-none focus:ring-1 focus:ring-red-500 font-mono font-bold" 
          value={formData.gstNo}
          onChange={e => setFormData({...formData, gstNo: e.target.value.toUpperCase()})}
        />
      </div>
    </div>
  </div>
</div>
              {/* Section 3: 16 Billing Strategy Checkboxes (Image 11 & 51 Core Automation) */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <p className="text-xs font-bold text-indigo-800 mb-4 flex items-center gap-2 uppercase"><FileText size={14}/> Define Billing Strategy</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6">
                  {[
                    {id: 'billNilLot', label: 'Nill Lot Bill'}, {id: 'billMonthly', label: 'Monthly Bill'},
                    {id: 'billTransport', label: 'Transport Bill'}, {id: 'billBalance', label: 'Balance Bill'},
                    {id: 'billItemDay', label: 'Item Day Wise'}, {id: 'billFixed', label: 'Fixed Bill'},
                    {id: 'billDispatch', label: 'Dispatch Bill'}, {id: 'billLabour', label: 'Labour Bill (V.Imp)'},
                    {id: 'billCA', label: 'CA Bill (Commission)'}, {id: 'billWeekly', label: 'Weekly Bill'}
                  ].map(check => (
                    <label key={check.id} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={formData[check.id]}
                        onChange={e => setFormData({...formData, [check.id]: e.target.checked})}
                      />
                      <span className="text-xs font-medium text-gray-600 group-hover:text-indigo-700">{check.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section 4: Bank & KYC (Image 13 Reference) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-4 rounded-lg border shadow-sm">
                   <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase border-b pb-2"><Landmark size={14}/> Bank Details</p>
                   <div className="space-y-3">
                     <input placeholder="Bank Name" className="w-full border p-2 rounded text-sm" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} />
                     <input placeholder="A/c Number" className="w-full border p-2 rounded text-sm" value={formData.accountNo} onChange={e => setFormData({...formData, accountNo: e.target.value})} />
                     <input placeholder="IFSC Code" className="w-full border p-2 rounded text-sm" value={formData.ifsc} onChange={e => setFormData({...formData, ifsc: e.target.value})} />
                   </div>
                 </div>
                 <div className="bg-white p-4 rounded-lg border shadow-sm">
                   <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase border-b pb-2"><ShieldCheck size={14}/> KYC & Credit Limit</p>
                   <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[9px] font-bold text-red-500 uppercase">Grace Days (Free)</label>
                          <input type="number" className="w-full border p-2 rounded text-sm font-bold text-blue-600" value={formData.graceDays} onChange={e => setFormData({...formData, graceDays: e.target.value})} />
                        </div>
                        <div className="flex-1">
                          <label className="text-[9px] font-bold text-red-500 uppercase">Max Credit Limit</label>
                          <input type="number" className="w-full border p-2 rounded text-sm font-bold text-red-600" value={formData.maxAllowedCredit} onChange={e => setFormData({...formData, maxAllowedCredit: e.target.value})} />
                        </div>
                      </div>
                      <input placeholder="Aadhar Number" className="w-full border p-2 rounded text-sm" value={formData.aadharNo} onChange={e => setFormData({...formData, aadharNo: e.target.value})} />
                   </div>
                 </div>
              </div>

            </form>

            {/* Footer Actions */}
            <div className="bg-white border-t p-4 flex justify-end gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 rounded-md text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                className="bg-[#4a4ea3] hover:bg-[#3b3e8a] px-10 py-2 rounded-md text-sm font-bold text-white transition-all shadow-lg active:scale-95"
              >
                Submit Party Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}