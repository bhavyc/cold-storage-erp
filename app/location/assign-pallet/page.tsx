// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import { Save, Search, Plus, Trash2, RotateCcw, Info, PackageCheck, X } from "lucide-react";
// import { toast } from "react-hot-toast";

// const initialRow = { chamberId: "", palletNo: "", qty: 0 };

// export default function AssignPalletPage() {
//   const [lotSearch, setLotSearch] = useState("");
//   const [lotInfo, setLotInfo] = useState<any>(null);
//   const [chambers, setChambers] = useState<any[]>([]);
//   const [rows, setRows] = useState<any[]>([{ ...initialRow }]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetch("/api/masters/chambers").then(res => res.json()).then(setChambers);
//   }, []);

//   // AUTOMATION: Search Lot Logic
//   const handleSearch = async () => {
//     if (!lotSearch) return toast.error("Bhai, Lot No toh dalo!");
//     setLoading(true);
//     try {
//       const res = await fetch(`/api/warehouse/assign-pallet?lotNo=${lotSearch}`);
//       const data = await res.json();
//       if (res.ok) {
//         setLotInfo(data);
//         toast.success(`Lot Found: ${data.itemName}`);
//       } else {
//         toast.error(data.error);
//         setLotInfo(null);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateRow = (idx: number, field: string, val: any) => {
//     const newRows = [...rows];
//     newRows[idx][field] = val;
//     setRows(newRows);
//   };

//   // AUTOMATED LIVE MATH (Footer Stats)
//   const stats = useMemo(() => {
//     const gridTotal = rows.reduce((s, r) => s + (parseInt(r.qty) || 0), 0);
//     const received = lotInfo?.receivedQty || 0;
//     const previouslyAllocated = lotInfo?.allocatedQty || 0;
    
//     return {
//       received,
//       allocated: previouslyAllocated + gridTotal,
//       unallocated: received - (previouslyAllocated + gridTotal)
//     };
//   }, [rows, lotInfo]);

//   // SAVE FUNCTION with POPUP & RESET
//   const handleSave = async () => {
//     if (!lotInfo) return toast.error("Pehle Lot search karo!");
//     if (stats.unallocated < 0) return toast.error("Received quantity se zyada assign nahi kar sakte!");

//     const loadId = toast.loading("Pallet details save ho rahi hain...");
//     try {
//       const res = await fetch("/api/warehouse/assign-pallet", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ 
//           lotId: lotInfo.lotId, 
//           assignments: rows,
//           date: new Date()
//         })
//       });

//       if (res.ok) {
//         toast.success("Mubarak ho! Pallet Assignment save ho gaya.", { id: loadId });
//         setLotSearch(""); setLotInfo(null); setRows([{ ...initialRow }]);
//       } else {
//         toast.error("Save fail ho gaya!", { id: loadId });
//       }
//     } catch (err) {
//       toast.error("Network error!", { id: loadId });
//     }
//   };

//   return (
//     <div className="space-y-4 text-[11px] animate-in fade-in">
//       {/* Action Buttons (Image Style) */}
//       <div className="flex justify-between items-center bg-white p-3 rounded border shadow-sm">
//         <div className="flex gap-2">
//           <button className="bg-red-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow">Show All</button>
//           <button onClick={() => window.location.reload()} className="bg-orange-500 text-white p-2 rounded shadow"><RotateCcw size={14}/></button>
//         </div>
//         <div className="flex gap-2">
//           <button className="bg-[#f39c12] text-white px-4 py-1.5 rounded font-bold uppercase flex items-center gap-2 shadow-sm">
//             <PackageCheck size={14}/> Check Pallet Status
//           </button>
//           <button onClick={handleSave} className="bg-[#10b981] text-white px-10 py-1.5 rounded font-bold uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all">
//             <Save size={14}/> Save
//           </button>
//         </div>
//       </div>

//       <div className="bg-[#5d5fb1] text-white p-2 rounded-t font-black text-center uppercase tracking-widest border border-b-0">
//         Assign Pallet | Entry Form
//       </div>

//       <div className="bg-white p-6 border rounded-b shadow-sm space-y-6">
//         {/* Header Inputs (Image Matching) */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-slate-50 p-5 rounded-lg border">
//           <div>
//             <label className="font-bold text-gray-500 uppercase block mb-1">Assign No</label>
//             <input className="w-full border p-2 rounded bg-white font-bold" value="1" readOnly />
//           </div>
//           <div>
//             <label className="font-bold text-gray-500 uppercase block mb-1">Date</label>
//             <input type="date" className="w-full border p-2 rounded bg-white" defaultValue="2026-03-24" />
//           </div>
//           <div className="md:col-span-2 relative">
//             <label className="font-bold text-indigo-700 uppercase block mb-1 flex items-center gap-1 text-[10px]">Enter Lot No <Info size={10}/></label>
//             <div className="flex gap-2">
//               <input 
//                 className="flex-1 border-2 border-slate-200 p-2 rounded font-bold text-lg outline-none focus:border-indigo-500 transition-all uppercase" 
//                 placeholder="Search Lot (e.g. 1001)..."
//                 value={lotSearch}
//                 onChange={(e) => setLotSearch(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
//               />
//               <button onClick={handleSearch} className="bg-red-600 text-white px-6 rounded shadow-md hover:bg-red-700">
//                 {loading ? <RotateCcw className="animate-spin" size={20}/> : <Search size={20}/>}
//               </button>
//             </div>
//             {lotInfo && <p className="absolute -bottom-5 left-0 font-bold text-green-600 uppercase">Item: {lotInfo.itemName}</p>}
//           </div>
//         </div>

//         {/* Assignment Grid */}
//         <div className="overflow-x-auto border rounded shadow-inner">
//           <table className="w-full border-collapse text-left">
//             <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[10px]">
//               <tr>
//                 <th className="p-3 border-r border-slate-300 w-16 text-center">SR. NO</th>
//                 <th className="p-3 border-r border-slate-300">CHAMBER NAME</th>
//                 <th className="p-3 border-r border-slate-300">PALLET NO</th>
//                 <th className="p-3 border-r border-slate-300 w-48 text-center">ASSIGN QTY</th>
//                 <th className="p-3 text-center w-24">ACTION</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map((row, idx) => (
//                 <tr key={idx} className="border-b hover:bg-slate-50">
//                   <td className="p-3 border-r text-center font-bold text-gray-400">{idx + 1}</td>
//                   <td className="p-1 border-r">
//                     <select 
//                       className="w-full p-2 outline-none bg-transparent font-bold text-slate-600"
//                       value={row.chamberId}
//                       onChange={e => updateRow(idx, "chamberId", e.target.value)}
//                     >
//                       <option value="">Select Chamber</option>
//                       {chambers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//                     </select>
//                   </td>
//                   <td className="p-1 border-r">
//                     <input 
//                       className="w-full p-2 outline-none font-bold uppercase text-indigo-700 placeholder:font-normal" 
//                       placeholder="ENTER PALLET NO"
//                       value={row.palletNo}
//                       onChange={e => updateRow(idx, "palletNo", e.target.value)}
//                     />
//                   </td>
//                   <td className="p-1 border-r bg-indigo-50/20">
//                     <input 
//                       type="number" 
//                       className="w-full p-2 text-center font-black text-lg text-blue-800 outline-none bg-transparent" 
//                       value={row.qty || ""}
//                       onChange={e => updateRow(idx, "qty", e.target.value)}
//                     />
//                   </td>
//                   <td className="p-1 text-center">
//                     <div className="flex justify-center gap-2">
//                        <button onClick={() => setRows([...rows, { ...initialRow }])} className="bg-blue-600 text-white p-1 rounded hover:scale-110 transition-transform"><Plus size={16}/></button>
//                        <button onClick={() => rows.length > 1 && setRows(rows.filter((_, i) => i !== idx))} className="bg-red-600 text-white p-1 rounded hover:scale-110 transition-transform"><X size={16}/></button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* FOOTER STATS (Image Exact Replication) */}
//         <div className="grid grid-cols-3 gap-10 pt-4 px-2">
//           <div className="text-center space-y-1">
//              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Received Lot Qty</p>
//              <div className="text-3xl font-black text-slate-800">{stats.received}</div>
//              <div className="h-0.5 bg-blue-500 w-full rounded"></div>
//           </div>
//           <div className="text-center space-y-1">
//              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">Allocated Lot Qty</p>
//              <div className="text-3xl font-black text-slate-800">{stats.allocated}</div>
//              <div className="h-0.5 bg-orange-500 w-full rounded"></div>
//           </div>
//           <div className="text-center space-y-1">
//              <p className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Unallocated Lot Qty</p>
//              <div className="text-3xl font-black text-green-600">{stats.unallocated}</div>
//              <div className="h-0.5 bg-green-500 w-full rounded"></div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }