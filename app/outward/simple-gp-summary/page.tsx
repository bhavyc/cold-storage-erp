"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Search, Printer, FileSpreadsheet, Filter, RefreshCcw, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils"; // Date formatter utility

export default function SimpleGPSummaryPage() {
  const [data, setData] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. FILTER STATES (Image Mapping)
  const [filters, setFilters] = useState({
    fromDate: "2025-04-09", 
    toDate: new Date().toISOString().split('T')[0],
    partyId: "All"
  });

  // 2. LOAD PARTIES FOR DROPDOWN
  useEffect(() => {
    fetch("/api/masters/party")
      .then(res => res.json())
      .then(json => setParties(json || []))
      .catch(() => toast.error("Parties load nahi hui!"));
  }, []);

  // 3. SEARCH FUNCTION (Hits /api/outward/simple-gp)
  const handleSearch = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams(filters).toString();
    try {
      const res = await fetch(`/api/outward/simple-gp?${query}`);
      if (!res.ok) throw new Error("Fetch error");
      const json = await res.json();
      
      setData(json);
      if (json.length === 0) {
        toast.error("Is range mein koi Simple GP nahi mila!");
      } else {
        toast.success(`${json.length} records found.`);
      }
    } catch (err) {
      toast.error("Data load karne mein problem hui!");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // 4. EXPORT TO CSV (Functional Implementation)
  const handleExport = () => {
    if (data.length === 0) return toast.error("Export ke liye data nahi hai!");
    
    const headers = ["GP No", "Party Name", "Remarks", "Date", "Amount"];
    const csvRows = data.map(row => [
      row.gpNo,
      `"${row.partyName}"`,
      `"${row.remarks}"`,
      formatDate(row.date),
      row.amt
    ].join(","));

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SimpleGP_Report_${filters.fromDate}.csv`;
    a.click();
    toast.success("Excel/CSV File Downloaded!");
  };

  // 5. PRINT FUNCTION
  const handlePrint = () => {
    if (data.length === 0) return toast.error("Print karne ke liye data nahi hai!");
    window.print();
  };

  // 6. TOTAL CALCULATION
  const totalAmount = useMemo(() => {
    return data.reduce((sum, row) => sum + (Number(row.amt) || 0), 0);
  }, [data]);

  return (
    <div className="space-y-4 text-xs animate-in fade-in duration-500">
      
      {/* PURPLE HEADER */}
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md no-print">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-widest">
          <Filter size={16}/> Simple Gate Pass Summary (Cash Sale)
        </h2>
        <div className="flex gap-2">
           <button onClick={() => window.location.reload()} className="bg-white/10 p-1.5 rounded hover:bg-white/20 transition-all">
             <RefreshCcw size={16}/>
           </button>
        </div>
      </div>

      {/* FILTER BOX (Image Replication) */}
      <div className="bg-white p-6 border border-t-0 rounded-b-lg shadow-sm no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end font-bold text-slate-600">
          <div>
            <label className="block mb-1 uppercase text-gray-400 text-[10px]">From Date</label>
            <input type="date" className="w-full border p-2 rounded outline-none focus:ring-1 focus:ring-indigo-400" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
          </div>
          <div>
            <label className="block mb-1 uppercase text-gray-400 text-[10px]">To Date</label>
            <input type="date" className="w-full border p-2 rounded outline-none focus:ring-1 focus:ring-indigo-400" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
          </div>
          <div>
            <label className="block mb-1 uppercase text-gray-400 text-[10px]">Party Name</label>
            <select className="w-full border p-2 rounded bg-white font-bold text-indigo-700 outline-none" value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})}>
              <option value="All">--- ALL PARTIES ---</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSearch} 
              disabled={loading}
              className="bg-red-600 text-white px-8 py-2 rounded font-black uppercase hover:bg-red-700 transition-all flex-1 flex items-center justify-center gap-2 shadow-md active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={16}/> : <><Search size={16}/> SEARCH</>}
            </button>
            <button onClick={handlePrint} className="bg-red-500 text-white p-2.5 rounded hover:bg-red-600 shadow-sm transition-all"><Printer size={18}/></button>
            <button onClick={handleExport} className="bg-green-600 text-white p-2.5 rounded hover:bg-green-700 shadow-sm transition-all"><FileSpreadsheet size={18}/></button>
          </div>
        </div>
      </div>

      {/* BRANDING SECTION (Center) */}
      <div className="text-center py-4 space-y-1">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Visual Softech ERP</h1>
        <div className="flex justify-center gap-6 text-[10px] font-bold text-indigo-600 uppercase">
          <span>PAN: AAXFV5416G</span>
          <span>GST: 07AAXFV5416G1ZO</span>
        </div>
        <p className="bg-slate-100 inline-block px-6 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase mt-2 tracking-widest border border-slate-200">
          Simple Gate Pass Summary Report
        </p>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border-2 border-slate-100 rounded-lg shadow-xl overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#b4b6e4] border-b-2 border-indigo-200 text-slate-800 uppercase font-black text-[10px] sticky top-0 shadow-sm">
            <tr>
              <th className="p-4 border-r border-indigo-100">GP Number</th>
              <th className="p-4 border-r border-indigo-100">Date</th>
              <th className="p-4 border-r border-indigo-100">Merchant / Party Name</th>
              <th className="p-4 border-r border-indigo-100">Remarks / Billing Type</th>
              <th className="p-4 border-r border-indigo-100 text-right">Net Amount (₹)</th>
              <th className="p-4 text-center no-print">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-20 text-center font-black text-indigo-700 animate-pulse text-lg tracking-[5px]">SCANNING SIMPLE GATE PASS LOGS...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} className="p-20 text-center text-gray-400 italic font-medium uppercase tracking-tighter">No dispatch records found for this period.</td></tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all font-bold group even:bg-slate-50/30">
                  <td className="p-4 border-r border-slate-100 text-indigo-700 uppercase">{row.gpNo}</td>
                  <td className="p-4 border-r border-slate-100 text-gray-500 font-mono">{formatDate(row.date)}</td>
                  <td className="p-4 border-r border-slate-100 uppercase text-slate-800">{row.partyName}</td>
                  <td className="p-4 border-r border-slate-100 text-gray-400 italic font-medium">{row.remarks}</td>
                  <td className="p-4 border-r border-slate-100 text-right text-green-700 text-sm">
                    ₹ {Number(row.amt).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-center no-print">
                    <button className="text-blue-600 hover:underline font-black uppercase text-[9px] tracking-tighter">View Bill</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* TABLE FOOTER AGGREGATES */}
          {data.length > 0 && (
            <tfoot className="bg-[#1e293b] text-white font-black uppercase text-sm">
               <tr>
                 <td colSpan={4} className="p-4 text-right tracking-[5px] italic">Grand Total (Page)</td>
                 <td className="p-4 text-right text-yellow-400 text-lg">
                    ₹ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                 </td>
                 <td className="no-print"></td>
               </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* FOOTER INFO BAR */}
      <div className="flex justify-between items-center bg-slate-50 p-2 border rounded opacity-60">
         <p className="font-bold uppercase tracking-widest text-[9px]">
           Filtered Records: {data.length}
         </p>
         <p className="text-[8px] font-black italic uppercase tracking-[10px]">Visual Softech Intelligence</p>
      </div>
    </div>
  );
}


// "use client";

// import React, { useEffect, useState } from "react";
// import { Search, Printer, FileSpreadsheet, Filter, RefreshCcw } from "lucide-react";
// import { toast } from "react-hot-toast";

// export default function SimpleGPSummaryPage() {
//   const [data, setData] = useState<any[]>([]);
//   const [parties, setParties] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   // 1. FILTER STATES (Image Mapping)
//   const [filters, setFilters] = useState({
//     fromDate: "2025-04-09", // Financial year start se default
//     toDate: new Date().toISOString().split('T')[0],
//     partyId: "All"
//   });

//   // 2. LOAD PARTIES FOR DROPDOWN
//   useEffect(() => {
//     fetch("/api/masters/party").then(res => res.json()).then(setParties);
//   }, []);

//   // 3. SEARCH FUNCTION (Lal Search Button)
//   const handleSearch = async () => {
//     setLoading(true);
//     const query = new URLSearchParams(filters).toString();
//     try {
//       const res = await fetch(`/api/outward/simple-gp?${query}`);
//       const json = await res.json();
//       if (res.ok) {
//         setData(json);
//         if (json.length === 0) toast.error("Bhai, is range mein koi data nahi mila!");
//       }
//     } catch (err) {
//       toast.error("Data load karne mein problem hui!");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 4. PRINT & EXCEL PLACEHOLDERS
//   const handlePrint = () => toast.success("PDF Report taiyar ho rahi hai...");
//   const handleExport = () => toast.success("Excel sheet download ho rahi hai...");

//   return (
//     <div className="space-y-4 text-xs animate-in fade-in">
//       {/* PURPLE HEADER */}
//       <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
//         <h2 className="font-bold uppercase flex items-center gap-2 tracking-widest">
//           <Filter size={16}/> Simple Gate Pass Summary
//         </h2>
//       </div>

//       {/* FILTER BOX (Image Replication) */}
//       <div className="bg-white p-6 border border-t-0 rounded-b-lg shadow-sm">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end font-bold text-slate-600">
//           <div>
//             <label className="block mb-1 uppercase text-gray-400">From Date</label>
//             <input type="date" className="w-full border p-2 rounded outline-none focus:ring-1 focus:ring-indigo-400" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
//           </div>
//           <div>
//             <label className="block mb-1 uppercase text-gray-400">To Date</label>
//             <input type="date" className="w-full border p-2 rounded outline-none focus:ring-1 focus:ring-indigo-400" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
//           </div>
//           <div>
//             <label className="block mb-1 uppercase text-gray-400">Party Name</label>
//             <select className="w-full border p-2 rounded bg-white font-bold text-indigo-700" value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})}>
//               <option value="All">All Parties</option>
//               {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
//             </select>
//           </div>
//           <div className="flex gap-2">
//             <button onClick={handleSearch} className="bg-red-600 text-white px-8 py-2 rounded font-black uppercase hover:bg-red-700 transition-all flex-1 flex items-center justify-center gap-2 shadow">
//               <Search size={16}/> {loading ? "..." : "SEARCH"}
//             </button>
//             <button onClick={handlePrint} className="bg-red-500 text-white p-2 rounded hover:bg-red-600 shadow"><Printer size={18}/></button>
//             <button onClick={handleExport} className="bg-green-600 text-white p-2 rounded hover:bg-green-700 shadow"><FileSpreadsheet size={18}/></button>
//           </div>
//         </div>
//       </div>

//       {/* BRANDING SECTION (Center) */}
//       <div className="text-center py-4 space-y-1">
//         <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">COLD STORAGE</h1>
//         <div className="flex justify-center gap-4 text-[10px] font-bold text-indigo-600 uppercase">
//           <span>PAN: AAXFV5416G</span>
//           <span>GST: 07AAXFV5416G1ZO</span>
//         </div>
//         <p className="bg-slate-100 inline-block px-4 py-0.5 rounded-full text-[10px] font-black text-slate-500 uppercase mt-2">
//           Simple Gate Pass Summary
//         </p>
//       </div>

//       {/* DATA TABLE */}
//       <div className="bg-white border rounded shadow-md overflow-hidden min-h-[400px]">
//         <table className="w-full text-left border-collapse">
//           <thead className="bg-[#b4b6e4] border-b text-slate-800 uppercase font-black text-[10px]">
//             <tr>
//               <th className="p-3 border-r border-slate-200">GP No</th>
//               <th className="p-3 border-r border-slate-200">Party Name</th>
//               <th className="p-3 border-r border-slate-200">Remarks</th>
//               <th className="p-3 border-r border-slate-200 text-right">Amt (₹)</th>
//               <th className="p-3 text-center">Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.length === 0 ? (
//               <tr><td colSpan={5} className="p-20 text-center text-gray-400 italic font-medium">Click Search to load summary data</td></tr>
//             ) : (
//               data.map((row) => (
//                 <tr key={row.id} className="border-b hover:bg-indigo-50 transition-colors font-bold">
//                   <td className="p-3 border-r border-slate-100 text-indigo-700">{row.gpNo}</td>
//                   <td className="p-3 border-r border-slate-100 uppercase">{row.partyName}</td>
//                   <td className="p-3 border-r border-slate-100 text-gray-400 italic">{row.remarks}</td>
//                   <td className="p-3 border-r border-slate-100 text-right text-green-700">₹ {Number(row.amt).toLocaleString()}</td>
//                   <td className="p-3 text-center">
//                     <button className="text-blue-600 hover:underline">View Bill</button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }