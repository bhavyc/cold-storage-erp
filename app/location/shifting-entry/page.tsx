"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Save, Search, ArrowRightLeft, MapPin, RotateCcw, Box, CheckCircle2, Loader2, X, User, Tag, Info, History, LayoutList } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

export default function MaterialShiftingEntry() {
  const router = useRouter();
  const [lotSearch, setLotSearch] = useState("");
  const [lotInfo, setLotInfo] = useState<any>(null);
  const [chambers, setChambers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Smart Search States
  const [lotList, setLotList] = useState<any[]>([]);
  const [showLotModal, setShowLotModal] = useState(false);

  const [formData, setFormData] = useState({
    shiftingNo: "", 
    date: new Date().toISOString().split('T')[0],
    toChamberId: "",
    toFloor: "",
    toPole: "",
    shiftQty: 0
  });

  // 1. LOAD MASTERS & NEXT NUMBER
  useEffect(() => {
    fetch("/api/masters/chambers").then(res => res.json()).then(setChambers);
    
    // Agla Shifting Number fetch karne ke liye (Start from 1 logic)
    fetch("/api/outward/gp/next-no") // Common sequence API use karein
      .then(res => res.json())
      .then(data => setFormData(prev => ({ ...prev, shiftingNo: data.nextNo || "1" })));
  }, []);

  // 2. SMART SEARCH LOGIC
  const handleSearch = async () => {
    if (!lotSearch) return toast.error("Bhai, Lot No. ya Kisan ka naam dalo!");
    setLoading(true);
    try {
      const res = await fetch(`/api/warehouse/shifting?query=${lotSearch}`);
      const data = await res.json();
      
      if (res.ok) {
        if (Array.isArray(data) && data.length > 1) {
          setLotList(data);
          setShowLotModal(true);
        } else if (Array.isArray(data) && data.length === 1) {
          selectLot(data[0]);
        } else if (!Array.isArray(data) && data.lotId) {
          selectLot(data);
        } else {
          toast.error("Is entry ka koi maal warehouse mein nahi mila!");
        }
      } else {
        toast.error(data.error || "Search fail ho gayi");
      }
    } catch (err) {
      toast.error("Network Error!");
    } finally {
      setLoading(false);
    }
  };

  const selectLot = (lot: any) => {
    setLotInfo(lot);
    setLotSearch(lot.lotNo); // Identity anchor
    setFormData(prev => ({ ...prev, shiftQty: lot.balanceQty })); 
    setShowLotModal(false);
    toast.success(`Lot ${lot.lotNo} selected for movement`);
  };

  // 3. PROCESS SHIFTING
  const handleProcessShifting = async () => {
    if (!lotInfo || !formData.toChamberId) return toast.error("Kripya saari details bhariye!");
    if (formData.shiftQty <= 0) return toast.error("Quantity 0 se zyada honi chahiye!");
    if (formData.shiftQty > lotInfo.balanceQty) return toast.error("Available balance se zyada shift nahi kar sakte!");

    setIsProcessing(true);
    const loadId = toast.loading("Executing internal stock movement...");
    try {
      const res = await fetch("/api/warehouse/shifting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotId: lotInfo.lotId,
          fromLocation: lotInfo.currentLocation,
          ...formData
        })
      });

      const result = await res.json();

      if (res.ok) {
        if (result.data?.isPartial) {
          toast.success(`Partial Shift Success! New child lot created for moved quantity. ✅`, { id: loadId, duration: 6000 });
        } else {
          toast.success(`Material Shifted Successfully! ✅`, { id: loadId, duration: 4000 });
        }
        setTimeout(() => window.location.reload(), 2000); 
      } else {
        toast.error(result.error || "Process failed! ❌", { id: loadId });
      }
    } catch (err) {
      toast.error("Server Error!", { id: loadId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* --- TOP ACTION BAR --- */}
      <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm no-print">
        <div className="flex gap-2">
          <button onClick={() => router.push('/location/shifting-report')} className="bg-red-600 text-white px-5 py-1.5 rounded font-black uppercase flex items-center gap-2 shadow-md hover:bg-red-700 transition-all">
            <LayoutList size={14}/> View Register
          </button>
          <button onClick={() => router.push('/location/shifting-report')} className="bg-indigo-600 text-white px-5 py-1.5 rounded font-black flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-all uppercase">
            <History size={14}/> Previous Entry
          </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleProcessShifting}
            disabled={isProcessing || !lotInfo}
            className="bg-[#10b981] hover:bg-green-700 text-white px-12 py-1.5 rounded font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50 uppercase"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} 
            EXECUTE MOVEMENT
          </button>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white p-1.5 rounded shadow hover:bg-orange-600 transition-all">
            <RotateCcw size={18}/>
          </button>
        </div>
      </div>

      <div className="bg-[#4a4ea3] text-white p-2 rounded-t-lg font-black text-center uppercase tracking-[5px] border border-b-0 border-indigo-300 italic shadow-md">
        Internal Logistics | Stock Shifting & Relocation Entry
      </div>

      <div className="bg-white p-8 border rounded-b-lg shadow-2xl space-y-10">
        
        {/* --- HEADER SEARCH BOX --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
          <div className="space-y-1">
            <label className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Shift Transaction No</label>
            <input readOnly className="w-full border-2 border-slate-100 p-2.5 rounded-lg bg-slate-100 font-black text-indigo-700 text-center text-lg shadow-sm" value={formData.shiftingNo} />
          </div>
          <div className="space-y-1">
            <label className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Movement Date</label>
            <input type="date" className="w-full border-2 border-slate-100 p-2.5 rounded-lg bg-white font-bold outline-none focus:border-indigo-400 shadow-inner" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="md:col-span-2 relative">
            <label className="font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1">Smart Stock Lookup (Merchant / Marka / Lot) <Info size={12}/></label>
            <div className="flex gap-2 mt-1">
              <input 
                className="flex-1 border-2 border-indigo-100 p-3 rounded-xl font-black text-lg outline-none focus:border-indigo-500 transition-all uppercase placeholder:font-normal placeholder:text-slate-300 shadow-sm" 
                placeholder="Type anything to find stock..." 
                value={lotSearch}
                onChange={e => setLotSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} disabled={loading} className="bg-indigo-600 text-white px-8 rounded-xl shadow-lg hover:bg-indigo-800 transition-all flex items-center justify-center min-w-[60px]">
                {loading ? <Loader2 className="animate-spin" size={24}/> : <Search size={24}/>}
              </button>
            </div>
            {lotInfo && (
              <div className="absolute -bottom-6 left-1 flex gap-5 animate-in slide-in-from-left">
                <p className="font-black text-green-600 uppercase text-[9px] flex items-center gap-1"><User size={10}/> {lotInfo.partyName}</p>
                <p className="font-black text-blue-600 uppercase text-[9px] flex items-center gap-1"><Tag size={10}/> {lotInfo.itemName} {lotInfo.marka ? `[${lotInfo.marka}]` : ''}</p>
              </div>
            )}
          </div>
        </div>

        {/* --- MOVEMENT CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           
           {/* LEFT: SOURCE (FROM) */}
           <div className="bg-red-50/20 p-8 rounded-3xl border-2 border-red-100 shadow-sm space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 bg-red-100 text-red-600 rounded-bl-xl font-black text-[8px] uppercase">ORIGIN SOURCE</div>
              <h3 className="font-black text-red-600 uppercase flex items-center gap-2 border-b-2 border-red-100 pb-3 italic text-xs tracking-widest">
                <MapPin size={18}/> Origin Point (Current Placement)
              </h3>
              <div className="space-y-6">
                 <div className="bg-white p-4 rounded-xl shadow-inner border border-red-50">
                    <p className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Selected Lot Identity:</p>
                    <p className="text-2xl font-black text-indigo-900 mt-1">{lotInfo ? lotInfo.lotNo : "--- SEARCH TO LOAD ---"}</p>
                    <p className="text-[10px] text-slate-400 uppercase mt-1">Location: {lotInfo ? lotInfo.currentLocation : '---'}</p>
                 </div>
                 <div className="bg-red-600 p-6 rounded-2xl text-center shadow-2xl transition-transform group-hover:scale-105">
                    <p className="text-red-100 font-black uppercase tracking-[3px] text-[10px]">Physical Balance In Stock</p>
                    <p className="text-5xl font-black text-white mt-1 leading-none">{lotInfo ? lotInfo.balanceQty : 0}</p>
                    <p className="text-red-200 text-[10px] font-bold mt-1 uppercase">BAGS / UNITS</p>
                 </div>
              </div>
           </div>

           {/* RIGHT: DESTINATION (TO) */}
           <div className="bg-green-50/20 p-8 rounded-3xl border-2 border-green-100 shadow-sm space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 bg-green-100 text-green-600 rounded-bl-xl font-black text-[8px] uppercase">NEW DESTINATION</div>
              <h3 className="font-black text-green-600 uppercase flex items-center gap-2 border-b-2 border-green-100 pb-3 italic text-xs tracking-widest">
                <ArrowRightLeft size={18}/> New Assignment (Destination)
              </h3>
              <div className="space-y-5">
                 <div className="space-y-1">
                    <label className="font-black text-slate-500 uppercase tracking-widest text-[9px]">Select Target Chamber</label>
                    <select 
                      className="w-full border-2 border-slate-100 p-3 rounded-xl bg-white font-black text-slate-700 shadow-sm outline-none focus:border-green-500 transition-all text-sm"
                      value={formData.toChamberId}
                      onChange={e => setFormData({...formData, toChamberId: e.target.value})}
                    >
                      <option value="">--- CHOOSE NEW CHAMBER ---</option>
                      {chambers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="font-black text-slate-500 uppercase text-[9px]">Floor No.</label>
                      <input className="w-full border-2 border-slate-100 p-3 rounded-xl bg-white outline-none focus:border-green-500 font-bold shadow-inner" placeholder="0" value={formData.toFloor} onChange={e => setFormData({...formData, toFloor: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="font-black text-slate-500 uppercase text-[9px]">Pillar / Pole</label>
                      <input className="w-full border-2 border-slate-100 p-3 rounded-xl bg-white outline-none focus:border-green-500 font-bold shadow-inner" placeholder="0" value={formData.toPole} onChange={e => setFormData({...formData, toPole: e.target.value})} />
                    </div>
                 </div>
                 <div className="bg-white p-5 rounded-2xl border-2 border-green-50 shadow-inner">
                    <label className="font-black text-indigo-700 uppercase block mb-2 tracking-widest text-[9px] text-center italic">Quantity To Shift (Units)</label>
                    <div className="relative max-w-[200px] mx-auto">
                      <Box className="absolute left-3 top-3 text-indigo-300" size={24}/>
                      <input 
                        type="number" 
                        className="w-full border-2 border-indigo-100 pl-12 pr-4 py-3 rounded-xl text-4xl font-black text-indigo-800 outline-none focus:border-indigo-400 text-center transition-all" 
                        value={formData.shiftQty || ""}
                        onChange={e => setFormData({...formData, shiftQty: parseInt(e.target.value) || 0})}
                      />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* --- SMART LOOKUP MODAL --- */}
      {showLotModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[75vh] animate-in zoom-in duration-300">
            <div className="bg-[#4a4ea3] text-white p-6 flex justify-between items-center border-b-4 border-indigo-400">
              <div className="flex items-center gap-4">
                 <div className="bg-white/20 p-3 rounded-2xl shadow-inner"><Search size={32}/></div>
                 <div>
                    <h3 className="font-black uppercase tracking-[3px] text-lg leading-none">Warehouse Stock Lookup</h3>
                    <p className="text-xs opacity-70 mt-1">Multiple lots matched your query. Select one to proceed with shifting.</p>
                 </div>
              </div>
              <button onClick={() => setShowLotModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-all"><X size={32}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-slate-50">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6">Lot Reference</th>
                    <th className="px-6">Merchant / Party</th>
                    <th className="px-6 text-center">Physical Balance</th>
                    <th className="px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lotList.map((lot) => (
                    <tr key={lot.lotId} className="bg-white shadow-sm hover:shadow-xl transition-all rounded-2xl group border border-slate-100">
                      <td className="p-5 font-black text-indigo-700 text-lg rounded-l-2xl border-l-4 border-indigo-500">{lot.lotNo}</td>
                      <td className="p-5">
                         <div className="font-black text-slate-700 uppercase text-sm">{lot.partyName}</div>
                         <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase">
                            {lot.itemName} <Tag size={8}/> {lot.marka || 'No Marka'}
                         </div>
                      </td>
                      <td className="p-5 text-center">
                         <div className="font-black text-red-600 text-xl bg-red-50 py-1 px-4 rounded-full inline-block border border-red-100">{lot.balanceQty}</div>
                         <p className="text-[8px] text-gray-400 mt-1 uppercase font-black">Bags in stock</p>
                      </td>
                      <td className="p-5 text-right rounded-r-2xl">
                        <button 
                            onClick={() => selectLot(lot)} 
                            className="bg-[#4a4ea3] text-white px-10 py-2.5 rounded-full font-black text-[10px] shadow-lg hover:bg-indigo-800 uppercase tracking-tighter active:scale-90 transition-all flex items-center gap-2 ml-auto"
                        >
                            Load Data <ArrowRightLeft size={12}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER NOTE */}
      <div className="p-4 bg-slate-100 border rounded-xl opacity-50 flex justify-between items-center italic text-[9px] font-bold no-print">
         <span>* System Note: Relocation entry will create an audit log and update physical stock position in the warehouse register.</span>
         <span className="uppercase tracking-widest text-slate-400">Cold Storage ERP v1.0.4</span>
      </div>
    </div>
  );
}

// "use client";

// import React, { useState, useEffect } from "react";
// import { Save, Search, ArrowRightLeft, MapPin, RotateCcw, Box, CheckCircle2 } from "lucide-react";
// import { toast } from "react-hot-toast";

// export default function MaterialShiftingEntry() {
//   const [lotSearch, setLotSearch] = useState("");
//   const [lotInfo, setLotInfo] = useState<any>(null);
//   const [chambers, setChambers] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   const [formData, setFormData] = useState({
//     shiftingNo: "2",
//     date: new Date().toISOString().split('T')[0],
//     toChamberId: "",
//     toFloor: "",
//     toPole: "",
//     shiftQty: 0
//   });

//   useEffect(() => {
//     fetch("/api/masters/chambers").then(res => res.json()).then(setChambers);
//   }, []);

//   // AUTOMATION: Search Lot Function
//   const handleSearch = async () => {
//     if (!lotSearch) return toast.error("Bhai, Lot No toh dalo!");
//     setLoading(true);
//     try {
//       const res = await fetch(`/api/warehouse/shifting?lotNo=${lotSearch}`);
//       const data = await res.json();
//       if (res.ok) {
//         setLotInfo(data);
//         setFormData(prev => ({ ...prev, shiftQty: data.balanceQty })); // Auto-fill full balance
//         toast.success(`Lot mil gaya: ${data.partyName}`);
//       } else {
//         toast.error(data.error);
//         setLotInfo(null);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // SAVE FUNCTION (Process Shifting)
//   const handleProcessShifting = async () => {
//     if (!lotInfo || !formData.toChamberId) return toast.error("Bhai, details poori bharo!");
//     if (formData.shiftQty > lotInfo.balanceQty) return toast.error("Oye! Balance se zyada shift nahi kar sakte.");

//     const loadId = toast.loading("Stock shift ho raha hai...");
//     try {
//       const res = await fetch("/api/warehouse/shifting", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           lotId: lotInfo.lotId,
//           fromLocation: lotInfo.currentLocation,
//           ...formData
//         })
//       });

//       if (res.ok) {
//         toast.success("Mubarak ho! Stock Nayi Location par shift ho gaya.", { id: loadId });
//         setLotInfo(null); setLotSearch(""); setFormData({...formData, toChamberId: "", toFloor: "", toPole: "", shiftQty: 0});
//       } else {
//         toast.error("Process fail ho gaya!", { id: loadId });
//       }
//     } catch (err) {
//       toast.error("Network Error!", { id: loadId });
//     }
//   };

//   return (
//     <div className="space-y-4 text-[11px] animate-in fade-in">
//       {/* ACTION BAR (Buttons from Image) */}
//       <div className="flex justify-between items-center bg-white p-3 rounded border shadow-sm">
//         <div className="flex gap-2">
//           <button className="bg-red-600 text-white px-6 py-1.5 rounded font-bold uppercase shadow">Show All</button>
//           <button onClick={() => window.location.reload()} className="bg-orange-500 text-white p-2 rounded shadow"><RotateCcw size={14}/></button>
//         </div>
//         <button 
//           onClick={handleProcessShifting}
//           className="bg-[#10b981] text-white px-10 py-1.5 rounded font-bold uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all"
//         >
//           <CheckCircle2 size={16}/> Process Shifting
//         </button>
//       </div>

//       <div className="bg-[#5d5fb1] text-white p-2 rounded-t font-black text-center uppercase tracking-widest border border-b-0">
//         Lot Shifting | Entry Form
//       </div>

//       <div className="bg-white p-8 border rounded-b shadow-sm space-y-8">
//         {/* HEADER SECTION (Image Matching) */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-inner">
//           <div>
//             <label className="font-bold text-gray-500 uppercase block mb-1">Shifting No</label>
//             <input className="w-full border p-2 rounded bg-white font-bold" value={formData.shiftingNo} readOnly />
//           </div>
//           <div>
//             <label className="font-bold text-gray-500 uppercase block mb-1">Date</label>
//             <input type="date" className="w-full border p-2 rounded bg-white font-medium" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
//           </div>
//           <div className="md:col-span-2 relative">
//             <label className="font-bold text-indigo-700 uppercase block mb-1 flex items-center gap-1">Search Lot No</label>
//             <div className="flex gap-2">
//               <input 
//                 className="flex-1 border-2 border-slate-200 p-2 rounded-md font-bold text-lg outline-none focus:border-blue-500 transition-all uppercase" 
//                 placeholder="Enter Lot No..." 
//                 value={lotSearch}
//                 onChange={e => setLotSearch(e.target.value)}
//                 onKeyDown={e => e.key === 'Enter' && handleSearch()}
//               />
//               <button onClick={handleSearch} className="bg-blue-600 text-white px-6 rounded-md shadow-md hover:bg-blue-700 transition-all">
//                 {loading ? <RotateCcw className="animate-spin" size={20}/> : <Search size={20}/>}
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* SHIFTING CARDS (Left: Source, Right: Destination) */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           
//            {/* FROM LOCATION (Red Card) */}
//            <div className="bg-red-50/30 p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
//               <h3 className="font-black text-red-600 uppercase flex items-center gap-2 border-b border-red-100 pb-2 italic">
//                 <MapPin size={16}/> From Location (Source)
//               </h3>
//               <div className="space-y-4">
//                  <div>
//                     <p className="text-gray-400 font-bold uppercase text-[9px]">Current Placement:</p>
//                     <p className="text-xl font-black text-slate-700 mt-1">
//                       {lotInfo ? lotInfo.currentLocation : "--- Search Lot First ---"}
//                     </p>
//                  </div>
//                  <div className="bg-white p-4 rounded-xl border border-red-200 text-center shadow-inner">
//                     <p className="text-gray-400 font-bold uppercase tracking-tighter">Current Balance Qty</p>
//                     <p className="text-4xl font-black text-red-500">{lotInfo ? lotInfo.balanceQty : 0} <span className="text-xs">Bags</span></p>
//                  </div>
//               </div>
//            </div>

//            {/* TO LOCATION (Green Card) */}
//            <div className="bg-green-50/30 p-6 rounded-2xl border border-green-100 shadow-sm space-y-5">
//               <h3 className="font-black text-green-600 uppercase flex items-center gap-2 border-b border-green-100 pb-2 italic">
//                 <ArrowRightLeft size={16}/> To Location (Destination)
//               </h3>
//               <div className="grid grid-cols-1 gap-4">
//                  <div>
//                     <label className="font-bold text-gray-500 uppercase block mb-1">New Chamber</label>
//                     <select 
//                       className="w-full border p-2.5 rounded bg-white font-bold text-slate-700 shadow-sm outline-none focus:ring-1 focus:ring-green-400"
//                       value={formData.toChamberId}
//                       onChange={e => setFormData({...formData, toChamberId: e.target.value})}
//                     >
//                       <option value="">Select Chamber</option>
//                       {chambers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//                     </select>
//                  </div>
//                  <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="font-bold text-gray-500 uppercase block mb-1">New Floor</label>
//                       <input className="w-full border p-2 rounded bg-white outline-none focus:ring-1 focus:ring-green-400" placeholder="e.g. 1" value={formData.toFloor} onChange={e => setFormData({...formData, toFloor: e.target.value})} />
//                     </div>
//                     <div>
//                       <label className="font-bold text-gray-500 uppercase block mb-1">New Pole</label>
//                       <input className="w-full border p-2 rounded bg-white outline-none focus:ring-1 focus:ring-green-400" placeholder="e.g. B-12" value={formData.toPole} onChange={e => setFormData({...formData, toPole: e.target.value})} />
//                     </div>
//                  </div>
//                  <div>
//                     <label className="font-bold text-blue-600 uppercase block mb-1">Quantity to Shift</label>
//                     <div className="relative">
//                       <Box className="absolute left-3 top-2.5 text-blue-300" size={16}/>
//                       <input 
//                         type="number" 
//                         className="w-full border-2 border-blue-100 pl-10 pr-4 py-2 rounded-lg text-2xl font-black text-blue-700 outline-none focus:border-blue-400" 
//                         value={formData.shiftQty || ""}
//                         onChange={e => setFormData({...formData, shiftQty: parseInt(e.target.value)})}
//                       />
//                     </div>
//                  </div>
//               </div>
//            </div>
//         </div>
//       </div>
//     </div>
//   );
// }
