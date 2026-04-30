
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Search, FileSpreadsheet, Printer, Plus, Loader2, AlertCircle, Check, ChevronsUpDown, Landmark, Tag, Calendar, LayoutList } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

// --- SEARCHABLE SELECT COMPONENT (Common Man Logic: Type + Select) ---
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
            placeholder="Type to search..."
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
                <span>{opt[displayKey]} <span className="opacity-60 text-[9px]">({opt[secondaryKey]})</span></span>
                {value === opt.id && <Check size={14} />}
              </div>
            )) : <div className="p-4 text-center text-slate-400 italic text-[11px]">No merchant found</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function OutwardSummaryPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 1. FILTER STATE (Mapping Image 81)
  const [filters, setFilters] = useState({
    filterType: "Search By Lot",
    fromDate: "2025-04-01",
    toDate: new Date().toISOString().split('T')[0],
    partyId: "All",
    sortData: "GpNoAsc"
  });

  // 2. Initial Load
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await fetch("/api/masters/party");
        const json = await res.json();
        setParties(json || []);
      } catch (err) {
        toast.error("Parties load nahi ho payi!");
      }
    };
    fetchParties();
  }, []);

  // 3. SEARCH FUNCTION
  const handleSearch = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams(filters as any).toString();
    try {
      const res = await fetch(`/api/outward/register?${query}&view=Summary`);
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      
      setData(json);
      if (json.length === 0) {
        toast.error("Is selection mein koi data nahi mila!");
      } else {
        toast.success(`${json.length} dispatch summaries loaded.`);
      }
    } catch (err) {
      toast.error("Outward data fetch fail ho gaya!");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* Visual Header Branding */}
      <div className="text-center bg-white p-5 border-b-4 border-indigo-500 rounded-lg shadow-sm">
        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800 italic">Cold Storage ERP</h1>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic mb-1">
           Warehouse Management & Inventory Audit System
        </p>
        <div className="flex justify-center gap-6 text-[10px] font-black text-indigo-700">
           <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">GST: 07AAXFV5416G1ZO</span>
           <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">PAN: AAXFV5416G</span>
        </div>
      </div>

      {/* FILTER BOX (Image 81 UI Replication with Writing Search) */}
      <div className="bg-[#f0f1f7] p-6 border-2 border-slate-200 rounded-xl shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end font-bold text-slate-700">
          
          <div className="space-y-1">
            <label className="uppercase mb-1 block text-[9px] tracking-widest text-slate-500">Search Mode</label>
            <select 
              className="w-full border-2 border-white p-1.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-400 font-bold"
              value={filters.filterType}
              onChange={e => setFilters({...filters, filterType: e.target.value})}
            >
              <option>Search By Lot</option>
              <option>Search By Party</option>
              <option>Search By GP No</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="uppercase mb-1 block text-[9px] tracking-widest text-slate-500">From Date</label>
            <input type="date" className="w-full border-2 border-white p-1.5 rounded-lg bg-white outline-none font-bold" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
          </div>

          <div className="space-y-1">
            <label className="uppercase mb-1 block text-[9px] tracking-widest text-slate-500">To Date</label>
            <input type="date" className="w-full border-2 border-white p-1.5 rounded-lg bg-white outline-none font-bold" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
          </div>

          <div className="lg:col-span-1 space-y-1">
            <label className="uppercase mb-1 block text-[9px] tracking-widest text-indigo-700 font-black">Merchant / Party Name</label>
            <SearchableSelect 
              options={parties} 
              value={filters.partyId} 
              onChange={(id: any) => setFilters({...filters, partyId: id})} 
              placeholder="--- TYPE NAME OR CODE ---" 
              displayKey="tradeName" 
              secondaryKey="partyCode"
            />
          </div>

          <div className="space-y-1">
            <label className="uppercase mb-1 block text-[9px] tracking-widest text-slate-500">Sort By</label>
            <select className="w-full border-2 border-white p-1.5 rounded-lg bg-white outline-none font-bold" value={filters.sortData} onChange={e => setFilters({...filters, sortData: e.target.value})}>
              <option value="GpNoAsc">GP No (Low to High)</option>
              <option value="GpNoDesc">GP No (High to Low)</option>
              <option value="GpDateAsc">Date (Old to New)</option>
              <option value="GpDateDesc">Date (New to Old)</option>
            </select>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex justify-between items-center mt-6">
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-red-600 text-white px-12 py-2.5 rounded-lg font-black uppercase shadow-lg flex items-center gap-2 hover:bg-red-700 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={16}/> : <><Search size={16}/> RETRIEVE SUMMARY</>}
          </button>
          
          <div className="flex gap-3">
            <button className="bg-green-600 text-white p-2.5 rounded-lg shadow hover:bg-green-700 transition-all" title="Export Excel"><FileSpreadsheet size={20}/></button>
            <button onClick={() => window.print()} className="bg-slate-700 text-white p-2.5 rounded-lg shadow hover:bg-black transition-all" title="Print Register"><Printer size={20}/></button>
            <button 
              onClick={() => router.push('/outward/gp-entry')} 
              className="bg-orange-500 text-white p-2.5 rounded-lg shadow hover:bg-orange-600 transition-all"
              title="New Gate Pass"
            >
              <Plus size={20}/>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-4">
         <div className="h-[2px] bg-slate-200 flex-1"></div>
         <h3 className="font-black text-slate-500 uppercase italic tracking-[8px] flex items-center gap-2">
            <LayoutList size={16}/> OUTWARD LOG SUMMARY
         </h3>
         <div className="h-[2px] bg-slate-200 flex-1"></div>
      </div>

      {/* DATA TABLE (All 8 Summary Columns) */}
      <div className="bg-white border-2 border-slate-100 rounded-xl shadow-2xl overflow-hidden min-h-[450px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[10px] border-b-2 border-indigo-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 border-r border-indigo-100">GP DATE</th>
              <th className="p-4 border-r border-indigo-100 text-indigo-900 bg-indigo-50/50 w-32 text-center">GP NO.</th>
              <th className="p-4 border-r border-indigo-100 w-64">PARTY / MERCHANT NAME</th>
              <th className="p-4 border-r border-indigo-100 text-center bg-red-50 text-red-700 w-28">GP QTY</th>
              <th className="p-4 border-r border-indigo-100 text-center bg-indigo-50 w-32">NET WEIGHT</th>
              <th className="p-4 border-r border-indigo-100 text-center text-blue-800 w-28">LOT NO.</th>
              <th className="p-4 border-r border-indigo-100">ITEM DESCRIPTION</th>
              <th className="p-4 text-center w-32 bg-indigo-50">ACTION</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {loading ? (
              <tr><td colSpan={8} className="p-24 text-center font-black text-indigo-700 animate-pulse text-lg uppercase tracking-widest">Scanning Dispatch Registry...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} className="p-24 text-center text-gray-400 italic font-medium uppercase tracking-[5px]">Define filter range and click search to view summary</td></tr>
            ) : (
              data.map((row: any) => (
                <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all group even:bg-slate-50/30">
                  <td className="p-4 border-r border-slate-100 text-gray-600 font-mono text-[10px]">{formatDate(row.gpDate)}</td>
                  <td className="p-4 border-r border-slate-100 font-black text-indigo-800 text-sm text-center shadow-inner">{row.gpNo}</td>
                  <td className="p-4 border-r border-slate-100 uppercase truncate max-w-[250px] text-slate-800">{row.lot?.party?.tradeName || "---"}</td>
                  <td className="p-4 border-r border-slate-100 text-center font-black text-red-600 bg-red-50/20 text-base">{row.qty}</td>
                  <td className="p-4 border-r border-slate-100 text-center font-black text-indigo-900 bg-indigo-50/20">{Number(row.netWeight).toFixed(2)} <span className="text-[8px] font-normal opacity-50">Kg</span></td>
                  <td className="p-4 border-r border-slate-100 text-center font-black text-blue-700 shadow-inner">{row.lot?.lotNo || "N/A"}</td>
                  <td className="p-4 border-r border-slate-100 uppercase text-slate-500 font-medium">{row.lot?.item?.name || "---"}</td>
                  <td className="p-4 text-center bg-indigo-50/30">
                    <button 
                      onClick={() => router.push(`/outward/register-detail?gpNo=${row.gpNo}`)}
                      className="bg-white border-2 border-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full font-black uppercase text-[8px] hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"
                    >
                      VIEW DETAIL
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          
          {/* TOTALS FOOTER */}
          {data.length > 0 && (
            <tfoot className="bg-[#1e293b] text-white font-black uppercase text-[10px] border-t-4 border-indigo-500">
               <tr>
                 <td colSpan={3} className="p-4 text-right tracking-[5px] italic border-r border-slate-700">Page Aggregate Summary</td>
                 <td className="p-4 text-center text-orange-400 text-sm">{data.reduce((s, r) => s + (Number(r.qty) || 0), 0)} Bags</td>
                 <td className="p-4 text-center text-green-400 text-sm">{data.reduce((s, r) => s + (Number(r.netWeight) || 0), 0).toFixed(2)} Kg</td>
                 <td colSpan={3}></td>
               </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* FOOTER INFO BAR */}
      <div className="flex justify-between items-center bg-[#f8f9fa] p-3 border rounded shadow-inner opacity-60">
         <p className="font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
           <AlertCircle size={14} className="text-indigo-400"/> Filtered Summary Records: {data.length}
         </p>
         <p className="text-[8px] font-black italic uppercase tracking-[10px]">Cold Storage Enterprise</p>
      </div>
    </div>
  );
}

//  "use client";

// import React, { useEffect, useState, useCallback } from "react";
// import { Search, FileSpreadsheet, Printer, Plus, Loader2, AlertCircle } from "lucide-react";
// import { toast } from "react-hot-toast";
// import { useRouter } from "next/navigation";
// import { formatDate } from "@/lib/utils"; // Standard date utility

// export default function OutwardSummaryPage() {
//   const router = useRouter();
//   const [data, setData] = useState<any[]>([]);
//   const [parties, setParties] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
  
//   // 1. FILTER STATE (Exact mapping to Image 81)
//   const [filters, setFilters] = useState({
//     filterType: "Search By Lot",
//     fromDate: new Date().toISOString().split('T')[0],
//     toDate: new Date().toISOString().split('T')[0],
//     partyId: "All",
//     sortData: "GpNoAsc"
//   });

//   // 2. Initial Load: Fetch Parties for Dropdown
//   useEffect(() => {
//     const fetchParties = async () => {
//       try {
//         const res = await fetch("/api/masters/party");
//         const json = await res.json();
//         setParties(json || []);
//       } catch (err) {
//         toast.error("Parties load karne mein error!");
//       }
//     };
//     fetchParties();
//   }, []);

//   // 3. SEARCH FUNCTION (Hits /api/outward/register)
//   const handleSearch = useCallback(async () => {
//     setLoading(true);
//     const query = new URLSearchParams(filters as any).toString();
//     try {
//       const res = await fetch(`/api/outward/register?${query}&view=Summary`);
//       if (!res.ok) throw new Error("Search failed");
//       const json = await res.json();
      
//       setData(json);
//       if (json.length === 0) {
//         toast.error("Is period mein koi dispatch nahi mila!");
//       } else {
//         toast.success(`${json.length} records found.`);
//       }
//     } catch (err) {
//       toast.error("Outward data fetch fail ho gaya!");
//     } finally {
//       setLoading(false);
//     }
//   }, [filters]);

//   return (
//     <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
//       {/* Visual Header Branding (As per Image 81) */}
//       <div className="text-center bg-white p-5 border rounded shadow-sm">
//         <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Cold Storage</h1>
//         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">
//           Block B, Plot No A 26, Mohan Cooperative, South Delhi, New Delhi 110044
//         </p>
//         <div className="flex justify-center gap-6 text-[10px] font-black text-indigo-700 mt-1">
//            <span>PAN: AAXFV5416G</span>
//            <span>GST: 07AAXFV5416G1ZO</span>
//         </div>
//       </div>

//       {/* FILTER BOX (Image 81 UI Replication) */}
//       <div className="bg-[#b4b6e4]/30 p-5 border-2 border-indigo-100 rounded-xl shadow-sm">
//         <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end font-bold text-slate-700">
          
//           <div>
//             <label className="uppercase mb-1 block text-[10px]">Filter Type</label>
//             <select 
//               className="w-full border p-1.5 rounded bg-white outline-none focus:ring-1 focus:ring-indigo-400"
//               value={filters.filterType}
//               onChange={e => setFilters({...filters, filterType: e.target.value})}
//             >
//               <option>Search By Lot</option>
//               <option>Search By Party</option>
//               <option>Search By GP No</option>
//             </select>
//           </div>

//           <div>
//             <label className="uppercase mb-1 block text-[10px]">From Date</label>
//             <input 
//               type="date" 
//               className="w-full border p-1.5 rounded bg-white outline-none" 
//               value={filters.fromDate}
//               onChange={e => setFilters({...filters, fromDate: e.target.value})}
//             />
//           </div>

//           <div>
//             <label className="uppercase mb-1 block text-[10px]">To Date</label>
//             <input 
//               type="date" 
//               className="w-full border p-1.5 rounded bg-white outline-none" 
//               value={filters.toDate}
//               onChange={e => setFilters({...filters, toDate: e.target.value})}
//             />
//           </div>

//           <div>
//             <label className="uppercase mb-1 block text-[10px]">Party Name</label>
//             <select 
//               className="w-full border p-1.5 rounded bg-white font-black text-indigo-800 outline-none"
//               value={filters.partyId}
//               onChange={e => setFilters({...filters, partyId: e.target.value})}
//             >
//               <option value="All">--- ALL PARTIES ---</option>
//               {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
//             </select>
//           </div>

//           <div>
//             <label className="uppercase mb-1 block text-[10px]">Sort Data</label>
//             <select 
//               className="w-full border p-1.5 rounded bg-white outline-none"
//               value={filters.sortData}
//               onChange={e => setFilters({...filters, sortData: e.target.value})}
//             >
//               <option value="GpNoAsc">GP No (Low to High)</option>
//               <option value="GpNoDesc">GP No (High to Low)</option>
//               <option value="GpDateAsc">GP Date (Old to New)</option>
//               <option value="GpDateDesc">GP Date (New to Old)</option>
//             </select>
//           </div>
//         </div>

//         {/* Search & Action Row */}
//         <div className="flex justify-between items-center mt-5">
//           <button 
//             onClick={handleSearch}
//             disabled={loading}
//             className="bg-red-600 text-white px-12 py-2 rounded font-black uppercase shadow-lg flex items-center gap-2 hover:bg-red-700 transition-all active:scale-95"
//           >
//             {loading ? <Loader2 className="animate-spin" size={14}/> : <><Search size={14}/> SEARCH SUMMARY</>}
//           </button>
          
//           <div className="flex gap-3">
//             <button className="bg-green-600 text-white p-2 rounded shadow hover:bg-green-700 transition-all" title="Export to Excel"><FileSpreadsheet size={18}/></button>
//             <button className="bg-red-500 text-white p-2 rounded shadow hover:bg-red-600 transition-all" title="Print Register"><Printer size={18}/></button>
//             <button 
//               onClick={() => router.push('/outward/gp-entry')} 
//               className="bg-orange-500 text-white p-2 rounded shadow hover:bg-orange-600 transition-all"
//               title="Create New Gate Pass"
//             >
//               <Plus size={18}/>
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="flex items-center justify-center gap-4 py-2">
//          <div className="h-[1px] bg-slate-200 flex-1"></div>
//          <h3 className="font-black text-slate-400 uppercase italic tracking-[5px]">Outward Register | Summary View</h3>
//          <div className="h-[1px] bg-slate-200 flex-1"></div>
//       </div>

//       {/* DATA TABLE (Mapping Image 81 Columns) */}
//       <div className="bg-white border rounded shadow-md overflow-hidden min-h-[400px]">
//         <table className="w-full text-left border-collapse">
//           <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] border-b border-indigo-200">
//             <tr>
//               <th className="p-3 border-r border-indigo-100">GP DATE</th>
//               <th className="p-3 border-r border-indigo-100">GP NO</th>
//               <th className="p-3 border-r border-indigo-100">PARTY / MERCHANT NAME</th>
//               <th className="p-3 border-r border-indigo-100 text-center">GP QTY</th>
//               <th className="p-3 border-r border-indigo-100 text-center">NET WEIGHT</th>
//               <th className="p-3 border-r border-indigo-100 text-center">LOT NO</th>
//               <th className="p-3 border-r border-indigo-100">ITEM DESCRIPTION</th>
//               <th className="p-3 text-center">ACTION</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={8} className="p-20 text-center font-bold text-indigo-700 animate-pulse uppercase tracking-widest text-lg">Loading Summary Data...</td></tr>
//             ) : data.length === 0 ? (
//               <tr><td colSpan={8} className="p-20 text-center text-gray-400 italic">Select Filter And Click Search To View Data</td></tr>
//             ) : (
//               data.map((row: any) => (
//                 <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all font-bold group even:bg-slate-50/30">
//                   <td className="p-3 border-r border-slate-100 text-gray-600">{formatDate(row.gpDate)}</td>
//                   <td className="p-3 border-r border-slate-100 font-black text-indigo-700 uppercase">{row.gpNo}</td>
//                   <td className="p-3 border-r border-slate-100 uppercase truncate max-w-[250px]">{row.lot?.party?.tradeName || "---"}</td>
//                   <td className="p-3 border-r border-slate-100 text-center font-black text-red-600 bg-red-50/30">{row.qty}</td>
//                   <td className="p-3 border-r border-slate-100 text-center font-black text-indigo-900 bg-indigo-50/30">{Number(row.netWeight).toFixed(2)} Kg</td>
//                   <td className="p-3 border-r border-slate-100 text-center font-black text-blue-600">{row.lot?.lotNo || "N/A"}</td>
//                   <td className="p-3 border-r border-slate-100 uppercase text-slate-500">{row.lot?.item?.name || "---"}</td>
//                   <td className="p-3 text-center">
//                     <button 
//                       onClick={() => router.push(`/outward/register-detail?gpNo=${row.gpNo}`)}
//                       className="text-blue-600 hover:underline font-black uppercase text-[9px] tracking-tighter"
//                     >
//                       View Detail
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
          
//           {/* TOTALS FOOTER */}
//           {data.length > 0 && (
//             <tfoot className="bg-slate-800 text-white font-black uppercase">
//                <tr>
//                  <td colSpan={3} className="p-3 text-right tracking-widest italic">Page Total (Current Selection)</td>
//                  <td className="p-3 text-center text-orange-400">{data.reduce((s, r) => s + (Number(r.qty) || 0), 0)}</td>
//                  <td className="p-3 text-center text-green-400">{data.reduce((s, r) => s + (Number(r.netWeight) || 0), 0).toFixed(2)} Kg</td>
//                  <td colSpan={3}></td>
//                </tr>
//             </tfoot>
//           )}
//         </table>
//       </div>

//       {/* FOOTER INFO BAR */}
//       <div className="flex justify-between items-center bg-[#f8f9fa] p-3 border rounded shadow-inner opacity-60">
//          <p className="font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
//            <AlertCircle size={14}/> Records on Current Filter: {data.length}
//          </p>
//          <p className="text-[8px] font-black italic uppercase tracking-[10px]">Cold Storage Enterprise</p>
//       </div>
//     </div>
//   );
// }


