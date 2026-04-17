"use client";

import React, { useState, useEffect } from "react";
import { Save, Search, ArrowRightLeft, MapPin, RotateCcw, Box, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation"; // 1. Router import kiya

export default function MaterialShiftingEntry() {
  const router = useRouter(); // 2. Router initialize
  const [lotSearch, setLotSearch] = useState("");
  const [lotInfo, setLotInfo] = useState<any>(null);
  const [chambers, setChambers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    shiftingNo: "", // 3. Hardcoded "2" hata kar khali kiya
    date: new Date().toISOString().split('T')[0],
    toChamberId: "",
    toFloor: "",
    toPole: "",
    shiftQty: 0
  });

  useEffect(() => {
    fetch("/api/masters/chambers").then(res => res.json()).then(setChambers);
  }, []);

  // AUTOMATION: Search Lot Function
  const handleSearch = async () => {
    if (!lotSearch) return toast.error("Bhai, Lot No toh dalo!");
    setLoading(true);
    try {
      const res = await fetch(`/api/warehouse/shifting?lotNo=${lotSearch}`);
      const data = await res.json();
      if (res.ok) {
        setLotInfo(data);
        setFormData(prev => ({ ...prev, shiftQty: data.balanceQty })); // Auto-fill full balance
        toast.success(`Lot mil gaya: ${data.partyName}`);
      } else {
        toast.error(data.error || "Lot record nahi mila!");
        setLotInfo(null);
      }
    } catch (err) {
      toast.error("Network Error!");
    } finally {
      setLoading(false);
    }
  };

  // SAVE FUNCTION (Process Shifting)
  const handleProcessShifting = async () => {
    if (!lotInfo || !formData.toChamberId) return toast.error("Bhai, details poori bharo!");
    if (formData.shiftQty <= 0) return toast.error("Quantity 0 nahi ho sakti!");
    if (formData.shiftQty > lotInfo.balanceQty) return toast.error("Oye! Balance se zyada shift nahi kar sakte.");

    setIsProcessing(true);
    const loadId = toast.loading("Stock shift ho raha hai...");
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

      const result = await res.json(); // Backend se response liya

      if (res.ok) {
        // 4. Toast mein Backend wala real ID/Number dikhayenge
        toast.success(`Stock Shifted Successfully! Ref No: ${result.data.shiftNo || 'Done'}`, { id: loadId, duration: 5000 });
        setLotInfo(null); 
        setLotSearch(""); 
        setFormData({...formData, toChamberId: "", toFloor: "", toPole: "", shiftQty: 0});
      } else {
        toast.error(result.error || "Process fail ho gaya!", { id: loadId });
      }
    } catch (err) {
      toast.error("Network Error!", { id: loadId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in">
      {/* ACTION BAR (Buttons from Image) */}
      <div className="flex justify-between items-center bg-white p-3 rounded border shadow-sm">
        <div className="flex gap-2">
          {/* 5. Show All ko Register page se link kiya */}
          <button onClick={() => router.push('/location/shifting-report')} className="bg-red-600 text-white px-6 py-1.5 rounded font-bold uppercase shadow hover:bg-red-700 transition-all">Show All</button>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white p-2 rounded shadow hover:bg-orange-600 transition-all"><RotateCcw size={14}/></button>
        </div>
        <button 
          onClick={handleProcessShifting}
          disabled={isProcessing}
          className="bg-[#10b981] text-white px-10 py-1.5 rounded font-bold uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>} Process Shifting
        </button>
      </div>

      <div className="bg-[#5d5fb1] text-white p-2 rounded-t font-black text-center uppercase tracking-widest border border-b-0 italic">
        Lot Shifting | Entry Form
      </div>

      <div className="bg-white p-8 border rounded-b shadow-sm space-y-8">
        {/* HEADER SECTION (Image Matching) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-inner">
          <div>
            <label className="font-bold text-gray-500 uppercase block mb-1">Shifting No</label>
            {/* 6. Input ko readOnly karke placeholder badla */}
            <input 
              readOnly 
              className="w-full border p-2 rounded bg-slate-100 font-bold text-indigo-700" 
              value={formData.shiftingNo} 
              placeholder="[ AUTO-GENERATED ]" 
            />
          </div>
          <div>
            <label className="font-bold text-gray-500 uppercase block mb-1">Date</label>
            <input type="date" className="w-full border p-2 rounded bg-white font-medium outline-none focus:ring-1 focus:ring-indigo-400" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="md:col-span-2 relative">
            <label className="font-bold text-indigo-700 uppercase block mb-1 flex items-center gap-1">Search Lot No</label>
            <div className="flex gap-2">
              <input 
                className="flex-1 border-2 border-slate-200 p-2 rounded-md font-bold text-lg outline-none focus:border-blue-500 transition-all uppercase" 
                placeholder="Enter Lot No (e.g. 1001)..." 
                value={lotSearch}
                onChange={e => setLotSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} disabled={loading} className="bg-blue-600 text-white px-6 rounded-md shadow-md hover:bg-blue-700 transition-all">
                {loading ? <RotateCcw className="animate-spin" size={20}/> : <Search size={20}/>}
              </button>
            </div>
            {lotInfo && <p className="absolute -bottom-5 left-0 font-bold text-green-600 uppercase italic">Party: {lotInfo.partyName}</p>}
          </div>
        </div>

        {/* SHIFTING CARDS (Left: Source, Right: Destination) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           
           {/* FROM LOCATION (Red Card) */}
           <div className="bg-red-50/30 p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
              <h3 className="font-black text-red-600 uppercase flex items-center gap-2 border-b border-red-100 pb-2 italic">
                <MapPin size={16}/> From Location (Source)
              </h3>
              <div className="space-y-4">
                 <div>
                    <p className="text-gray-400 font-bold uppercase text-[9px]">Current Placement:</p>
                    <p className="text-xl font-black text-slate-700 mt-1">
                      {lotInfo ? lotInfo.currentLocation : "--- Search Lot First ---"}
                    </p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-red-200 text-center shadow-inner">
                    <p className="text-gray-400 font-bold uppercase tracking-tighter">Current Balance Qty</p>
                    <p className="text-4xl font-black text-red-500">{lotInfo ? lotInfo.balanceQty : 0} <span className="text-xs">Bags</span></p>
                 </div>
              </div>
           </div>

           {/* TO LOCATION (Green Card) */}
           <div className="bg-green-50/30 p-6 rounded-2xl border border-green-100 shadow-sm space-y-5">
              <h3 className="font-black text-green-600 uppercase flex items-center gap-2 border-b border-green-100 pb-2 italic">
                <ArrowRightLeft size={16}/> To Location (Destination)
              </h3>
              <div className="grid grid-cols-1 gap-4">
                 <div>
                    <label className="font-bold text-gray-500 uppercase block mb-1">New Chamber</label>
                    <select 
                      className="w-full border p-2.5 rounded bg-white font-bold text-slate-700 shadow-sm outline-none focus:ring-1 focus:ring-green-400"
                      value={formData.toChamberId}
                      onChange={e => setFormData({...formData, toChamberId: e.target.value})}
                    >
                      <option value="">Select Chamber</option>
                      {chambers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-500 uppercase block mb-1">New Floor</label>
                      <input className="w-full border p-2 rounded bg-white outline-none focus:ring-1 focus:ring-green-400" placeholder="e.g. 1" value={formData.toFloor} onChange={e => setFormData({...formData, toFloor: e.target.value})} />
                    </div>
                    <div>
                      <label className="font-bold text-gray-500 uppercase block mb-1">New Pole</label>
                      <input className="w-full border p-2 rounded bg-white outline-none focus:ring-1 focus:ring-green-400" placeholder="e.g. B-12" value={formData.toPole} onChange={e => setFormData({...formData, toPole: e.target.value})} />
                    </div>
                 </div>
                 <div>
                    <label className="font-bold text-blue-600 uppercase block mb-1">Quantity to Shift</label>
                    <div className="relative">
                      <Box className="absolute left-3 top-2.5 text-blue-300" size={16}/>
                      <input 
                        type="number" 
                        className="w-full border-2 border-blue-100 pl-10 pr-4 py-2 rounded-lg text-2xl font-black text-blue-700 outline-none focus:border-blue-400" 
                        value={formData.shiftQty || ""}
                        onChange={e => setFormData({...formData, shiftQty: parseInt(e.target.value)})}
                      />
                    </div>
                 </div>
              </div>
           </div>
        </div>
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