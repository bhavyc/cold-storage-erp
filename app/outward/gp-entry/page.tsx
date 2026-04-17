"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Save, Printer, Database, Search, X, Trash2, Plus, ClipboardCheck, RotateCcw, Import, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation"; // Router import kiya

const initialHeader = {
  gpNo: "", gpDate: new Date().toISOString().split('T')[0],
  partyId: "", partyCode: "", stateCode: "06", stateName: "Haryana",
  deliveryPerson: "", transportRequired: "Yes", grNo: "", truckNo: "", 
  remarks: "", transporterName: ""
};

const initialRow = { 
  lotId: "", lotNo: "", itemName: "", packing: "", marka: "", pMarka: "",
  balQty: 0, recQty: 0, recWgt: 0, perUnitWgt: 0, gpQty: 0, gpWgt: 0, 
  location: "", demandNo: "", demandId: "", lotValue: 0
};

export default function GPEntryPage() {
  const router = useRouter(); // Router initialize kiya
  const [parties, setParties] = useState<any[]>([]);
  const [header, setHeader] = useState(initialHeader);
  const [grid, setGrid] = useState<any[]>([initialRow]);
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [pendingDemands, setPendingDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
    // UI par agla number sirf preview ke liye dikhayega
    fetch("/api/outward/gp/next-no").then(res => res.json()).then(data => setHeader(h => ({...h, gpNo: data.nextNo})));
  }, []);

  // Automation: Party logic
  const handlePartyChange = (id: string) => {
    const party = parties.find(p => p.id === id);
    if (party) setHeader({...header, partyId: id, partyCode: party.partyCode, stateCode: party.stateCode || "06", stateName: party.stateName || "Haryana"});
  };

  // Automation: Weight Engine (Keeping your logic intact)
  const updateGridRow = (idx: number, field: string, val: any) => {
    const newGrid = [...grid];
    newGrid[idx][field] = val;

    if (field === "gpQty") {
      const qty = parseInt(val) || 0;
      if (qty > newGrid[idx].balQty) {
        toast.error("Stock se zyada bori nahi nikal sakte!");
        newGrid[idx].gpQty = 0;
        newGrid[idx].gpWgt = 0;
      } else {
        newGrid[idx].gpWgt = (qty * (newGrid[idx].perUnitWgt || 0)).toFixed(2);
      }
    }
    setGrid(newGrid);
  };

  // Import Demand Logic
  const fetchDemands = async () => {
    if (!header.partyId) return toast.error("Pehle Party select karo!");
    setLoading(true);
    try {
      const res = await fetch(`/api/outward/demand/register?partyId=${header.partyId}&status=Pending`);
      const data = await res.json();
      setPendingDemands(data);
      setShowDemandModal(true);
    } finally { setLoading(false); }
  };

  const importDemand = (demand: any) => {
    const newRows = demand.items.map((it: any) => ({
      lotId: it.lotId, lotNo: it.lot.lotNo, itemName: it.lot.item.name,
      packing: it.lot.unit.name, marka: it.lot.marka, pMarka: it.lot.pMarka,
      recQty: it.lot.receivedQty, balQty: it.lot.balanceQty, 
      recWgt: Number(it.lot.totalNetWgt), perUnitWgt: Number(it.lot.perUnitWgt),
      gpQty: it.qty, gpWgt: (it.qty * Number(it.lot.perUnitWgt)).toFixed(2),
      location: `${it.lot.chamber.name}/${it.lot.floor}/${it.lot.pole || ''}`,
      demandNo: demand.demandNo, demandId: demand.id, lotValue: 0
    }));
    setGrid(newRows);
    setShowDemandModal(false);
    toast.success("Demand Data Imported!");
  };

  // Calculations for Footer
  const totals = useMemo(() => grid.reduce((acc, r) => ({
    qty: acc.qty + (Number(r.gpQty) || 0),
    net: acc.net + (Number(r.gpWgt) || 0),
    tare: acc.tare + ((Number(r.gpQty) || 0) * 0.5) 
  }), { qty: 0, net: 0, tare: 0 }), [grid]);

  // SAVE WITH POPUP & RESET
  const handleSave = async () => {
    if (!header.partyId) return toast.error("Select Party!");
    if (grid.some(r => !r.lotId || r.gpQty <= 0)) return toast.error("Maal select karein aur Qty bharein!");

    const loadId = toast.loading("Gate Pass aur Accounting entries generate ho rahi hain...");
    try {
      const res = await fetch("/api/outward/gp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, items: grid })
      });
      const result = await res.json();
      if (res.ok) {
        // Backend se aaya hua real GP No toast mein dikhayenge
        toast.success(`Gate Pass Generated! GP No: ${result.data.gpNo}`, { id: loadId, duration: 5000 });
        setHeader(initialHeader);
        setGrid([initialRow]);
        // Refresh agla GP Number display ke liye
        fetch("/api/outward/gp/next-no").then(res => res.json()).then(d => setHeader(h => ({...h, gpNo: d.nextNo})));
      } else {
        toast.error(result.error || "Save Failed!", { id: loadId });
      }
    } catch (err) {
      toast.error("Network Error!", { id: loadId });
    }
  };

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in">
      {/* 1. BUTTON BAR */}
      <div className="flex justify-between bg-white p-3 rounded border shadow-sm border-slate-200">
        <div className="flex gap-2">
          {/* Link to Register */}
          <button onClick={() => router.push('/outward/register-summary')} className="bg-red-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow-sm">Show All</button>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-4 py-1.5 rounded font-bold uppercase flex items-center gap-1 shadow-sm">
            <RotateCcw size={14}/> Add New
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDemands} className="bg-[#3498db] hover:bg-blue-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow-sm">All Pending Demand</button>
          <button onClick={() => setGrid([...grid, initialRow])} className="bg-red-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow-sm">Add New Row</button>
          <button onClick={handleSave} className="bg-[#f39c12] text-white px-8 py-1.5 rounded font-bold flex items-center gap-2 shadow-md transition-all active:scale-95">
            <Save size={14}/> SAVE GP
          </button>
          <button className="bg-[#3498db] text-white px-8 py-1.5 rounded font-bold flex items-center gap-2 shadow-sm"><Printer size={14}/> PRINT</button>
        </div>
      </div>

      <div className="bg-[#b4b6e4] text-slate-800 p-2 text-center font-bold uppercase tracking-widest border border-slate-300 italic">
        Gate Pass | Outward Entry Form
      </div>

      {/* 2. HEADER FIELDS */}
      <div className="bg-white p-6 border rounded shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
            <label className="font-bold text-gray-400 block mb-1 uppercase">GP No</label>
            {/* Auto-generated lock */}
            <input 
              readOnly 
              className="w-full border p-2 rounded bg-slate-100 font-bold text-indigo-700" 
              value={header.gpNo} 
              placeholder="[ AUTO-GENERATED ]"
            />
        </div>
        <div><label className="font-bold text-gray-400 block mb-1 uppercase">GP Date</label><input type="date" className="w-full border p-2 rounded" value={header.gpDate} onChange={e => setHeader({...header, gpDate: e.target.value})} /></div>
        <div className="md:col-span-1"><label className="font-bold text-indigo-700 block mb-1 uppercase">Party Name</label>
          <select className="w-full border p-2 rounded font-bold text-blue-800" value={header.partyId} onChange={e => handlePartyChange(e.target.value)}>
            <option value="">Select Party</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
          </select>
        </div>
        <div><label className="font-bold text-gray-400 block mb-1 uppercase">State Code</label><input className="w-full border p-2 rounded bg-slate-100 text-center font-bold" value={header.stateCode} readOnly /></div>
        <div><label className="font-bold text-gray-400 block mb-1 uppercase">State Name</label><input className="w-full border p-2 rounded bg-slate-100 uppercase" value={header.stateName} readOnly /></div>
        
        <div><label className="font-bold text-gray-400 block mb-1 uppercase">Delivery Person</label><input className="w-full border p-2 rounded" value={header.deliveryPerson} onChange={e => setHeader({...header, deliveryPerson: e.target.value})} /></div>
        <div><label className="font-bold text-gray-400 block mb-1 uppercase">Transport Required</label>
          <select className="w-full border p-2 rounded" value={header.transportRequired} onChange={e => setHeader({...header, transportRequired: e.target.value})}>
            <option>Yes</option><option>No</option>
          </select>
        </div>
        <div><label className="font-bold text-gray-400 block mb-1 uppercase">GR No</label><input className="w-full border p-2 rounded" value={header.grNo} onChange={e => setHeader({...header, grNo: e.target.value})} /></div>
        <div><label className="font-bold text-gray-400 block mb-1 uppercase">Truck No</label><input className="w-full border p-2 rounded font-mono uppercase" value={header.truckNo} onChange={e => setHeader({...header, truckNo: e.target.value})} /></div>
        <div><label className="font-bold text-gray-400 block mb-1 uppercase">Transporter Name</label><input className="w-full border p-2 rounded" value={header.transporterName} onChange={e => setHeader({...header, transporterName: e.target.value})} /></div>
        
        <div className="md:col-span-2 flex gap-2">
            <button onClick={fetchDemands} className="flex-1 bg-red-600 text-white font-bold py-2 rounded uppercase shadow-md flex items-center justify-center gap-2 hover:bg-red-700 transition-all"><Database size={14}/> Import Demand Data</button>
            <button className="flex-1 bg-red-600 text-white font-bold py-2 rounded uppercase shadow-md flex items-center justify-center gap-2 hover:bg-red-700 transition-all"><Import size={14}/> Import GP Data</button>
        </div>
      </div>

      {/* 3. GRID TABLE */}
      <div className="bg-white border rounded shadow-sm overflow-x-auto">
        <table className="w-full border-collapse min-w-[1800px] text-left">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px]">
            <tr>
              <th className="p-2 border border-slate-300 w-32">Lot No</th>
              <th className="p-2 border border-slate-300 w-52">Item Name</th>
              <th className="p-2 border border-slate-300 w-24">Packing</th>
              <th className="p-2 border border-slate-300 w-20 text-center">Rec Qty</th>
              <th className="p-2 border border-slate-300 w-32">Marka</th>
              <th className="p-2 border border-slate-300 w-32">P.Marka</th>
              <th className="p-2 border border-slate-300 w-20 text-center text-red-600">Bal Qty</th>
              <th className="p-2 border border-slate-300 w-24 text-center">Rec Wgt</th>
              <th className="p-2 border border-blue-300 bg-blue-50 text-blue-800 text-center">GP Qty</th>
              <th className="p-2 border border-slate-300 text-center font-bold bg-slate-50">GP Wgt</th>
              <th className="p-2 border border-slate-300 w-40">Location</th>
              <th className="p-2 border border-slate-300 w-24 text-center">Demand No</th>
              <th className="p-2 border border-slate-300 w-24 text-center">Lot Value</th>
              <th className="p-2 border border-slate-300 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {grid.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 border-b">
                <td className="p-1 border border-slate-200"><input className="w-full p-1 text-center font-bold text-indigo-700 outline-none" value={row.lotNo} readOnly /></td>
                <td className="p-1 border border-slate-200 uppercase font-medium bg-slate-50">{row.itemName}</td>
                <td className="p-1 border border-slate-200 bg-slate-50">{row.packing}</td>
                <td className="p-1 border border-slate-200 text-center bg-slate-50">{row.recQty}</td>
                <td className="p-1 border border-slate-200 uppercase bg-slate-50">{row.marka}</td>
                <td className="p-1 border border-slate-200 uppercase bg-slate-50">{row.pMarka}</td>
                <td className="p-1 border border-slate-200 text-center font-bold text-red-600 bg-red-50/20">{row.balQty}</td>
                <td className="p-1 border border-slate-200 text-center bg-slate-50">{row.recWgt}</td>
                <td className="p-1 border border-blue-300 bg-blue-50 shadow-inner">
                  <input type="number" className="w-full p-1 text-center font-bold text-blue-700 outline-none bg-transparent" value={row.gpQty || ""} onChange={e => updateGridRow(idx, "gpQty", e.target.value)} />
                </td>
                <td className="p-1 border border-slate-200 text-center font-bold text-gray-500 bg-slate-50">{row.gpWgt}</td>
                <td className="p-1 border border-slate-200 italic text-gray-400 bg-slate-50">{row.location}</td>
                <td className="p-1 border border-slate-200 text-center font-bold bg-slate-50">{row.demandNo}</td>
                <td className="p-1 border border-slate-200"><input type="number" className="w-full p-1 text-center outline-none bg-transparent" value={row.lotValue} /></td>
                <td className="p-1 border text-center"><button onClick={() => setGrid(grid.filter((_,i) => i !== idx))} className="text-red-500 hover:scale-125 transition-all"><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. FOOTER STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 bg-slate-50 border rounded shadow-inner">
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-red-500 uppercase">Total Unit Qty</p>
          <div className="text-2xl font-black text-slate-800">{totals.qty}</div>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-red-500 uppercase">Tare Weight</p>
          <div className="text-2xl font-black text-slate-800">{totals.tare.toFixed(2)} Kg</div>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-red-500 uppercase">Total Produced Wgt</p>
          <div className="text-2xl font-black text-slate-800">{totals.net.toFixed(2)} Kg</div>
        </div>
        <div className="bg-indigo-600 p-2 rounded-lg text-white text-center shadow-lg">
          <p className="text-[9px] font-black uppercase opacity-80 mb-1">Total Net Weight</p>
          <div className="text-2xl font-black">{totals.net.toFixed(2)} Kg</div>
        </div>
      </div>

      {/* DEMAND IMPORT MODAL (Keeping your modal intact) */}
      {showDemandModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col h-[70vh]">
            <div className="bg-[#3498db] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold uppercase tracking-widest flex items-center gap-2"><ClipboardCheck size={18}/> Select Pending Demand</h3>
              <button onClick={() => setShowDemandModal(false)}><X/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b uppercase">
                  <tr><th className="p-3">Demand No</th><th className="p-3">Date</th><th className="p-3">Item Detail</th><th className="p-3 text-center">Action</th></tr>
                </thead>
                <tbody>
                  {pendingDemands.map(d => (
                    <tr key={d.id} className="border-b hover:bg-blue-50">
                      <td className="p-3 font-bold text-blue-700">{d.demandNo}</td>
                      <td className="p-3">{new Date(d.date).toLocaleDateString()}</td>
                      <td className="p-3 font-medium uppercase text-gray-500">{d.items.length} Items (Lots) Found</td>
                      <td className="p-3 text-center"><button onClick={() => importDemand(d)} className="bg-green-600 text-white px-6 py-1.5 rounded font-black hover:bg-green-700 shadow transition-all uppercase">Import All Data</button></td>
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
// import { Save, Printer, Database, Search, X, Trash2, Plus, ClipboardCheck, RotateCcw, Import, Info } from "lucide-react";
// import { toast } from "react-hot-toast";

// const initialHeader = {
//   gpNo: "", gpDate: new Date().toISOString().split('T')[0],
//   partyId: "", partyCode: "", stateCode: "06", stateName: "Haryana",
//   deliveryPerson: "", transportRequired: "Yes", grNo: "", truckNo: "", 
//   remarks: "", transporterName: ""
// };

// const initialRow = { 
//   lotId: "", lotNo: "", itemName: "", packing: "", marka: "", pMarka: "",
//   balQty: 0, recQty: 0, recWgt: 0, perUnitWgt: 0, gpQty: 0, gpWgt: 0, 
//   location: "", demandNo: "", demandId: "", lotValue: 0
// };

// export default function GPEntryPage() {
//   const [parties, setParties] = useState<any[]>([]);
//   const [header, setHeader] = useState(initialHeader);
//   const [grid, setGrid] = useState<any[]>([initialRow]);
//   const [showDemandModal, setShowDemandModal] = useState(false);
//   const [pendingDemands, setPendingDemands] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetch("/api/masters/party").then(res => res.json()).then(setParties);
//     fetch("/api/outward/gp/next-no").then(res => res.json()).then(data => setHeader(h => ({...h, gpNo: data.nextNo})));
//   }, []);

//   // Automation: Party logic (Credit Limit check triggers here in real-time if needed)
//   const handlePartyChange = (id: string) => {
//     const party = parties.find(p => p.id === id);
//     if (party) setHeader({...header, partyId: id, partyCode: party.partyCode, stateCode: party.stateCode || "06", stateName: party.stateName || "Haryana"});
//   };

//   // Automation: Weight Engine
//   const updateGridRow = (idx: number, field: string, val: any) => {
//     const newGrid = [...grid];
//     newGrid[idx][field] = val;

//     if (field === "gpQty") {
//       const qty = parseInt(val) || 0;
//       if (qty > newGrid[idx].balQty) {
//         toast.error("Stock se zyada bori nahi nikal sakte!");
//         newGrid[idx].gpQty = 0;
//         newGrid[idx].gpWgt = 0;
//       } else {
//         newGrid[idx].gpWgt = (qty * (newGrid[idx].perUnitWgt || 0)).toFixed(2);
//       }
//     }
//     setGrid(newGrid);
//   };

//   // Import Demand Logic
//   const fetchDemands = async () => {
//     if (!header.partyId) return toast.error("Pehle Party select karo!");
//     setLoading(true);
//     try {
//       const res = await fetch(`/api/outward/demand/register?partyId=${header.partyId}&status=Pending`);
//       const data = await res.json();
//       setPendingDemands(data);
//       setShowDemandModal(true);
//     } finally { setLoading(false); }
//   };

//   const importDemand = (demand: any) => {
//     const newRows = demand.items.map((it: any) => ({
//       lotId: it.lotId, lotNo: it.lot.lotNo, itemName: it.lot.item.name,
//       packing: it.lot.unit.name, marka: it.lot.marka, pMarka: it.lot.pMarka,
//       recQty: it.lot.receivedQty, balQty: it.lot.balanceQty, 
//       recWgt: Number(it.lot.totalNetWgt), perUnitWgt: Number(it.lot.perUnitWgt),
//       gpQty: it.qty, gpWgt: (it.qty * Number(it.lot.perUnitWgt)).toFixed(2),
//       location: `${it.lot.chamber.name}/${it.lot.floor}/${it.lot.pole || ''}`,
//       demandNo: demand.demandNo, demandId: demand.id, lotValue: 0
//     }));
//     setGrid(newRows);
//     setShowDemandModal(false);
//     toast.success("Demand Data Imported!");
//   };

//   // Calculations for Footer (Image 32 Match)
//   const totals = useMemo(() => grid.reduce((acc, r) => ({
//     qty: acc.qty + (Number(r.gpQty) || 0),
//     net: acc.net + (Number(r.gpWgt) || 0),
//     tare: acc.tare + ((Number(r.gpQty) || 0) * 0.5) // Assuming 0.5kg tare per unit
//   }), { qty: 0, net: 0, tare: 0 }), [grid]);

//   // SAVE WITH POPUP & RESET
//   const handleSave = async () => {
//     if (!header.partyId) return toast.error("Select Party!");
//     if (grid.some(r => !r.lotId || r.gpQty <= 0)) return toast.error("Maal select karein aur Qty bharein!");

//     const loadId = toast.loading("Gate Pass aur Accounting entries generate ho rahi hain...");
//     try {
//       const res = await fetch("/api/outward/gp", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ header, items: grid })
//       });
//       const data = await res.json();
//       if (res.ok) {
//         toast.success("Gate Pass Generated! Physical Stock minus ho gaya.", { id: loadId });
//         setHeader(initialHeader);
//         setGrid([initialRow]);
//         // Refresh agla GP Number
//         fetch("/api/outward/gp/next-no").then(res => res.json()).then(d => setHeader(h => ({...h, gpNo: d.nextNo})));
//       } else {
//         toast.error(data.error || "Save Failed!", { id: loadId });
//       }
//     } catch (err) {
//       toast.error("Network Error!", { id: loadId });
//     }
//   };

//   return (
//     <div className="space-y-4 text-[11px] animate-in fade-in">
//       {/* 1. BUTTON BAR (Image 32 Style) */}
//       <div className="flex justify-between bg-white p-3 rounded border shadow-sm border-slate-200">
//         <div className="flex gap-2">
//           <button className="bg-red-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow-sm">Show All</button>
//           <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-4 py-1.5 rounded font-bold uppercase flex items-center gap-1 shadow-sm">
//             <RotateCcw size={14}/> Add New
//           </button>
//         </div>
//         <div className="flex gap-2">
//           <button onClick={fetchDemands} className="bg-[#3498db] hover:bg-blue-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow-sm">All Pending Demand</button>
//           <button onClick={() => setGrid([...grid, initialRow])} className="bg-red-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow-sm">Add New Row</button>
//           <button onClick={handleSave} className="bg-[#f39c12] text-white px-8 py-1.5 rounded font-bold flex items-center gap-2 shadow-md transition-all active:scale-95">
//             <Save size={14}/> SAVE GP
//           </button>
//           <button className="bg-[#3498db] text-white px-8 py-1.5 rounded font-bold flex items-center gap-2 shadow-sm"><Printer size={14}/> PRINT</button>
//         </div>
//       </div>

//       <div className="bg-[#b4b6e4] text-slate-800 p-2 text-center font-bold uppercase tracking-widest border border-slate-300 italic">
//         Gate Pass | Outward Entry Form
//       </div>

//       {/* 2. HEADER FIELDS (ALL FIELDS FROM IMAGE 32) */}
//       <div className="bg-white p-6 border rounded shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
//         <div><label className="font-bold text-gray-400 block mb-1 uppercase">GP No</label><input className="w-full border p-2 rounded bg-slate-50 font-bold text-indigo-700" value={header.gpNo} readOnly /></div>
//         <div><label className="font-bold text-gray-400 block mb-1 uppercase">GP Date</label><input type="date" className="w-full border p-2 rounded" value={header.gpDate} onChange={e => setHeader({...header, gpDate: e.target.value})} /></div>
//         <div className="md:col-span-1"><label className="font-bold text-indigo-700 block mb-1 uppercase">Party Name</label>
//           <select className="w-full border p-2 rounded font-bold text-blue-800" value={header.partyId} onChange={e => handlePartyChange(e.target.value)}>
//             <option value="">Select Party</option>
//             {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
//           </select>
//         </div>
//         <div><label className="font-bold text-gray-400 block mb-1 uppercase">State Code</label><input className="w-full border p-2 rounded bg-slate-100 text-center font-bold" value={header.stateCode} readOnly /></div>
//         <div><label className="font-bold text-gray-400 block mb-1 uppercase">State Name</label><input className="w-full border p-2 rounded bg-slate-100 uppercase" value={header.stateName} readOnly /></div>
        
//         <div><label className="font-bold text-gray-400 block mb-1 uppercase">Delivery Person</label><input className="w-full border p-2 rounded" value={header.deliveryPerson} onChange={e => setHeader({...header, deliveryPerson: e.target.value})} /></div>
//         <div><label className="font-bold text-gray-400 block mb-1 uppercase">Transport Required</label>
//           <select className="w-full border p-2 rounded" value={header.transportRequired} onChange={e => setHeader({...header, transportRequired: e.target.value})}>
//             <option>Yes</option><option>No</option>
//           </select>
//         </div>
//         <div><label className="font-bold text-gray-400 block mb-1 uppercase">GR No</label><input className="w-full border p-2 rounded" value={header.grNo} onChange={e => setHeader({...header, grNo: e.target.value})} /></div>
//         <div><label className="font-bold text-gray-400 block mb-1 uppercase">Truck No</label><input className="w-full border p-2 rounded font-mono uppercase" value={header.truckNo} onChange={e => setHeader({...header, truckNo: e.target.value})} /></div>
//         <div><label className="font-bold text-gray-400 block mb-1 uppercase">Transporter Name</label><input className="w-full border p-2 rounded" value={header.transporterName} onChange={e => setHeader({...header, transporterName: e.target.value})} /></div>
        
//         <div className="md:col-span-2 flex gap-2">
//             <button onClick={fetchDemands} className="flex-1 bg-red-600 text-white font-bold py-2 rounded uppercase shadow-md flex items-center justify-center gap-2 hover:bg-red-700 transition-all"><Database size={14}/> Import Demand Data</button>
//             <button className="flex-1 bg-red-600 text-white font-bold py-2 rounded uppercase shadow-md flex items-center justify-center gap-2 hover:bg-red-700 transition-all"><Import size={14}/> Import GP Data</button>
//         </div>
//       </div>

//       {/* 3. GRID TABLE (ALL 14 COLUMNS FROM IMAGE 32) */}
//       <div className="bg-white border rounded shadow-sm overflow-x-auto">
//         <table className="w-full border-collapse min-w-[1800px] text-left">
//           <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px]">
//             <tr>
//               <th className="p-2 border border-slate-300 w-32">Lot No</th>
//               <th className="p-2 border border-slate-300 w-52">Item Name</th>
//               <th className="p-2 border border-slate-300 w-24">Packing</th>
//               <th className="p-2 border border-slate-300 w-20 text-center">Rec Qty</th>
//               <th className="p-2 border border-slate-300 w-32">Marka</th>
//               <th className="p-2 border border-slate-300 w-32">P.Marka</th>
//               <th className="p-2 border border-slate-300 w-20 text-center text-red-600">Bal Qty</th>
//               <th className="p-2 border border-slate-300 w-24 text-center">Rec Wgt</th>
//               <th className="p-2 border border-blue-300 bg-blue-50 text-blue-800 text-center">GP Qty</th>
//               <th className="p-2 border border-slate-300 text-center font-bold bg-slate-50">GP Wgt</th>
//               <th className="p-2 border border-slate-300 w-40">Location</th>
//               <th className="p-2 border border-slate-300 w-24 text-center">Demand No</th>
//               <th className="p-2 border border-slate-300 w-24 text-center">Lot Value</th>
//               <th className="p-2 border border-slate-300 w-16 text-center">Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {grid.map((row, idx) => (
//               <tr key={idx} className="hover:bg-slate-50 border-b">
//                 <td className="p-1 border border-slate-200"><input className="w-full p-1 text-center font-bold text-indigo-700 outline-none" value={row.lotNo} readOnly /></td>
//                 <td className="p-1 border border-slate-200 uppercase font-medium bg-slate-50">{row.itemName}</td>
//                 <td className="p-1 border border-slate-200 bg-slate-50">{row.packing}</td>
//                 <td className="p-1 border border-slate-200 text-center bg-slate-50">{row.recQty}</td>
//                 <td className="p-1 border border-slate-200 uppercase bg-slate-50">{row.marka}</td>
//                 <td className="p-1 border border-slate-200 uppercase bg-slate-50">{row.pMarka}</td>
//                 <td className="p-1 border border-slate-200 text-center font-bold text-red-600 bg-red-50/20">{row.balQty}</td>
//                 <td className="p-1 border border-slate-200 text-center bg-slate-50">{row.recWgt}</td>
//                 <td className="p-1 border border-blue-300 bg-blue-50 shadow-inner">
//                   <input type="number" className="w-full p-1 text-center font-bold text-blue-700 outline-none bg-transparent" value={row.gpQty || ""} onChange={e => updateGridRow(idx, "gpQty", e.target.value)} />
//                 </td>
//                 <td className="p-1 border border-slate-200 text-center font-bold text-gray-500 bg-slate-50">{row.gpWgt}</td>
//                 <td className="p-1 border border-slate-200 italic text-gray-400 bg-slate-50">{row.location}</td>
//                 <td className="p-1 border border-slate-200 text-center font-bold bg-slate-50">{row.demandNo}</td>
//                 <td className="p-1 border border-slate-200"><input type="number" className="w-full p-1 text-center outline-none bg-transparent" value={row.lotValue} /></td>
//                 <td className="p-1 border text-center"><button onClick={() => setGrid(grid.filter((_,i) => i !== idx))} className="text-red-500 hover:scale-125 transition-all"><Trash2 size={16}/></button></td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* 4. FOOTER STATS (ALL 4 BOXES FROM IMAGE 32) */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 bg-slate-50 border rounded shadow-inner">
//         <div className="space-y-1">
//           <p className="text-[9px] font-bold text-red-500 uppercase">Total Unit Qty</p>
//           <div className="text-2xl font-black text-slate-800">{totals.qty}</div>
//         </div>
//         <div className="space-y-1">
//           <p className="text-[9px] font-bold text-red-500 uppercase">Tare Weight</p>
//           <div className="text-2xl font-black text-slate-800">{totals.tare.toFixed(2)} Kg</div>
//         </div>
//         <div className="space-y-1">
//           <p className="text-[9px] font-bold text-red-500 uppercase">Total Produced Wgt</p>
//           <div className="text-2xl font-black text-slate-800">{totals.net.toFixed(2)} Kg</div>
//         </div>
//         <div className="bg-indigo-600 p-2 rounded-lg text-white text-center shadow-lg">
//           <p className="text-[9px] font-black uppercase opacity-80 mb-1">Total Net Weight</p>
//           <div className="text-2xl font-black">{totals.net.toFixed(2)} Kg</div>
//         </div>
//       </div>

//       {/* DEMAND IMPORT MODAL */}
//       {showDemandModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
//           <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col h-[70vh]">
//             <div className="bg-[#3498db] text-white p-4 flex justify-between items-center">
//               <h3 className="font-bold uppercase tracking-widest flex items-center gap-2"><ClipboardCheck size={18}/> Select Pending Demand</h3>
//               <button onClick={() => setShowDemandModal(false)}><X/></button>
//             </div>
//             <div className="flex-1 overflow-y-auto p-4">
//               <table className="w-full text-left text-xs">
//                 <thead className="bg-slate-50 border-b uppercase">
//                   <tr><th className="p-3">Demand No</th><th className="p-3">Date</th><th className="p-3">Item Detail</th><th className="p-3 text-center">Action</th></tr>
//                 </thead>
//                 <tbody>
//                   {pendingDemands.map(d => (
//                     <tr key={d.id} className="border-b hover:bg-blue-50">
//                       <td className="p-3 font-bold text-blue-700">{d.demandNo}</td>
//                       <td className="p-3">{new Date(d.date).toLocaleDateString()}</td>
//                       <td className="p-3 font-medium uppercase text-gray-500">{d.items.length} Items (Lots) Found</td>
//                       <td className="p-3 text-center"><button onClick={() => importDemand(d)} className="bg-green-600 text-white px-6 py-1.5 rounded font-black hover:bg-green-700 shadow transition-all uppercase">Import All Data</button></td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }