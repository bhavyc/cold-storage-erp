"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Search, Printer, FileSpreadsheet, History, Plus, Loader2, RefreshCw, AlertCircle, MapPin, ArrowRight, ArrowLeft, Check, ChevronsUpDown, Landmark, Package, Tag } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

// --- SEARCHABLE SELECT COMPONENT (Common Man Logic: Writing + Selecting) ---
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
        className="w-full border-2 border-slate-200 p-1.5 rounded bg-white flex justify-between items-center cursor-pointer hover:border-indigo-400 transition-all shadow-sm"
      >
        <span className={`truncate font-bold text-[11px] ${selectedOption || value === "All" ? 'text-blue-900' : 'text-slate-400'}`}>
          {value === "All" ? (placeholder.includes("PARTIES") ? "--- ALL PARTIES ---" : placeholder.includes("ITEM") ? "--- ALL ITEMS ---" : "--- ALL CHAMBERS ---") : selectedOption ? `${selectedOption[displayKey]} ${secondaryKey ? `[${selectedOption[secondaryKey]}]` : ''}` : placeholder}
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
             <div 
                onClick={() => { onChange("All"); setIsOpen(false); setSearchTerm(""); }}
                className="p-2.5 hover:bg-slate-100 cursor-pointer font-black text-red-600 border-b text-[10px] uppercase"
              >
                --- SHOW ALL ---
              </div>
            {filtered.length > 0 ? filtered.map((opt: any) => (
              <div 
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(""); }}
                className="p-2.5 hover:bg-indigo-600 hover:text-white cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 font-bold text-[11px]"
              >
                <span>{opt[displayKey]} {secondaryKey && <span className="opacity-60 text-[9px]">({opt[secondaryKey]})</span>}</span>
                {value === opt.id && <Check size={14} />}
              </div>
            )) : <div className="p-4 text-center text-slate-400 italic text-[11px]">No matching record</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE ---
export default function ShiftingRegisterPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [parties, setParties] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [chambers, setChambers] = useState<any[]>([]);

  // 1. FILTER STATES
  const [filters, setFilters] = useState({
    fromDate: "2025-04-01",
    toDate: new Date().toISOString().split('T')[0],
    partyId: "All",
    itemId: "All",
    chamberId: "All"
  });

  // 2. LOAD MASTERS
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [p, i, c] = await Promise.all([
          fetch("/api/masters/party").then(res => res.json()),
          fetch("/api/masters/items").then(res => res.json()),
          fetch("/api/masters/chambers").then(res => res.json())
        ]);
        setParties(p || []);
        setItems(i || []);
        setChambers(c || []);
      } catch (err) {
        toast.error("Masters load nahi ho paye!");
      }
    };
    loadMasters();
  }, []);

  // 3. SEARCH FUNCTION
  const handleSearch = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams(filters).toString();
    try {
      const res = await fetch(`/api/reports/shifting?${query}`);
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      setData(json);
      if (json.length === 0) toast.error("Is period mein koi movement record nahi mila!");
      else toast.success(`${json.length} Movement logs found.`);
    } catch (err) {
      toast.error("Data load nahi ho paya!");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // 4. TOTALS AGGREGATE
  const totalShifted = useMemo(() => data.reduce((s, r) => s + (Number(r.qty) || 0), 0), [data]);

  return (
    <div className="space-y-4 text-[10px] animate-in fade-in duration-500">
      
      {/* Visual Header */}
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg flex justify-between items-center shadow-lg border-b-4 border-indigo-300 no-print">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-[2px] text-xs">
          <History size={18}/> Stock Shifting Audit Register (Internal Logistics)
        </h2>
        <div className="flex gap-2">
            <button 
                onClick={() => router.push('/location/shifting-entry')}
                className="bg-red-600 hover:bg-red-700 px-5 py-1.5 rounded font-black uppercase text-[9px] shadow-lg flex items-center gap-2 transition-all active:scale-95"
            >
                <Plus size={14}/> Add New Shifting
            </button>
            <button 
                onClick={() => router.push('/location/shifting-entry')}
                className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded font-bold flex items-center gap-2 uppercase transition-all"
            >
                <ArrowLeft size={14}/> Back To Entry
            </button>
        </div>
      </div>

      {/* FILTER BAR (Writing Dropdowns Integrated) */}
      <div className="bg-[#f0f1f7] p-6 border-2 border-slate-200 rounded-b-xl shadow-inner grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end font-bold text-slate-700 no-print">
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 block mb-1 uppercase tracking-widest">From Date</label>
          <input type="date" className="w-full border-2 border-white p-1.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-400 font-bold" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 block mb-1 uppercase tracking-widest">To Date</label>
          <input type="date" className="w-full border-2 border-white p-1.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-400 font-bold" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
        </div>

        <div className="lg:col-span-1 space-y-1">
          <label className="text-[9px] text-indigo-900 block mb-1 uppercase tracking-widest">Merchant Name</label>
          <SearchableSelect 
            options={parties} value={filters.partyId} 
            onChange={(val: any) => setFilters({...filters, partyId: val})} 
            placeholder="--- SEARCH PARTIES ---" displayKey="tradeName" secondaryKey="partyCode" 
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-indigo-900 block mb-1 uppercase tracking-widest">Item Description</label>
          <SearchableSelect 
            options={items} value={filters.itemId} 
            onChange={(val: any) => setFilters({...filters, itemId: val})} 
            placeholder="--- ALL ITEMS ---" 
          />
        </div>

        <div className="space-y-1">
            <label className="text-[9px] text-indigo-900 block mb-1 uppercase tracking-widest">Source Chamber</label>
            <SearchableSelect 
              options={chambers} value={filters.chamberId} 
              onChange={(val: any) => setFilters({...filters, chamberId: val})} 
              placeholder="--- ALL CHAMBERS ---" 
            />
        </div>

        <div className="flex gap-2">
          <button 
            disabled={loading}
            onClick={handleSearch}
            className="bg-red-600 text-white px-8 py-2 rounded-lg shadow-lg hover:bg-red-700 transition-all active:scale-90 flex-1 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <><Search size={16}/> RETRIEVE</>}
          </button>
        </div>
      </div>

      {/* LIVE AGGREGATE DISPLAY */}
      <div className="text-center py-2 animate-in zoom-in duration-300">
        <p className="bg-indigo-600 text-white inline-block px-12 py-2 rounded-full font-black text-[10px] shadow-xl uppercase tracking-[4px] border-4 border-indigo-100">
          Total Material Shifted (Period) = <span className="text-yellow-300 ml-1 italic">{totalShifted.toLocaleString()} BAGS</span>
        </p>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border-2 border-slate-100 rounded-xl shadow-2xl overflow-x-auto min-h-[450px]">
        <table className="w-full text-left border-collapse min-w-[1500px]">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 border-r border-indigo-200">MOVEMENT DATE</th>
              <th className="p-4 border-r border-indigo-200 text-indigo-900 bg-indigo-50/50 w-32 text-center">SHIFT REF NO.</th>
              <th className="p-4 border-r border-indigo-200 text-blue-800 w-28 text-center">LOT NO.</th>
              <th className="p-4 border-r border-slate-300 w-64"><Landmark size={10} className="inline mr-1"/> MERCHANT / PARTY NAME</th>
              <th className="p-4 border-r border-slate-300"><Package size={10} className="inline mr-1"/> ITEM & UNIT DESC.</th>
              <th className="p-4 border-r border-slate-300 text-red-600 bg-red-50/50 font-black">ORIGIN (FROM)</th>
              <th className="p-4 border-r border-slate-300 text-green-700 bg-green-50/50 font-black">DESTINATION (TO)</th>
              <th className="p-4 border-r border-indigo-200 text-center font-black bg-indigo-50">QTY MOVED</th>
              <th className="p-4 text-center no-print">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-24 text-center font-black text-indigo-700 animate-pulse text-lg uppercase tracking-widest">Scanning internal movement audit logs...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={9} className="p-24 text-center text-gray-400 italic font-medium">Select filters and retrieve data to view movement audit trail.</td></tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all font-bold even:bg-slate-50/30 group">
                  <td className="p-4 border-r border-slate-100 text-gray-500 font-mono">{formatDate(row.date)}</td>
                  <td className="p-4 border-r border-slate-100 font-black text-indigo-800 text-sm text-center shadow-inner">{row.shiftNo || "SFT-REG"}</td>
                  <td className="p-4 border-r border-slate-100 font-black text-blue-700 text-center bg-blue-50/20">{row.lot?.lotNo}</td>
                  <td className="p-4 border-r border-slate-100 uppercase truncate max-w-[250px] text-slate-800">{row.lot?.party?.tradeName}</td>
                  <td className="p-4 border-r border-slate-100 uppercase">
                    <div className="text-slate-700 font-black text-[10px]">{row.lot?.item?.name}</div>
                    <div className="text-[8px] text-gray-400 flex items-center gap-1 mt-0.5"><Tag size={8}/> {row.lot?.unit?.name} | {row.lot?.marka}</div>
                  </td>
                  <td className="p-4 border-r border-slate-100 text-red-500 italic bg-red-50/10 text-[9px] truncate max-w-[150px]">{row.fromLocation}</td>
                  <td className="p-4 border-r border-slate-100 text-green-600 font-black bg-green-50/10 text-[9px] truncate max-w-[150px]">{row.toLocation}</td>
                  <td className="p-4 border-r border-slate-100 text-center font-black text-slate-900 text-base bg-indigo-50/30">
                    {row.qty}
                  </td>
                  <td className="p-4 text-center no-print">
                     <button className="text-blue-600 hover:scale-125 transition-transform"><Printer size={18}/></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          
          {/* TOTALS FOOTER */}
          {data.length > 0 && (
            <tfoot className="bg-[#1e293b] text-white font-black uppercase text-[10px] border-t-4 border-indigo-500">
               <tr>
                 <td colSpan={7} className="p-4 text-right tracking-[5px] italic border-r border-slate-700">Page Shifting Summary</td>
                 <td className="p-4 text-center text-yellow-400 text-lg italic">{totalShifted} Bags</td>
                 <td className="bg-slate-800"></td>
               </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* FOOTER INFO BAR */}
      <div className="flex justify-between items-center bg-slate-50 p-2 border rounded shadow-inner opacity-60 no-print">
         <p className="font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
           <AlertCircle size={14} className="text-indigo-400"/> Audit Trail Entries: {data.length} | Aggregate: {totalShifted} Bags
         </p>
         <p className="text-[8px] font-black italic uppercase tracking-[10px]">Cold Storage Enterprise Intelligence</p>
      </div>
    </div>
  );
}
