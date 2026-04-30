"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Save, Search, Plus, Trash2, RotateCcw, Info, PackageCheck, X, Loader2, User, Tag, Check, ChevronsUpDown, Landmark } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

// --- SEARCHABLE SELECT COMPONENT (Common Logic for Writing + Selection) ---
const SearchableSelect = ({ options, value, onChange, placeholder, displayKey = "name" }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<any>(null);

  const filtered = options.filter((opt: any) =>
    opt[displayKey]?.toLowerCase().includes(searchTerm.toLowerCase())
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
        className="w-full border-2 border-slate-200 p-2 rounded-lg bg-white flex justify-between items-center cursor-pointer hover:border-indigo-400 transition-all shadow-sm"
      >
        <span className={`truncate font-bold ${selectedOption ? 'text-blue-900' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption[displayKey] : placeholder}
        </span>
        <ChevronsUpDown size={14} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-indigo-100 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-150">
          <input 
            autoFocus
            className="w-full p-2 border-b border-slate-100 outline-none font-bold text-indigo-600 sticky top-0 bg-indigo-50"
            placeholder="Type to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto">
            {filtered.length > 0 ? filtered.map((opt: any) => (
              <div 
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(""); }}
                className="p-2.5 hover:bg-indigo-600 hover:text-white cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 font-bold text-[11px]"
              >
                <span>{opt[displayKey]}</span>
                {value === opt.id && <Check size={14} />}
              </div>
            )) : <div className="p-4 text-center text-slate-400 italic">No matches</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE ---
const initialRow = { chamberId: "", palletNo: "", qty: 0 };

export default function AssignPalletPage() {
  const router = useRouter();
  const [lotSearch, setLotSearch] = useState("");
  const [lotInfo, setLotInfo] = useState<any>(null);
  const [chambers, setChambers] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([{ ...initialRow }]);
  
  const [lotList, setLotList] = useState<any[]>([]);
  const [showLotModal, setShowLotModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [assignNo, setAssignNo] = useState("[ AUTO ]");

  useEffect(() => {
    fetch("/api/masters/chambers").then(res => res.json()).then(setChambers);
    fetch("/api/warehouse/assign-pallet/next-no").then(res => res.json()).then(data => setAssignNo(data.nextAssignNo));
  }, []);

  // 1. SMART SEARCH LOGIC
  const handleSearch = async () => {
    if (!lotSearch) return toast.error("Kripya Lot No, Marka ya Kisan ka naam likhein!");
    setLoading(true);
    try {
      const res = await fetch(`/api/warehouse/assign-pallet?query=${lotSearch}`);
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
          toast.error("Is entry ka koi unallocated stock nahi mila!");
        }
      } else {
        toast.error(data.error || "Search failed");
      }
    } catch (err) {
      toast.error("Network error!");
    } finally {
      setLoading(false);
    }
  };

  const selectLot = (lot: any) => {
    setLotInfo(lot);
    setLotSearch(lot.lotNo); 
    setShowLotModal(false);
    toast.success(`Lot ${lot.lotNo} Loaded!`);
  };

  const updateRow = (idx: number, field: string, val: any) => {
    setRows(prev => prev.map((row, i) => 
      i === idx ? { ...row, [field]: field === "palletNo" ? val.toUpperCase() : val } : row
    ));
  };

  const removeRow = (idx: number) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter((_, i) => i !== idx));
    } else {
      setRows([{ ...initialRow }]);
    }
  };

  // 2. LIVE MATH ENGINE
  const stats = useMemo(() => {
    const gridTotal = rows.reduce((sum, r) => sum + (parseInt(r.qty) || 0), 0);
    const received = lotInfo?.receivedQty || 0;
    const previouslyAllocated = lotInfo?.allocatedQty || 0;
    
    return {
      received,
      allocated: previouslyAllocated + gridTotal,
      unallocated: received - (previouslyAllocated + gridTotal)
    };
  }, [rows, lotInfo]);

  // 3. SAVE FUNCTION
  const handleSave = async () => {
    if (!lotInfo) return toast.error("Pehle Lot search karke select karo!");
    if (rows.some(r => !r.chamberId || !r.palletNo || r.qty <= 0)) return toast.error("Grid details poori bhariye!");
    if (stats.unallocated < 0) return toast.error("Bhai, received bori se zyada assign nahi kar sakte!");

    setIsSaving(true);
    const loadId = toast.loading("Saving warehouse placement...");
    try {
      const res = await fetch("/api/warehouse/assign-pallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lotId: lotInfo.lotId, assignments: rows })
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`Pallet Assignment Saved!`, { id: loadId });
        window.location.reload(); 
      } else {
        toast.error(result.error || "Save fail ho gaya!", { id: loadId });
      }
    } catch (err) {
      toast.error("Network error!", { id: loadId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* TOP ACTION BAR */}
      <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm no-print">
        <div className="flex gap-2">
          <button onClick={() => router.push('/location/pallet-report')} className="bg-red-600 text-white px-5 py-1.5 rounded font-black uppercase shadow-md hover:bg-red-700 transition-all flex items-center gap-2">
            <Search size={14}/> View Report
          </button>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white p-1.5 rounded shadow hover:bg-orange-600 transition-all">
            <RotateCcw size={18}/>
          </button>
        </div>
        <div className="flex gap-2">
          <button className="bg-[#f39c12] text-white px-5 py-1.5 rounded font-black uppercase flex items-center gap-2 shadow-md">
            <PackageCheck size={16}/> Check Status
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving || !lotInfo}
            className="bg-[#10b981] hover:bg-green-700 text-white px-12 py-1.5 rounded font-black uppercase flex items-center gap-2 shadow-xl active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} 
            LOCK PLACEMENT
          </button>
        </div>
      </div>

      <div className="bg-[#4a4ea3] text-white p-2 rounded-t-lg font-black text-center uppercase tracking-[5px] border border-b-0 italic shadow-md">
        Warehouse Logistics | Pallet & Bin Assignment
      </div>

      <div className="bg-white p-8 border rounded-b-lg shadow-2xl space-y-8">
        
        {/* SMART SEARCH HEADER */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
          <div className="space-y-1">
            <label className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Entry No.</label>
            <input readOnly className="w-full border-2 border-slate-100 p-2.5 rounded-lg bg-slate-100 font-black text-indigo-700 text-center text-lg shadow-sm" placeholder="[ AUTO ]" value={assignNo} />
          </div>
          <div className="space-y-1">
            <label className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Assignment Date</label>
            <input type="date" className="w-full border-2 border-slate-100 p-2.5 rounded-lg bg-white font-bold outline-none focus:border-indigo-400 shadow-inner" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="md:col-span-2 relative">
            <label className="font-black text-indigo-700 uppercase flex items-center gap-1 tracking-widest">
               Search Lot / Merchant / Marka <Info size={12}/>
            </label>
            <div className="flex gap-2 mt-1">
              <input 
                className="flex-1 border-2 border-indigo-100 p-3 rounded-xl font-black text-lg outline-none focus:border-indigo-500 transition-all uppercase placeholder:font-normal placeholder:text-slate-300 shadow-sm" 
                placeholder="TYPE NAME OR MARK..."
                value={lotSearch}
                onChange={(e) => setLotSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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

        {/* ASSIGNMENT GRID */}
        <div className="overflow-x-auto border-2 border-slate-100 rounded-xl shadow-inner bg-white min-h-[200px]">
          <table className="w-full border-collapse text-left min-w-[800px]">
            <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10">
              <tr>
                <th className="p-4 border-r border-indigo-200 w-16 text-center">SR.</th>
                <th className="p-4 border-r border-indigo-200">SEARCH & SELECT CHAMBER</th>
                <th className="p-4 border-r border-indigo-200">PALLET / BIN NO.</th>
                <th className="p-4 border-r border-indigo-200 text-center w-48 bg-yellow-50 text-indigo-900">BORI TO ASSIGN</th>
                <th className="p-4 text-center w-24 bg-indigo-50">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-indigo-50/50 transition-all font-bold">
                  <td className="p-4 border-r border-slate-100 text-center text-gray-400 font-mono">{idx + 1}</td>
                  <td className="p-2 border-r border-slate-100">
                    <SearchableSelect 
                       options={chambers} 
                       value={row.chamberId} 
                       onChange={(val: any) => updateRow(idx, "chamberId", val)} 
                       placeholder="-- CHOOSE CHAMBER --"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <input className="w-full p-2 border-2 border-slate-100 rounded-lg outline-none uppercase font-black text-indigo-700 text-center focus:border-indigo-400 shadow-sm" placeholder="NO." value={row.palletNo} onChange={e => updateRow(idx, "palletNo", e.target.value)} />
                  </td>
                  <td className="p-2 border-r border-slate-100 bg-yellow-50/30">
                    <input type="number" className="w-full p-2 text-center font-black text-xl text-blue-800 outline-none bg-transparent" value={row.qty || ""} onChange={e => updateRow(idx, "qty", parseInt(e.target.value) || 0)} />
                  </td>
                  <td className="p-2 text-center bg-indigo-50/50">
                    <div className="flex justify-center gap-3">
                       <button onClick={() => setRows([...rows, { ...initialRow }])} className="text-blue-600 hover:scale-125 transition-transform"><Plus size={20}/></button>
                       <button onClick={() => removeRow(idx)} className="text-red-500 hover:scale-125 transition-transform"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LIVE MATH FOOTER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-6 border-t-4 border-slate-100 relative">
          <div className="text-center space-y-1">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Received Bags</p>
             <div className="text-4xl font-black text-slate-800 italic">{stats.received}</div>
             <div className="h-1.5 bg-slate-200 w-2/3 mx-auto rounded-full mt-2"></div>
          </div>
          <div className="text-center space-y-1">
             <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">System Assigned</p>
             <div className="text-4xl font-black text-orange-600 italic">{stats.allocated}</div>
             <div className="h-1.5 bg-orange-400 w-2/3 mx-auto rounded-full mt-2"></div>
          </div>
          <div className="text-center space-y-1">
             <p className={`text-[10px] font-black uppercase tracking-widest ${stats.unallocated < 0 ? 'text-red-600' : 'text-green-500'}`}>Balance Remaining</p>
             <div className={`text-4xl font-black italic ${stats.unallocated < 0 ? 'text-red-600' : 'text-green-600'}`}>{stats.unallocated}</div>
             <div className={`h-1.5 w-2/3 mx-auto rounded-full mt-2 shadow-lg ${stats.unallocated < 0 ? 'bg-red-600 animate-pulse' : 'bg-green-500'}`}></div>
          </div>
          {stats.unallocated < 0 && (
            <div className="absolute -top-4 right-0 bg-red-600 text-white px-4 py-1 rounded-full text-[8px] font-black uppercase animate-bounce shadow-xl border-2 border-white">
                ERROR: Qty Exceeded!
            </div>
          )}
        </div>
      </div>

      {/* SEARCH RESULTS MODAL */}
      {showLotModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[75vh] animate-in zoom-in duration-300">
            <div className="bg-[#4a4ea3] text-white p-6 flex justify-between items-center border-b-4 border-indigo-400">
              <div className="flex items-center gap-4">
                 <div className="bg-white/20 p-3 rounded-2xl shadow-inner"><Landmark size={32}/></div>
                 <div>
                    <h3 className="font-black uppercase tracking-[3px] text-lg leading-none">Warehouse Inventory Results</h3>
                    <p className="text-xs opacity-70 mt-1">Pick the correct inward lot to allocate pallets.</p>
                 </div>
              </div>
              <button onClick={() => setShowLotModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-all"><X size={32}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-slate-50">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6">
                    <th className="px-6">Lot Reference</th>
                    <th className="px-6">Merchant & Item</th>
                    <th className="px-6 text-center">Unassigned Stock</th>
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
                            <Tag size={8}/> {lot.itemName} {lot.marka ? `[${lot.marka}]` : ''}
                         </div>
                      </td>
                      <td className="p-5 text-center">
                         <div className="font-black text-red-600 text-xl bg-red-50 py-1 px-4 rounded-full inline-block border border-red-100">{lot.unallocated} Bags</div>
                      </td>
                      <td className="p-5 text-right rounded-r-2xl">
                        <button onClick={() => selectLot(lot)} className="bg-[#4a4ea3] text-white px-10 py-2.5 rounded-full font-black text-[10px] shadow-lg hover:bg-indigo-800 uppercase tracking-tighter active:scale-90 transition-all flex items-center gap-2 ml-auto">
                           Select Lot <ChevronsUpDown size={14}/>
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
    </div>
  );
}
// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import { Save, Search, Plus, Trash2, PackageCheck, RotateCcw, Info, X } from "lucide-react";
// import { toast } from "react-hot-toast";

// const initialRow = { chamberId: "", palletNo: "", qty: 0 };

// export default function PalletEntryPage() {
//   const [lotSearch, setLotSearch] = useState("");
//   const [lotInfo, setLotInfo] = useState<any>(null);
//   const [chambers, setChambers] = useState<any[]>([]);
//   const [rows, setRows] = useState<any[]>([{ ...initialRow }]);
//   const [loading, setLoading] = useState(false);

//   // 1. Load Chambers for Dropdown
//   useEffect(() => {
//     fetch("/api/masters/chambers").then(res => res.json()).then(setChambers);
//   }, []);

//   // 2. AUTOMATION: Search Lot (As per Image)
//   const handleSearch = async () => {
//     if (!lotSearch) return toast.error("Enter Lot No first!");
//     setLoading(true);
//     try {
//       const res = await fetch(`/api/warehouse/pallet?lotNo=${lotSearch}`);
//       const data = await res.json();
//       if (res.ok) {
//         setLotInfo(data);
//         toast.success("Lot Data Fetched!");
//       } else {
//         toast.error(data.error);
//         setLotInfo(null);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 3. Grid Row Logic
//   const updateRow = (idx: number, field: string, val: any) => {
//     const newRows = [...rows];
//     newRows[idx][field] = val;
//     setRows(newRows);
//   };

//   // 4. FOOTER AUTOMATION: Received, Allocated, Unallocated (Live Math)
//   const stats = useMemo(() => {
//     const currentGridTotal = rows.reduce((s, r) => s + (parseInt(r.qty) || 0), 0);
//     const received = lotInfo?.receivedQty || 0;
//     const previouslyAllocated = lotInfo?.alreadyAllocated || 0;
//     const totalAllocated = previouslyAllocated + currentGridTotal;
//     const unallocated = received - totalAllocated;

//     return { received, totalAllocated, unallocated };
//   }, [rows, lotInfo]);

//   // 5. SAVE FUNCTION (Post to Database)
//   const handleSave = async () => {
//     if (!lotInfo) return toast.error("Search a Lot first!");
//     if (stats.unallocated < 0) return toast.error("Received qty se zyada assign nahi kar sakte!");

//     const loadId = toast.loading("Saving Pallet Mappings...");
//     try {
//       const res = await fetch("/api/warehouse/pallet", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ lotId: lotInfo.lotId, assignments: rows })
//       });
//       if (res.ok) {
//         toast.success("Pallets Assigned Successfully!", { id: loadId });
//         setLotSearch(""); setLotInfo(null); setRows([{ ...initialRow }]);
//       } else {
//         toast.error("Error saving data", { id: loadId });
//       }
//     } catch (err) {
//       toast.error("Network Error", { id: loadId });
//     }
//   };

//   return (
//     <div className="space-y-4 text-[11px] animate-in fade-in">
//       {/* ACTION BAR */}
//       <div className="flex justify-between items-center bg-white p-3 rounded border shadow-sm">
//         <div className="flex gap-2">
//           <button className="bg-red-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow">Show All</button>
//           <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-4 py-1.5 rounded font-bold uppercase"><RotateCcw size={14}/></button>
//         </div>
//         <div className="flex gap-2">
//           <button className="bg-[#f39c12] text-white px-4 py-1.5 rounded font-bold uppercase flex items-center gap-2 shadow-sm">
//             <PackageCheck size={14}/> Check Pallet Status
//           </button>
//           <button onClick={handleSave} className="bg-[#10b981] text-white px-10 py-1.5 rounded font-bold uppercase flex items-center gap-2 shadow-lg transition-transform active:scale-95">
//             <Save size={14}/> Save
//           </button>
//         </div>
//       </div>

//       <div className="bg-[#5d5fb1] text-white p-2 rounded-t font-black text-center uppercase tracking-widest border border-b-0">
//         Assign Pallet | Entry Form
//       </div>

//       <div className="bg-white p-6 border rounded-b shadow-sm space-y-8">
//         {/* HEADER SEARCH SECTION */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-slate-50 p-5 rounded-lg border border-slate-200">
//           <div>
//             <label className="font-bold text-gray-500 uppercase block mb-1">Assign No</label>
//             <input className="w-full border p-2 rounded bg-white font-bold" value="1" readOnly />
//           </div>
//           <div>
//             <label className="font-bold text-gray-500 uppercase block mb-1">Date</label>
//             <input type="date" className="w-full border p-2 rounded bg-white" defaultValue={new Date().toISOString().split('T')[0]} />
//           </div>
//           <div className="md:col-span-2 relative">
//             <label className="font-bold text-indigo-700 uppercase block mb-1 flex items-center gap-1">Enter Lot No <Info size={10}/></label>
//             <div className="flex gap-2">
//               <input 
//                 className="flex-1 border-2 border-indigo-100 p-2 rounded-md font-bold text-lg outline-none focus:border-indigo-500 transition-all uppercase" 
//                 placeholder="Search Lot (e.g. 1001)..."
//                 value={lotSearch}
//                 onChange={(e) => setLotSearch(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
//               />
//               <button onClick={handleSearch} className="bg-indigo-600 text-white px-6 rounded-md shadow-md hover:bg-indigo-700 transition-all">
//                 {loading ? <RotateCcw className="animate-spin" size={20}/> : <Search size={20}/>}
//               </button>
//             </div>
//             {lotInfo && <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-green-600 uppercase tracking-tighter">Maal: {lotInfo.itemName}</p>}
//           </div>
//         </div>

//         {/* ASSIGNMENT GRID */}
//         <div className="overflow-x-auto border rounded shadow-inner">
//           <table className="w-full border-collapse text-left">
//             <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[10px]">
//               <tr>
//                 <th className="p-3 border-r border-slate-300 w-16 text-center">Sr. No</th>
//                 <th className="p-3 border-r border-slate-300">Chamber Name</th>
//                 <th className="p-3 border-r border-slate-300">Pallet No</th>
//                 <th className="p-3 border-r border-slate-300 w-48 text-center">Assign Qty</th>
//                 <th className="p-3 text-center w-24">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map((row, idx) => (
//                 <tr key={idx} className="border-b hover:bg-indigo-50/30 transition-all">
//                   <td className="p-3 border-r border-slate-200 text-center font-bold text-gray-400">{idx + 1}</td>
//                   <td className="p-1 border-r border-slate-200">
//                     <select 
//                       className="w-full p-2 outline-none bg-transparent font-bold text-slate-700"
//                       value={row.chamberId}
//                       onChange={e => updateRow(idx, "chamberId", e.target.value)}
//                     >
//                       <option value="">Select Chamber</option>
//                       {chambers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//                     </select>
//                   </td>
//                   <td className="p-1 border-r border-slate-200">
//                     <input 
//                       className="w-full p-2 outline-none font-black text-indigo-700 uppercase" 
//                       placeholder="ENTER PALLET NO"
//                       value={row.palletNo}
//                       onChange={e => updateRow(idx, "palletNo", e.target.value.toUpperCase())}
//                     />
//                   </td>
//                   <td className="p-1 border-r border-slate-200 bg-indigo-50/30">
//                     <input 
//                       type="number" 
//                       className="w-full p-2 text-center font-black text-lg text-blue-800 outline-none bg-transparent" 
//                       value={row.qty || ""}
//                       onChange={e => updateRow(idx, "qty", e.target.value)}
//                     />
//                   </td>
//                   <td className="p-1 text-center">
//                     <div className="flex justify-center gap-2">
//                        <button onClick={() => setRows([...rows, { ...initialRow }])} className="text-blue-600 hover:scale-125 transition-all"><Plus size={20}/></button>
//                        <button onClick={() => rows.length > 1 && setRows(rows.filter((_, i) => i !== idx))} className="text-red-500 hover:scale-125 transition-all"><X size={20}/></button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* AUTOMATED STATS (Image Footer Mapping) */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t-2 border-slate-100">
//           <div className="space-y-1">
//             <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Received Lot Qty</p>
//             <div className="text-4xl font-black text-blue-700">{stats.received}</div>
//           </div>
//           <div className="space-y-1">
//             <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Allocated Lot Qty</p>
//             <div className="text-4xl font-black text-orange-600">{stats.totalAllocated}</div>
//           </div>
//           <div className="space-y-1">
//             <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Unallocated Lot Qty</p>
//             <div className="text-4xl font-black text-green-600">{stats.unallocated}</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
