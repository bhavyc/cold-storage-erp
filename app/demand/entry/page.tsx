"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Save, Trash2, Search, X, RotateCcw, Database, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

// --- INITIAL STATES ---
const initialHeader = {
  demandNo: "",
  demandDate: new Date().toISOString().split('T')[0],
  partyId: ""
};

const initialRow = {
  lotId: "", 
  lotNo: "", 
  itemName: "", 
  packing: "",
  recQty: 0, 
  pMarka: "", 
  balQty: 0, // This is available balance
  demandQty: 0, 
  recWgt: 0,
  location: "", 
  demandRemarks: ""
};

export default function DemandEntryPage() {
  const [parties, setParties] = useState<any[]>([]);
  const [header, setHeader] = useState(initialHeader);
  const [grid, setGrid] = useState<any[]>([{ ...initialRow }]);
  const [availableLots, setAvailableLots] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Initial Load
  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
    fetch("/api/outward/demand/next-no")
      .then(res => res.json())
      .then(data => setHeader(h => ({ ...h, demandNo: data.nextNo })));
  }, []);

  // 2. LIVE TOTALS CALCULATION (Weighted Logic)
  const totals = useMemo(() => {
    return grid.reduce((acc, r) => {
      const dQty = Number(r.demandQty) || 0;
      const rWgt = Number(r.recWgt) || 0;
      const rQty = Number(r.recQty) || 1; // FIX: Prevent Division by Zero (Infinity/NaN)

      return {
        qty: acc.qty + dQty,
        wgt: acc.wgt + (dQty * (rWgt / rQty))
      };
    }, { qty: 0, wgt: 0 });
  }, [grid]);

  // 3. GRID STATE MANAGEMENT (Deep Cloning Fix)
  const updateGridRow = (idx: number, field: string, val: any) => {
    setGrid(prev => prev.map((row, i) => 
      i === idx ? { ...row, [field]: val } : row
    ));
  };

  // 4. IMPORT LOT DATA
  const handleOpenImport = async () => {
    if (!header.partyId) return toast.error("Bhai, pehle Party toh select karo!");
    setLoading(true);
    try {
      const res = await fetch(`/api/outward/demand?partyId=${header.partyId}`);
      const data = await res.json();
      
      if (!res.ok || !Array.isArray(data)) {
        toast.error(data.error || "Stock load karne mein dikkat hui!");
        setAvailableLots([]);
      } else {
        setAvailableLots(data);
        setShowModal(true);
      }
    } catch (err) {
      toast.error("Network error: Lots load nahi ho paye!");
    } finally {
      setLoading(false);
    }
  };

  // 5. SELECTION LOGIC
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
      demandQty: lot.availableQty, // Default to full available
      recWgt: Number(lot.totalNetWgt),
      location: `${lot.chamber?.name || ''}/${lot.floor || ''}/${lot.pole || ''}`,
      demandRemarks: ""
    };

    // Replace first empty row or append
    setGrid(prev => {
      const filtered = prev.filter(r => r.lotId !== "");
      return [...filtered, newRow];
    });
    setShowModal(false);
    toast.success(`Lot ${lot.lotNo} added!`);
  };

  // 6. SAVE LOGIC
  const handleSave = async () => {
    if (!header.partyId) return toast.error("Party select karo!");
    
    const validItems = grid.filter(r => r.lotId && r.demandQty > 0);
    if (validItems.length === 0) return toast.error("Kam se kam ek valid Lot aur Quantity dalo!");

    // Double check constraints
    const overLimit = validItems.find(r => r.demandQty > r.balQty);
    if (overLimit) return toast.error(`Lot ${overLimit.lotNo} has only ${overLimit.balQty} available!`);

    setIsSaving(true);
    const loadId = toast.loading("Demand save ho rahi hai...");
    
    try {
      const res = await fetch("/api/outward/demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, items: validItems })
      });

      if (res.ok) {
        toast.success("Demand Entry Saved! Stock reserved.", { id: loadId });
        // Reset Form
        setHeader(prev => ({ ...prev, demandNo: (parseInt(prev.demandNo) + 1).toString() }));
        setGrid([{ ...initialRow }]);
      } else {
        const err = await res.json();
        toast.error(err.error || "Save fail ho gaya!", { id: loadId });
      }
    } catch (err) {
      toast.error("Server Error!", { id: loadId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in">
      {/* ACTION BAR */}
      <div className="flex justify-between bg-white p-3 rounded shadow-sm border border-slate-200">
        <h2 className="text-sm font-bold text-indigo-800 uppercase flex items-center gap-2">
          <Database size={16}/> Demand Management
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#f39c12] hover:bg-orange-600 text-white px-8 py-1.5 rounded font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} 
            SAVE DEMAND
          </button>
          <button onClick={() => window.location.reload()} className="bg-red-600 text-white p-1.5 rounded shadow-sm">
            <RotateCcw size={16}/>
          </button>
        </div>
      </div>

      {/* HEADER SECTION */}
      <div className="bg-white p-6 border rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div>
          <label className="font-bold text-gray-400 uppercase block mb-1">Demand No</label>
          <input className="w-full border p-2 rounded bg-slate-50 font-bold" value={header.demandNo} readOnly />
        </div>
        <div>
          <label className="font-bold text-gray-400 uppercase block mb-1">Demand Date</label>
          <input type="date" className="w-full border p-2 rounded" value={header.demandDate} onChange={e => setHeader({...header, demandDate: e.target.value})} />
        </div>
        <div className="md:col-span-1">
          <label className="font-bold text-indigo-700 uppercase block mb-1">Select Party</label>
          <select 
            className="w-full border p-2 rounded font-bold text-blue-800 outline-none" 
            value={header.partyId} 
            onChange={e => setHeader({...header, partyId: e.target.value})}
          >
            <option value="">-- Select Party --</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
          </select>
        </div>
        <button 
          onClick={handleOpenImport} 
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-black py-2.5 rounded shadow-lg uppercase transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>}
          Import Lot Data
        </button>
      </div>

      {/* GRID TABLE */}
      <div className="bg-white border rounded shadow-sm overflow-x-auto min-h-[200px]">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-bold text-[10px]">
            <tr>
              <th className="p-2 border border-slate-300">Lot No</th>
              <th className="p-2 border border-slate-300">Item Name</th>
              <th className="p-2 border border-slate-300">Avail. Qty</th>
              <th className="p-2 border border-blue-300 bg-blue-50 text-blue-800">Demand Qty</th>
              <th className="p-2 border border-slate-300">Location</th>
              <th className="p-2 border border-slate-300">Remarks</th>
              <th className="p-2 border border-slate-300 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {grid.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-all border-b">
                <td className="p-2 border text-center font-bold text-indigo-700">{row.lotNo || "---"}</td>
                <td className="p-2 border uppercase font-medium">{row.itemName || "---"}</td>
                <td className="p-2 border text-center font-bold text-red-500">{row.balQty}</td>
                <td className="p-1 border bg-blue-50">
                  <input 
                    type="number" 
                    className="w-full p-1 text-center font-black text-blue-700 outline-none bg-transparent" 
                    value={row.demandQty || ""} 
                    onChange={e => updateGridRow(idx, "demandQty", parseInt(e.target.value) || 0)} 
                  />
                </td>
                <td className="p-2 border text-gray-500 italic text-center text-[9px]">{row.location || "---"}</td>
                <td className="p-1 border">
                  <input 
                    className="w-full p-1 bg-transparent outline-none" 
                    placeholder="..." 
                    value={row.demandRemarks} 
                    onChange={e => updateGridRow(idx, "demandRemarks", e.target.value)} 
                  />
                </td>
                <td className="p-1 border text-center">
                  <button onClick={() => setGrid(prev => prev.filter((_, i) => i !== idx || prev.length === 1))} className="text-red-500 hover:scale-125 transition-all">
                    <Trash2 size={16}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER TOTALS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 p-4 border border-red-200 rounded-lg flex justify-between items-center shadow-inner">
          <span className="font-bold text-red-600 uppercase text-[10px] tracking-widest">Total Demand Qty</span>
          <span className="text-3xl font-black text-slate-800">{totals.qty} <span className="text-xs font-normal text-gray-400">BAGS</span></span>
        </div>
        <div className="bg-blue-50 p-4 border border-blue-200 rounded-lg flex justify-between items-center shadow-inner">
          <span className="font-bold text-blue-600 uppercase text-[10px] tracking-widest">Est. Stored Weight</span>
          <span className="text-3xl font-black text-slate-800">{totals.wgt.toFixed(2)} <span className="text-xs font-normal text-gray-400">KG</span></span>
        </div>
      </div>

      {/* SELECTION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in zoom-in duration-200">
            <div className="bg-red-600 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold uppercase italic tracking-tighter">Stock Inventory Selection</h3>
                <p className="text-[10px] opacity-80">Only displaying lots with positive available balance</p>
              </div>
              <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-1 rounded-full"><X/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
               {availableLots.length === 0 ? (
                 <div className="text-center py-20 text-gray-400 italic">No available stock found for this party.</div>
               ) : (
                 <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 sticky top-0 border-b text-[10px] uppercase font-bold text-slate-500 z-10">
                     <tr>
                       <th className="p-3">Lot No</th>
                       <th className="p-3">Item Name</th>
                       <th className="p-3 text-center">Available</th>
                       <th className="p-3 text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody>
                    {availableLots.map((lot: any) => (
                      <tr key={lot.id} className="border-b hover:bg-indigo-50 transition-colors group">
                        <td className="p-3 font-bold text-indigo-700">{lot.lotNo}</td>
                        <td className="p-3 uppercase">
                          <div className="font-bold text-slate-700">{lot.item?.name}</div>
                          <div className="text-[9px] text-gray-400">{lot.unit?.name} | {lot.pMarka}</div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="font-black text-red-600 text-sm">{lot.availableQty}</div>
                          <div className="text-[8px] text-gray-400 uppercase">Physical: {lot.originalBal}</div>
                        </td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => selectLot(lot)} 
                            className="bg-indigo-600 text-white px-6 py-1.5 rounded-full text-[10px] font-bold shadow hover:bg-indigo-700 transition-all active:scale-90"
                          >
                            ADD TO LIST
                          </button>
                        </td>
                      </tr>
                    ))}
                   </tbody>
                 </table>
               )}
            </div>
            <div className="bg-slate-50 p-3 border-t text-right">
                <button onClick={() => setShowModal(false)} className="text-gray-500 font-bold uppercase text-[10px] px-6 py-2">Close Window</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}