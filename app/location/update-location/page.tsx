"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Save, MapPin, RefreshCw, Layers, Loader2, CheckCircle2, AlertTriangle, Printer, FileSpreadsheet, History, LayoutList, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

// --- SEARCHABLE SELECT COMPONENT (For Grid Cells) ---
const SearchableSelect = ({ options, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<any>(null);

  const filtered = options.filter((opt: any) =>
    opt.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
        className="w-full border border-slate-200 p-1.5 rounded bg-white flex justify-between items-center cursor-pointer hover:border-indigo-400 transition-all"
      >
        <span className={`truncate font-bold text-[10px] ${selectedOption ? 'text-indigo-800' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronsUpDown size={12} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-indigo-100 rounded shadow-2xl animate-in fade-in zoom-in duration-100">
          <input 
            autoFocus
            className="w-full p-2 border-b outline-none font-bold text-indigo-600 bg-indigo-50 text-[10px]"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-40 overflow-y-auto scrollbar-hide">
            {filtered.map((opt: any) => (
              <div 
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(""); }}
                className="p-2 hover:bg-indigo-600 hover:text-white cursor-pointer flex justify-between items-center border-b border-slate-50 font-bold text-[10px]"
              >
                <span>{opt.name}</span>
                {value === opt.id && <Check size={12} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE ---
export default function UpdateStockLocationPage() {
  const router = useRouter();
  const [range, setRange] = useState({ from: "", to: "" });
  const [records, setRecords] = useState<any[]>([]);
  const [chambers, setChambers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editState, setEditState] = useState<Record<string, any>>({});
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/masters/chambers").then(res => res.json()).then(setChambers);
  }, []);

  const handleSearch = async () => {
    if (!range.from || !range.to) return toast.error("Kripya Lot range dalo!");
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/update-location?fromLot=${range.from}&toLot=${range.to}`);
      const data = await res.json();
      if (res.ok) {
        setRecords(data);
        const initialState: Record<string, any> = {};
        data.forEach((r: any) => { 
            initialState[r.id] = { 
                ...r,
                perUnitWgt: Number(r.perUnitWgt),
                truckNo: r.inwardEntry?.truckNo || "",
                deliveryPerson: r.inwardEntry?.deliveryPerson || ""
            }; 
        });
        setEditState(initialState);
        setModifiedIds(new Set());
        if (data.length === 0) toast.error("Is range mein koi stock nahi mila!");
      }
    } catch (err) { toast.error("Fetch error!"); }
    finally { setLoading(false); }
  };

  const handleInputChange = (id: string, field: string, val: any) => {
    setEditState(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: val }
    }));
    setModifiedIds(prev => new Set(prev).add(id));
  };

  const handleUpdate = async () => {
    if (modifiedIds.size === 0) return toast.error("Pehle badlav toh karo!");
    setIsSaving(true);
    const loadId = toast.loading(`Updating ${modifiedIds.size} records...`);
    const updates = Array.from(modifiedIds).map(id => editState[id]);
    try {
      const res = await fetch("/api/inventory/update-location", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });
      if (res.ok) {
        toast.success("Warehouse logs updated!", { id: loadId });
        setModifiedIds(new Set());
        handleSearch();
      } else { toast.error("Update failed", { id: loadId }); }
    } catch (err) { toast.error("Server error!"); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-4 text-[10px] animate-in fade-in duration-500">
      
      {/* HEADER BAR */}
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg flex justify-between items-center shadow-lg border-b-4 border-indigo-300 no-print">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-[2px] text-xs">
          <Layers size={18}/> Master Correction Interface | Stock & Logistics Audit
        </h2>
        <div className="flex gap-2">
            <button onClick={() => router.push('/inward/register')} className="bg-white/10 hover:bg-white/20 px-4 py-1 rounded font-bold flex items-center gap-2 uppercase transition-all">
                <LayoutList size={14}/> View Register
            </button>
            <button 
                onClick={handleUpdate}
                disabled={isSaving || modifiedIds.size === 0}
                className="bg-[#10b981] hover:bg-green-700 px-8 py-1.5 rounded font-black flex items-center gap-2 uppercase transition-all shadow-xl active:scale-95 disabled:opacity-50"
            >
                {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} 
                SYNC {modifiedIds.size > 0 ? `(${modifiedIds.size})` : ''} MODIFICATIONS
            </button>
        </div>
      </div>

      {/* FILTER BOX */}
      <div className="bg-[#f0f1f7] p-6 border-2 border-slate-200 rounded shadow-inner flex flex-wrap items-end gap-6 no-print">
        <div className="space-y-1">
          <label className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Start Lot No.</label>
          <input className="border-2 border-white p-2 rounded-lg w-40 font-black text-indigo-700 outline-none focus:border-indigo-400 shadow-sm" value={range.from} onChange={e => setRange({...range, from: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="font-black text-slate-500 uppercase text-[9px] tracking-widest">End Lot No.</label>
          <input className="border-2 border-white p-2 rounded-lg w-40 font-black text-indigo-700 outline-none focus:border-indigo-400 shadow-sm" value={range.to} onChange={e => setRange({...range, to: e.target.value})} />
        </div>
        <button onClick={handleSearch} disabled={loading} className="bg-red-600 text-white px-10 py-2.5 rounded-lg font-black uppercase hover:bg-red-700 transition-all shadow-lg active:scale-95 flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={18}/> : <Search size={18}/>} FETCH ENTRIES
        </button>
      </div>

      {/* GIANT GRID */}
      <div className="bg-white border-2 border-slate-100 rounded-xl shadow-2xl overflow-x-auto max-h-[600px] scrollbar-hide">
        <table className="w-full border-collapse text-left min-w-[2500px]">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-20 shadow-md">
            <tr>
              <th className="p-4 border-r border-slate-300 sticky left-0 bg-[#b4b6e4] z-30 w-28 text-center text-indigo-900">LOT NO.</th>
              <th className="p-4 border-r border-slate-300 w-24 text-center">SLIP NO</th>
              <th className="p-4 border-r border-slate-300 w-28 text-center">REC DATE</th>
              <th className="p-4 border-r border-slate-300 w-64">MERCHANT NAME</th>
              <th className="p-4 border-r border-slate-300 w-52">ITEM NAME</th>
              <th className="p-4 border-r border-slate-300 text-center w-20">QTY</th>
              <th className="p-4 border-r border-slate-300 w-28">PACKING</th>
              <th className="p-4 border-r border-slate-300 text-center w-24 bg-red-50 text-red-700">LIVE BAL</th>
              <th className="p-4 border-r border-slate-300 w-28 text-center bg-yellow-50 text-indigo-900">UNIT WGT (KG)</th>
              <th className="p-4 border-r border-slate-300 w-48 bg-yellow-50 text-indigo-900">ASSIGN CHAMBER</th>
              <th className="p-4 border-r border-slate-300 w-20 text-center">FLOOR</th>
              <th className="p-4 border-r border-slate-300 w-20 text-center">POLE</th>
              <th className="p-4 border-r border-slate-300 w-32 text-center">LOT VALUE</th>
              <th className="p-4 border-r border-slate-300 w-32">MARKA</th>
              <th className="p-4 border-r border-slate-300 w-32">PMARKA</th>
              <th className="p-4 border-r border-slate-300 w-52">AUDIT REMARKS</th>
              <th className="p-4 border-r border-slate-300 w-32 italic">VARIETY</th>
              <th className="p-4 text-center w-32">UPTO DATE</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={18} className="p-24 text-center font-black text-indigo-700 animate-pulse text-lg uppercase">Scanning Registry Data...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={18} className="p-24 text-center text-gray-400 italic font-medium uppercase tracking-[5px]">Define range and fetch entries to begin bulk correction</td></tr>
            ) : records.map((row) => (
              <tr key={row.id} className={`border-b transition-all font-bold group ${modifiedIds.has(row.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50 even:bg-slate-50/30'}`}>
                <td className="p-3 border-r border-indigo-200 sticky left-0 bg-white group-hover:bg-slate-50 z-10 font-black text-indigo-900 text-center text-sm shadow-sm">{row.lotNo}</td>
                <td className="p-3 border-r border-slate-100 text-gray-400 font-mono text-center">{row.mrNo}</td>
                <td className="p-3 border-r border-slate-100 text-gray-500 font-mono text-center">{formatDate(row.arrivalDate)}</td>
                <td className="p-3 border-r border-slate-100 uppercase font-black text-slate-600 truncate max-w-[200px]">{row.party.tradeName}</td>
                <td className="p-3 border-r border-slate-100 uppercase font-medium text-slate-500 truncate max-w-[150px]">{row.item.name}</td>
                <td className="p-3 border-r border-slate-100 text-center text-slate-800">{row.receivedQty}</td>
                <td className="p-3 border-r border-slate-100 text-gray-400 uppercase text-[9px]">{row.unit.name}</td>
                <td className="p-3 border-r border-slate-100 text-center font-black text-red-600 bg-red-50/20">{row.balanceQty}</td>
                
                {/* EDITABLE FIELDS */}
                <td className="p-1 border-r border-slate-200 bg-yellow-50/30">
                  <input type="number" className="w-full p-2 border-none text-center font-black text-blue-700 bg-transparent outline-none shadow-inner" 
                    value={editState[row.id]?.perUnitWgt} 
                    onChange={e => handleInputChange(row.id, "perUnitWgt", e.target.value)} 
                  />
                </td>
                <td className="p-1 border-r border-slate-200 bg-yellow-50/30">
                  <SearchableSelect 
                    options={chambers} 
                    value={editState[row.id]?.chamberId} 
                    onChange={(val: any) => handleInputChange(row.id, "chamberId", val)} 
                    placeholder="CHAMBER"
                  />
                </td>
                <td className="p-1 border-r border-slate-200">
                  <input className="w-full p-2 border-none text-center font-bold bg-transparent outline-none shadow-inner" 
                    value={editState[row.id]?.floor || ""} 
                    onChange={e => handleInputChange(row.id, "floor", e.target.value)} 
                  />
                </td>
                <td className="p-1 border-r border-slate-200">
                  <input className="w-full p-2 border-none text-center font-bold bg-transparent outline-none shadow-inner" 
                    value={editState[row.id]?.pole || ""} 
                    onChange={e => handleInputChange(row.id, "pole", e.target.value)} 
                  />
                </td>
                <td className="p-1 border-r border-slate-200">
                   <input type="number" className="w-full p-2 border-none text-center font-bold bg-transparent outline-none shadow-inner text-green-700" 
                    value={editState[row.id]?.lotValue} 
                    onChange={e => handleInputChange(row.id, "lotValue", e.target.value)} 
                   />
                </td>
                <td className="p-1 border-r border-slate-200">
                  <input className="w-full p-2 border-none uppercase font-black text-indigo-700 bg-transparent outline-none shadow-inner" 
                    value={editState[row.id]?.marka || ""} 
                    onChange={e => handleInputChange(row.id, "marka", e.target.value.toUpperCase())} 
                  />
                </td>
                <td className="p-1 border-r border-slate-200">
                  <input className="w-full p-2 border-none uppercase font-bold text-gray-500 bg-transparent outline-none shadow-inner" 
                    value={editState[row.id]?.pMarka || ""} 
                    onChange={e => handleInputChange(row.id, "pMarka", e.target.value.toUpperCase())} 
                  />
                </td>
                <td className="p-1 border-r border-slate-200">
                  <input className="w-full p-2 border-none italic bg-transparent outline-none font-normal" 
                    placeholder="..."
                    value={editState[row.id]?.remarks || ""} 
                    onChange={e => handleInputChange(row.id, "remarks", e.target.value)} 
                  />
                </td>
                <td className="p-1 border-r border-slate-200">
                  <input className="w-full p-2 border-none font-bold text-orange-700 bg-transparent outline-none shadow-inner uppercase" 
                    value={editState[row.id]?.variety || ""} 
                    onChange={e => handleInputChange(row.id, "variety", e.target.value)} 
                  />
                </td>
                <td className="p-3 text-gray-400 italic font-mono text-center">
                  {row.uptoDate ? formatDate(row.uptoDate) : "---"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER INFO */}
      <div className="bg-[#1e293b] text-white p-3 rounded-lg flex justify-between items-center shadow-xl no-print border-t-4 border-indigo-500">
         <div className="flex gap-10">
            <p className="flex items-center gap-2 font-black uppercase tracking-widest text-[9px]">
               <CheckCircle2 size={14} className="text-green-400"/> Operational Audit Control Locked
            </p>
            <p className="font-bold text-[9px] uppercase">Loaded Records in Session: {records.length}</p>
         </div>
         <div className="flex gap-4">
            <FileSpreadsheet className="cursor-pointer hover:text-green-400" size={18} />
            <Printer onClick={() => window.print()} className="cursor-pointer hover:text-red-400" size={18} />
         </div>
      </div>
    </div>
  );
}
