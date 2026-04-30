"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Save, Search, Plus, Trash2, RotateCcw, Info, PackageCheck, X, Loader2, User, Tag, Check, ChevronsUpDown, Landmark, LayoutList, History } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

// --- SEARCHABLE SELECT COMPONENT (Common Man Logic: Writing + Selecting) ---
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
        <span className={`truncate font-bold text-[11px] ${selectedOption ? 'text-blue-900' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption[displayKey] : placeholder}
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
          <div className="max-h-48 overflow-y-auto scrollbar-hide">
            {filtered.length > 0 ? filtered.map((opt: any) => (
              <div 
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(""); }}
                className="p-2.5 hover:bg-indigo-600 hover:text-white cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 font-bold text-[11px]"
              >
                <span>{opt[displayKey]}</span>
                {value === opt.id && <Check size={14} />}
              </div>
            )) : <div className="p-4 text-center text-slate-400 italic text-[11px]">No matches</div>}
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
  const [nextAssignNo, setNextAssignNo] = useState("1");

  // 1. LOAD MASTERS & NEXT ASSIGN NO
  useEffect(() => {
    fetch("/api/masters/chambers").then(res => res.json()).then(setChambers);
    fetch("/api/warehouse/assign-pallet/next-no") // Ensure this endpoint returns {nextNo: "..."}
      .then(res => res.json())
      .then(data => setNextAssignNo(data.nextNo || "1"))
      .catch(() => setNextAssignNo("1"));
  }, []);

  // 2. SMART SEARCH LOGIC (Hits /api/warehouse/assign-pallet?query=)
  const handleSearch = async () => {
    if (!lotSearch) return toast.error("Bhai, Lot No ya Kisan ka naam dalo!");
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
          toast.error("Is entry ka koi unassigned stock nahi mila!");
        }
      } else {
        toast.error(data.error || "Lot search fail");
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

  // 3. LIVE MATH ENGINE
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

  // 4. SAVE FUNCTION
  const handleSave = async () => {
    if (!lotInfo) return toast.error("Pehle Lot search karke select karo!");
    if (rows.some(r => !r.chamberId || !r.palletNo || r.qty <= 0)) return toast.error("Bhai, grid details poori bharo!");
    if (stats.unallocated < 0) return toast.error("Error: Received quantity se zyada assign nahi kar sakte!");

    setIsSaving(true);
    const loadId = toast.loading("Saving warehouse placement...");
    try {
      const res = await fetch("/api/warehouse/assign-pallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          lotId: lotInfo.lotId, 
          assignments: rows
        })
      });

      if (res.ok) {
        toast.success(`Pallets Assigned to Lot ${lotInfo.lotNo}! 📍`, { id: loadId, duration: 5000 });
        setTimeout(() => window.location.reload(), 2000); 
      } else {
        const err = await res.json();
        toast.error(err.error || "Save fail! ❌", { id: loadId });
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
            <LayoutList size={14}/> View Register
          </button>
          <button onClick={() => router.push('/location/pallet-report')} className="bg-indigo-600 text-white px-5 py-1.5 rounded font-black flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-all uppercase">
            <History size={14}/> Previous Entry
          </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSave} 
            disabled={isSaving || !lotInfo}
            className="bg-[#10b981] hover:bg-green-700 text-white px-12 py-2 rounded font-black uppercase flex items-center gap-2 shadow-xl active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} 
            LOCK POSITIONING
          </button>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white p-1.5 rounded shadow hover:bg-orange-600 transition-all">
            <RotateCcw size={18}/>
          </button>
        </div>
      </div>

      <div className="bg-[#4a4ea3] text-white p-2 rounded-t-lg font-black text-center uppercase tracking-[5px] border border-b-0 italic shadow-md">
        Warehouse Logistics | Material-to-Pallet Mapping
      </div>

      <div className="bg-white p-8 border rounded-b-lg shadow-2xl space-y-8">
        
        {/* SMART SEARCH HEADER */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
          <div className="space-y-1">
            <label className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Assign Reference No.</label>
            <input readOnly className="w-full border-2 border-slate-100 p-2.5 rounded-lg bg-slate-100 font-black text-indigo-700 text-center text-lg shadow-sm" value={nextAssignNo} />
          </div>
          <div className="space-y-1">
            <label className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Placement Date</label>
            <input type="date" className="w-full border-2 border-slate-100 p-2.5 rounded-lg bg-white font-bold outline-none focus:border-indigo-400 shadow-inner" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="md:col-span-2 relative">
            <label className="font-black text-indigo-700 uppercase flex items-center gap-1 tracking-widest">
               Search Lot / Merchant / Marka <Info size={12}/>
            </label>
            <div className="flex gap-2 mt-1">
              <input 
                className="flex-1 border-2 border-indigo-100 p-3 rounded-xl font-black text-lg outline-none focus:border-indigo-500 transition-all uppercase placeholder:font-normal placeholder:text-slate-300 shadow-sm" 
                placeholder="TYPE LOT NO OR NAME..."
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
            <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 border-r border-indigo-200 w-16 text-center">SR.</th>
                <th className="p-4 border-r border-indigo-200 w-1/3">SEARCH & SELECT CHAMBER</th>
                <th className="p-4 border-r border-indigo-200">PALLET / BIN NO.</th>
                <th className="p-4 border-r border-indigo-200 text-center w-48 bg-yellow-50 text-indigo-900">BORI QTY</th>
                <th className="p-4 text-center w-24 bg-indigo-50">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-indigo-50/50 transition-all font-bold group even:bg-slate-50/30">
                  <td className="p-4 border-r border-slate-100 text-center text-gray-400 font-mono">{idx + 1}</td>
                  <td className="p-2 border-r border-slate-100">
                    <SearchableSelect 
                       options={chambers} 
                       value={row.chamberId} 
                       onChange={(val: any) => updateRow(idx, "chamberId", val)} 
                       placeholder="-- TYPE CHAMBER NAME --"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <input className="w-full p-2 border-2 border-slate-100 rounded-lg outline-none uppercase font-black text-indigo-700 text-center focus:border-indigo-400 shadow-sm" placeholder="BIN / PALLET NO." value={row.palletNo} onChange={e => updateRow(idx, "palletNo", e.target.value)} />
                  </td>
                  <td className="p-2 border-r border-slate-100 bg-yellow-50/30">
                    <input type="number" className="w-full p-2 text-center font-black text-xl text-blue-800 outline-none bg-transparent" value={row.qty || ""} onChange={e => updateRow(idx, "qty", parseInt(e.target.value) || 0)} />
                  </td>
                  <td className="p-2 text-center bg-indigo-50/50">
                    <div className="flex justify-center gap-3">
                       <button onClick={() => setRows([...rows, { ...initialRow }])} className="text-blue-600 hover:scale-125 transition-all"><Plus size={20}/></button>
                       <button onClick={() => removeRow(idx)} className="text-red-500 hover:scale-125 transition-all"><Trash2 size={18}/></button>
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
             <p className={`text-[10px] font-black uppercase tracking-widest ${stats.unallocated < 0 ? 'text-red-600' : 'text-green-500'}`}>Balance Pending</p>
             <div className={`text-4xl font-black italic ${stats.unallocated < 0 ? 'text-red-600' : 'text-green-500'}`}>{stats.unallocated}</div>
             <div className={`h-1.5 w-2/3 mx-auto rounded-full mt-2 shadow-lg ${stats.unallocated < 0 ? 'bg-red-600 animate-pulse' : 'bg-green-500'}`}></div>
          </div>
          {stats.unallocated < 0 && (
            <div className="absolute -top-4 right-0 bg-red-600 text-white px-6 py-1 rounded-full text-[9px] font-black uppercase animate-bounce shadow-xl border-2 border-white">
                CRITICAL ERROR: Qty Exceeded Received Stock!
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
                    <p className="text-xs opacity-70 mt-1">Select the correct inward lot to allocate pallets.</p>
                 </div>
              </div>
              <button onClick={() => setShowLotModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-all"><X size={32}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-slate-50">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6">
                    <th className="px-6">Identity</th>
                    <th className="px-6">Merchant & Item Detail</th>
                    <th className="px-6 text-center">Unassigned Stock</th>
                    <th className="px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lotList.map((lot) => (
                    <tr key={lot.lotId} className="bg-white shadow-sm hover:shadow-xl transition-all rounded-2xl group border border-slate-100">
                      <td className="p-5 font-black text-indigo-700 text-lg rounded-l-2xl border-l-4 border-indigo-500">
                        {lot.lotNo}
                        <div className="text-[8px] text-slate-400 uppercase font-normal">MR Ref: {lot.mrNo || 'N/A'}</div>
                      </td>
                      <td className="p-5">
                         <div className="font-black text-slate-700 uppercase text-sm">{lot.partyName}</div>
                         <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase mt-1">
                            {lot.itemName} <Tag size={8}/> {lot.marka ? `[${lot.marka}]` : 'No Marka'}
                         </div>
                      </td>
                      <td className="p-5 text-center">
                         <div className="font-black text-red-600 text-xl bg-red-50 py-1 px-4 rounded-full inline-block border border-red-100">{lot.unallocated} Bags</div>
                      </td>
                      <td className="p-5 text-right rounded-r-2xl">
                        <button onClick={() => selectLot(lot)} className="bg-[#4a4ea3] text-white px-10 py-2.5 rounded-full font-black text-[10px] shadow-lg hover:bg-indigo-800 uppercase tracking-tighter active:scale-90 transition-all flex items-center gap-2 ml-auto">
                           Select Lot & Map <ChevronsUpDown size={14}/>
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
         <div className="flex items-center gap-2">
            <Info size={14} className="text-blue-500"/>
            <span>* System Note: Pallet allocation connects physical storage location with financial lot identity.</span>
         </div>
         <span className="uppercase tracking-widest text-slate-400">Cold Storage ERP v1.0.4</span>
      </div>
    </div>
  );
}
