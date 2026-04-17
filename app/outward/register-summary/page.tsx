"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Search, FileSpreadsheet, Printer, Plus, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils"; // Standard date utility

export default function OutwardSummaryPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 1. FILTER STATE (Exact mapping to Image 81)
  const [filters, setFilters] = useState({
    filterType: "Search By Lot",
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    partyId: "All",
    sortData: "GpNoAsc"
  });

  // 2. Initial Load: Fetch Parties for Dropdown
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await fetch("/api/masters/party");
        const json = await res.json();
        setParties(json || []);
      } catch (err) {
        toast.error("Parties load karne mein error!");
      }
    };
    fetchParties();
  }, []);

  // 3. SEARCH FUNCTION (Hits /api/outward/register)
  const handleSearch = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams(filters as any).toString();
    try {
      const res = await fetch(`/api/outward/register?${query}&view=Summary`);
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      
      setData(json);
      if (json.length === 0) {
        toast.error("Is period mein koi dispatch nahi mila!");
      } else {
        toast.success(`${json.length} records found.`);
      }
    } catch (err) {
      toast.error("Outward data fetch fail ho gaya!");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* Visual Header Branding (As per Image 81) */}
      <div className="text-center bg-white p-5 border rounded shadow-sm">
        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">VISUAL SOFTECH</h1>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">
          Block B, Plot No A 26, Mohan Cooperative, South Delhi, New Delhi 110044
        </p>
        <div className="flex justify-center gap-6 text-[10px] font-black text-indigo-700 mt-1">
           <span>PAN: AAXFV5416G</span>
           <span>GST: 07AAXFV5416G1ZO</span>
        </div>
      </div>

      {/* FILTER BOX (Image 81 UI Replication) */}
      <div className="bg-[#b4b6e4]/30 p-5 border-2 border-indigo-100 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end font-bold text-slate-700">
          
          <div>
            <label className="uppercase mb-1 block text-[10px]">Filter Type</label>
            <select 
              className="w-full border p-1.5 rounded bg-white outline-none focus:ring-1 focus:ring-indigo-400"
              value={filters.filterType}
              onChange={e => setFilters({...filters, filterType: e.target.value})}
            >
              <option>Search By Lot</option>
              <option>Search By Party</option>
              <option>Search By GP No</option>
            </select>
          </div>

          <div>
            <label className="uppercase mb-1 block text-[10px]">From Date</label>
            <input 
              type="date" 
              className="w-full border p-1.5 rounded bg-white outline-none" 
              value={filters.fromDate}
              onChange={e => setFilters({...filters, fromDate: e.target.value})}
            />
          </div>

          <div>
            <label className="uppercase mb-1 block text-[10px]">To Date</label>
            <input 
              type="date" 
              className="w-full border p-1.5 rounded bg-white outline-none" 
              value={filters.toDate}
              onChange={e => setFilters({...filters, toDate: e.target.value})}
            />
          </div>

          <div>
            <label className="uppercase mb-1 block text-[10px]">Party Name</label>
            <select 
              className="w-full border p-1.5 rounded bg-white font-black text-indigo-800 outline-none"
              value={filters.partyId}
              onChange={e => setFilters({...filters, partyId: e.target.value})}
            >
              <option value="All">--- ALL PARTIES ---</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
            </select>
          </div>

          <div>
            <label className="uppercase mb-1 block text-[10px]">Sort Data</label>
            <select 
              className="w-full border p-1.5 rounded bg-white outline-none"
              value={filters.sortData}
              onChange={e => setFilters({...filters, sortData: e.target.value})}
            >
              <option value="GpNoAsc">GP No (Low to High)</option>
              <option value="GpNoDesc">GP No (High to Low)</option>
              <option value="GpDateAsc">GP Date (Old to New)</option>
              <option value="GpDateDesc">GP Date (New to Old)</option>
            </select>
          </div>
        </div>

        {/* Search & Action Row */}
        <div className="flex justify-between items-center mt-5">
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-red-600 text-white px-12 py-2 rounded font-black uppercase shadow-lg flex items-center gap-2 hover:bg-red-700 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={14}/> : <><Search size={14}/> SEARCH SUMMARY</>}
          </button>
          
          <div className="flex gap-3">
            <button className="bg-green-600 text-white p-2 rounded shadow hover:bg-green-700 transition-all" title="Export to Excel"><FileSpreadsheet size={18}/></button>
            <button className="bg-red-500 text-white p-2 rounded shadow hover:bg-red-600 transition-all" title="Print Register"><Printer size={18}/></button>
            <button 
              onClick={() => router.push('/outward/gp-entry')} 
              className="bg-orange-500 text-white p-2 rounded shadow hover:bg-orange-600 transition-all"
              title="Create New Gate Pass"
            >
              <Plus size={18}/>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-2">
         <div className="h-[1px] bg-slate-200 flex-1"></div>
         <h3 className="font-black text-slate-400 uppercase italic tracking-[5px]">Outward Register | Summary View</h3>
         <div className="h-[1px] bg-slate-200 flex-1"></div>
      </div>

      {/* DATA TABLE (Mapping Image 81 Columns) */}
      <div className="bg-white border rounded shadow-md overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] border-b border-indigo-200">
            <tr>
              <th className="p-3 border-r border-indigo-100">GP DATE</th>
              <th className="p-3 border-r border-indigo-100">GP NO</th>
              <th className="p-3 border-r border-indigo-100">PARTY / MERCHANT NAME</th>
              <th className="p-3 border-r border-indigo-100 text-center">GP QTY</th>
              <th className="p-3 border-r border-indigo-100 text-center">NET WEIGHT</th>
              <th className="p-3 border-r border-indigo-100 text-center">LOT NO</th>
              <th className="p-3 border-r border-indigo-100">ITEM DESCRIPTION</th>
              <th className="p-3 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-20 text-center font-bold text-indigo-700 animate-pulse uppercase tracking-widest text-lg">Loading Summary Data...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} className="p-20 text-center text-gray-400 italic">Select Filter And Click Search To View Data</td></tr>
            ) : (
              data.map((row: any) => (
                <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all font-bold group even:bg-slate-50/30">
                  <td className="p-3 border-r border-slate-100 text-gray-600">{formatDate(row.gpDate)}</td>
                  <td className="p-3 border-r border-slate-100 font-black text-indigo-700 uppercase">{row.gpNo}</td>
                  <td className="p-3 border-r border-slate-100 uppercase truncate max-w-[250px]">{row.lot?.party?.tradeName || "---"}</td>
                  <td className="p-3 border-r border-slate-100 text-center font-black text-red-600 bg-red-50/30">{row.qty}</td>
                  <td className="p-3 border-r border-slate-100 text-center font-black text-indigo-900 bg-indigo-50/30">{Number(row.netWeight).toFixed(2)} Kg</td>
                  <td className="p-3 border-r border-slate-100 text-center font-black text-blue-600">{row.lot?.lotNo || "N/A"}</td>
                  <td className="p-3 border-r border-slate-100 uppercase text-slate-500">{row.lot?.item?.name || "---"}</td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => router.push(`/outward/register-detail?gpNo=${row.gpNo}`)}
                      className="text-blue-600 hover:underline font-black uppercase text-[9px] tracking-tighter"
                    >
                      View Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          
          {/* TOTALS FOOTER */}
          {data.length > 0 && (
            <tfoot className="bg-slate-800 text-white font-black uppercase">
               <tr>
                 <td colSpan={3} className="p-3 text-right tracking-widest italic">Page Total (Current Selection)</td>
                 <td className="p-3 text-center text-orange-400">{data.reduce((s, r) => s + (Number(r.qty) || 0), 0)}</td>
                 <td className="p-3 text-center text-green-400">{data.reduce((s, r) => s + (Number(r.netWeight) || 0), 0).toFixed(2)} Kg</td>
                 <td colSpan={3}></td>
               </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* FOOTER INFO BAR */}
      <div className="flex justify-between items-center bg-[#f8f9fa] p-3 border rounded shadow-inner opacity-60">
         <p className="font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
           <AlertCircle size={14}/> Records on Current Filter: {data.length}
         </p>
         <p className="text-[8px] font-black italic uppercase tracking-[10px]">Visual Softech Enterprise</p>
      </div>
    </div>
  );
}







// "use client";

// import React, { useEffect, useState } from "react";
// import { Search, FileSpreadsheet, Printer, Plus, Loader2 } from "lucide-react";
// import { toast } from "react-hot-toast";
// import { useRouter } from "next/navigation";

// export default function OutwardSummaryPage() {
//   const router = useRouter();
//   const [data, setData] = useState<any[]>([]);
//   const [parties, setParties] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
  
//   // 1. FILTER STATE (Exact as per Image 81)
//   const [filters, setFilters] = useState({
//     filterType: "Search By Lot",
//     fromDate: new Date().toISOString().split('T')[0],
//     toDate: new Date().toISOString().split('T')[0],
//     partyId: "All",
//     sortData: "GpNoAsc"
//   });

//   // 2. Initial Load: Parties for Dropdown
//   useEffect(() => {
//     fetch("/api/masters/party")
//       .then(res => res.json())
//       .then(setParties)
//       .catch(() => toast.error("Parties load nahi hui!"));
//   }, []);

//   // 3. SEARCH FUNCTION
//   const handleSearch = async () => {
//     setLoading(true);
//     const query = new URLSearchParams(filters).toString();
//     try {
//       const res = await fetch(`/api/outward/register?${query}`);
//       const json = await res.json();
//       if (res.ok) {
//         setData(json);
//         if (json.length === 0) toast.error("Koi data nahi mila!");
//       }
//     } catch (err) {
//       toast.error("Fetch failed!");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
//       {/* Visual Header Branding */}
//       <div className="text-center bg-white p-4 border rounded shadow-sm">
//         <h1 className="text-xl font-black uppercase tracking-tighter text-slate-800">VISUAL SOFTECH</h1>
//         <p className="text-[9px] text-gray-500 font-bold">Block B, Plot No A 26, Mohan Cooperative, South Delhi, New Delhi 110044</p>
//         <p className="text-[9px] font-bold text-indigo-700">PAN: AAXFV5416G | GST: 07AAXFV5416G1ZO</p>
//       </div>

//       {/* FILTER BOX (Image 81 UI Replication) */}
//       <div className="bg-[#b4b6e4]/40 p-5 border rounded shadow-sm">
//         <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          
//           <div>
//             <label className="font-bold text-slate-600 uppercase mb-1 block">Select Filter Type</label>
//             <select 
//               className="w-full border p-1.5 rounded bg-white font-medium outline-none focus:ring-1 focus:ring-indigo-400"
//               value={filters.filterType}
//               onChange={e => setFilters({...filters, filterType: e.target.value})}
//             >
//               <option>Search By Lot</option>
//               <option>Search By Party</option>
//               <option>Search By GP No</option>
//             </select>
//           </div>

//           <div>
//             <label className="font-bold text-slate-600 uppercase mb-1 block">From Date</label>
//             <input 
//               type="date" 
//               className="w-full border p-1.5 rounded bg-white" 
//               value={filters.fromDate}
//               onChange={e => setFilters({...filters, fromDate: e.target.value})}
//             />
//           </div>

//           <div>
//             <label className="font-bold text-slate-600 uppercase mb-1 block">To Date</label>
//             <input 
//               type="date" 
//               className="w-full border p-1.5 rounded bg-white" 
//               value={filters.toDate}
//               onChange={e => setFilters({...filters, toDate: e.target.value})}
//             />
//           </div>

//           <div>
//             <label className="font-bold text-slate-600 uppercase mb-1 block">Party Name</label>
//             <select 
//               className="w-full border p-1.5 rounded bg-white font-bold text-indigo-800"
//               value={filters.partyId}
//               onChange={e => setFilters({...filters, partyId: e.target.value})}
//             >
//               <option value="All">All</option>
//               {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
//             </select>
//           </div>

//           <div>
//             <label className="font-bold text-slate-600 uppercase mb-1 block">Sort Data</label>
//             <select 
//               className="w-full border p-1.5 rounded bg-white font-medium"
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

//         {/* Search & Export Row */}
//         <div className="flex justify-between items-center mt-4">
//           <button 
//             onClick={handleSearch}
//             disabled={loading}
//             className="bg-red-600 text-white px-10 py-1.5 rounded font-black uppercase shadow-md flex items-center gap-2 hover:bg-red-700 transition-all"
//           >
//             {loading ? <Loader2 className="animate-spin" size={14}/> : "SEARCH"}
//           </button>
          
//           <div className="flex gap-2">
//             <button className="bg-green-600 text-white p-2 rounded shadow hover:bg-green-700 transition-all"><FileSpreadsheet size={16}/></button>
//             <button className="bg-red-500 text-white p-2 rounded shadow hover:bg-red-600 transition-all"><Printer size={16}/></button>
//             <button onClick={() => router.push('/outward/gp-entry')} className="bg-orange-500 text-white p-2 rounded shadow hover:bg-orange-600 transition-all"><Plus size={16}/></button>
//           </div>
//         </div>
//       </div>

//       <h3 className="text-center font-bold text-slate-500 border-b border-dashed pb-1 uppercase italic tracking-widest">Outward Register | Summary</h3>

//       {/* DATA TABLE (Image 81 Columns) */}
//       <div className="bg-white border rounded shadow-md overflow-hidden min-h-[300px]">
//         <table className="w-full text-left border-collapse">
//           <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] border-b border-slate-300">
//             <tr>
//               <th className="p-3 border-r border-slate-300">GP DATE</th>
//               <th className="p-3 border-r border-slate-300">GP NO</th>
//               <th className="p-3 border-r border-slate-300">PARTY NAME</th>
//               <th className="p-3 border-r border-slate-300 text-center">GP QTY</th>
//               <th className="p-3 border-r border-slate-300 text-center">GP WGT</th>
//               <th className="p-3 border-r border-slate-300 text-center">LOT NO</th>
//               <th className="p-3 border-r border-slate-300">ITEM NAME</th>
//               <th className="p-3 text-center">ACTION</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.length === 0 ? (
//               <tr><td colSpan={8} className="p-20 text-center text-gray-400 italic font-medium">Select Filter To View Data</td></tr>
//             ) : data.map((row: any) => (
//               <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all font-medium">
//                 <td className="p-3 border-r border-slate-200">{new Date(row.gpDate).toLocaleDateString('en-GB')}</td>
//                 <td className="p-3 border-r border-slate-200 font-bold text-indigo-700">{row.gpNo}</td>
//                 <td className="p-3 border-r border-slate-200 uppercase truncate max-w-[150px]">{row.lot.party.tradeName}</td>
//                 <td className="p-3 border-r border-slate-200 text-center font-black text-red-600">{row.qty}</td>
//                 <td className="p-3 border-r border-slate-200 text-center font-bold text-indigo-900">{Number(row.netWeight).toFixed(2)}</td>
//                 <td className="p-3 border-r border-slate-200 text-center font-bold text-blue-600">{row.lot.lotNo}</td>
//                 <td className="p-3 border-r border-slate-200 uppercase">{row.lot.item.name}</td>
//                 <td className="p-3 text-center">
//                   <button className="text-blue-600 hover:underline font-bold">View</button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }