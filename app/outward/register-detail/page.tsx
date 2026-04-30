"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Search, FileSpreadsheet, Printer, Loader2, AlertCircle, Check, ChevronsUpDown, Landmark, Calendar, Package, Tag, Filter ,FileText} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

// --- SEARCHABLE SELECT COMPONENT (Common Man Logic) ---
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
        className="w-full border-2 border-slate-200 p-1.5 rounded-lg bg-white flex justify-between items-center cursor-pointer hover:border-indigo-400 transition-all shadow-sm"
      >
        <span className={`truncate font-bold text-[11px] ${selectedOption ? 'text-blue-900' : 'text-slate-400'}`}>
          {selectedOption ? (secondaryKey ? `${selectedOption[displayKey]} [${selectedOption[secondaryKey]}]` : selectedOption[displayKey]) : placeholder}
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
            )) : <div className="p-4 text-center text-slate-400 italic text-[11px]">No match found</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE ---
export default function OutwardDetailPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [masters, setMasters] = useState<any>({ parties: [], categories: [], items: [], units: [] });
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    fromDate: "2025-04-01",
    toDate: new Date().toISOString().split('T')[0],
    partyId: "All",
    categoryId: "All",
    itemId: "All",
    unitId: "All",
    varietyName: "All",
    sortData: "GpDateDesc"
  });

  // 1. Initial Load
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [p, c, i, u] = await Promise.all([
          fetch("/api/masters/party").then(res => res.json()),
          fetch("/api/masters/category").then(res => res.json()),
          fetch("/api/masters/items").then(res => res.json()),
          fetch("/api/masters/units").then(res => res.json())
        ]);
        setMasters({ parties: p || [], categories: c || [], items: i || [], units: u || [] });
      } catch (err) { toast.error("Dropdown data missing!"); }
    };
    loadMasters();
  }, []);

  // 2. SEARCH FUNCTION
  const handleSearch = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams(filters as any).toString();
    try {
      const res = await fetch(`/api/outward/register?${query}`);
      if (!res.ok) throw new Error("Server Error");
      const json = await res.json();
      setData(json);
      if (json.length === 0) toast.error("No dispatches found.");
    } catch (err) { toast.error("Fetch failed!"); }
    finally { setLoading(false); }
  }, [filters]);

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      {/* Visual Branding */}
      <div className="text-center bg-white p-6 border-b-4 border-indigo-500 rounded-lg shadow-sm">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800 italic">Cold Storage ERP</h1>
        <div className="flex justify-center gap-8 text-[10px] font-black text-indigo-700 mt-2">
           <span className="bg-indigo-50 px-3 py-1 rounded border border-indigo-100 uppercase flex items-center gap-1"><Landmark size={12}/> PAN: AAXFV5416G</span>
           <span className="bg-indigo-50 px-3 py-1 rounded border border-indigo-100 uppercase flex items-center gap-1"><Tag size={12}/> GST: 07AAXFV5416G1ZO</span>
        </div>
      </div>

      {/* FILTER BAR (Searchable Grid) */}
      <div className="bg-[#f0f1f7] p-6 border-2 border-slate-200 rounded-xl shadow-inner">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 items-end font-bold">
          
          <div className="space-y-1">
            <label className="text-slate-500 uppercase mb-1 block flex items-center gap-1"><Calendar size={12}/> From Date</label>
            <input type="date" className="w-full border-2 border-white p-1.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-400 font-bold" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 uppercase mb-1 block flex items-center gap-1"><Calendar size={12}/> To Date</label>
            <input type="date" className="w-full border-2 border-white p-1.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-400 font-bold" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
          </div>

          <div className="lg:col-span-1 space-y-1">
            <label className="text-indigo-700 uppercase mb-1 block">Merchant / Party Name</label>
            <SearchableSelect 
              options={masters.parties} value={filters.partyId} 
              onChange={(id: any) => setFilters({...filters, partyId: id})} 
              placeholder="--- SEARCH PARTY ---" displayKey="tradeName" secondaryKey="partyCode"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 uppercase mb-1 block">Item Category</label>
            <SearchableSelect 
              options={masters.categories} value={filters.categoryId} 
              onChange={(id: any) => setFilters({...filters, categoryId: id})} 
              placeholder="--- CATEGORY ---" displayKey="name" secondaryKey="code"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 uppercase mb-1 block">Item Name</label>
            <SearchableSelect 
              options={masters.items} value={filters.itemId} 
              onChange={(id: any) => setFilters({...filters, itemId: id})} 
              placeholder="--- SELECT ITEM ---" displayKey="name" secondaryKey="code"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 uppercase mb-1 block">Unit (Packing)</label>
            <SearchableSelect 
              options={masters.units} value={filters.unitId} 
              onChange={(id: any) => setFilters({...filters, unitId: id})} 
              placeholder="--- PACKING ---" displayKey="name" secondaryKey="code"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 uppercase mb-1 block">Sort Records</label>
            <select className="w-full border-2 border-white p-2 rounded-lg bg-white outline-none font-bold" value={filters.sortData} onChange={e => setFilters({...filters, sortData: e.target.value})}>
              <option value="GpDateDesc">Date: New to Old</option>
              <option value="GpDateAsc">Date: Old to New</option>
              <option value="GpNoDesc">GP No: High to Low</option>
            </select>
          </div>

          <div className="flex gap-2 lg:col-span-2">
            <button 
              onClick={handleSearch} disabled={loading}
              className="bg-red-600 text-white px-10 py-2.5 rounded-lg font-black uppercase shadow-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-all flex-1 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={16}/> : <><Search size={16}/> RETRIEVE DISPATCH LOGS</>}
            </button>
            <button className="bg-green-600 text-white p-2.5 rounded-lg shadow hover:bg-green-700"><FileSpreadsheet size={18}/></button>
            <button onClick={() => window.print()} className="bg-slate-700 text-white p-2.5 rounded-lg shadow hover:bg-black"><Printer size={18}/></button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-4">
         <div className="h-[2px] bg-slate-200 flex-1"></div>
         <h3 className="font-black text-slate-500 uppercase italic tracking-[8px] text-[12px] flex items-center gap-2">
            <Filter size={16}/> OUTWARD LOGBOOK DETAIL
         </h3>
         <div className="h-[2px] bg-slate-200 flex-1"></div>
      </div>

      {/* DATA GRID (14 COLUMNS RESTORED) */}
      <div className="bg-white border-2 border-slate-100 rounded-xl shadow-2xl overflow-x-auto min-h-[450px]">
        <table className="w-full text-left border-collapse min-w-[2200px]">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10 shadow-md">
            <tr>
              <th className="p-4 border-r border-indigo-200 w-32">DISPATCH DATE</th>
              <th className="p-4 border-r border-indigo-200 w-28 text-indigo-900 bg-indigo-50/50">GP NO.</th>
              <th className="p-4 border-r border-slate-300 w-28 text-blue-800">LOT NO.</th>
              <th className="p-4 border-r border-slate-300 w-32">ARRIVAL DATE</th>
              <th className="p-4 border-r border-slate-300 w-24 text-center bg-red-50 text-red-700">GP QTY</th>
              <th className="p-4 border-r border-slate-300 w-28 text-center">PACKING</th>
              <th className="p-4 border-r border-slate-300 w-52">ITEM DESCRIPTION</th>
              <th className="p-4 border-r border-slate-300 w-64">MERCHANT / PARTY NAME</th>
              <th className="p-4 border-r border-slate-300 w-32 italic">CATEGORY</th>
              <th className="p-4 border-r border-slate-300 w-32">MARKA</th>
              <th className="p-4 border-r border-slate-300 w-32 text-center bg-indigo-50">NET WEIGHT</th>
              <th className="p-4 border-r border-slate-300 w-32">VARIETY</th>
              <th className="p-4 border-r border-slate-300 w-40 font-mono text-center">TRUCK NO.</th>
              <th className="p-4">DELIVERY PERSON / REP.</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {loading ? (
              <tr><td colSpan={14} className="p-24 text-center font-black text-indigo-700 animate-pulse text-lg uppercase tracking-widest">Compiling Outward Audit Records...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={14} className="p-24 text-center text-gray-400 italic font-medium uppercase tracking-[5px]">Select filters and click search to view detailed dispatch trail</td></tr>
            ) : data.map((row: any) => (
              <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all even:bg-slate-50/30">
                <td className="p-4 border-r border-slate-100 text-gray-600">{formatDate(row.gpDate)}</td>
                <td className="p-4 border-r border-slate-100 font-black text-indigo-800 text-sm">{row.gpNo}</td>
                <td className="p-4 border-r border-slate-100 font-black text-blue-700 shadow-inner">{row.lot?.lotNo || "N/A"}</td>
                <td className="p-4 border-r border-slate-100 text-gray-500 font-mono text-[10px]">{formatDate(row.lot?.arrivalDate)}</td>
                <td className="p-4 border-r border-slate-100 text-center font-black text-red-600 bg-red-50/20 text-sm">{row.qty}</td>
                <td className="p-4 border-r border-slate-100 uppercase text-gray-400 text-[10px]">{row.lot?.unit?.name || "---"}</td>
                <td className="p-4 border-r border-slate-100 uppercase text-slate-700 truncate max-w-[150px]">{row.lot?.item?.name || "---"}</td>
                <td className="p-4 border-r border-slate-100 uppercase truncate max-w-[250px] text-slate-800">{row.lot?.party?.tradeName || "---"}</td>
                <td className="p-4 border-r border-slate-100 text-gray-400 italic">{row.lot?.item?.category?.name || "---"}</td>
                <td className="p-4 border-r border-slate-100 font-mono text-indigo-900 uppercase">{row.lot?.marka || "-"}</td>
                <td className="p-4 border-r border-slate-100 text-center font-black text-indigo-950 bg-indigo-50/30">{Number(row.netWeight).toFixed(2)} Kg</td>
                <td className="p-4 border-r border-slate-100 italic text-blue-600">{row.lot?.variety || "Normal"}</td>
                <td className="p-4 border-r border-slate-100 font-mono uppercase text-slate-600 text-center">{row.vehicleNo || "-"}</td>
                <td className="p-4 truncate max-w-[120px] font-medium">{row.personName || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER SUMMARY */}
      <div className="bg-[#1e293b] p-5 border rounded-xl shadow-2xl flex justify-between items-center text-white relative overflow-hidden">
         <div className="absolute right-0 top-0 p-2 opacity-5"><FileText size={100}/></div>
         <div className="flex gap-16 relative z-10">
            <div className="space-y-1">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Distinct Dispatches</p>
                <div className="text-2xl font-black text-white italic">{data.length} <span className="text-[10px] font-normal opacity-50 not-italic uppercase">Logs Found</span></div>
            </div>
            <div className="space-y-1 border-l-2 border-slate-700 pl-16">
                <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Aggregate Qty Released</p>
                <div className="text-2xl font-black text-green-400 italic">{data.reduce((s, r) => s + (Number(r.qty) || 0), 0)} <span className="text-[10px] font-normal opacity-50 not-italic uppercase text-white">Bags</span></div>
            </div>
         </div>
         <p className="text-[8px] font-black italic opacity-30 uppercase tracking-[10px]">Cold Storage Intelligence v1.0</p>
      </div>
    </div>
  );
}
