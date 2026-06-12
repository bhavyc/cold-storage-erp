"use client";

import React, { useState, useEffect } from "react";
import { Save, Plus, Trash2, ArrowLeft, Landmark, Tag, Package, History, LayoutList, RotateCcw, Loader2, Database, ShieldCheck, ChevronsUpDown, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useRef } from "react";

// --- SEARCHABLE SELECT COMPONENT ---
const SearchableSelect = ({ options, value, onChange, placeholder, displayKey = "name", secondaryKey = "code" }: any) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const wrapperRef = useRef<any>(null);

  const filtered = options.filter((opt: any) =>
    opt[displayKey]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (secondaryKey && opt[secondaryKey]?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedOption = options.find((opt: any) => opt.id === value);

  React.useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="w-full border-2 border-indigo-100 p-2.5 rounded-lg bg-white flex justify-between items-center cursor-pointer hover:border-indigo-400 transition-all shadow-sm">
        <span className={`truncate font-black text-sm ${selectedOption ? 'text-blue-900' : 'text-slate-400'}`}>
          {selectedOption ? `${selectedOption[displayKey]} [${selectedOption[secondaryKey] || ''}]` : placeholder}
        </span>
        <ChevronsUpDown size={16} className="text-indigo-400" />
      </div>
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-indigo-100 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-150">
          <input autoFocus className="w-full p-3 border-b border-slate-100 outline-none font-bold text-indigo-600 sticky top-0 bg-indigo-50 text-xs" placeholder="Type to search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {filtered.length > 0 ? filtered.map((opt: any) => (
              <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(""); }} className="p-3 hover:bg-indigo-600 hover:text-white cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 font-black text-xs">
                <span>{opt[displayKey]} {secondaryKey && <span className="opacity-60 text-[10px]">({opt[secondaryKey]})</span>}</span>
                {value === opt.id && <Check size={16} />}
              </div>
            )) : <div className="p-4 text-center text-slate-400 italic text-xs">No results</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// Har field jo tune maangi thi wo yahan initialized hai
const initialRow = { 
  itemId: "", 
  unitId: "", 
  csRent: 0, 
  csLab: 0, 
  caRent: 0, 
  caLab: 0, 
  freight: 0, 
  period: 0 
};

export default function PartyRateEntryPage() {
  const router = useRouter();
  const [parties, setParties] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  
  const [selectedParty, setSelectedParty] = useState("");
  const [rows, setRows] = useState<any[]>([{ ...initialRow }]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. LOAD MASTER DATA
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [p, i, u] = await Promise.all([
          fetch("/api/masters/party").then(res => res.json()),
          fetch("/api/masters/items").then(res => res.json()),
          fetch("/api/masters/units").then(res => res.json())
        ]);
        const creditParties = (p || []).filter((party: any) => party.paymentPreference === "Credit");
        setParties(creditParties);
        setItems(i || []);
        setUnits(u || []);
      } catch (err) {
        toast.error("Master data load karne mein error!");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. GRID HANDLERS
  const addRow = () => setRows([...rows, { ...initialRow }]);
  
  const removeRow = (idx: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== idx));
    } else {
      setRows([{ ...initialRow }]);
    }
  };

  const updateRow = (idx: number, field: string, val: any) => {
    const newRows = [...rows];
    newRows[idx][field] = val;
    setRows(newRows);
  };

  // 3. SAVE LOGIC
  const handleSave = async () => {
    if (!selectedParty) return toast.error("Bhai, pehle Party/Merchant toh chuno!");
    if (rows.some(r => !r.itemId || !r.unitId)) return toast.error("Grid mein Item aur Unit select karna zaroori hai!");

    setIsSaving(true);
    const loadId = toast.loading("Saving special rates for party...");
    try {
      const res = await fetch("/api/masters/party-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId: selectedParty, rows })
      });
      if (res.ok) {
        const party = parties.find(p => p.id === selectedParty);
        toast.success(`Special Rates locked for ${party?.tradeName}! 💰`, { id: loadId, duration: 5000 });
        router.push("/masters/party-rates");
      } else {
        toast.error("Save fail ho gaya! ❌", { id: loadId });
      }
    } catch (err) {
      toast.error("Network error!", { id: loadId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 text-[11px] animate-in slide-in-from-right-4 duration-500">
      
      {/* --- TOP ACTION BAR --- */}
      <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm no-print">
        <div className="flex gap-2">
          <button onClick={() => router.push('/masters/party-rates')} className="bg-red-600 text-white px-5 py-1.5 rounded font-black flex items-center gap-2 shadow-md hover:bg-red-700 transition-all uppercase">
            <LayoutList size={14}/> View All Rates
          </button>
          <button onClick={() => router.push('/masters/party-rates')} className="bg-indigo-600 text-white px-5 py-1.5 rounded font-black flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-all uppercase">
            <History size={14}/> Previous Entries
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={isSaving || loading} className="bg-[#10b981] hover:bg-green-700 text-white px-12 py-1.5 rounded font-black flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 uppercase">
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} 
            SAVE ALL RATES
          </button>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white p-1.5 rounded shadow hover:bg-orange-600 transition-all">
            <RotateCcw size={18}/>
          </button>
        </div>
      </div>

      <div className="bg-[#4a4ea3] text-white p-2 rounded-t-lg font-black text-center uppercase tracking-[5px] italic shadow-md border-b-4 border-indigo-400">
        Party Wise Item Rate Master | Special Pricing Configuration
      </div>

      <div className="bg-white p-8 border rounded-b-lg shadow-2xl space-y-8">
        
        {/* MERCHANT SELECTION SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
          <div className="space-y-1">
            <label className="font-black text-indigo-700 uppercase text-[9px] tracking-widest flex items-center gap-1">
              <Landmark size={12}/> 1. Select Merchant / Kisan Account *
            </label>
            <SearchableSelect 
              options={parties}
              value={selectedParty}
              onChange={setSelectedParty}
              placeholder="--- SEARCH & SELECT PARTY ---"
              displayKey="tradeName"
              secondaryKey="partyCode"
            />
          </div>
          <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-indigo-600 italic">
             <ShieldCheck size={20}/>
             <p className="text-[10px] font-bold">Note: Yahan set kiye gaye rates Billing ke waqt Item Master ke rates ko override kar denge.</p>
          </div>
        </div>

        {/* DYNAMIC RATE GRID (All 8 Fields) */}
        <div className="overflow-x-auto border-2 border-slate-100 rounded-xl shadow-inner">
          <table className="w-full border-collapse min-w-[1200px] text-left">
            <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 border-r border-indigo-200 w-64"><Tag size={10} className="inline mr-1"/> ITEM NAME</th>
                <th className="p-3 border-r border-slate-300 w-48"><Package size={10} className="inline mr-1"/> UNIT TYPE</th>
                <th className="p-3 border-r border-slate-300 text-center bg-indigo-50 text-indigo-900">CS RENT</th>
                <th className="p-3 border-r border-slate-300 text-center bg-indigo-50 text-indigo-900">CS LABOUR</th>
                <th className="p-3 border-r border-slate-300 text-center">CA RENT</th>
                <th className="p-3 border-r border-slate-300 text-center">CA LABOUR</th>
                <th className="p-3 border-r border-slate-300 text-center text-orange-700">FREIGHT</th>
                <th className="p-3 border-r border-slate-300 text-center bg-yellow-50 text-orange-900 w-28">PERIOD</th>
                <th className="p-3 text-center w-24 bg-indigo-50">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/50 transition-all border-b border-slate-200 font-bold group">
                  <td className="p-1 border-r border-slate-200">
                    <select className="w-full p-2 outline-none bg-transparent uppercase text-blue-800" value={row.itemId} onChange={e => updateRow(idx, "itemId", e.target.value)}>
                      <option value="">-- CHOOSE ITEM --</option>
                      {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                    </select>
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <select className="w-full p-2 outline-none bg-transparent uppercase text-slate-600" value={row.unitId} onChange={e => updateRow(idx, "unitId", e.target.value)}>
                      <option value="">-- PACKING --</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </td>
                  <td className="p-1 border-r border-slate-200 bg-indigo-50/30">
                    <input type="number" className="w-full p-2 text-center font-black text-indigo-700 bg-transparent outline-none" value={row.csRent || ""} onChange={e => updateRow(idx, "csRent", parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="p-1 border-r border-slate-200 bg-indigo-50/30">
                    <input type="number" className="w-full p-2 text-center font-black text-green-700 bg-transparent outline-none" value={row.csLab || ""} onChange={e => updateRow(idx, "csLab", parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <input type="number" className="w-full p-2 text-center font-bold text-slate-500 bg-transparent outline-none" value={row.caRent || ""} onChange={e => updateRow(idx, "caRent", parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <input type="number" className="w-full p-2 text-center font-bold text-slate-500 bg-transparent outline-none" value={row.caLab || ""} onChange={e => updateRow(idx, "caLab", parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <input type="number" className="w-full p-2 text-center font-black text-orange-600 bg-transparent outline-none" value={row.freight || ""} onChange={e => updateRow(idx, "freight", parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="p-1 border-r border-slate-200 bg-yellow-50/30">
                    <input type="number" className="w-full p-2 text-center font-black text-orange-950 bg-transparent outline-none" value={row.period || ""} onChange={e => updateRow(idx, "period", parseInt(e.target.value) || 0)} />
                  </td>
                  <td className="p-1 text-center bg-indigo-50/50">
                    <div className="flex justify-center items-center gap-3 py-2">
                       <button onClick={addRow} className="text-blue-600 hover:scale-125 transition-all"><Plus size={20}/></button>
                       <button onClick={() => removeRow(idx)} className="text-red-500 hover:scale-125 transition-all"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* INFO FOOTER */}
        <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center gap-4">
           <div className="bg-white p-2 rounded-full shadow-sm"><Database className="text-indigo-500" size={24}/></div>
           <div className="space-y-1">
              <p className="font-black text-slate-700 uppercase text-[9px] tracking-widest">Database Sync Integrity</p>
              <p className="text-gray-400 text-[10px]">Saving these rates will automatically overwrite any previous special configuration for the selected merchant.</p>
           </div>
        </div>
      </div>
      
      <div className="text-center opacity-30 italic font-black text-[8px] uppercase tracking-[10px] mt-4">
        Cold Storage Intelligence - Special Rate Master
      </div>
    </div>
  );
}
