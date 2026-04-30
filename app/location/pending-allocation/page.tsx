"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search, Printer, FileSpreadsheet, Loader2, AlertCircle, PackageSearch, LayoutGrid, ArrowRight, Check, ChevronsUpDown, Landmark, Tag, Package } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

// --- SEARCHABLE SELECT COMPONENT (Writing + Selection Logic) ---
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
        <span className={`truncate font-bold text-[11px] ${selectedOption || value === "All" ? 'text-blue-900' : 'text-slate-400'}`}>
          {value === "All" ? "--- ALL PARTIES ---" : selectedOption ? `${selectedOption[displayKey]} [${selectedOption[secondaryKey]}]` : placeholder}
        </span>
        <ChevronsUpDown size={14} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-indigo-100 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-150">
          <input 
            autoFocus
            className="w-full p-2 border-b border-slate-100 outline-none font-bold text-indigo-600 sticky top-0 bg-indigo-50 text-[11px]"
            placeholder="Type name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            <div onClick={() => { onChange("All"); setIsOpen(false); }} className="p-2.5 hover:bg-slate-100 cursor-pointer font-black text-red-600 border-b text-[10px]">--- SHOW ALL ---</div>
            {filtered.map((opt: any) => (
              <div 
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(""); }}
                className="p-2.5 hover:bg-indigo-600 hover:text-white cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 font-bold text-[11px]"
              >
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

// --- MAIN REPORT PAGE ---
export default function PendingAllocationReport() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    fromLot: "",
    toLot: "",
    partyId: "All",
    query: "" 
  });

  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
  }, []);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters as any).toString();
      const res = await fetch(`/api/reports/pending-allocation?${queryParams}`);
      const json = await res.json();
      setData(json || []);
      if (json.length === 0) toast.success("Good Job! No pending allocations.");
    } catch (err) { toast.error("Fetch error!"); }
    finally { setLoading(false); }
  }, [filters]);

  const grandTotalPending = useMemo(() => data.reduce((sum, row) => sum + (Number(row.pendingQty) || 0), 0), [data]);

  return (
    <div className="space-y-4 text-[10px] animate-in fade-in duration-500">
      
      {/* Visual Header */}
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg shadow-lg flex justify-between items-center no-print border-b-4 border-indigo-300">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-[2px] text-xs">
          <LayoutGrid size={18}/> Pending Pallet Assignment | Warehouse Audit
        </h2>
        <div className="bg-white/20 px-4 py-1 rounded-full text-[9px] font-black italic uppercase">
           Internal Inventory Guard
        </div>
      </div>

      {/* SMART FILTER BAR */}
      <div className="bg-[#f0f1f7] border-2 border-slate-200 rounded-b-xl p-6 shadow-sm flex flex-wrap gap-6 items-end no-print">
        <div className="space-y-1">
          <label className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Lot Range</label>
          <div className="flex gap-2">
            <input className="border-2 border-white p-2 rounded-lg w-24 outline-none focus:border-indigo-400 font-bold shadow-inner" placeholder="FROM" value={filters.fromLot} onChange={e => setFilters({...filters, fromLot: e.target.value})} />
            <input className="border-2 border-white p-2 rounded-lg w-24 outline-none focus:border-indigo-400 font-bold shadow-inner" placeholder="TO" value={filters.toLot} onChange={e => setFilters({...filters, toLot: e.target.value})} />
          </div>
        </div>

        <div className="w-64 space-y-1">
          <label className="font-black text-slate-500 uppercase text-[9px] tracking-widest">Filter By Merchant</label>
          <SearchableSelect 
            options={parties} 
            value={filters.partyId} 
            onChange={(val: any) => setFilters({...filters, partyId: val})} 
            displayKey="tradeName" 
            secondaryKey="partyCode"
          />
        </div>

        <div className="space-y-1">
          <label className="font-black text-indigo-700 uppercase text-[9px] tracking-widest">Smart Search (Marka / Item / Lot)</label>
          <div className="relative">
            <PackageSearch className="absolute left-3 top-2.5 text-indigo-300" size={16} />
            <input 
              className="border-2 border-white p-2 pl-10 rounded-lg w-72 outline-none focus:border-indigo-500 font-black uppercase shadow-inner" 
              placeholder="TYPE ANYTHING..." 
              value={filters.query}
              onChange={e => setFilters({...filters, query: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-10 py-2.5 rounded-lg font-black uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>}
            SEARCH PENDING
          </button>
          <button onClick={() => window.print()} className="bg-slate-700 text-white p-2.5 rounded-lg shadow hover:bg-black transition-all"><Printer size={18}/></button>
          <button className="bg-green-600 text-white p-2.5 rounded-lg shadow hover:bg-green-800 transition-all"><FileSpreadsheet size={18}/></button>
        </div>
      </div>

      {/* GRAND TOTAL PENDING BADGE */}
      <div className="text-center py-2 animate-in zoom-in duration-300">
        <p className="bg-red-600 text-white inline-block px-16 py-3 rounded-full font-black text-[11px] shadow-2xl uppercase tracking-[4px] border-4 border-white">
          Total Unassigned Bags in Storage = <span className="text-yellow-300 text-lg ml-2 italic">{grandTotalPending.toLocaleString()}</span>
        </p>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border-2 border-slate-100 rounded-xl shadow-2xl overflow-hidden min-h-[450px]">
        <div className="bg-indigo-50/50 p-2 text-center font-black text-indigo-800 border-b italic uppercase tracking-widest flex items-center justify-center gap-2">
          <AlertCircle size={14} className="text-red-500 animate-pulse"/> Inventory Alert: Goods arrived but not yet allocated to specific Pallets
        </div>
        
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 shadow-sm z-10">
              <tr>
                <th className="p-4 border-r border-indigo-200 w-16 text-center">SR.</th>
                <th className="p-4 border-r border-indigo-200 w-28">PARTY CODE</th>
                <th className="p-4 border-r border-indigo-200 w-64"><Landmark size={10} className="inline mr-1"/> MERCHANT / PARTY NAME</th>
                <th className="p-4 border-r border-indigo-200 bg-indigo-100 text-indigo-900 w-28 text-center">LOT NO.</th>
                <th className="p-4 border-r border-indigo-200 w-32 font-mono">ITEM CODE</th>
                <th className="p-4 border-r border-indigo-200 w-52"><Package size={10} className="inline mr-1"/> ITEM DESCRIPTION</th>
                <th className="p-4 border-r border-indigo-200 w-32 text-center">PACKING</th>
                <th className="p-4 border-r border-indigo-200 text-center w-24">REC. QTY</th>
                <th className="p-4 border-r border-indigo-200 text-center text-blue-700 w-24">ALLOCATED</th>
                <th className="p-4 border-r border-indigo-200 text-center font-black text-red-600 bg-red-50 w-28">PENDING QTY</th>
                <th className="p-4 text-center w-32 bg-indigo-50">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="p-24 text-center font-black text-indigo-700 animate-pulse text-lg tracking-widest uppercase">Scanning Warehouse Digital Map...</td></tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-24 text-center text-gray-400 italic font-medium">
                    <div className="flex flex-col items-center gap-3 opacity-30 uppercase tracking-[5px]">
                       <Check size={48} className="text-green-500"/>
                       <p className="text-sm font-black">All Lots Allocated</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={row.lotNo} className="border-b hover:bg-indigo-50/50 transition-all font-bold group even:bg-slate-50/30">
                    <td className="p-4 border-r border-slate-100 text-center text-gray-400 font-mono">{idx + 1}</td>
                    <td className="p-4 border-r border-slate-100 font-mono text-indigo-700">{row.partyCode}</td>
                    <td className="p-4 border-r border-slate-100 uppercase truncate max-w-[250px] text-slate-800">{row.partyName}</td>
                    <td className="p-4 border-r border-slate-100 font-black text-indigo-900 bg-indigo-50/30 text-center">{row.lotNo}</td>
                    <td className="p-4 border-r border-slate-100 text-gray-400 font-mono text-[9px] uppercase">{row.itemCode}</td>
                    <td className="p-4 border-r border-slate-100 uppercase text-slate-700 font-medium truncate max-w-[200px]">{row.itemName}</td>
                    <td className="p-4 border-r border-slate-100 text-gray-500 text-center">{row.unitName}</td>
                    <td className="p-4 border-r border-slate-100 text-center text-slate-900">{row.receivedQty}</td>
                    <td className="p-4 border-r border-slate-100 text-center text-blue-600 bg-blue-50/20">{row.allocatedQty}</td>
                    <td className="p-4 border-r border-slate-100 text-center font-black text-red-600 bg-red-100/30">
                      {row.pendingQty}
                    </td>
                    <td className="p-4 text-center bg-indigo-50/30">
                       <button 
                         onClick={() => router.push(`/location/pallet-entry?lotNo=${row.lotNo}`)}
                         className="bg-white border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-600 hover:text-white px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 mx-auto shadow-sm transition-all active:scale-90"
                       >
                         FIX NOW <ArrowRight size={12}/>
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Audit Summary */}
      <div className="p-3 bg-[#1e293b] text-white rounded-lg flex justify-between items-center opacity-90 shadow-xl">
         <p className="font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
           <Landmark size={14} className="text-indigo-400"/> Critical Logs: {data.length} | Page Unallocated: {grandTotalPending} Bags
         </p>
         <p className="text-[8px] font-black italic uppercase tracking-[10px]">Cold Storage Enterprise v1.0.4</p>
      </div>
    </div>
  );
}
