"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Search, Printer, FileSpreadsheet, Filter, RefreshCcw, Loader2, ArrowLeft, Check, ChevronsUpDown, Landmark, Calculator } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils"; 
import { useRouter } from "next/navigation";

// --- SEARCHABLE SELECT COMPONENT (Common Man Logic: Writing + Selecting) ---
const SearchableSelect = ({ options, value, onChange, placeholder, displayKey = "name", secondaryKey = "code" }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<any>(null);

  const filtered = options.filter((opt: any) =>
    opt[displayKey]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt[secondaryKey]?.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Type name to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {filtered.length > 0 ? filtered.map((opt: any) => (
              <div 
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(""); }}
                className="p-2 hover:bg-indigo-600 hover:text-white cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 font-bold text-[11px]"
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

// --- MAIN COMPONENT ---
export default function SimpleGPSummaryPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. FILTER STATES
  const [filters, setFilters] = useState({
    fromDate: "2025-04-09", 
    toDate: new Date().toISOString().split('T')[0],
    partyId: "All"
  });

  // 2. LOAD PARTIES
  useEffect(() => {
    fetch("/api/masters/party")
      .then(res => res.json())
      .then(json => setParties(json || []))
      .catch(() => toast.error("Parties load nahi hui!"));
  }, []);

  // 3. SEARCH FUNCTION
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
        toast.success(`${json.length} dispatch logs loaded.`);
      }
    } catch (err) {
      toast.error("Data load karne mein problem hui!");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // 4. EXPORT / PRINT
  const handleExport = () => {
    if (data.length === 0) return toast.error("Export ke liye data nahi hai!");
    const headers = ["GP No", "Party Name", "Remarks", "Date", "Amount"];
    const csvContent = [headers.join(","), ...data.map(r => [r.gpNo, `"${r.partyName}"`, `"${r.remarks}"`, formatDate(r.date), r.amt].join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `SimpleGP_Report.csv`; a.click();
    toast.success("Excel Downloaded!");
  };

  const totalAmount = useMemo(() => data.reduce((sum, row) => sum + (Number(row.amt) || 0), 0), [data]);

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* HEADER ACTION BAR */}
      <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm no-print">
        <div className="flex gap-2">
          <button onClick={() => router.push('/outward/gp-entry')} className="bg-red-600 text-white px-5 py-1.5 rounded font-black flex items-center gap-2 shadow-md hover:bg-red-700 transition-all uppercase">
            <ArrowLeft size={14}/> Back to GP Entry
          </button>
        </div>
        <div className="flex gap-2">
           <button onClick={() => window.location.reload()} className="bg-orange-500 text-white p-1.5 rounded shadow hover:bg-orange-600 transition-all">
             <RefreshCcw size={18}/>
           </button>
        </div>
      </div>

      {/* FILTER BOX */}
      <div className="bg-[#f0f1f7] p-6 border-2 border-slate-200 rounded-xl shadow-sm no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end font-bold text-slate-700">
          <div>
            <label className="block mb-1 uppercase text-gray-400 text-[9px] tracking-widest">From Date</label>
            <input type="date" className="w-full border-2 border-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
          </div>
          <div>
            <label className="block mb-1 uppercase text-gray-400 text-[9px] tracking-widest">To Date</label>
            <input type="date" className="w-full border-2 border-white p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
          </div>
          <div>
            <label className="block mb-1 uppercase text-indigo-900 text-[9px] tracking-widest">Search Merchant Name</label>
            <SearchableSelect 
              options={parties} 
              value={filters.partyId} 
              onChange={(val: any) => setFilters({...filters, partyId: val})} 
              placeholder="--- TYPE NAME ---" 
              displayKey="tradeName" 
              secondaryKey="partyCode"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSearch} 
              disabled={loading}
              className="bg-red-600 text-white px-10 py-2 rounded-lg font-black uppercase hover:bg-red-700 transition-all flex-1 flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={16}/> : <><Search size={16}/> SEARCH</>}
            </button>
            <button onClick={() => window.print()} className="bg-slate-700 text-white p-2 rounded shadow transition-all hover:bg-black"><Printer size={18}/></button>
            <button onClick={handleExport} className="bg-green-600 text-white p-2 rounded shadow transition-all hover:bg-green-800"><FileSpreadsheet size={18}/></button>
          </div>
        </div>
      </div>

      {/* BRANDING SECTION */}
      <div className="text-center py-4 bg-white border rounded-lg shadow-sm">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Cold Storage ERP</h1>
        <div className="flex justify-center gap-6 text-[10px] font-bold text-indigo-700 uppercase mt-1">
          <span className="flex items-center gap-1"><Landmark size={12}/> PAN: AAXFV5416G</span>
          <span className="flex items-center gap-1"><Calculator size={12}/> GST: 07AAXFV5416G1ZO</span>
        </div>
        <p className="bg-indigo-50 inline-block px-8 py-1 rounded-full text-[10px] font-black text-indigo-600 uppercase mt-4 tracking-[5px] border border-indigo-100">
          Simple Gate Pass Summary Report (Cash Settlement)
        </p>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border-2 border-slate-100 rounded-xl shadow-2xl overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#b4b6e4] border-b-2 border-indigo-200 text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 border-r border-indigo-100 w-40 text-center">GP NUMBER</th>
              <th className="p-4 border-r border-indigo-100 w-32 text-center">DISPATCH DATE</th>
              <th className="p-4 border-r border-indigo-100">MERCHANT / PARTY NAME</th>
              <th className="p-4 border-r border-indigo-100">REMARKS / BILLING TYPE</th>
              <th className="p-4 border-r border-indigo-100 text-right pr-10">NET CASH AMT (₹)</th>
              <th className="p-4 text-center no-print">ACTION</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {loading ? (
              <tr><td colSpan={6} className="p-24 text-center font-black text-indigo-700 animate-pulse text-lg tracking-[5px] uppercase">Retrieving Cash Dispatch Records...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} className="p-24 text-center text-gray-400 italic font-medium">No dispatch records found. Adjust filters to view.</td></tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all group even:bg-slate-50/30">
                  <td className="p-4 border-r border-slate-100 text-indigo-800 text-center font-black text-sm">{row.gpNo}</td>
                  <td className="p-4 border-r border-slate-100 text-gray-500 font-mono text-center">{formatDate(row.date)}</td>
                  <td className="p-4 border-r border-slate-100 uppercase text-slate-700 truncate max-w-[300px]">{row.partyName}</td>
                  <td className="p-4 border-r border-slate-100 text-slate-400 italic font-medium">{row.remarks}</td>
                  <td className="p-4 border-r border-slate-100 text-right pr-10 text-green-700 bg-green-50/20 font-black text-sm">
                    ₹ {Number(row.amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-center no-print">
                    <button className="text-blue-600 hover:underline font-black uppercase text-[9px] tracking-tighter">Open Bill</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* TABLE FOOTER */}
          {data.length > 0 && (
            <tfoot className="bg-[#1e293b] text-white font-black uppercase text-sm border-t-4 border-indigo-500">
               <tr>
                 <td colSpan={4} className="p-4 text-right tracking-[5px] italic border-r border-slate-700">Total Cash Inflow (Page Total)</td>
                 <td className="p-4 text-right pr-10 text-yellow-400 text-xl font-black italic">
                    ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                 </td>
                 <td className="no-print bg-slate-800"></td>
               </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* FOOTER INFO BAR */}
      <div className="flex justify-between items-center bg-slate-50 p-2 border rounded shadow-inner opacity-60">
         <p className="font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
           <Calculator size={14} className="text-indigo-400"/> Filtered Vouchers: {data.length}
         </p>
         <p className="text-[8px] font-black italic uppercase tracking-[10px]">Cold Storage Intelligence</p>
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
