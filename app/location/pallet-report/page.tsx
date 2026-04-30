"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Printer, FileSpreadsheet, MapPin, Loader2, User, Tag, ArrowLeft, Check, ChevronsUpDown, Landmark, Calendar, Package } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

// --- SEARCHABLE SELECT COMPONENT (Writing + Selection) ---
const SearchableSelect = ({ options, value, onChange, placeholder, displayKey = "name" }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<any>(null);

  const filtered = options.filter((opt: any) =>
    opt[displayKey]?.toLowerCase().includes(searchTerm.toLowerCase())
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
        className="w-full border-2 border-white p-2 rounded-lg bg-white flex justify-between items-center cursor-pointer hover:border-indigo-400 transition-all shadow-inner"
      >
        <span className={`truncate font-bold text-[11px] ${selectedOption || value === "All" ? 'text-blue-900' : 'text-slate-400'}`}>
          {value === "All" ? "--- ALL CHAMBERS ---" : selectedOption ? selectedOption[displayKey] : placeholder}
        </span>
        <ChevronsUpDown size={14} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-indigo-100 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-150">
          <input 
            autoFocus
            className="w-full p-2 border-b border-slate-100 outline-none font-bold text-indigo-600 sticky top-0 bg-indigo-50 text-[11px]"
            placeholder="Search chamber..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto">
            <div 
              onClick={() => { onChange("All"); setIsOpen(false); }}
              className="p-2.5 hover:bg-slate-100 cursor-pointer font-black text-red-600 border-b text-[10px]"
            >
              --- SHOW ALL CHAMBERS ---
            </div>
            {filtered.map((opt: any) => (
              <div 
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(""); }}
                className="p-2.5 hover:bg-indigo-600 hover:text-white cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 font-bold text-[11px]"
              >
                <span>{opt[displayKey]}</span>
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
export default function PalletReportPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [chambers, setChambers] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    chamberId: "All",
    partyId: "All",
    query: "" // Global search for Pallet No, Lot No, Marka
  });

  useEffect(() => {
    fetch("/api/masters/chambers").then(res => res.json()).then(setChambers);
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/warehouse/pallet-report?${queryParams}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.length === 0) toast.error("Is criteria mein koi maal nahi mila!");
      }
    } catch (err) {
      toast.error("Fetch failed!");
    } finally {
      setLoading(false);
    }
  };

  const totalQty = useMemo(() => data.reduce((s, item) => s + (item.assignedQty || 0), 0), [data]);

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* Visual Header */}
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg shadow-lg flex justify-between items-center no-print border-b-4 border-indigo-300">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-[2px] text-xs">
          <MapPin size={18} /> Warehouse Inventory & Pallet Position Report
        </h2>
        <button 
          onClick={() => router.push('/location/pallet-entry')}
          className="bg-white/10 hover:bg-white/20 px-4 py-1 rounded font-bold flex items-center gap-2 uppercase transition-all"
        >
          <ArrowLeft size={14}/> Back To Entry
        </button>
      </div>

      {/* SMART FILTER BAR */}
      <div className="bg-[#f0f1f7] p-6 border-2 border-slate-200 rounded-xl shadow-inner grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end no-print">
        <div className="space-y-1">
          <label className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Select Chamber</label>
          <SearchableSelect 
            options={chambers} 
            value={filters.chamberId} 
            onChange={(val: any) => setFilters({...filters, chamberId: val})} 
          />
        </div>

        <div className="space-y-1">
          <label className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Filter By Merchant</label>
          <SearchableSelect 
            options={parties} 
            value={filters.partyId} 
            onChange={(val: any) => setFilters({...filters, partyId: val})} 
            displayKey="tradeName"
            placeholder="--- ALL PARTIES ---"
          />
        </div>

        <div className="space-y-1">
          <label className="font-black text-indigo-700 uppercase text-[9px] tracking-widest">Smart Query (Pallet / Lot / Marka)</label>
          <input 
            className="w-full border-2 border-white p-2 rounded-lg outline-none font-bold placeholder:font-normal uppercase shadow-inner focus:border-indigo-400" 
            placeholder="TYPE ANY REF..." 
            value={filters.query}
            onChange={(e) => setFilters({...filters, query: e.target.value})}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-red-600 text-white px-8 py-2 rounded-lg font-black uppercase hover:bg-red-700 shadow-lg flex-1 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>}
            RETRIEVE STOCK
          </button>
          <button onClick={() => window.print()} className="bg-slate-700 text-white p-2 rounded-lg shadow hover:bg-black transition-all"><Printer size={18}/></button>
        </div>
      </div>

      {/* TOTAL BADGE */}
      <div className="text-center py-2">
        <p className="bg-indigo-600 text-white inline-block px-12 py-2 rounded-full font-black text-[10px] shadow-xl tracking-[4px] uppercase border-4 border-indigo-100">
          Total Material on Pallets = <span className="text-yellow-300 ml-2">{totalQty.toLocaleString()} BAGS</span>
        </p>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border-2 border-slate-100 rounded-xl shadow-2xl overflow-hidden min-h-[450px]">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 shadow-sm z-10">
            <tr>
              <th className="p-4 border-r border-indigo-200 w-16 text-center">SR.</th>
              <th className="p-4 border-r border-indigo-200 w-40">STORAGE CHAMBER</th>
              <th className="p-4 border-r border-indigo-200 w-32 bg-indigo-50 text-indigo-900 text-center">PALLET NO.</th>
              <th className="p-4 border-r border-indigo-200 w-64"><Landmark size={10} className="inline mr-1"/> MERCHANT / PARTY</th>
              <th className="p-4 border-r border-indigo-200 w-32 bg-indigo-50 text-indigo-900 text-center">LOT NO.</th>
              <th className="p-4 border-r border-indigo-200"><Package size={10} className="inline mr-1"/> ITEM & MARKA</th>
              <th className="p-4 border-r border-indigo-200 text-center bg-red-50 text-red-700 w-28">QTY</th>
              <th className="p-4 text-center w-32"><Calendar size={10} className="inline mr-1"/> PLACED ON</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-24 text-center font-black text-indigo-700 animate-pulse text-lg uppercase tracking-widest">Scanning Digital Warehouse Map...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} className="p-24 text-center text-gray-400 italic font-medium">Select criteria and search to view current stock positions.</td></tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all font-bold group even:bg-slate-50/30">
                  <td className="p-4 border-r border-slate-100 text-center text-gray-400 font-mono">{idx + 1}</td>
                  <td className="p-4 border-r border-slate-100 text-slate-600 uppercase font-medium">{row.chamber.name}</td>
                  <td className="p-4 border-r border-slate-100 font-black text-indigo-800 text-sm text-center shadow-inner">{row.palletNo}</td>
                  <td className="p-4 border-r border-slate-100 uppercase text-slate-800 truncate max-w-[250px]">{row.lot?.party?.tradeName || "---"}</td>
                  <td className="p-4 border-r border-slate-100 font-black text-blue-700 text-center bg-blue-50/20">{row.lot?.lotNo || "---"}</td>
                  <td className="p-4 border-r border-slate-100 uppercase">
                    <div className="text-slate-700 font-black text-[10px]">{row.lot?.item?.name || "---"}</div>
                    <div className="text-[8px] text-gray-400 flex items-center gap-1 mt-0.5"><Tag size={8}/> MARKA: {row.lot?.marka || "NA"}</div>
                  </td>
                  <td className="p-4 border-r border-slate-100 text-center font-black text-red-600 bg-red-50/30 text-base">
                    {row.assignedQty}
                  </td>
                  <td className="p-4 text-center font-mono text-gray-500 bg-slate-50/30">
                     {formatDate(row.date)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Audit Hint */}
      <div className="p-3 bg-[#1e293b] text-white rounded-lg flex justify-between items-center opacity-90 shadow-xl">
         <p className="font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
           <Landmark size={14} className="text-indigo-400"/> Total Records in View: {data.length}
         </p>
         <p className="text-[8px] font-black italic uppercase tracking-[10px]">Cold Storage Internal Logistics Audit</p>
      </div>
    </div>
  );
}
