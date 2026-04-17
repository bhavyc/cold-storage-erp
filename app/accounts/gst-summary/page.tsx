"use client";

import React, { useState, useEffect } from "react";
import { Search, FileJson, FileSpreadsheet, Printer, IndianRupee, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { exportToJSON } from "@/lib/utils"; // Utils se import kiya

export default function GSTSummaryPage() {
  const [data, setData] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: "Input", fromDate: "2026-03-01", toDate: "2026-03-31", partyId: "All", gstFilter: "ALL"
  });

  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/compliance/gst-data?${query}`);
      const json = await res.json();
      setData(json);
      if (json.length === 0) toast.error("Is period mein koi GST data nahi mila!");
    } catch (err) {
      toast.error("Data load karne mein error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 text-[10px] animate-in fade-in duration-500">
      {/* FILTER BAR (Exact Mapping from GST Summary Image) */}
      <div className="bg-[#b4b6e4]/30 p-4 border rounded shadow-sm grid grid-cols-2 md:grid-cols-6 gap-3 items-end font-bold text-slate-600">
        <div><label>Type</label><select className="w-full border p-1 rounded bg-white" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}><option>Input</option><option>Output</option></select></div>
        <div><label>From Date</label><input type="date" className="w-full border p-1 rounded" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} /></div>
        <div><label>To Date</label><input type="date" className="w-full border p-1 rounded" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} /></div>
        <div><label>Party Name</label>
          <select className="w-full border p-1 rounded bg-white font-bold text-indigo-700" value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})}>
            <option value="All">All Parties</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
          </select>
        </div>
        <div><label>GST</label>
          <select className="w-full border p-1 rounded bg-white" value={filters.gstFilter} onChange={e => setFilters({...filters, gstFilter: e.target.value})}>
            <option>ALL</option><option>GST Bill</option><option>Non GST Bill</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSearch} 
            disabled={loading}
            className="bg-red-600 text-white px-4 py-1.5 rounded font-black uppercase shadow flex-1 hover:bg-red-700 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={14}/> : "Search"}
          </button>
          <button className="bg-red-600 text-white p-1 rounded shadow hover:bg-red-700"><IndianRupee size={14}/></button>
          
          {/* ✅ THE JSON DOWNLOAD BUTTON (Now Functional) */}
          <button 
            onClick={() => data.length > 0 ? exportToJSON(data, `GST_Report_${filters.fromDate}`) : toast.error("Pehle Search karein!")}
            className="bg-red-800 text-white px-2 py-1.5 rounded font-black uppercase text-[8px] shadow flex items-center gap-1 hover:bg-black transition-all active:scale-95"
          >
            <FileJson size={12}/> Download JSON
          </button>
        </div>
      </div>

      <div className="bg-white p-4 border rounded shadow-sm text-center space-y-1">
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Visual Softech</h1>
        <p className="font-bold text-indigo-600 uppercase tracking-widest">GST Summary Report</p>
      </div>

      {/* DATA GRID (16 COLUMNS EXACT REPLICATION) */}
      <div className="bg-white border rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1600px]">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[8px]">
            <tr>
              <th className="p-2 border-r">Inv Date</th><th className="p-2 border-r">Inv No</th>
              <th className="p-2 border-r">Code</th><th className="p-2 border-r">Party Name</th>
              <th className="p-2 border-r">GST No</th><th className="p-2 border-r text-right">SGST</th>
              <th className="p-2 border-r text-right">CGST</th><th className="p-2 border-r text-right">IGST</th>
              <th className="p-2 border-r text-right bg-slate-50">Taxable Value</th>
              <th className="p-2 border-r text-right text-blue-600">Lab</th>
              <th className="p-2 border-r text-right text-green-600">Rent</th>
              <th className="p-2 border-r text-right font-black">Total GST</th>
              <th className="p-2 border-r text-right">Round Off</th>
              <th className="p-2 border-r text-right bg-indigo-50 font-black">Inv Amt</th>
              <th className="p-2 border-r">Remarks</th><th>HSN</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {data.length === 0 ? (
              <tr><td colSpan={16} className="p-20 text-center text-gray-400 italic">No records found. Click search to view GST data.</td></tr>
            ) : data.map((inv, idx) => (
              <tr key={idx} className="border-b hover:bg-slate-50 transition-colors">
                <td className="p-2 border-r">{new Date(inv.date).toLocaleDateString('en-GB')}</td>
                <td className="p-2 border-r font-mono text-indigo-700">{inv.invoiceNo}</td>
                <td className="p-2 border-r text-gray-400">{inv.party.partyCode}</td>
                <td className="p-2 border-r truncate max-w-[150px] uppercase">{inv.party.tradeName}</td>
                <td className="p-2 border-r font-mono text-indigo-700">{inv.party.gstNo || "NA"}</td>
                <td className="p-2 border-r text-right">{Number(inv.sgst).toFixed(2)}</td>
                <td className="p-2 border-r text-right">{Number(inv.cgst).toFixed(2)}</td>
                <td className="p-2 border-r text-right">{Number(inv.igst).toFixed(2)}</td>
                <td className="p-2 border-r text-right bg-slate-50 text-slate-700">{Number(inv.taxableValue).toFixed(2)}</td>
                <td className="p-2 border-r text-right text-blue-600">{Number(inv.totalLabour).toFixed(2)}</td>
                <td className="p-2 border-r text-right text-green-600">{Number(inv.totalRent).toFixed(2)}</td>
                <td className="p-2 border-r text-right font-black">{(Number(inv.cgst) + Number(inv.sgst) + Number(inv.igst)).toFixed(2)}</td>
                <td className="p-2 border-r text-right text-red-400">{Number(inv.roundOff).toFixed(2)}</td>
                <td className="p-2 border-r text-right bg-indigo-50 text-indigo-900 font-black text-xs">₹ {Number(inv.netAmount).toLocaleString()}</td>
                <td className="p-2 border-r italic text-gray-400 truncate max-w-[100px]">{inv.remarks || "-"}</td>
                <td className="p-2 font-mono text-[9px]">{inv.items[0]?.lot.item.hsnCode || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}











// "use client";

// import React, { useState, useEffect } from "react";
// import { Search, FileJson, FileSpreadsheet, Printer, IndianRupee } from "lucide-react";
// import { toast } from "react-hot-toast";
// import { exportToJSON } from "@/lib/utils";
// export default function GSTSummaryPage() {
//   const [data, setData] = useState<any[]>([]);
//   const [parties, setParties] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [filters, setFilters] = useState({
//     type: "Input", fromDate: "2026-03-01", toDate: "2026-03-31", partyId: "All", gstFilter: "ALL"
//   });

//   useEffect(() => {
//     fetch("/api/masters/party").then(res => res.json()).then(setParties);
//   }, []);

//   const handleSearch = async () => {
//     setLoading(true);
//     const query = new URLSearchParams(filters).toString();
//     const res = await fetch(`/api/compliance/gst-data?${query}`);
//     const json = await res.json();
//     setData(json);
//     setLoading(false);
//   };

//   return (
//     <div className="space-y-3 text-[10px] animate-in fade-in duration-500">
//       {/* FILTER BAR (Exact Mapping from GST Summary Image) */}
//       <div className="bg-[#b4b6e4]/30 p-4 border rounded shadow-sm grid grid-cols-2 md:grid-cols-6 gap-3 items-end font-bold text-slate-600">
//         <div><label>Type</label><select className="w-full border p-1 rounded bg-white"><option>Input</option><option>Output</option></select></div>
//         <div><label>From Date</label><input type="date" className="w-full border p-1 rounded" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} /></div>
//         <div><label>To Date</label><input type="date" className="w-full border p-1 rounded" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} /></div>
//         <div><label>Party Name</label>
//           <select className="w-full border p-1 rounded bg-white" onChange={e => setFilters({...filters, partyId: e.target.value})}>
//             <option value="All">All</option>
//             {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
//           </select>
//         </div>
//         <div><label>GST</label>
//           <select className="w-full border p-1 rounded bg-white" value={filters.gstFilter} onChange={e => setFilters({...filters, gstFilter: e.target.value})}>
//             <option>ALL</option><option>GST Bill</option><option>Non GST Bill</option>
//           </select>
//         </div>
//         <div className="flex gap-2">
//           <button onClick={handleSearch} className="bg-red-600 text-white px-4 py-1.5 rounded font-black uppercase shadow flex-1">Search</button>
//           <button className="bg-red-600 text-white p-1 rounded shadow"><IndianRupee size={14}/></button>
//           {/* THE JSON DOWNLOAD BUTTON (Image 55) */}
//          <button onClick={() => exportToJSON(data, "GST_Report")} className="...">
//   <FileJson size={12}/> Download JSON
// </button>
//         </div>
//       </div>

//       <div className="bg-white p-4 border rounded shadow-sm text-center space-y-1">
//         <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Visual Softech</h1>
//         <p className="font-bold text-indigo-600 uppercase tracking-widest">GST Summary Report</p>
//       </div>

//       {/* DATA GRID (16 COLUMNS EXACT REPLICATION) */}
//       <div className="bg-white border rounded shadow-sm overflow-x-auto">
//         <table className="w-full text-left border-collapse min-w-[1600px]">
//           <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[8px]">
//             <tr>
//               <th className="p-2 border-r">Inv Date</th><th className="p-2 border-r">Inv No</th>
//               <th className="p-2 border-r">Code</th><th className="p-2 border-r">Party Name</th>
//               <th className="p-2 border-r">GST No</th><th className="p-2 border-r text-right">SGST</th>
//               <th className="p-2 border-r text-right">CGST</th><th className="p-2 border-r text-right">IGST</th>
//               <th className="p-2 border-r text-right bg-slate-50">Taxable Value</th>
//               <th className="p-2 border-r text-right text-blue-600">Lab</th>
//               <th className="p-2 border-r text-right text-green-600">Rent</th>
//               <th className="p-2 border-r text-right font-black">Total GST</th>
//               <th className="p-2 border-r text-right">Round Off</th>
//               <th className="p-2 border-r text-right bg-indigo-50 font-black">Inv Amt</th>
//               <th className="p-2 border-r">Remarks</th><th>HSN</th>
//             </tr>
//           </thead>
//           <tbody className="font-bold">
//             {data.map((inv, idx) => (
//               <tr key={idx} className="border-b hover:bg-slate-50">
//                 <td className="p-2 border-r">{new Date(inv.date).toLocaleDateString()}</td>
//                 <td className="p-2 border-r font-mono">{inv.invoiceNo}</td>
//                 <td className="p-2 border-r text-gray-400">{inv.party.partyCode}</td>
//                 <td className="p-2 border-r truncate max-w-[150px] uppercase">{inv.party.tradeName}</td>
//                 <td className="p-2 border-r font-mono text-indigo-700">{inv.party.gstNo || "NA"}</td>
//                 <td className="p-2 border-r text-right">{Number(inv.sgst).toFixed(2)}</td>
//                 <td className="p-2 border-r text-right">{Number(inv.cgst).toFixed(2)}</td>
//                 <td className="p-2 border-r text-right">{Number(inv.igst).toFixed(2)}</td>
//                 <td className="p-2 border-r text-right bg-slate-50 text-slate-700">{Number(inv.taxableValue).toFixed(2)}</td>
//                 <td className="p-2 border-r text-right text-blue-600">{Number(inv.totalLabour).toFixed(2)}</td>
//                 <td className="p-2 border-r text-right text-green-600">{Number(inv.totalRent).toFixed(2)}</td>
//                 <td className="p-2 border-r text-right font-black">{(Number(inv.cgst) + Number(inv.sgst) + Number(inv.igst)).toFixed(2)}</td>
//                 <td className="p-2 border-r text-right text-red-400">{Number(inv.roundOff).toFixed(2)}</td>
//                 <td className="p-2 border-r text-right bg-indigo-50 text-indigo-900 font-black text-xs">₹ {Number(inv.netAmount).toLocaleString()}</td>
//                 <td className="p-2 border-r italic text-gray-400">{inv.remarks || "-"}</td>
//                 <td className="p-2 font-mono">{inv.items[0]?.lot.item.hsnCode || "-"}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }