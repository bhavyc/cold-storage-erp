"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Search, FileSpreadsheet, Printer, AlertCircle, Loader2, ArrowLeft, History, Filter } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

// --- STRICT TYPES ---
interface InwardRecord {
  id: string;
  lotNo: string;
  mrNo: string;
  arrivalDate: string;
  receivedQty: number;
  balanceQty: number;
  marka: string | null;
  pMarka: string | null;
  variety: string | null;
  floor: string | null;
  pole: string | null;
  perUnitWgt: any;
  totalTareWgt: any;
  totalNetWgt: any;
  lotValue: any;
  rate: number;
  labour: number;
  party: { tradeName: string; partyCode: string };
  item: { name: string; category: { name: string } };
  unit: { name: string };
  chamber: { name: string };
  inwardEntry: {
    truckNo: string | null;
    deliveryPerson: string | null;
    billingType: string | null;
    remarks: string | null; // E-Way Bill yahan hai
  } | null;
}

export default function InwardRegisterPage() {
  const router = useRouter();
  const [viewType, setViewType] = useState<"Summary" | "Detail">("Summary");
  const [data, setData] = useState<InwardRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [parties, setParties] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    filterType: "Search By Party",
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    partyId: "All",
    categoryId: "All",
    itemId: "All",
    unitId: "All",
    variety: "All",
    sortBy: "Rec Date Desc"
  });

  const handleSearch = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({...filters, view: viewType} as any).toString();

    try {
      const res = await fetch(`/api/reports/inward-register?${query}`);
      const json = await res.json();
      setData(json);
      if (json.length === 0) toast.error("Koi records nahi mile!");
    } catch (err) {
      toast.error("Data load karne mein error!");
    } finally {
      setLoading(false);
    }
  }, [filters, viewType]);

  useEffect(() => {
    const fetchMasters = async () => {
      const [p, i] = await Promise.all([
        fetch("/api/masters/party").then(res => res.json()),
        fetch("/api/masters/items").then(res => res.json())
      ]);
      setParties(p); setItems(i);
      handleSearch();
    };
    fetchMasters();
  }, []);

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm no-print">
        <div className="flex gap-2">
          <button onClick={() => router.push('/inward/mr-entry')} className="bg-red-600 text-white px-5 py-1.5 rounded font-black flex items-center gap-2 uppercase shadow-md active:scale-95 transition-all">
            <ArrowLeft size={14}/> Back To MR Entry
          </button>
          <button onClick={handleSearch} className="bg-indigo-600 text-white px-5 py-1.5 rounded font-black flex items-center gap-2 shadow-md hover:bg-indigo-700">
            <History size={14}/> Refresh Data
          </button>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setViewType("Summary")} className={`px-6 py-1.5 rounded font-black uppercase transition-all ${viewType === 'Summary' ? 'bg-orange-500 text-white shadow-inner' : 'bg-slate-100 text-slate-500'}`}>Summary</button>
           <button onClick={() => setViewType("Detail")} className={`px-6 py-1.5 rounded font-black uppercase transition-all ${viewType === 'Detail' ? 'bg-orange-500 text-white shadow-inner' : 'bg-slate-100 text-slate-500'}`}>Full Detail</button>
        </div>
      </div>

      {/* --- FILTER SECTION (USER FRIENDLY) --- */}
      <div className="bg-[#f0f1f7] p-6 border-2 border-slate-200 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
        <div className="space-y-1">
          <label className="font-black text-indigo-900 uppercase text-[10px]">From Date</label>
          <input type="date" className="w-full border-2 border-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="font-black text-indigo-900 uppercase text-[10px]">To Date</label>
          <input type="date" className="w-full border-2 border-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
        </div>
        <div className="lg:col-span-2 space-y-1">
          <label className="font-black text-indigo-900 uppercase text-[10px]">Merchant / Kisan Name</label>
          <select className="w-full border-2 border-white p-2 rounded-lg font-black text-blue-900 outline-none" value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})}>
            <option value="All">--- ALL REGISTERED PARTIES ---</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName} [{p.partyCode}]</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="font-black text-indigo-900 uppercase text-[10px]">Item Description</label>
          <select className="w-full border-2 border-white p-2 rounded-lg font-medium" value={filters.itemId} onChange={e => setFilters({...filters, itemId: e.target.value})}>
            <option value="All">All Items</option>
            {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSearch} disabled={loading} className="bg-red-600 text-white px-8 py-2 rounded-lg font-black uppercase shadow-lg flex-1 flex items-center justify-center gap-2 active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin" size={14}/> : <><Search size={14}/> SEARCH</>}
          </button>
        </div>
      </div>

      {/* --- DATA TABLE (LOT NO FIRST) --- */}
      <div className="bg-white border-2 border-slate-100 rounded-xl shadow-2xl overflow-x-auto min-h-[500px]">
        <table className="w-full border-collapse min-w-[2000px] text-left">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10 shadow-md">
            {viewType === "Summary" ? (
              <tr>
                <th className="p-4 border-r border-indigo-200 bg-indigo-100 w-28 text-center text-indigo-900">LOT NO.</th>
                <th className="p-4 border-r border-slate-300">MR NO.</th>
                <th className="p-4 border-r border-slate-300">RECEIPT DATE</th>
                <th className="p-4 border-r border-slate-300">MERCHANT / PARTY NAME</th>
                <th className="p-4 border-r border-slate-300 text-center">INWARD QTY</th>
                <th className="p-4 border-r border-slate-300 text-center bg-red-50 text-red-700">LIVE BALANCE</th>
                <th className="p-4 border-r border-slate-300">ITEM DESCRIPTION</th>
                <th className="p-4 border-r border-slate-300">VARIETY</th>
                <th className="p-4 text-center w-24">ACTION</th>
              </tr>
            ) : (
              <tr>
                <th className="p-3 border-r border-indigo-200 bg-indigo-100 w-24 text-center text-indigo-900">LOT NO.</th>
                <th className="p-3 border-r border-slate-300 w-24">MR NO.</th>
                <th className="p-3 border-r border-slate-300 w-28">REC DATE</th>
                <th className="p-3 border-r border-slate-300 w-48">PARTY NAME</th>
                <th className="p-3 border-r border-slate-300 w-48">ITEM NAME</th>
                <th className="p-3 border-r border-slate-300 w-24 bg-yellow-50 text-orange-900 text-center">VARIETY</th>
                <th className="p-3 border-r border-slate-300 w-20 text-center">QTY</th>
                <th className="p-3 border-r border-slate-300 w-24 text-center">PACKING</th>
                <th className="p-3 border-r border-slate-300 w-28">CHAMBER</th>
                <th className="p-3 border-r border-slate-300 w-16 text-center">FLR</th>
                <th className="p-3 border-r border-slate-300 w-16 text-center">PLR</th>
                <th className="p-3 border-r border-slate-300 w-24">MARKA</th>
                <th className="p-3 border-r border-slate-300 w-24 text-center">RENT</th>
                <th className="p-3 border-r border-slate-300 w-24 text-center">LABOUR</th>
                <th className="p-3 border-r border-slate-300 w-24 text-center text-red-600">TARE (Kg)</th>
                <th className="p-3 border-r border-slate-300 w-24 text-center text-blue-600">NET (Kg)</th>
                <th className="p-3 border-r border-slate-300 w-28 text-center text-green-700 bg-green-50">VALUATION</th>
                <th className="p-3 border-r border-slate-300 w-32">TRUCK NO.</th>
                <th className="p-3 border-r border-slate-300 w-40">PERSON NAME</th>
                <th className="p-3 border-r border-slate-300 w-48">E-WAY BILL / REMARKS</th>
                <th className="p-3 text-center">ACTION</th>
              </tr>
            )}
          </thead>

          <tbody className="font-bold">
            {loading ? (
              <tr><td colSpan={20} className="p-24 text-center font-black text-indigo-700 animate-pulse text-lg uppercase tracking-widest">Scanning Warehouse Logs...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={20} className="p-24 text-center text-gray-400 italic">No records found. Click search to view register.</td></tr>
            ) : data.map((row) => {
              const net = Number(row.totalNetWgt) || 0;
              const tare = Number(row.totalTareWgt) || 0;

              return (
                <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all even:bg-slate-50/30 group">
                  {/* LOT NO FIRST IN BOTH VIEWS */}
                  <td className="p-3 border-r border-indigo-200 bg-indigo-50/50 text-center font-black text-indigo-950 text-xs shadow-inner">{row.lotNo}</td>
                  
                  {viewType === "Summary" ? (
                    <>
                      <td className="p-3 border-r border-slate-100 text-indigo-700 uppercase">{row.mrNo}</td>
                      <td className="p-3 border-r border-slate-100 text-gray-500 font-mono">{formatDate(row.arrivalDate)}</td>
                      <td className="p-3 border-r border-slate-100 uppercase truncate max-w-[300px] text-slate-800">{row.party.tradeName}</td>
                      <td className="p-3 border-r border-slate-100 text-center text-blue-600 text-sm">{row.receivedQty}</td>
                      <td className="p-3 border-r border-slate-100 text-center text-red-600 bg-red-50/50 text-sm">{row.balanceQty}</td>
                      <td className="p-3 border-r border-slate-100 uppercase text-slate-500 font-medium">{row.item.name}</td>
                      <td className="p-3 border-r border-slate-100 text-orange-600 italic">{row.variety || "Normal"}</td>
                      <td className="p-3 text-center"><button onClick={() => router.push(`/inward/update?lot=${row.lotNo}`)} className="bg-blue-600 text-white px-4 py-1 rounded-full text-[9px] hover:bg-black transition-all">VIEW</button></td>
                    </>
                  ) : (
                    <>
                      <td className="p-2 border-r border-slate-100 font-black text-indigo-700">{row.mrNo}</td>
                      <td className="p-2 border-r border-slate-100 font-mono text-gray-400">{formatDate(row.arrivalDate)}</td>
                      <td className="p-2 border-r border-slate-100 uppercase truncate max-w-[200px] text-slate-800">{row.party.tradeName}</td>
                      <td className="p-2 border-r border-slate-100 uppercase truncate max-w-[200px] text-slate-500">{row.item.name}</td>
                      <td className="p-2 border-r border-slate-100 bg-yellow-50 text-orange-700 text-center italic">{row.variety || "Normal"}</td>
                      <td className="p-2 border-r border-slate-100 text-center font-black text-blue-700">{row.receivedQty}</td>
                      <td className="p-2 border-r border-slate-100 uppercase text-gray-400 text-[10px]">{row.unit.name}</td>
                      <td className="p-2 border-r border-slate-100 truncate max-w-[120px] text-slate-600">{row.chamber.name}</td>
                      <td className="p-2 border-r border-slate-100 text-center">{row.floor || "0"}</td>
                      <td className="p-2 border-r border-slate-100 text-center">{row.pole || "0"}</td>
                      <td className="p-2 border-r border-slate-100 uppercase text-indigo-600">{row.marka || "-"}</td>
                      <td className="p-2 border-r border-slate-100 text-center text-gray-400 italic">₹{Number(row.rate).toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-100 text-center text-gray-400 italic">₹{Number(row.labour).toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-100 text-center text-red-500 bg-red-50/20">{tare.toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-100 text-center text-blue-600 bg-blue-50/20">{net.toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-100 text-center text-green-700 bg-green-50/30 font-black">₹{Number(row.lotValue || 0).toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-100 font-mono uppercase text-slate-600">{row.inwardEntry?.truckNo || "---"}</td>
                      <td className="p-2 border-r border-slate-100 truncate max-w-[150px]">{row.inwardEntry?.deliveryPerson || "---"}</td>
                      <td className="p-2 border-r border-slate-100 italic text-slate-400 truncate max-w-[200px]">{row.inwardEntry?.remarks || "No Special Remarks"}</td>
                      <td className="p-2 text-center">
                        <button onClick={() => router.push(`/inward/update`)} className="text-blue-600 hover:underline font-black uppercase text-[8px]">Edit Log</button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- FOOTER SUMMARY BAR --- */}
      <div className="flex justify-between items-center bg-[#1e293b] text-white p-3 rounded-xl shadow-xl border-t-4 border-indigo-500">
         <div className="flex gap-12">
            <span className="font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
               <AlertCircle size={14} className="text-indigo-400"/> Total Inward Lots: <span className="text-indigo-300 text-sm">{data.length}</span>
            </span>
            <span className="font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
               Aggregate Bag Count: <span className="text-green-400 text-sm">{data.reduce((s, r) => s + (r.receivedQty || 0), 0)} BAGS</span>
            </span>
         </div>
         <p className="text-[8px] italic opacity-30 uppercase tracking-[10px]">Cold Storage Internal Intelligence</p>
      </div>
    </div>
  );
}
// "use client";

// import React, { useEffect, useState, useCallback } from "react";
// import { Search, FileSpreadsheet, Printer, AlertCircle, Loader2 } from "lucide-react";
// import { toast } from "react-hot-toast";
// import { formatDate } from "@/lib/utils";

// // --- STRICT TYPES ---
// interface InwardRecord {
//   id: string;
//   lotNo: string;
//   mrNo: string;
//   arrivalDate: string;
//   receivedQty: number;
//   balanceQty: number;
//   marka: string | null;
//   pMarka: string | null;
//   variety: string | null;
//   floor: string | null;
//   pole: string | null;
//   perUnitWgt: any;
//   totalTareWgt: any;
//   totalNetWgt: any;
//   party: { tradeName: string; partyCode: string };
//   item: { name: string; category: { name: string } };
//   unit: { name: string };
//   chamber: { name: string };
//   inwardEntry: {
//     truckNo: string | null;
//     deliveryPerson: string | null;
//     billingType: string | null;
//     createdAt: string; 
//   } | null;
// }

// export default function InwardRegisterPage() {
//   const [viewType, setViewType] = useState<"Summary" | "Detail">("Summary");
//   const [data, setData] = useState<InwardRecord[]>([]);
//   const [loading, setLoading] = useState(false);
  
//   // Masters for Dropdowns
//   const [parties, setParties] = useState<any[]>([]);
//   const [items, setItems] = useState<any[]>([]);

//   const [filters, setFilters] = useState({
//     filterType: "Search By Party",
//     fromDate: new Date().toISOString().split('T')[0],
//     toDate: new Date().toISOString().split('T')[0],
//     partyId: "All",
//     categoryId: "All",
//     itemId: "All",
//     unitId: "All",
//     variety: "All",
//     sortBy: "Rec Date Desc"
//   });

//   // 1. Search Function (Wrapped in useCallback for stability)
//   const handleSearch = useCallback(async () => {
//     setLoading(true);
//     const query = new URLSearchParams(filters as any).toString();
//     try {
//       const res = await fetch(`/api/reports/inward-register?${query}`);
//       if (!res.ok) throw new Error("Search failed");
//       const json = await res.json();
//       setData(json);
//     } catch (err) {
//       toast.error("Data load karne mein problem hui!");
//     } finally {
//       setLoading(false);
//     }
//   }, [filters]);

//   // 2. Initial Load
//   useEffect(() => {
//     Promise.all([
//       fetch("/api/masters/party").then(res => res.json()),
//       fetch("/api/masters/items").then(res => res.json()),
//     ]).then(([p, i]) => { 
//       setParties(p); 
//       setItems(i); 
//     }).catch(() => toast.error("Master data load nahi hua"));
//   }, []);

//   // 3. Auto-refresh when switching views
//   useEffect(() => {
//     if (data.length > 0) {
//       handleSearch();
//     }
//   }, [viewType, handleSearch]);

//   return (
//     <div className="space-y-3 text-[11px] animate-in fade-in duration-500">
//       {/* HEADER ACTION BAR */}
//       <div className="bg-[#5d5fb1] p-2 rounded-t-md flex justify-between items-center text-white shadow-sm">
//         <h2 className="font-bold uppercase flex items-center gap-2 tracking-tighter">
//           INWARD REGISTER | {viewType}
//         </h2>
//         <div className="flex gap-2">
//           <button 
//             onClick={() => setViewType("Summary")} 
//             className={`px-4 py-1 rounded text-[10px] font-bold transition-all ${viewType === "Summary" ? 'bg-orange-500 shadow-md scale-105' : 'bg-white/10 hover:bg-white/20'}`}
//           >
//             SUMMARY
//           </button>
//           <button 
//             onClick={() => setViewType("Detail")} 
//             className={`px-4 py-1 rounded text-[10px] font-bold transition-all ${viewType === "Detail" ? 'bg-orange-500 shadow-md scale-105' : 'bg-white/10 hover:bg-white/20'}`}
//           >
//             DETAIL
//           </button>
//         </div>
//       </div>

//       {/* FILTER BOX */}
//       <div className="bg-[#f0f1f7] p-4 border rounded shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
//         <div className="space-y-1">
//           <label className="text-[10px] font-bold text-indigo-900 uppercase">Select Filter Type</label>
//           <select className="w-full border p-1.5 rounded bg-white font-medium" value={filters.filterType} onChange={e => setFilters({...filters, filterType: e.target.value})}>
//             <option>Search By Party</option>
//             <option>Search By Date</option>
//           </select>
//         </div>
//         <div className="space-y-1">
//           <label className="text-[10px] font-bold text-indigo-900 uppercase">From Date</label>
//           <input type="date" className="w-full border p-1.5 rounded bg-white" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
//         </div>
//         <div className="space-y-1">
//           <label className="text-[10px] font-bold text-indigo-900 uppercase">To Date</label>
//           <input type="date" className="w-full border p-1.5 rounded bg-white" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
//         </div>
//         <div className="lg:col-span-2 space-y-1">
//           <label className="text-[10px] font-bold text-indigo-900 uppercase">Party Name</label>
//           <select className="w-full border p-1.5 rounded bg-white font-bold text-blue-900" value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})}>
//             <option value="All">All Parties</option>
//             {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
//           </select>
//         </div>

//         {viewType === "Detail" && (
//           <>
//             <div className="space-y-1">
//               <label className="text-[10px] font-bold text-indigo-900 uppercase">Item Name</label>
//               <select className="w-full border p-1.5 rounded bg-white" value={filters.itemId} onChange={e => setFilters({...filters, itemId: e.target.value})}>
//                 <option value="All">All Items</option>
//                 {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
//               </select>
//             </div>
//             <div className="space-y-1">
//               <label className="text-[10px] font-bold text-indigo-900 uppercase">Variety Name</label>
//               <input className="w-full border p-1.5 rounded bg-white uppercase" placeholder="ALL" value={filters.variety} onChange={e => setFilters({...filters, variety: e.target.value})} />
//             </div>
//             <div className="space-y-1">
//               <label className="text-[10px] font-bold text-indigo-900 uppercase">Sort By</label>
//               <select className="w-full border p-1.5 rounded bg-white" value={filters.sortBy} onChange={e => setFilters({...filters, sortBy: e.target.value})}>
//                 <option value="Rec Date Desc">Rec Date Desc</option>
//                 <option value="Rec Date Asc">Rec Date Asc</option>
//               </select>
//             </div>
//           </>
//         )}

//         <div className="flex gap-2 lg:col-span-1">
//           <button onClick={handleSearch} disabled={loading} className="bg-red-600 text-white px-6 py-1.5 rounded font-bold uppercase hover:bg-red-700 transition-all flex-1 flex items-center justify-center gap-2 shadow">
//             {loading ? <Loader2 className="animate-spin" size={14}/> : <><Search size={14}/> SEARCH</>}
//           </button>
//           <button className="bg-green-600 text-white p-1.5 rounded shadow hover:bg-green-700"><FileSpreadsheet size={16}/></button>
//           <button className="bg-red-500 text-white p-1.5 rounded shadow hover:bg-red-600"><Printer size={16}/></button>
//         </div>
//       </div>

//       {/* DATA TABLE */}
//       <div className="bg-white border rounded shadow-md overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-hide">
//         <table className="w-full border-collapse min-w-[1800px]">
//           <thead className="bg-[#f8f9fa] border-b text-slate-700 uppercase font-black text-[9px] sticky top-0 z-10 shadow-sm">
//             {viewType === "Summary" ? (
//               <tr>
//                 <th className="p-3 border-r text-left">Receipt Date</th>
//                 <th className="p-3 border-r text-left">MR No</th>
//                 <th className="p-3 border-r text-left">Party Name</th>
//                 <th className="p-3 border-r text-center">Qty</th>
//                 <th className="p-3 border-r text-left">Lot No</th>
//                 <th className="p-3 border-r text-center">Bal Qty</th>
//                 <th className="p-3 border-r text-left">Item Name</th>
//                 <th className="p-3 text-center">Action</th>
//               </tr>
//             ) : (
//               <tr>
//                 <th className="p-2 border-r bg-slate-100">REC DATE</th>
//                 <th className="p-2 border-r">MR NO</th>
//                 <th className="p-2 border-r">LOT NO</th>
//                 <th className="p-2 border-r">PARTY NAME</th>
//                 <th className="p-2 border-r">ITEM NAME</th>
//                 <th className="p-2 border-r text-center">QTY</th>
//                 <th className="p-2 border-r text-center">RATE</th>
//                 <th className="p-2 border-r">PACKING</th>
//                 <th className="p-2 border-r">CHAMBER</th>
//                 <th className="p-2 border-r">POLE</th>
//                 <th className="p-2 border-r">MARKA</th>
//                 <th className="p-2 border-r">VARIETY</th>
//                 <th className="p-2 border-r">P.MARKA</th>
//                 <th className="p-2 border-r text-center">TOT TARE</th>
//                 <th className="p-2 border-r text-center">TOT NET</th>
//                 <th className="p-2 border-r text-center">TOT WGT</th>
//                 <th className="p-2 border-r">TRUCK NO</th>
//                 <th className="p-2 border-r">PERSON</th>
//                 <th className="p-2 text-center bg-slate-100">ACTION</th>
//               </tr>
//             )}
//           </thead>

//           <tbody>
//             {loading ? (
//               <tr><td colSpan={20} className="p-20 text-center font-bold text-indigo-700 animate-pulse text-lg tracking-widest uppercase">Fetching Register Data...</td></tr>
//             ) : data.length === 0 ? (
//               <tr><td colSpan={20} className="p-20 text-center text-gray-400 italic">No records found. Adjust filters and click Search.</td></tr>
//             ) : data.map((row) => {
//               const net = Number(row.totalNetWgt) || 0;
//               const tare = Number(row.totalTareWgt) || 0;
//               const totalWgt = net + tare;

//               return (
//                 <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all even:bg-slate-50/30 font-bold">
//                   {viewType === "Summary" ? (
//                     <>
//                       <td className="p-3 border-r text-gray-600">{formatDate(row.arrivalDate)}</td>
//                       <td className="p-3 border-r text-indigo-700 font-black">{row.mrNo}</td>
//                       <td className="p-3 border-r uppercase">{row.party.tradeName}</td>
//                       <td className="p-3 border-r text-center">{row.receivedQty}</td>
//                       <td className="p-3 border-r text-blue-600">{row.lotNo}</td>
//                       <td className="p-3 border-r text-center text-red-600 bg-red-50/50">{row.balanceQty}</td>
//                       <td className="p-3 border-r uppercase text-slate-500 font-medium">{row.item.name}</td>
//                       <td className="p-3 text-center"><button className="text-blue-500 hover:underline">View</button></td>
//                     </>
//                   ) : (
//                     <>
//                       <td className="p-2 border-r font-mono">{formatDate(row.arrivalDate)}</td>
//                       <td className="p-2 border-r text-indigo-700">{row.mrNo}</td>
//                       <td className="p-2 border-r text-blue-600">{row.lotNo}</td>
//                       <td className="p-2 border-r uppercase truncate max-w-[200px]">{row.party.tradeName}</td>
//                       <td className="p-2 border-r uppercase">{row.item.name}</td>
//                       <td className="p-2 border-r text-center text-slate-800">{row.receivedQty}</td>
//                       <td className="p-2 border-r text-center text-gray-400">0.00</td>
//                       <td className="p-2 border-r">{row.unit.name}</td>
//                       <td className="p-2 border-r truncate">{row.chamber.name}</td>
//                       <td className="p-2 border-r">{row.pole || "-"}</td>
//                       <td className="p-2 border-r uppercase">{row.marka || "-"}</td>
//                       <td className="p-2 border-r uppercase italic text-blue-500">{row.variety || "Normal"}</td>
//                       <td className="p-2 border-r uppercase text-gray-500">{row.pMarka || "-"}</td>
//                       <td className="p-2 border-r text-center text-red-500">{tare.toFixed(2)}</td>
//                       <td className="p-2 border-r text-center text-indigo-600">{net.toFixed(2)}</td>
//                       <td className="p-2 border-r text-center bg-slate-50">{totalWgt.toFixed(2)}</td>
//                       <td className="p-2 border-r font-mono">{row.inwardEntry?.truckNo || "-"}</td>
//                       <td className="p-2 border-r truncate max-w-[100px]">{row.inwardEntry?.deliveryPerson || "-"}</td>
//                       <td className="p-2 text-center flex justify-center gap-2"><button className="text-blue-600 hover:underline">Edit</button></td>
//                     </>
//                   )}
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* FOOTER INFO */}
//       <div className="flex justify-between items-center bg-slate-50 p-2 border rounded">
//          <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-2">
//            <AlertCircle size={12}/> Total Records: {data.length}
//          </p>
//          <p className="text-[8px] italic opacity-40 uppercase tracking-widest">Cold Storage ERP System</p>
//       </div>
//     </div>
//   );
// }
