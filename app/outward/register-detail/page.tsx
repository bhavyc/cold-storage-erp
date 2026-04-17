
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Search, FileSpreadsheet, Printer, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils"; // Custom utility for standardized dates
import { useRouter } from "next/navigation";

export default function OutwardDetailPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [masters, setMasters] = useState<any>({ parties: [], categories: [], items: [], units: [] });
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    partyId: "All",
    categoryId: "All",
    itemId: "All",
    unitId: "All",
    varietyName: "All",
    sortData: "GpDateDesc"
  });

  // 1. Initial Load: Fetch all dropdown data from Masters API
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [p, c, i, u] = await Promise.all([
          fetch("/api/masters/party").then(res => res.json()),
          fetch("/api/masters/category").then(res => res.json()),
          fetch("/api/masters/items").then(res => res.json()),
          fetch("/api/masters/units").then(res => res.json())
        ]);
        setMasters({ 
          parties: p || [], 
          categories: c || [], 
          items: i || [], 
          units: u || [] 
        });
      } catch (err) {
        toast.error("Dropdown data load karne mein galti hui!");
      }
    };
    loadMasters();
  }, []);

  // 2. SEARCH FUNCTION (Connects to /api/outward/register)
  const handleSearch = useCallback(async () => {
    setLoading(true);
    // Convert filter state to URL parameters
    const query = new URLSearchParams(filters as any).toString();
    try {
      const res = await fetch(`/api/outward/register?${query}`);
      if (!res.ok) throw new Error("Server Error");
      const json = await res.json();
      
      setData(json);
      if (json.length === 0) {
        toast.error("Is selection ke liye koi record nahi mila.");
      } else {
        toast.success(`${json.length} Dispatches found.`);
      }
    } catch (err) {
      toast.error("Outward data fetch fail ho gaya!");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      {/* Visual Header Branding (As per Image 83) */}
      <div className="text-center bg-white p-5 border rounded shadow-sm">
        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Visual Softech</h1>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">
          Block B, Plot No A 26, Mohan Cooperative, South Delhi, New Delhi 110044
        </p>
        <div className="flex justify-center gap-6 text-[10px] font-black text-indigo-700 mt-1">
           <span>PAN: AAXFV5416G</span>
           <span>GST: 07AAXFV5416G1ZO</span>
        </div>
      </div>

      {/* FILTER BAR (Exact mapping to Image 83 Grid) */}
      <div className="bg-[#b4b6e4]/30 p-5 border-2 border-indigo-100 rounded-xl shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end font-bold">
          
          <div>
            <label className="text-slate-600 uppercase mb-1 block">From Date</label>
            <input type="date" className="w-full border p-1.5 rounded bg-white outline-none focus:ring-1 focus:ring-indigo-400" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
          </div>

          <div>
            <label className="text-slate-600 uppercase mb-1 block">To Date</label>
            <input type="date" className="w-full border p-1.5 rounded bg-white outline-none focus:ring-1 focus:ring-indigo-400" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
          </div>

          <div className="lg:col-span-1">
            <label className="text-slate-600 uppercase mb-1 block">Party Name</label>
            <select className="w-full border p-1.5 rounded bg-white font-black text-blue-900 outline-none" value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})}>
              <option value="All">--- ALL PARTIES ---</option>
              {masters.parties.map((p: any) => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
            </select>
          </div>

          <div>
            <label className="text-slate-600 uppercase mb-1 block">Category</label>
            <select className="w-full border p-1.5 rounded bg-white outline-none" value={filters.categoryId} onChange={e => setFilters({...filters, categoryId: e.target.value})}>
              <option value="All">All Categories</option>
              {masters.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-slate-600 uppercase mb-1 block">Item Name</label>
            <select className="w-full border p-1.5 rounded bg-white outline-none" value={filters.itemId} onChange={e => setFilters({...filters, itemId: e.target.value})}>
              <option value="All">All Items</option>
              {masters.items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-slate-600 uppercase mb-1 block">Unit (Packing)</label>
            <select className="w-full border p-1.5 rounded bg-white outline-none" value={filters.unitId} onChange={e => setFilters({...filters, unitId: e.target.value})}>
              <option value="All">All Units</option>
              {masters.units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-slate-600 uppercase mb-1 block">Variety</label>
            <select className="w-full border p-1.5 rounded bg-white outline-none" value={filters.varietyName} onChange={e => setFilters({...filters, varietyName: e.target.value})}>
              <option value="All">All Varieties</option>
              <option value="Normal">Normal</option>
              <option value="Sugar Free">Sugar Free</option>
              <option value="Gola">Gola</option>
            </select>
          </div>

          <div>
            <label className="text-slate-600 uppercase mb-1 block">Sort Order</label>
            <select className="w-full border p-1.5 rounded bg-white outline-none" value={filters.sortData} onChange={e => setFilters({...filters, sortData: e.target.value})}>
              <option value="GpDateDesc">GP Date (New to Old)</option>
              <option value="GpDateAsc">GP Date (Old to New)</option>
              <option value="GpNoAsc">GP No (Low to High)</option>
              <option value="GpNoDesc">GP No (High to Low)</option>
            </select>
          </div>

          {/* Action Buttons Row */}
          <div className="flex gap-2 lg:col-span-2">
            <button 
              onClick={handleSearch} 
              disabled={loading}
              className="bg-red-600 text-white px-10 py-2 rounded font-black uppercase shadow-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-all flex-1 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={14}/> : <><Search size={14}/> SEARCH DATA</>}
            </button>
            <button className="bg-green-600 text-white p-2 rounded shadow hover:bg-green-700 transition-all"><FileSpreadsheet size={16}/></button>
            <button className="bg-red-500 text-white p-2 rounded shadow hover:bg-red-600 transition-all"><Printer size={16}/></button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-2">
         <div className="h-[1px] bg-slate-200 flex-1"></div>
         <h3 className="font-black text-slate-500 uppercase italic tracking-[5px]">Outward Register | Detail View</h3>
         <div className="h-[1px] bg-slate-200 flex-1"></div>
      </div>

      {/* DATA GRID (Exact 14 Columns Mapping) */}
      <div className="bg-white border rounded shadow-md overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse min-w-[1800px]">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 border-r border-slate-300">GP Date</th>
              <th className="p-3 border-r border-slate-300">GP No</th>
              <th className="p-3 border-r border-slate-300">Lot No.</th>
              <th className="p-3 border-r border-slate-300">Rec Date</th>
              <th className="p-3 border-r border-slate-300 text-center">GP Qty</th>
              <th className="p-3 border-r border-slate-300">Unit Type</th>
              <th className="p-3 border-r border-slate-300">Item Description</th>
              <th className="p-3 border-r border-slate-300">Party / Merchant Name</th>
              <th className="p-3 border-r border-slate-300">Category</th>
              <th className="p-3 border-r border-slate-300">Marka</th>
              <th className="p-3 border-r border-slate-300 text-center">Net Weight</th>
              <th className="p-3 border-r border-slate-300">Variety</th>
              <th className="p-3 border-r border-slate-300">Truck/Vehicle No</th>
              <th className="p-3">Delivery Person</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={14} className="p-20 text-center font-bold text-indigo-700 animate-pulse text-lg tracking-widest uppercase">Fetching Outward Logs From Database...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={14} className="p-20 text-center text-gray-400 italic font-medium uppercase tracking-tighter">No dispatch records found. Adjust filters and search.</td></tr>
            ) : data.map((row: any) => (
              <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all font-bold even:bg-slate-50/30">
                <td className="p-3 border-r border-slate-200 text-gray-600">{formatDate(row.gpDate)}</td>
                <td className="p-3 border-r border-slate-200 font-black text-indigo-700 uppercase">{row.gpNo}</td>
                <td className="p-3 border-r border-slate-200 font-black text-blue-600">{row.lot?.lotNo || "N/A"}</td>
                <td className="p-3 border-r border-slate-200 text-gray-500 font-mono">{formatDate(row.lot?.arrivalDate)}</td>
                <td className="p-3 border-r border-slate-200 text-center font-black text-red-600 bg-red-50/30">{row.qty}</td>
                <td className="p-3 border-r border-slate-200 text-slate-500">{row.lot?.unit?.name || "---"}</td>
                <td className="p-3 border-r border-slate-200 uppercase text-slate-700 truncate max-w-[150px]">{row.lot?.item?.name || "---"}</td>
                <td className="p-3 border-r border-slate-200 uppercase truncate max-w-[250px] text-slate-800">{row.lot?.party?.tradeName || "---"}</td>
                <td className="p-3 border-r border-slate-200 text-gray-400 italic">{row.lot?.item?.category?.name || "---"}</td>
                <td className="p-3 border-r border-slate-200 font-mono text-indigo-900">{row.lot?.marka || "-"}</td>
                <td className="p-3 border-r border-slate-200 text-center font-black text-indigo-950 bg-indigo-50/30">{Number(row.netWeight).toFixed(2)} Kg</td>
                <td className="p-3 border-r border-slate-200 italic text-blue-600">{row.lot?.variety || "Normal"}</td>
                <td className="p-3 border-r border-slate-200 font-mono text-gray-600 uppercase">{row.vehicleNo || "-"}</td>
                <td className="p-3 truncate max-w-[120px]">{row.personName || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER SUMMARY INFO */}
      <div className="bg-[#1e293b] p-3 border rounded-lg shadow-xl flex justify-between items-center text-white">
         <div className="flex gap-10">
            <p className="font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
              <AlertCircle size={14} className="text-indigo-400"/> Total Records: <span className="text-indigo-300 text-xs">{data.length}</span>
            </p>
            <p className="font-bold uppercase tracking-widest text-[10px]">
              Total Qty Dispatched: <span className="text-green-400 text-xs">{data.reduce((s, r) => s + (Number(r.qty) || 0), 0)} Bags</span>
            </p>
         </div>
         <p className="text-[8px] font-black italic opacity-40 uppercase tracking-[10px]">Visual Softech Intelligence</p>
      </div>
    </div>
  );
}

// "use client";

// import React, { useEffect, useState } from "react";
// import { Search, FileSpreadsheet, Printer, Loader2 } from "lucide-react";
// import { toast } from "react-hot-toast";

// export default function OutwardDetailPage() {
//   const [data, setData] = useState<any[]>([]);
//   const [masters, setMasters] = useState<any>({ parties: [], categories: [], items: [], units: [] });
//   const [loading, setLoading] = useState(false);
  
//   const [filters, setFilters] = useState({
//     fromDate: new Date().toISOString().split('T')[0],
//     toDate: new Date().toISOString().split('T')[0],
//     partyId: "All",
//     categoryId: "All",
//     itemId: "All",
//     unitId: "All",
//     varietyName: "All",
//     sortData: "GpDateDesc"
//   });

//   // 1. Initial Load: Fetch all dropdown data
//   useEffect(() => {
//     const loadMasters = async () => {
//       try {
//         const [p, c, i, u] = await Promise.all([
//           fetch("/api/masters/party").then(res => res.json()),
//           fetch("/api/masters/category").then(res => res.json()),
//           fetch("/api/masters/items").then(res => res.json()),
//           fetch("/api/masters/units").then(res => res.json())
//         ]);
//         setMasters({ parties: p, categories: c, items: i, units: u });
//       } catch (err) {
//         toast.error("Masters load nahi ho paye!");
//       }
//     };
//     loadMasters();
//   }, []);

//   // 2. SEARCH FUNCTION (Wired to Red Search Button)
//   const handleSearch = async () => {
//     setLoading(true);
//     const query = new URLSearchParams(filters).toString();
//     try {
//       const res = await fetch(`/api/outward/register?${query}`);
//       const json = await res.json();
//       if (res.ok) {
//         setData(json);
//         if (json.length === 0) toast.error("Is filter ke saath koi record nahi mila!");
//       }
//     } catch (err) {
//       toast.error("Fetch failed!");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
//       {/* Branding Header */}
//       <div className="text-center bg-white p-4 border rounded shadow-sm">
//         <h1 className="text-xl font-black uppercase tracking-tighter text-slate-800">Visual Softech</h1>
//         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Block B, Plot No A 26, Mohan Cooperative, South Delhi, New Delhi 110044</p>
//         <p className="text-[10px] font-bold text-indigo-700">PAN: AAXFV5416G | GST: 07AAXFV5416G1ZO</p>
//       </div>

//       {/* FILTER BAR (Exact mapping to Image 83) */}
//       <div className="bg-[#b4b6e4]/40 p-5 border rounded-lg shadow-sm">
//         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
          
//           <div>
//             <label className="font-bold text-slate-700 uppercase mb-1 block">From Date</label>
//             <input type="date" className="w-full border p-1.5 rounded bg-white" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
//           </div>

//           <div>
//             <label className="font-bold text-slate-700 uppercase mb-1 block">To Date</label>
//             <input type="date" className="w-full border p-1.5 rounded bg-white" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
//           </div>

//           <div>
//             <label className="font-bold text-slate-700 uppercase mb-1 block">Party Name</label>
//             <select className="w-full border p-1.5 rounded bg-white font-medium" value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})}>
//               <option value="All">All Parties</option>
//               {masters.parties.map((p: any) => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
//             </select>
//           </div>

//           <div>
//             <label className="font-bold text-slate-700 uppercase mb-1 block">Category</label>
//             <select className="w-full border p-1.5 rounded bg-white" value={filters.categoryId} onChange={e => setFilters({...filters, categoryId: e.target.value})}>
//               <option value="All">All Categories</option>
//               {masters.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
//             </select>
//           </div>

//           <div>
//             <label className="font-bold text-slate-700 uppercase mb-1 block">Item Name</label>
//             <select className="w-full border p-1.5 rounded bg-white" value={filters.itemId} onChange={e => setFilters({...filters, itemId: e.target.value})}>
//               <option value="All">All Items</option>
//               {masters.items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
//             </select>
//           </div>

//           <div>
//             <label className="font-bold text-slate-700 uppercase mb-1 block">Unit Name</label>
//             <select className="w-full border p-1.5 rounded bg-white" value={filters.unitId} onChange={e => setFilters({...filters, unitId: e.target.value})}>
//               <option value="All">All Units</option>
//               {masters.units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
//             </select>
//           </div>

//           <div>
//             <label className="font-bold text-slate-700 uppercase mb-1 block">Variety Name</label>
//             <select className="w-full border p-1.5 rounded bg-white font-medium" value={filters.varietyName} onChange={e => setFilters({...filters, varietyName: e.target.value})}>
//               <option value="All">All</option>
//               <option value="Normal">Normal</option>
//               <option value="Sugar Free">Sugar Free</option>
//             </select>
//           </div>

//           <div>
//             <label className="font-bold text-slate-700 uppercase mb-1 block">Sort By</label>
//             <select className="w-full border p-1.5 rounded bg-white" value={filters.sortData} onChange={e => setFilters({...filters, sortData: e.target.value})}>
//               <option value="GpDateDesc">GP Date (New to Old)</option>
//               <option value="GpDateAsc">GP Date (Old to New)</option>
//               <option value="GpNoAsc">GP No (Ascending)</option>
//               <option value="GpNoDesc">GP No (Descending)</option>
//             </select>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex gap-2">
//             <button 
//               onClick={handleSearch} 
//               disabled={loading}
//               className="bg-red-600 text-white px-8 py-2 rounded font-black uppercase shadow-md flex items-center justify-center gap-2 hover:bg-red-700 transition-all flex-1"
//             >
//               {loading ? <Loader2 className="animate-spin" size={14}/> : "SEARCH"}
//             </button>
//             <button className="bg-green-600 text-white p-2 rounded shadow-sm hover:bg-green-700"><FileSpreadsheet size={16}/></button>
//             <button className="bg-red-500 text-white p-2 rounded shadow-sm hover:bg-red-600"><Printer size={16}/></button>
//           </div>
//         </div>
//       </div>

//       <h3 className="text-center font-bold text-slate-600 border-b border-dashed pb-1 uppercase italic tracking-widest">Outward Register | Detail</h3>

//       {/* DATA GRID (Exact columns matching Image 83) */}
//       <div className="bg-white border rounded shadow-md overflow-x-auto">
//         <table className="w-full text-left border-collapse min-w-[1800px]">
//           <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 shadow-sm">
//             <tr>
//               <th className="p-2 border-r border-slate-300">GP Date</th>
//               <th className="p-2 border-r border-slate-300">GP No</th>
//               <th className="p-2 border-r border-slate-300">Lot No.</th>
//               <th className="p-2 border-r border-slate-300">Rec Date</th>
//               <th className="p-2 border-r border-slate-300 text-center">GP Qty</th>
//               <th className="p-2 border-r border-slate-300">Unit</th>
//               <th className="p-2 border-r border-slate-300">Item Name</th>
//               <th className="p-2 border-r border-slate-300">Party Name</th>
//               <th className="p-2 border-r border-slate-300">Category</th>
//               <th className="p-2 border-r border-slate-300">Marka</th>
//               <th className="p-2 border-r border-slate-300 text-center">GP Wgt</th>
//               <th className="p-2 border-r border-slate-300">Variety</th>
//               <th className="p-2 border-r border-slate-300">Truck No</th>
//               <th className="p-2">Person</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.length === 0 ? (
//               <tr><td colSpan={14} className="p-20 text-center text-gray-400 italic font-medium">Select Filter And Click Search To View Outward Data</td></tr>
//             ) : data.map((row: any) => (
//               <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all font-medium even:bg-slate-50/30">
//                 <td className="p-2 border-r border-slate-200">{new Date(row.gpDate).toLocaleDateString('en-GB')}</td>
//                 <td className="p-2 border-r border-slate-200 font-bold text-indigo-700">{row.gpNo}</td>
//                 <td className="p-2 border-r border-slate-200 font-bold text-blue-600">{row.lot.lotNo}</td>
//                 <td className="p-2 border-r border-slate-200">{new Date(row.lot.arrivalDate).toLocaleDateString('en-GB')}</td>
//                 <td className="p-2 border-r border-slate-200 text-center font-bold text-red-600">{row.qty}</td>
//                 <td className="p-2 border-r border-slate-200">{row.lot.unit.name}</td>
//                 <td className="p-2 border-r border-slate-200 uppercase font-bold text-slate-700">{row.lot.item.name}</td>
//                 <td className="p-2 border-r border-slate-200 uppercase truncate max-w-[200px]">{row.lot.party.tradeName}</td>
//                 <td className="p-2 border-r border-slate-200 text-gray-500">{row.lot.item.category.name}</td>
//                 <td className="p-2 border-r border-slate-200 font-mono">{row.lot.marka || "-"}</td>
//                 <td className="p-2 border-r border-slate-200 text-center font-black text-indigo-700">{Number(row.netWeight).toFixed(2)}</td>
//                 <td className="p-2 border-r border-slate-200 italic text-blue-600">{row.lot.variety || "Normal"}</td>
//                 <td className="p-2 border-r border-slate-200 font-mono text-gray-600">{row.vehicleNo || "-"}</td>
//                 <td className="p-2">{row.personName || "-"}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <div className="bg-slate-100 p-2 border rounded text-center">
//          <p className="text-[9px] font-bold text-slate-500">End of Report - Total Records Found: {data.length}</p>
//       </div>
//     </div>
//   );
// }