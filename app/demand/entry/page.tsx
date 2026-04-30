"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Save, Trash2, Search, X, RotateCcw, Database, Loader2, Check, ChevronsUpDown, Landmark, History, LayoutList, Package, Info, Tag } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

// --- SEARCHABLE SELECT COMPONENT (Common Logic) ---
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
        className="w-full border-2 border-slate-200 p-2 rounded-lg bg-white flex justify-between items-center cursor-pointer hover:border-indigo-400 transition-all shadow-sm"
      >
        <span className={`truncate font-bold ${selectedOption ? 'text-blue-900' : 'text-slate-400'}`}>
          {selectedOption ? `${selectedOption[displayKey]} [${selectedOption[secondaryKey]}]` : placeholder}
        </span>
        <ChevronsUpDown size={14} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-indigo-100 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-150">
          <input 
            autoFocus
            className="w-full p-2 border-b border-slate-100 outline-none font-bold text-indigo-600 sticky top-0 bg-indigo-50"
            placeholder="Type name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {filtered.length > 0 ? filtered.map((opt: any) => (
              <div 
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(""); }}
                className="p-2.5 hover:bg-indigo-600 hover:text-white cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 font-bold text-[11px]"
              >
                <span>{opt[displayKey]} <span className="opacity-60 text-[9px]">({opt[secondaryKey]})</span></span>
                {value === opt.id && <Check size={14} />}
              </div>
            )) : <div className="p-4 text-center text-slate-400 italic">No Merchant Found</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE ---
const initialHeader = {
  demandNo: "",
  demandDate: new Date().toISOString().split('T')[0],
  partyId: ""
};

const initialRow = {
  lotId: "", lotNo: "", itemName: "", packing: "", recQty: 0, pMarka: "", 
  balQty: 0, demandQty: 0, recWgt: 0, location: "", demandRemarks: ""
};

export default function DemandEntryPage() {
  const router = useRouter();
  const [parties, setParties] = useState<any[]>([]);
  const [header, setHeader] = useState(initialHeader);
  const [grid, setGrid] = useState<any[]>([{ ...initialRow }]);
  const [availableLots, setAvailableLots] = useState<any[]>([]);
  const [modalSearch, setModalSearch] = useState(""); // Search inside modal
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. INITIAL LOAD (Sequence starts from 1)
  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
    fetch("/api/outward/demand/next-no")
      .then(res => res.json())
      .then(data => setHeader(h => ({ ...h, demandNo: data.nextNo || "1" })));
  }, []);

  // 2. LIVE TOTALS CALCULATION
  const totals = useMemo(() => {
    return grid.reduce((acc, r) => {
      const dQty = Number(r.demandQty) || 0;
      const rWgt = Number(r.recWgt) || 0;
      const rQty = Number(r.recQty) || 1;
      return {
        qty: acc.qty + dQty,
        wgt: acc.wgt + (dQty * (rWgt / rQty))
      };
    }, { qty: 0, wgt: 0 });
  }, [grid]);

  // 3. IMPORT LOT LOGIC
  const handleOpenImport = async () => {
    if (!header.partyId) return toast.error("Bhai, pehle Kisan (Party) select karo!");
    setLoading(true);
    try {
      const res = await fetch(`/api/outward/demand?partyId=${header.partyId}`);
      const data = await res.json();
      if (res.ok) {
        setAvailableLots(data);
        setShowModal(true);
      } else { toast.error("Stock load nahi hua!"); }
    } catch (err) { toast.error("Network Error!"); }
    finally { setLoading(false); }
  };

  const filteredLotsInModal = availableLots.filter(l => 
    l.lotNo.toLowerCase().includes(modalSearch.toLowerCase()) || 
    l.item?.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
    l.pMarka?.toLowerCase().includes(modalSearch.toLowerCase())
  );

  const selectLot = (lot: any) => {
    if (grid.some(r => r.lotId === lot.id)) return toast.error("Ye Lot pehle se list mein hai!");
    const newRow = {
      lotId: lot.id,
      lotNo: lot.lotNo,
      itemName: lot.item?.name || "Unknown",
      packing: lot.unit?.name || "Unit",
      recQty: lot.receivedQty,
      pMarka: lot.pMarka || "-",
      balQty: lot.availableQty,
      demandQty: lot.availableQty,
      recWgt: Number(lot.totalNetWgt),
      location: `${lot.chamber?.name || ''}/${lot.floor || ''}/${lot.pole || ''}`,
      demandRemarks: ""
    };
    setGrid(prev => [...prev.filter(r => r.lotId !== ""), newRow]);
    setShowModal(false);
    setModalSearch("");
    toast.success(`Lot ${lot.lotNo} Added!`);
  };

  const updateGridRow = (idx: number, field: string, val: any) => {
    setGrid(prev => prev.map((row, i) => i === idx ? { ...row, [field]: val } : row));
  };

  const handleSave = async () => {
    if (!header.partyId) return toast.error("Party chuno!");
    const validItems = grid.filter(r => r.lotId && r.demandQty > 0);
    if (validItems.length === 0) return toast.error("Grid khali hai!");

    setIsSaving(true);
    const loadId = toast.loading("Booking stock...");
    try {
      const res = await fetch("/api/outward/demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, items: validItems })
      });
      if (res.ok) {
        toast.success(`Booking Confirmed! Order No: ${header.demandNo} ✅`, { id: loadId, duration: 5000 });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        const err = await res.json();
        toast.error(err.error || "Save Failed! ❌", { id: loadId });
      }
    } catch (err) { toast.error("Server Error!"); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* TOP ACTION BAR */}
      <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm no-print">
        <div className="flex gap-2">
          <button onClick={() => router.push('/demand/register')} className="bg-red-600 text-white px-5 py-1.5 rounded font-black uppercase flex items-center gap-2 shadow-md hover:bg-red-700 transition-all">
            <LayoutList size={14}/> View Register
          </button>
          <button onClick={() => router.push('/demand/register')} className="bg-indigo-600 text-white px-5 py-1.5 rounded font-black flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-all uppercase">
            <History size={14}/> Previous Booking
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={isSaving} className="bg-[#10b981] hover:bg-green-700 text-white px-10 py-1.5 rounded font-black flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 uppercase">
            {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
            REGISTER DEMAND
          </button>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white p-1.5 rounded shadow hover:bg-orange-600 transition-all">
            <RotateCcw size={18}/>
          </button>
        </div>
      </div>

      <div className="bg-[#4a4ea3] text-white p-2 rounded-t-lg font-black text-center uppercase tracking-[5px] italic shadow-md border-b-4 border-indigo-300">
        Party Booking (Demand) | Material Release Request
      </div>

      {/* HEADER SECTION */}
      <div className="bg-white p-8 border rounded-b-lg shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest block">Demand No</label>
          <input readOnly className="w-full border-2 border-slate-100 p-2.5 rounded-lg bg-slate-100 font-black text-indigo-700 text-center text-lg shadow-inner" value={header.demandNo} />
        </div>
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest block">Request Date</label>
          <input type="date" className="w-full border-2 border-slate-100 p-2.5 rounded-lg font-bold outline-none focus:border-indigo-400 shadow-inner" value={header.demandDate} onChange={e => setHeader({...header, demandDate: e.target.value})} />
        </div>
        <div className="md:col-span-1 space-y-1">
          <label className="font-black text-indigo-700 uppercase text-[9px] tracking-widest flex items-center gap-1"><Landmark size={10}/> Search Merchant / Kisan *</label>
          <SearchableSelect 
            options={parties} 
            value={header.partyId} 
            onChange={(id: any) => setHeader({...header, partyId: id})} 
            placeholder="--- SEARCH NAME OR CODE ---" 
            displayKey="tradeName" 
            secondaryKey="partyCode"
          />
        </div>
        <button 
          onClick={handleOpenImport} 
          disabled={loading || !header.partyId}
          className="bg-red-600 hover:bg-red-700 disabled:bg-slate-200 text-white font-black py-2.5 rounded-lg shadow-lg uppercase transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin" size={16}/> : <Database size={16}/>}
          Import Warehouse Stock
        </button>
      </div>

      {/* GRID TABLE */}
      <div className="bg-white border rounded-lg shadow-xl overflow-x-auto min-h-[250px]">
        <table className="w-full border-collapse min-w-[1200px] text-left">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 border-r border-indigo-200 bg-indigo-100 w-28 text-center text-indigo-900">LOT NO.</th>
              <th className="p-3 border-r border-slate-300 w-64">ITEM NAME</th>
              <th className="p-3 border-r border-slate-300 w-24 text-center bg-red-50 text-red-600">AVAIL QTY</th>
              <th className="p-3 border-r border-blue-300 bg-blue-100 text-blue-900 text-center w-32">DEMAND QTY</th>
              <th className="p-3 border-r border-slate-300 w-48">LOCATION</th>
              <th className="p-3 border-r border-slate-300">BOOKING REMARKS</th>
              <th className="p-3 text-center w-20 bg-indigo-50">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {grid.map((row, idx) => (
              <tr key={idx} className="hover:bg-indigo-50/50 transition-all border-b border-slate-200 font-bold group">
                <td className="p-1 border-r border-indigo-200 bg-indigo-50/30 text-center font-black text-indigo-800 text-sm">{row.lotNo || "---"}</td>
                <td className="p-3 border-r border-slate-200 uppercase text-slate-700 truncate max-w-[200px]">{row.itemName || "---"}</td>
                <td className="p-3 border-r border-slate-200 text-center font-black text-red-600 bg-red-50/20">{row.balQty}</td>
                <td className="p-1 border-r border-blue-300 bg-blue-50 shadow-inner">
                  <input type="number" className="w-full p-2 text-center font-black text-blue-700 bg-transparent outline-none text-lg" value={row.demandQty || ""} onChange={e => updateGridRow(idx, "demandQty", parseInt(e.target.value) || 0)} />
                </td>
                <td className="p-3 border-r border-slate-200 italic text-gray-400 text-[10px] truncate max-w-[150px]">{row.location || "---"}</td>
                <td className="p-1 border-r border-slate-200"><input className="w-full p-2 bg-transparent outline-none font-normal italic" placeholder="e.g. Self Collection..." value={row.demandRemarks} onChange={e => updateGridRow(idx, "demandRemarks", e.target.value)} /></td>
                <td className="p-1 text-center bg-indigo-50/50">
                   <button onClick={() => setGrid(prev => prev.filter((_, i) => i !== idx || prev.length === 1))} className="text-red-500 hover:scale-125 transition-all"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER TOTALS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-[#1e293b] rounded-xl shadow-2xl border-t-4 border-indigo-500 text-white">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Total Bags Reserved</p>
          <div className="text-5xl font-black italic text-green-400">{totals.qty} <span className="text-xs font-normal opacity-50 not-italic">BAGS</span></div>
        </div>
        <div className="bg-indigo-600 p-6 rounded-2xl text-center shadow-inner ring-4 ring-indigo-500/50">
          <p className="text-[11px] font-black uppercase tracking-[5px] text-white/80 mb-2 underline underline-offset-8 decoration-yellow-400 decoration-2">Estimated Withdrawal Weight</p>
          <div className="text-5xl font-black tracking-tighter text-yellow-300 italic">{totals.wgt.toFixed(2)} <span className="text-sm font-black">KG</span></div>
        </div>
      </div>

      {/* STOCK SELECTION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in zoom-in duration-300">
            <div className="bg-[#4a4ea3] text-white p-6 flex justify-between items-center border-b-4 border-indigo-400">
              <div className="flex items-center gap-4">
                 <div className="bg-white/20 p-3 rounded-2xl shadow-inner"><Package size={32}/></div>
                 <div>
                    <h3 className="font-black uppercase tracking-[3px] text-lg leading-none">Select Stock from Warehouse</h3>
                    <p className="text-xs opacity-70 mt-1">Pick a lot to reserve bori for this kisan</p>
                 </div>
              </div>
              <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-all"><X size={32}/></button>
            </div>
            
            {/* Modal Search Bar */}
            <div className="p-4 bg-slate-100 border-b flex gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                  <input 
                    placeholder="Search by Lot No or Marka..." 
                    className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-indigo-400 font-bold"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                  />
               </div>
               <div className="bg-white px-6 py-2 rounded-xl border font-black text-indigo-700 flex items-center gap-2">
                  <Info size={14}/> Lots Found: {filteredLotsInModal.length}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-slate-50">
               <table className="w-full text-left border-separate border-spacing-y-3">
                 <thead>
                   <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6">
                     <th className="px-6">Identity</th>
                     <th className="px-6">Item & Marka</th>
                     <th className="px-6 text-center">Physical / Available</th>
                     <th className="px-6 text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody>
                  {filteredLotsInModal.map((lot: any) => (
                    <tr key={lot.id} className="bg-white shadow-sm hover:shadow-xl transition-all rounded-2xl group border border-slate-100">
                      <td className="p-5 font-black text-indigo-700 text-lg rounded-l-2xl border-l-4 border-indigo-500">
                        {lot.lotNo}
                        <div className="text-[8px] text-slate-400 uppercase font-normal">MR: {lot.mrNo}</div>
                      </td>
                      <td className="p-5">
                        <div className="font-black text-slate-700 uppercase text-sm">{lot.item?.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                           <Tag size={10}/> {lot.pMarka || 'No Marka'} | {lot.unit?.name}
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="font-black text-red-600 text-xl">{lot.availableQty}</div>
                        <div className="text-[8px] text-gray-400 uppercase">Physical: {lot.originalBal}</div>
                      </td>
                      <td className="p-5 text-right rounded-r-2xl">
                        <button 
                          onClick={() => selectLot(lot)} 
                          className="bg-[#10b981] text-white px-8 py-2 rounded-full font-black text-[10px] shadow-lg hover:bg-black uppercase tracking-tighter active:scale-90 transition-all"
                        >
                          Add To Booking
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
