"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Save, Printer, Import, Calculator, RotateCcw, Database, X, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation"; // 1. Router import kiya

const initialRow = { 
  lotId: "", lotNo: "", marka: "", itemName: "", packing: "", gpNo: "", 
  mrDate: "", gpDate: "", prd: 0, qty: 0, rentRate: 0, rentAmt: 0, labRate: 0, labourAmt: 0 
};

export default function PIEntryPage() {
  const router = useRouter(); // 2. Router initialize
  const [parties, setParties] = useState<any[]>([]);
  const [header, setHeader] = useState({
    seriesType: "Bill Of Supply", 
    piNo: "", // 3. Empty for auto-gen
    piDate: new Date().toISOString().split('T')[0],
    partyId: "", vehicleNo: "", transporterGst: "", transporterName: "", remarks: "", graceDays: 0
  });
  const [grid, setGrid] = useState<any[]>([initialRow]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
    // UI Preview number only
    fetch("/api/billing/pi/next-no").then(res => res.json()).then(d => setHeader(h => ({...h, piNo: d.nextNo})));
  }, []);

  // 1. AUTOMATION: Import Data
  const handleImportData = async () => {
    if (!header.partyId) return toast.error("Select Party First!");
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/pending-lots/${header.partyId}`);
      const lots = await res.json();
      const mappedRows = lots.map((l: any) => ({
        lotId: l.id, lotNo: l.lotNo, marka: l.marka, itemName: l.item.name,
        packing: l.unit.name, gpNo: l.outwardEntries?.[0]?.gpNo || "NA",
        mrDate: l.arrivalDate, gpDate: l.outwardEntries?.[0]?.gpDate || new Date().toISOString(),
        prd: 0, qty: l.receivedQty, rentRate: 0, rentAmt: 0, labRate: 0, labourAmt: 0
      }));
      setGrid(mappedRows);
      toast.success("Lots Imported!");
    } finally { setLoading(false); }
  };

  // 2. AUTOMATION: Calculate Amt
  const handleCalculate = () => {
    const newGrid = grid.map(row => {
      const arrival = new Date(row.mrDate);
      const billing = new Date(header.piDate);
      const diffTime = Math.ceil((billing.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
      
      const period = Math.max(0, diffTime - header.graceDays);
      const rentAmt = row.qty * row.rentRate * period;
      const labourAmt = row.qty * row.labRate;

      return { ...row, prd: period, rentAmt, labourAmt };
    });
    setGrid(newGrid);
    toast.success("Calculations Updated!");
  };

  // 3. FINAL TOTALS
  const totals = useMemo(() => {
    const rentTotal = grid.reduce((s, r) => s + (r.rentAmt || 0), 0);
    const labourTotal = grid.reduce((s, r) => s + (r.labourAmt || 0), 0);
    const taxable = rentTotal + labourTotal;
    const cgst = taxable * 0.09; 
    const sgst = taxable * 0.09;
    return {
      rentTotal, labourTotal, taxableValue: taxable,
      cgstAmt: cgst, sgstAmt: sgst, netAmt: Math.round(taxable + cgst + sgst),
      totalGpQty: grid.reduce((s, r) => s + (r.qty || 0), 0)
    };
  }, [grid]);

  // 4. SAVE PI
  const handleSave = async () => {
    if (grid.length === 0 || !header.partyId) return toast.error("Data missing!");
    
    setIsSaving(true);
    const loadId = toast.loading("Saving PI Estimate...");
    try {
      const res = await fetch("/api/billing/pi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, items: grid, totals })
      });
      
      const result = await res.json(); // Backend se response liya

      if (res.ok) {
        // 4. Toast mein Backend wala real ID dikhayenge
        toast.success(`PI Saved Successfully! Estimate No: ${result.invoiceNo}`, { id: loadId, duration: 5000 });
        window.location.reload();
      } else {
        toast.error("Save failed", { id: loadId });
      }
    } catch (err) {
      toast.error("Network Error!", { id: loadId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3 text-[11px] animate-in fade-in">
      {/* ACTION BAR */}
      <div className="flex justify-between bg-white p-2 border rounded shadow-sm">
        <div className="flex gap-2">
          {/* 5. Link to PI Book */}
          <button onClick={() => router.push('/billing/pi-book')} className="bg-red-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow hover:bg-red-700 transition-all">Show All</button>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-4 py-1.5 rounded font-bold uppercase flex items-center gap-1 shadow hover:bg-orange-600 transition-all"><RotateCcw size={12}/> Add New PI</button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#f39c12] text-white px-10 py-1.5 rounded font-bold flex items-center gap-2 shadow hover:bg-orange-600 transition-all uppercase"
          >
            {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} SAVE PI
          </button>
          <button className="bg-[#3498db] text-white px-8 py-1.5 rounded font-bold flex items-center gap-2 shadow uppercase"><Printer size={14}/> PRINT</button>
        </div>
      </div>

      <div className="bg-[#5d5fb1] text-white p-2 rounded-t font-black text-center uppercase tracking-widest italic border border-b-0">
        Nill Lot PI | Entry Form (Draft Bill)
      </div>

      {/* HEADER GRID */}
      <div className="bg-white p-6 border rounded-b shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3 items-end">
          <div><label className="text-gray-400 font-bold uppercase text-[9px]">Series Type</label><input className="w-full border p-1 rounded bg-slate-50" value="Bill Of Supply" readOnly /></div>
          <div>
              <label className="text-gray-400 font-bold uppercase text-[9px]">PI No</label>
              {/* 6. PI No Locked */}
              <input 
                readOnly 
                className="w-full border p-1 rounded bg-slate-100 font-bold text-center text-indigo-700" 
                value={header.piNo} 
                placeholder="[ AUTO ]" 
              />
          </div>
          <div><label className="text-gray-400 font-bold uppercase text-[9px]">PI Date</label><input type="date" className="w-full border p-1 rounded outline-none focus:ring-1 focus:ring-indigo-400" value={header.piDate} onChange={e => setHeader({...header, piDate: e.target.value})} /></div>
          <div className="md:col-span-2"><label className="text-blue-700 font-black uppercase text-[9px]">Party Name</label>
            <select className="w-full border-2 border-blue-100 p-1 rounded font-bold outline-none" onChange={e => {
                const p = parties.find(x => x.id === e.target.value);
                setHeader({...header, partyId: e.target.value, graceDays: p?.graceDays || 0});
            }}>
              <option value="">-----Select Party Name-----</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
            </select>
          </div>
          <div><label className="text-gray-400 font-bold uppercase text-[9px]">Vehicle No</label><input className="w-full border p-1 rounded font-mono uppercase" placeholder="UP-14-XXXX" value={header.vehicleNo} onChange={e => setHeader({...header, vehicleNo: e.target.value})} /></div>
          <div><label className="text-gray-400 font-bold uppercase text-[9px]">Transporter GST</label><input className="w-full border p-1 rounded uppercase" value={header.transporterGst} onChange={e => setHeader({...header, transporterGst: e.target.value})} /></div>
          <div className="md:col-span-2"><label className="text-gray-400 font-bold uppercase text-[9px]">Transporter Name</label><input className="w-full border p-1 rounded uppercase" value={header.transporterName} onChange={e => setHeader({...header, transporterName: e.target.value})} /></div>
          <div><label className="text-gray-400 font-bold uppercase text-[9px]">Remarks</label><input className="w-full border p-1 rounded" value={header.remarks} onChange={e => setHeader({...header, remarks: e.target.value})} /></div>
        </div>

        {/* RED AUTOMATION BUTTONS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button className="bg-red-600 text-white py-2 rounded font-black uppercase text-[9px] shadow-md hover:bg-red-700">Pending PI Statement</button>
          <button onClick={handleImportData} className="bg-red-600 text-white py-2 rounded font-black uppercase text-[9px] shadow-md hover:bg-red-700 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={12}/> : <Import size={14}/>} Import Data
          </button>
          <button onClick={handleCalculate} className="bg-red-600 text-white py-2 rounded font-black uppercase text-[9px] shadow-md hover:bg-red-700 flex items-center justify-center gap-2"><Calculator size={14}/> Calculate Amt</button>
          <button className="bg-red-600 text-white py-2 rounded font-black uppercase text-[9px] shadow-md hover:bg-red-700">Import Party Rate</button>
        </div>

        {/* DATA GRID */}
        <div className="overflow-x-auto border rounded shadow-inner">
          <table className="w-full border-collapse text-[9px] min-w-[1400px]">
            <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black sticky top-0">
              <tr>
                <th className="p-2 border border-slate-300">Lot No</th><th className="p-2 border border-slate-300">Marka</th>
                <th className="p-2 border border-slate-300 w-48">Item Name</th><th className="p-2 border border-slate-300">Packing</th>
                <th className="p-2 border border-slate-300">Gp No</th><th className="p-2 border border-slate-300">Mr Date</th>
                <th className="p-2 border border-slate-300">Gp Date</th><th className="p-2 border border-slate-300 bg-white text-indigo-700">Prd</th>
                <th className="p-2 border border-slate-300">Gp Qty</th><th className="p-2 border border-slate-300">Rent Rate</th>
                <th className="p-2 border border-slate-300">Rent Amt</th><th className="p-2 border border-slate-300">Lab Rate</th>
                <th className="p-2 border border-slate-300">Labour Amt</th><th className="p-2 border border-slate-300 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {grid.map((row, idx) => (
                <tr key={idx} className="bg-white border-b hover:bg-slate-50 transition-all">
                  <td className="p-1 border border-slate-200 text-center font-bold">{row.lotNo}</td>
                  <td className="p-1 border border-slate-200 uppercase">{row.marka}</td>
                  <td className="p-1 border border-slate-200 uppercase font-medium">{row.itemName}</td>
                  <td className="p-1 border border-slate-200">{row.packing}</td>
                  <td className="p-1 border border-slate-200 text-center font-bold text-blue-600">{row.gpNo}</td>
                  <td className="p-1 border border-slate-200 text-center">{new Date(row.mrDate).toLocaleDateString('en-GB')}</td>
                  <td className="p-1 border border-slate-200 text-center">{new Date(row.gpDate).toLocaleDateString('en-GB')}</td>
                  <td className="p-1 border border-slate-200 text-center bg-indigo-50 font-black text-indigo-700">{row.prd}</td>
                  <td className="p-1 border border-slate-200 text-center font-bold">{row.qty}</td>
                  <td className="p-1 border border-slate-200">
                    <input type="number" step="0.01" className="w-full text-center bg-transparent outline-none font-bold" value={row.rentRate} 
                      onChange={e => setGrid(prev => prev.map((r, i) => i === idx ? {...r, rentRate: parseFloat(e.target.value) || 0} : r))} 
                    />
                  </td>
                  <td className="p-1 border border-slate-200 text-center bg-slate-50 font-bold">{row.rentAmt.toFixed(2)}</td>
                  <td className="p-1 border border-slate-200">
                    <input type="number" step="0.01" className="w-full text-center bg-transparent outline-none font-bold" value={row.labRate} 
                      onChange={e => setGrid(prev => prev.map((r, i) => i === idx ? {...r, labRate: parseFloat(e.target.value) || 0} : r))} 
                    />
                  </td>
                  <td className="p-1 border border-slate-200 text-center bg-slate-50 font-bold">{row.labourAmt.toFixed(2)}</td>
                  <td className="p-1 border border-slate-200 text-center"><button onClick={() => setGrid(prev => prev.filter((_,i) => i !== idx || prev.length === 1))} className="text-red-500 hover:scale-125 transition-transform"><X size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PI FOOTER TOTALS */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-4">
           <div className="border border-slate-300 p-2 bg-slate-50 rounded text-center shadow-inner"><p className="font-bold text-slate-500 uppercase text-[8px]">CGST AMT</p><p className="text-xs font-black">₹ {totals.cgstAmt.toFixed(2)}</p></div>
           <div className="border border-slate-300 p-2 bg-slate-50 rounded text-center shadow-inner"><p className="font-bold text-slate-500 uppercase text-[8px]">SGST AMT</p><p className="text-xs font-black">₹ {totals.sgstAmt.toFixed(2)}</p></div>
           <div className="border border-slate-300 p-2 bg-slate-50 rounded text-center shadow-inner"><p className="font-bold text-slate-500 uppercase text-[8px]">IGST AMT</p><p className="text-xs font-black">₹ 0.00</p></div>
           <div className="border border-slate-300 p-2 bg-slate-50 rounded text-center shadow-inner"><p className="font-bold text-slate-500 uppercase text-[8px]">LABOUR AMT</p><p className="text-xs font-black text-blue-600">₹ {totals.labourTotal.toFixed(2)}</p></div>
           <div className="border border-slate-300 p-2 bg-slate-50 rounded text-center shadow-inner"><p className="font-bold text-slate-500 uppercase text-[8px]">RENT AMT</p><p className="text-xs font-black text-green-600">₹ {totals.rentTotal.toFixed(2)}</p></div>
           <div className="bg-red-600 border border-red-700 p-2 rounded text-center shadow-lg text-white transition-transform hover:scale-105">
             <p className="font-black uppercase text-[10px] tracking-widest">NET PI AMT</p>
             <p className="text-lg font-black italic">₹ {totals.netAmt.toLocaleString()}</p>
           </div>
        </div>
      </div>
    </div>
  );
}


// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import { Save, Printer, Import, Calculator, RotateCcw, Database, X, Loader2 } from "lucide-react";
// import { toast } from "react-hot-toast";

// const initialRow = { 
//   lotId: "", lotNo: "", marka: "", itemName: "", packing: "", gpNo: "", 
//   mrDate: "", gpDate: "", prd: 0, qty: 0, rentRate: 0, rentAmt: 0, labRate: 0, labourAmt: 0 
// };

// export default function PIEntryPage() {
//   const [parties, setParties] = useState<any[]>([]);
//   const [header, setHeader] = useState({
//     seriesType: "Bill Of Supply", piNo: "658", piDate: new Date().toISOString().split('T')[0],
//     partyId: "", vehicleNo: "", transporterGst: "", transporterName: "", remarks: "", graceDays: 0
//   });
//   const [grid, setGrid] = useState<any[]>([initialRow]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetch("/api/masters/party").then(res => res.json()).then(setParties);
//   }, []);

//   // 1. AUTOMATION: Import Data (Lots fetch karna)
//   const handleImportData = async () => {
//     if (!header.partyId) return toast.error("Select Party First!");
//     setLoading(true);
//     try {
//       const res = await fetch(`/api/billing/pending-lots/${header.partyId}`);
//       const lots = await res.json();
//       const mappedRows = lots.map((l: any) => ({
//         lotId: l.id, lotNo: l.lotNo, marka: l.marka, itemName: l.item.name,
//         packing: l.unit.name, gpNo: l.outwardEntries?.[0]?.gpNo || "NA",
//         mrDate: l.arrivalDate, gpDate: l.outwardEntries?.[0]?.gpDate || new Date().toISOString(),
//         prd: 0, qty: l.receivedQty, rentRate: 0, rentAmt: 0, labRate: 0, labourAmt: 0
//       }));
//       setGrid(mappedRows);
//       toast.success("Lots Imported!");
//     } finally { setLoading(false); }
//   };

//   // 2. AUTOMATION: Calculate Amt (The Period Logic)
//   const handleCalculate = () => {
//     const newGrid = grid.map(row => {
//       const arrival = new Date(row.mrDate);
//       const billing = new Date(header.piDate);
//       const diffTime = Math.ceil((billing.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
      
//       const period = Math.max(0, diffTime - header.graceDays);
//       const rentAmt = row.qty * row.rentRate * period;
//       const labourAmt = row.qty * row.labRate;

//       return { ...row, prd: period, rentAmt, labourAmt };
//     });
//     setGrid(newGrid);
//     toast.success("Calculations Updated!");
//   };

//   // 3. FINAL TOTALS (Footer Logic)
//   const totals = useMemo(() => {
//     const rentTotal = grid.reduce((s, r) => s + (r.rentAmt || 0), 0);
//     const labourTotal = grid.reduce((s, r) => s + (r.labourAmt || 0), 0);
//     const taxable = rentTotal + labourTotal;
//     const cgst = taxable * 0.09; // 9% Static
//     const sgst = taxable * 0.09;
//     return {
//       rentTotal, labourTotal, taxableValue: taxable,
//       cgstAmt: cgst, sgstAmt: sgst, netAmt: Math.round(taxable + cgst + sgst),
//       totalGpQty: grid.reduce((s, r) => s + (r.qty || 0), 0)
//     };
//   }, [grid]);

//   // 4. SAVE PI
//   const handleSave = async () => {
//     if (grid.length === 0 || !header.partyId) return toast.error("Data missing!");
//     const loadId = toast.loading("Saving PI Estimate...");
//     const res = await fetch("/api/billing/pi", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ header, items: grid, totals })
//     });
//     if (res.ok) {
//       toast.success("PI Saved! This won't affect accounting ledgers.", { id: loadId });
//       window.location.reload();
//     } else {
//       toast.error("Save failed", { id: loadId });
//     }
//   };

//   return (
//     <div className="space-y-3 text-[11px] animate-in fade-in">
//       {/* ACTION BAR */}
//       <div className="flex justify-between bg-white p-2 border rounded shadow-sm">
//         <div className="flex gap-2">
//           <button className="bg-red-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow">Show All</button>
//           <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-4 py-1.5 rounded font-bold uppercase flex items-center gap-1 shadow"><RotateCcw size={12}/> Add New PI</button>
//         </div>
//         <div className="flex gap-2">
//           <button onClick={handleSave} className="bg-[#f39c12] text-white px-10 py-1.5 rounded font-bold flex items-center gap-2 shadow hover:bg-orange-600 transition-all"><Save size={14}/> SAVE PI</button>
//           <button className="bg-[#3498db] text-white px-8 py-1.5 rounded font-bold flex items-center gap-2 shadow"><Printer size={14}/> PRINT</button>
//         </div>
//       </div>

//       <div className="bg-[#5d5fb1] text-white p-2 rounded-t font-black text-center uppercase tracking-widest italic">
//         Nill Lot PI | Entry Form (Draft Bill)
//       </div>

//       {/* HEADER GRID */}
//       <div className="bg-white p-6 border rounded shadow-sm space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3 items-end">
//           <div><label className="text-gray-400 font-bold uppercase text-[9px]">Series Type</label><input className="w-full border p-1 rounded bg-slate-50" value="Bill Of Supply" readOnly /></div>
//           <div><label className="text-gray-400 font-bold uppercase text-[9px]">PI No</label><input className="w-full border p-1 rounded bg-slate-50 font-bold text-center" value={header.piNo} readOnly /></div>
//           <div><label className="text-gray-400 font-bold uppercase text-[9px]">PI Date</label><input type="date" className="w-full border p-1 rounded" value={header.piDate} onChange={e => setHeader({...header, piDate: e.target.value})} /></div>
//           <div className="md:col-span-2"><label className="text-blue-700 font-black uppercase text-[9px]">Party Name</label>
//             <select className="w-full border-2 border-blue-100 p-1 rounded font-bold" onChange={e => {
//                 const p = parties.find(x => x.id === e.target.value);
//                 setHeader({...header, partyId: e.target.value, graceDays: p?.graceDays || 0});
//             }}>
//               <option value="">-----Select Party Name-----</option>
//               {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
//             </select>
//           </div>
//           <div><label className="text-gray-400 font-bold uppercase text-[9px]">Vehicle No</label><input className="w-full border p-1 rounded font-mono uppercase" placeholder="UP-14-XXXX" value={header.vehicleNo} onChange={e => setHeader({...header, vehicleNo: e.target.value})} /></div>
//           <div><label className="text-gray-400 font-bold uppercase text-[9px]">Transporter GST</label><input className="w-full border p-1 rounded" value={header.transporterGst} onChange={e => setHeader({...header, transporterGst: e.target.value})} /></div>
//           <div className="md:col-span-2"><label className="text-gray-400 font-bold uppercase text-[9px]">Transporter Name</label><input className="w-full border p-1 rounded" value={header.transporterName} onChange={e => setHeader({...header, transporterName: e.target.value})} /></div>
//           <div><label className="text-gray-400 font-bold uppercase text-[9px]">Remarks</label><input className="w-full border p-1 rounded" value={header.remarks} onChange={e => setHeader({...header, remarks: e.target.value})} /></div>
//         </div>

//         {/* RED AUTOMATION BUTTONS (Exact Replication) */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
//           <button className="bg-red-600 text-white py-2 rounded font-black uppercase text-[9px] shadow-md hover:bg-red-700">Pending PI Statement</button>
//           <button onClick={handleImportData} className="bg-red-600 text-white py-2 rounded font-black uppercase text-[9px] shadow-md hover:bg-red-700 flex items-center justify-center gap-2">
//             {loading ? <Loader2 className="animate-spin" size={12}/> : <Import size={14}/>} Import Data
//           </button>
//           <button onClick={handleCalculate} className="bg-red-600 text-white py-2 rounded font-black uppercase text-[9px] shadow-md hover:bg-red-700 flex items-center justify-center gap-2"><Calculator size={14}/> Calculate Amt</button>
//           <button className="bg-red-600 text-white py-2 rounded font-black uppercase text-[9px] shadow-md hover:bg-red-700">Import Party Item Rate</button>
//         </div>

//         {/* DATA GRID */}
//         <div className="overflow-x-auto border rounded shadow-inner">
//           <table className="w-full border-collapse text-[9px] min-w-[1400px]">
//             <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black">
//               <tr>
//                 <th className="p-2 border border-slate-300">Lot No</th><th className="p-2 border border-slate-300">Marka</th>
//                 <th className="p-2 border border-slate-300 w-48">Item Name</th><th className="p-2 border border-slate-300">Packing</th>
//                 <th className="p-2 border border-slate-300">Gp No</th><th className="p-2 border border-slate-300">Mr Date</th>
//                 <th className="p-2 border border-slate-300">Gp Date</th><th className="p-2 border border-slate-300 bg-white text-indigo-700">Prd</th>
//                 <th className="p-2 border border-slate-300">Gp Qty</th><th className="p-2 border border-slate-300">Rent Rate</th>
//                 <th className="p-2 border border-slate-300">Rent Amt</th><th className="p-2 border border-slate-300">Lab Rate</th>
//                 <th className="p-2 border border-slate-300">Labour Amt</th><th className="p-2 border border-slate-300 text-center">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {grid.map((row, idx) => (
//                 <tr key={idx} className="bg-white border-b hover:bg-slate-50 transition-all">
//                   <td className="p-1 border border-slate-200 text-center font-bold">{row.lotNo}</td>
//                   <td className="p-1 border border-slate-200 uppercase">{row.marka}</td>
//                   <td className="p-1 border border-slate-200 uppercase font-medium">{row.itemName}</td>
//                   <td className="p-1 border border-slate-200">{row.packing}</td>
//                   <td className="p-1 border border-slate-200 text-center font-bold text-blue-600">{row.gpNo}</td>
//                   <td className="p-1 border border-slate-200 text-center">{new Date(row.mrDate).toLocaleDateString('en-GB')}</td>
//                   <td className="p-1 border border-slate-200 text-center">{new Date(row.gpDate).toLocaleDateString('en-GB')}</td>
//                   <td className="p-1 border border-slate-200 text-center bg-indigo-50 font-black text-indigo-700">{row.prd}</td>
//                   <td className="p-1 border border-slate-200 text-center font-bold">{row.qty}</td>
//                   <td className="p-1 border border-slate-200"><input type="number" step="0.01" className="w-full text-center bg-transparent outline-none font-bold" value={row.rentRate} onChange={e => {const n = [...grid]; n[idx].rentRate = parseFloat(e.target.value); setGrid(n);}} /></td>
//                   <td className="p-1 border border-slate-200 text-center bg-slate-50 font-bold">{row.rentAmt.toFixed(2)}</td>
//                   <td className="p-1 border border-slate-200"><input type="number" step="0.01" className="w-full text-center bg-transparent outline-none font-bold" value={row.labRate} onChange={e => {const n = [...grid]; n[idx].labRate = parseFloat(e.target.value); setGrid(n);}} /></td>
//                   <td className="p-1 border border-slate-200 text-center bg-slate-50 font-bold">{row.labourAmt.toFixed(2)}</td>
//                   <td className="p-1 border border-slate-200 text-center"><button onClick={() => setGrid(grid.filter((_,i) => i !== idx))} className="text-red-500"><X size={14}/></button></td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* PI FOOTER TOTALS (Image Matching) */}
//         <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-4">
//            <div className="border border-slate-300 p-2 bg-slate-50 rounded text-center"><p className="font-bold text-slate-500 uppercase text-[8px]">CGST AMT</p><p className="text-xs font-black">{totals.cgstAmt.toFixed(2)}</p></div>
//            <div className="border border-slate-300 p-2 bg-slate-50 rounded text-center"><p className="font-bold text-slate-500 uppercase text-[8px]">SGST AMT</p><p className="text-xs font-black">{totals.sgstAmt.toFixed(2)}</p></div>
//            <div className="border border-slate-300 p-2 bg-slate-50 rounded text-center"><p className="font-bold text-slate-500 uppercase text-[8px]">IGST AMT</p><p className="text-xs font-black">.00</p></div>
//            <div className="border border-slate-300 p-2 bg-slate-50 rounded text-center"><p className="font-bold text-slate-500 uppercase text-[8px]">LABOUR AMT</p><p className="text-xs font-black">{totals.labourTotal.toFixed(2)}</p></div>
//            <div className="border border-slate-300 p-2 bg-slate-50 rounded text-center"><p className="font-bold text-slate-500 uppercase text-[8px]">RENT AMT</p><p className="text-xs font-black">{totals.rentTotal.toFixed(2)}</p></div>
//            <div className="bg-red-600 border border-red-700 p-2 rounded text-center shadow-lg text-white">
//              <p className="font-black uppercase text-[10px] tracking-widest">NET PI AMT</p>
//              <p className="text-lg font-black italic">₹ {totals.netAmt.toLocaleString()}</p>
//            </div>
//         </div>
//       </div>
//     </div>
//   );
// }