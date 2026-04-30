"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Edit3, Save, Printer, ArrowLeft, RefreshCw, X, Loader2, CheckCircle2, Landmark, Truck, Calendar, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

// --- SEARCHABLE SELECT COMPONENT ---
const SearchableSelect = ({ options, value, onChange, placeholder, displayKey = "name", secondaryKey = "code" }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<any>(null);

  const filtered = options.filter((opt: any) =>
    opt[displayKey]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (secondaryKey && opt[secondaryKey]?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedOption = options.find((opt: any) => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border-2 border-slate-200 p-2 rounded-lg bg-white flex justify-between items-center cursor-pointer hover:border-indigo-400 transition-all shadow-sm"
      >
        <span className={`truncate font-bold text-[11px] ${selectedOption ? 'text-blue-900' : 'text-slate-400'}`}>
          {selectedOption ? `${selectedOption[displayKey]} [${selectedOption[secondaryKey]}]` : placeholder}
        </span>
        <ChevronsUpDown size={14} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-indigo-100 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-150">
          <input 
            autoFocus
            className="w-full p-2 border-b border-slate-100 outline-none font-bold text-indigo-600 sticky top-0 bg-indigo-50 text-[11px]"
            placeholder="Type to filter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            <div onClick={() => { onChange("All"); setIsOpen(false); }} className="p-2.5 hover:bg-slate-100 cursor-pointer font-black text-red-600 border-b text-[10px]">--- ALL PARTIES ---</div>
            {filtered.map((opt: any) => (
              <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(""); }} className="p-2.5 hover:bg-indigo-600 hover:text-white cursor-pointer flex justify-between items-center border-b border-slate-50 font-bold text-[11px]">
                <span>{opt[displayKey]} <span className="opacity-60 text-[9px]">({opt[secondaryKey]})</span></span>
                {value === opt.id && <Check size={14} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE ---
interface GPUpdateRecord { 
  id: string; 
  gpNo: string; 
  gpDate: string; 
  transportRequired: boolean; 
  grNo: string; 
  vehicleNo: string; 
  personName: string; 
  remarks?: string;
  lot?: { lotNo: string, party: { tradeName: string } };
}

export default function UpdateGPDetailsPage() {
  const router = useRouter();
  const [range, setRange] = useState({ from: "", to: "" });
  const [selectedParty, setSelectedParty] = useState("All");
  const [parties, setParties] = useState<any[]>([]);
  const [records, setRecords] = useState<GPUpdateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingRows, setEditingRows] = useState<Record<string, GPUpdateRecord>>({});

  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
  }, []);

  // 1. SEARCH LOGIC
  const handleSearch = async () => {
    if (!range.from || !range.to) return toast.error("Bhai, GP No. ki range toh daalo!");
    setLoading(true);
    try {
      const res = await fetch(`/api/outward/update-gp?fromGp=${range.from}&toGp=${range.to}&partyId=${selectedParty}`);
      const data = await res.json();
      if (res.ok) {
        setRecords(data);
        const initialEditState: Record<string, GPUpdateRecord> = {};
        data.forEach((r: GPUpdateRecord) => { initialEditState[r.id] = { ...r }; });
        setEditingRows(initialEditState);
        if (data.length === 0) toast.error("Is range mein koi Gate Pass nahi mila!");
      }
    } catch (err) { toast.error("Data load karne mein galti hui!"); }
    finally { setLoading(false); }
  };

  // 2. INLINE CHANGE HANDLER
  const handleChange = (id: string, field: keyof GPUpdateRecord, value: any) => {
    setEditingRows(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: field === "vehicleNo" ? value.toUpperCase() : value }
    }));
  };

  // 3. BULK UPDATE
  const handleBulkUpdate = async () => {
    const updates = Object.values(editingRows);
    if (updates.length === 0) return toast.error("Pehle koi badlav toh kijiye!");

    setIsSaving(true);
    const loadId = toast.loading("Updating Dispatch Logs...");
    try {
      const res = await fetch("/api/outward/update-gp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });
      if (res.ok) {
        toast.success("Gate Pass details synchronized!", { id: loadId });
        handleSearch();
      } else { toast.error("Update failed!", { id: loadId }); }
    } catch (err) { toast.error("Network Error!", { id: loadId }); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* Visual Header */}
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md border-b-4 border-indigo-300 no-print">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-widest">
          <RefreshCw size={16}/> Dispatch Correction Interface | GP Logs
        </h2>
        <div className="flex gap-2">
            <button onClick={() => router.push('/outward/gp-entry')} className="bg-white/10 hover:bg-white/20 px-4 py-1 rounded font-bold flex items-center gap-2 uppercase transition-all">
                <ArrowLeft size={14}/> Back To GP Entry
            </button>
            <button 
                onClick={handleBulkUpdate}
                disabled={isSaving || records.length === 0}
                className="bg-[#10b981] hover:bg-green-700 px-8 py-1.5 rounded font-black flex items-center gap-2 uppercase transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
            {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} 
            SAVE ALL CHANGES
            </button>
        </div>
      </div>

      {/* SMART SEARCH BOX */}
      <div className="bg-white p-6 border rounded shadow-sm flex flex-wrap items-end gap-6 shadow-inner no-print">
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase block tracking-widest text-[9px]">From GP No</label>
          <input className="border-2 border-slate-100 p-2 rounded w-40 outline-none focus:border-indigo-500 font-black text-indigo-700 shadow-inner text-sm" placeholder="START" value={range.from} onChange={e => setRange({...range, from: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase block tracking-widest text-[9px]">To GP No</label>
          <input className="border-2 border-slate-100 p-2 rounded w-40 outline-none focus:border-indigo-500 font-black text-indigo-700 shadow-inner text-sm" placeholder="END" value={range.to} onChange={e => setRange({...range, to: e.target.value})} />
        </div>
        <div className="w-64 space-y-1">
          <label className="font-black text-indigo-700 uppercase block tracking-widest text-[9px]">Select Merchant (Optional)</label>
          <SearchableSelect options={parties} value={selectedParty} onChange={setSelectedParty} placeholder="--- ALL MERCHANTS ---" displayKey="tradeName" secondaryKey="partyCode" />
        </div>
        <button onClick={handleSearch} disabled={loading} className="bg-red-600 text-white px-10 py-2.5 rounded-lg font-black uppercase hover:bg-red-700 flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" size={18}/> : <Search size={18}/>} RETRIEVE LOGS
        </button>
      </div>

      {/* BRANDING SECTION */}
      <div className="text-center py-5 bg-white border-2 border-slate-100 rounded-xl relative">
         <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Cold Storage ERP</h1>
         <div className="flex justify-center gap-6 text-[10px] font-black text-indigo-700 mt-1">
           <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase flex items-center gap-1"><Landmark size={12}/> PAN: AAXFV5416G</span>
           <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase flex items-center gap-1"><Truck size={12}/> GST: 07AAXFV5416G1ZO</span>
         </div>
      </div>

      {/* DATA GRID */}
      <div className="bg-white border rounded-xl shadow-2xl overflow-x-auto min-h-[450px]">
        <table className="w-full border-collapse text-left min-w-[1300px]">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 border-r border-indigo-200 bg-indigo-100 text-indigo-900 w-32 text-center">GP NUMBER</th>
              <th className="p-4 border-r border-slate-300 w-48 text-center">TRANSPORT REQ?</th>
              <th className="p-4 border-r border-slate-300 w-40 text-center">GR / BUILTY NO.</th>
              <th className="p-4 border-r border-slate-300 w-44 text-center">TRUCK / VEHICLE NO.</th>
              <th className="p-4 border-r border-slate-300 w-48">DELIVERY PERSON</th>
              <th className="p-4 border-r border-slate-300">SPECIAL REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={6} className="p-24 text-center text-gray-300 italic font-medium uppercase tracking-[5px]">Enter dispatch range to retrieve and edit Gate Pass logs</td></tr>
            ) : records.map((row) => (
              <tr key={row.id} className={`border-b transition-all font-bold ${editingRows[row.id] !== records.find(r => r.id === row.id) ? 'bg-indigo-50/50 shadow-inner' : 'hover:bg-slate-50'}`}>
                
                {/* GP IDENTITY */}
                <td className="p-3 border-r border-indigo-200 bg-indigo-50 text-center">
                    <div className="font-black text-indigo-900 text-sm">{row.gpNo}</div>
                    <div className="text-[8px] text-gray-400 font-normal uppercase tracking-tighter">{formatDate(row.gpDate)}</div>
                    <div className="text-[8px] text-blue-600 mt-1 uppercase">Lot: {row.lot?.lotNo}</div>
                </td>
                
                {/* TRANSPORT REQ EDIT */}
                <td className="p-2 border-r border-slate-200 text-center">
                  <select 
                    className="w-full border-2 border-slate-100 p-2 rounded-lg bg-white font-black text-blue-700 outline-none shadow-sm"
                    value={editingRows[row.id]?.transportRequired ? "Yes" : "No"}
                    onChange={e => handleChange(row.id, "transportRequired", e.target.value === "Yes")}
                  >
                    <option value="Yes">YES (REQ)</option>
                    <option value="No">NO (SELF)</option>
                  </select>
                </td>

                {/* GR NO EDIT */}
                <td className="p-2 border-r border-slate-200">
                  <input className="w-full border-2 border-slate-100 p-2 rounded-lg outline-none font-bold text-center shadow-inner" placeholder="GR No" value={editingRows[row.id]?.grNo || ""} onChange={e => handleChange(row.id, "grNo", e.target.value)} />
                </td>

                {/* VEHICLE NO EDIT */}
                <td className="p-2 border-r border-slate-200">
                  <input className="w-full border-2 border-slate-100 p-2 rounded-lg font-mono uppercase font-black text-indigo-700 text-center outline-none shadow-inner" placeholder="UP-14-XXXX" value={editingRows[row.id]?.vehicleNo || ""} onChange={e => handleChange(row.id, "vehicleNo", e.target.value)} />
                </td>

                {/* PERSON EDIT */}
                <td className="p-2 border-r border-slate-200">
                  <input className="w-full border-2 border-slate-100 p-2 rounded-lg outline-none font-black text-slate-700 shadow-inner" placeholder="Representative Name" value={editingRows[row.id]?.personName || ""} onChange={e => handleChange(row.id, "personName", e.target.value)} />
                </td>

                {/* REMARKS EDIT */}
                <td className="p-2">
                  <input className="w-full border-2 border-slate-100 p-2 rounded-lg outline-none italic font-normal text-slate-500 shadow-inner" placeholder="Dispatch instructions..." value={editingRows[row.id]?.remarks || ""} onChange={e => handleChange(row.id, "remarks", e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#1e293b] text-white rounded-lg flex justify-between items-center shadow-xl no-print">
         <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[9px]">
           <CheckCircle2 size={14} className="text-green-400"/> Audit Log: Only dispatch metadata is editable here
         </div>
         <div className="flex gap-4">
            <button onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 p-2 rounded transition-all"><Printer size={16}/></button>
         </div>
      </div>
    </div>
  );
}
