"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Save, Printer, Import, Calculator, RotateCcw, Database, X, Loader2, Truck, Tag, Landmark, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

const initialRow = { 
  lotId: "", lotNo: "", marka: "", itemName: "", packing: "", gpNo: "", 
  mrDate: "", gpDate: "", prd: 0, qty: 0, rentRate: 0, rentAmt: 0, labRate: 0, labourAmt: 0 
};

export default function PIEntryPage() {
  const router = useRouter();
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [billingConfig, setBillingConfig] = useState<any>({
    billNilLot: false, billMonthly: false, billTransport: false, billSpace: false,
    billBalance: false, billItemDay: false, billFixed: false, billLabour: true,
    billCA: false, billWeekly: false
  });

  // 1. HEADER STATE (All Fields from Image Mapping)
  const [header, setHeader] = useState({
    seriesType: "Bill Of Supply", 
    piNo: "", // Empty for backend auto-gen
    piDate: new Date().toISOString().split('T')[0],
    partyId: "", 
    vehicleNo: "", 
    transporterGst: "", 
    transporterName: "", 
    remarks: "", 
    graceDays: 0
  });

  const [grid, setGrid] = useState<any[]>([initialRow]);

  // Load Initial Masters
  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
    // UI Preview next PI No
    fetch("/api/billing/pi/next-no").then(res => res.json()).then(d => setHeader(h => ({...h, piNo: d.nextNo})));
  }, []);

  // 2. AUTOMATION: Import Pending Lots
  const handleImportData = async () => {
    if (!header.partyId) return toast.error("Bhai, pehle Merchant select karo!");
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/nill-lot-import?partyId=${header.partyId}`);
      const lots = await res.json();
      
      if (!res.ok || lots.items.length === 0) {
        toast.error("Is party ka koi unbilled lot nahi mila!");
        setGrid([initialRow]);
      } else {
        setBillingConfig(lots.partyFlags);
        // Since nill-lot-import already formats the data perfectly with rates
        const mappedRows = lots.items.map((l: any) => ({
          lotId: l.lotId, 
          lotNo: l.lotNo, 
          marka: l.marka || "-", 
          itemName: l.itemName,
          itemId: l.itemId, // CRITICAL: Need this for rate matching
          packing: l.packing, 
          gpNo: l.gpNo,
          mrDate: l.mrDate, 
          gpDate: l.gpDate,
          prd: 0, 
          qty: l.qty, 
          rentRate: l.rentRate || 0, 
          rentAmt: 0, 
          labRate: l.labRate || 0, 
          labourAmt: 0,
          uptoDate: l.uptoDate
        }));
        setGrid(mappedRows);
        toast.success(`${lots.items.length} Lots imported. Mode: ${lots.partyFlags.billNilLot ? 'Nill Lot' : 'Running'}`);
      }
    } catch (err) {
      toast.error("Data load failed!");
    } finally {
      setLoading(false);
    }
  };

  // 3. AUTOMATION: Calculate Period & Amounts
  const handleCalculate = () => {
    if (grid.length === 0 || !grid[0].lotId) return toast.error("Pehle Data Import karein!");
    
    setGrid(prev => prev.map(row => {
      // Logic from regular Bill Entry: Use uptoDate if exists, else mrDate
      const arrival = new Date(row.uptoDate ? row.uptoDate : row.mrDate);
      const billing = new Date(header.piDate);
      const diffTime = Math.ceil((billing.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
      
      // Period calculation
      const period = Math.max(0, diffTime - header.graceDays);
      let finalPrd = period;

      if (billingConfig.billFixed) finalPrd = 1;
      else if (billingConfig.billWeekly) finalPrd = Math.ceil(finalPrd / 7);
      else if (billingConfig.billMonthly) finalPrd = Math.ceil(finalPrd / 30);

      const rentAmt = Number(row.qty) * Number(row.rentRate) * finalPrd;
      
      // If uptoDate exists, Labour is 0 (as it is already billed)
      const isAlreadyBilled = !!row.uptoDate;
      const labourAmt = (!billingConfig.billLabour) ? 0 : (isAlreadyBilled ? 0 : Number(row.qty) * Number(row.labRate));

      return { ...row, prd: finalPrd, rentAmt, labourAmt };
    }));
    toast.success("Estimates updated based on PI Date.");
  };

  // 4. LIVE TOTALS ENGINE (Includes 18% GST Logic)
  const totals = useMemo(() => {
    const rentTotal = grid.reduce((s, r) => s + (Number(r.rentAmt) || 0), 0);
    const labourTotal = grid.reduce((s, r) => s + (Number(r.labourAmt) || 0), 0);
    const taxable = rentTotal + labourTotal;
    const cgst = taxable * 0.09; 
    const sgst = taxable * 0.09;
    
    return {
      rentTotal, 
      labourTotal, 
      taxableValue: taxable,
      cgstAmt: cgst, 
      sgstAmt: sgst, 
      netAmt: Math.round(taxable + cgst + sgst),
      totalGpQty: grid.reduce((s, r) => s + (Number(r.qty) || 0), 0)
    };
  }, [grid]);

  // 5. SAVE PI HANDLER
  // 6. AUTOMATION: Import Special Party Rates
  const handleImportPartyRates = async () => {
    if (!header.partyId) return toast.error("Select Merchant First!");
    const loadId = toast.loading("Checking special rates...");
    try {
      const res = await fetch(`/api/masters/party-rates?partyId=${header.partyId}`);
      const specialRates = await res.json();
      
      if (!res.ok || specialRates.length === 0) {
        toast.error("Is party ke liye koi special rates nahi mile!", { id: loadId });
        return;
      }

      setGrid(prev => prev.map(row => {
        const rate = specialRates.find((r: any) => r.itemId === row.itemId);
        if (rate) {
          return { 
            ...row, 
            rentRate: Number(rate.csRent || rate.caRent || 0), 
            labRate: Number(rate.csLab || rate.caLab || 0) 
          };
        }
        return row;
      }));
      toast.success(`${specialRates.length} Special rates applied!`, { id: loadId });
    } catch (err) {
      toast.error("Rates import failed!", { id: loadId });
    }
  };

  const handleSave = async () => {
    if (!header.partyId) return toast.error("Select Party!");
    if (grid.length === 0 || !grid[0].lotId) return toast.error("Grid khali hai!");
    
    setIsSaving(true);
    const loadId = toast.loading("Saving PI Estimate...");
    try {
      const res = await fetch("/api/billing/pi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, items: grid, totals })
      });
      
      const result = await res.json();

      if (res.ok) {
        toast.success(`Proforma Saved! Ref No: ${result.invoiceNo}`, { id: loadId, duration: 5000 });
        window.location.reload();
      } else {
        toast.error(result.error || "Save failed", { id: loadId });
      }
    } catch (err) {
      toast.error("Server Error!", { id: loadId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3 text-[11px] animate-in fade-in duration-500">
      {/* ACTION BAR */}
      <div className="flex justify-between bg-white p-3 rounded border shadow-sm no-print">
        <div className="flex gap-2">
          <button onClick={() => router.push('/billing/pi-book')} className="bg-red-600 text-white px-5 py-1.5 rounded font-black uppercase shadow hover:bg-red-700 transition-all">Show All PI</button>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-5 py-1.5 rounded font-black uppercase flex items-center gap-2 shadow hover:bg-orange-600 transition-all"><RotateCcw size={14}/> Reset Form</button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSave} 
            disabled={isSaving || !header.partyId}
            className="bg-[#f39c12] text-white px-12 py-1.5 rounded font-black flex items-center gap-2 shadow-xl hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} SAVE PI (ESTIMATE)
          </button>
          <button onClick={() => window.print()} className="bg-[#3498db] text-white px-8 py-1.5 rounded font-black flex items-center gap-2 shadow uppercase"><Printer size={16}/> PRINT PI</button>
        </div>
      </div>

      <div className="bg-[#5d5fb1] text-white p-2 rounded-t font-black text-center uppercase tracking-[5px] italic shadow-md border-b-4 border-indigo-300 relative">
        Nill Lot Proforma (PI) | Draft Billing Interface
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
            {billingConfig.billNilLot && <span className="bg-yellow-400 text-black px-2 py-0.5 rounded text-[8px] animate-pulse">Nill Lot</span>}
            {billingConfig.billLabour && <span className="bg-green-400 text-black px-2 py-0.5 rounded text-[8px]">Auto Labour</span>}
            {billingConfig.billFixed && <span className="bg-blue-400 text-white px-2 py-0.5 rounded text-[8px]">Fixed Rate</span>}
        </div>
      </div>

      {/* HEADER SECTION (10 Fields mapping) */}
      <div className="bg-white p-8 border rounded-b shadow-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end shadow-inner p-4 bg-slate-50 rounded-xl">
          <div className="space-y-1">
            <label className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Series Type</label>
            <input readOnly className="w-full border-2 border-slate-100 p-2 rounded bg-slate-100 font-bold" value="Bill Of Supply / Proforma" />
          </div>
          <div className="space-y-1">
              <label className="text-gray-400 font-black uppercase text-[9px] tracking-widest">PI Reference No</label>
              <input readOnly className="w-full border-2 border-slate-100 p-2 rounded bg-slate-200 font-black text-center text-indigo-700" value={header.piNo} placeholder="[ AUTO ]" />
          </div>
          <div className="space-y-1">
            <label className="text-gray-400 font-black uppercase text-[9px] tracking-widest">PI Date</label>
            <input type="date" className="w-full border-2 border-slate-100 p-2 rounded font-bold outline-none focus:border-indigo-400" value={header.piDate} onChange={e => setHeader({...header, piDate: e.target.value})} />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-blue-700 font-black uppercase text-[9px] tracking-widest flex items-center gap-1"><Landmark size={10}/> Select Merchant / Party *</label>
            <select className="w-full border-2 border-blue-100 p-2 rounded font-black text-blue-900 outline-none focus:border-blue-500 shadow-sm" value={header.partyId} onChange={e => {
                const p = parties.find(x => x.id === e.target.value);
                setHeader({...header, partyId: e.target.value, graceDays: p?.graceDays || 0});
            }}>
              <option value="">----- Select Registered Merchant -----</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName} [{p.partyCode}]</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-gray-400 font-black uppercase text-[9px] tracking-widest"><Truck size={10} className="inline mr-1"/> Vehicle No</label>
            <input className="w-full border-2 border-slate-100 p-2 rounded font-mono uppercase font-bold outline-none focus:border-indigo-400" placeholder="UP-14-XXXX" value={header.vehicleNo} onChange={e => setHeader({...header, vehicleNo: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Transporter GST</label>
            <input className="w-full border-2 border-slate-100 p-2 rounded uppercase outline-none focus:border-indigo-400" placeholder="Optional" value={header.transporterGst} onChange={e => setHeader({...header, transporterGst: e.target.value})} />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Transporter Name</label>
            <input className="w-full border-2 border-slate-100 p-2 rounded uppercase font-bold outline-none focus:border-indigo-400" placeholder="Enter Full Agency Name" value={header.transporterName} onChange={e => setHeader({...header, transporterName: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Admin Remarks</label>
            <input className="w-full border-2 border-slate-100 p-2 rounded outline-none focus:border-indigo-400" placeholder="Internal notes..." value={header.remarks} onChange={e => setHeader({...header, remarks: e.target.value})} />
          </div>
        </div>

        {/* RED AUTOMATION BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
          <button onClick={() => router.push('/billing/pending-summary')} className="bg-red-600 hover:bg-red-700 text-white py-3 rounded font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
             <AlertCircle size={14}/> Pending PI Statement
          </button>
          <button onClick={handleImportData} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white py-3 rounded font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin" size={14}/> : <Import size={16}/>} Import Dispatch Data
          </button>
          <button onClick={handleCalculate} className="bg-red-600 hover:bg-red-700 text-white py-3 rounded font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
             <Calculator size={16}/> Calculate Est. Amt
          </button>
          <button onClick={handleImportPartyRates} className="bg-red-600 hover:bg-red-700 text-white py-3 rounded font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
             <Tag size={16}/> Import Party Rates
          </button>
        </div>

        {/* DATA GRID (13 Columns Exact) */}
        <div className="overflow-x-auto border-2 border-slate-100 rounded-xl shadow-inner bg-white">
          <table className="w-full border-collapse text-[9px] min-w-[1500px]">
            <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 border-r border-indigo-200">Lot No</th><th className="p-3 border-r border-indigo-200">Marka</th>
                <th className="p-3 border-r border-indigo-200 w-52">Item Name</th><th className="p-3 border-r border-indigo-200">Packing</th>
                <th className="p-3 border-r border-indigo-200">Gp No</th><th className="p-3 border-r border-indigo-200">Mr Date</th>
                <th className="p-3 border-r border-indigo-200">Gp Date</th><th className="p-3 border-r border-white bg-indigo-600 text-white text-center">PRD (Days)</th>
                <th className="p-3 border-r border-indigo-200 text-center">Gp Qty</th><th className="p-3 border-r border-indigo-200 text-center">Rent Rate</th>
                <th className="p-3 border-r border-indigo-200 text-right bg-green-50 text-green-700">Rent Amt</th><th className="p-3 border-r border-indigo-200 text-center">Lab Rate</th>
                <th className="p-3 text-right bg-green-50 text-green-700">Labour Amt</th><th className="p-3 text-center no-print">Action</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {grid[0].lotId === "" ? (
                <tr><td colSpan={14} className="p-20 text-center text-gray-400 italic text-sm uppercase tracking-widest">Select a merchant and import dispatch data to generate estimate</td></tr>
              ) : grid.map((row, idx) => (
                <tr key={row.lotId || idx} className="bg-white border-b hover:bg-indigo-50/50 transition-all even:bg-slate-50/30">
                  <td className="p-2 border-r border-slate-100 text-center font-black text-indigo-700">{row.lotNo}</td>
                  <td className="p-2 border-r border-slate-100 uppercase text-gray-400">{row.marka}</td>
                  <td className="p-2 border-r border-slate-100 uppercase text-slate-700 truncate max-w-[150px]">{row.itemName}</td>
                  <td className="p-2 border-r border-slate-100 text-gray-500 font-medium">{row.packing}</td>
                  <td className="p-2 border-r border-slate-100 text-center font-mono text-blue-600 shadow-inner">{row.gpNo}</td>
                  <td className="p-2 border-r border-slate-100 text-center text-gray-400">{formatDate(row.mrDate)}</td>
                  <td className="p-2 border-r border-slate-100 text-center text-gray-400">{formatDate(row.gpDate)}</td>
                  <td className="p-2 border-r border-slate-100 text-center bg-indigo-50/80">
                    <input type="number" className="w-16 bg-transparent text-center font-black text-indigo-900 outline-none" value={row.prd} 
                      onChange={e => setGrid(prev => prev.map((r, i) => i === idx ? {...r, prd: parseInt(e.target.value) || 0} : r))} 
                    />
                  </td>
                  <td className="p-2 border-r border-slate-100 text-center font-black text-slate-800">{row.qty}</td>
                  <td className="p-2 border-r border-slate-100">
                    <input type="number" step="0.01" className="w-full text-center bg-transparent outline-none font-black text-green-700" value={row.rentRate} 
                      onChange={e => setGrid(prev => prev.map((r, i) => i === idx ? {...r, rentRate: parseFloat(e.target.value) || 0} : r))} 
                    />
                  </td>
                  <td className="p-2 border-r border-slate-100 text-right bg-slate-50/50">₹{row.rentAmt.toFixed(2)}</td>
                  <td className="p-2 border-r border-slate-100">
                    <input type="number" step="0.01" className="w-full text-center bg-transparent outline-none font-black text-green-700" value={row.labRate} 
                      onChange={e => setGrid(prev => prev.map((r, i) => i === idx ? {...r, labRate: parseFloat(e.target.value) || 0} : r))} 
                    />
                  </td>
                  <td className="p-2 text-right bg-slate-50/50">₹{row.labourAmt.toFixed(2)}</td>
                  <td className="p-2 text-center no-print">
                    <button onClick={() => setGrid(prev => prev.filter((_,i) => i !== idx || prev.length === 1))} className="text-red-500 hover:scale-125 transition-all"><X size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PI FOOTER TOTALS (All 6 Boxes) */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-6">
           <div className="border-2 border-slate-100 p-3 bg-slate-50 rounded-xl text-center shadow-inner">
              <p className="font-black text-slate-400 uppercase text-[8px] tracking-widest mb-1">CGST (9%)</p>
              <p className="text-xs font-black text-indigo-900">₹ {totals.cgstAmt.toFixed(2)}</p>
           </div>
           <div className="border-2 border-slate-100 p-3 bg-slate-50 rounded-xl text-center shadow-inner">
              <p className="font-black text-slate-400 uppercase text-[8px] tracking-widest mb-1">SGST (9%)</p>
              <p className="text-xs font-black text-indigo-900">₹ {totals.sgstAmt.toFixed(2)}</p>
           </div>
           <div className="border-2 border-slate-100 p-3 bg-slate-50 rounded-xl text-center shadow-inner opacity-40">
              <p className="font-black text-slate-400 uppercase text-[8px] tracking-widest mb-1">IGST (0%)</p>
              <p className="text-xs font-black text-indigo-900">₹ 0.00</p>
           </div>
           <div className="border-2 border-slate-100 p-3 bg-slate-50 rounded-xl text-center shadow-inner">
              <p className="font-black text-slate-400 uppercase text-[8px] tracking-widest mb-1">TOTAL LABOUR</p>
              <p className="text-xs font-black text-blue-600">₹ {totals.labourTotal.toFixed(2)}</p>
           </div>
           <div className="border-2 border-slate-100 p-3 bg-slate-50 rounded-xl text-center shadow-inner">
              <p className="font-black text-slate-400 uppercase text-[8px] tracking-widest mb-1">TOTAL RENT</p>
              <p className="text-xs font-black text-green-600">₹ {totals.rentTotal.toFixed(2)}</p>
           </div>
           <div className="bg-red-600 border-b-4 border-red-800 p-3 rounded-xl text-center shadow-2xl text-white transition-transform hover:scale-105">
             <p className="font-black uppercase text-[10px] tracking-widest mb-1">NET ESTIMATE AMT</p>
             <p className="text-xl font-black italic tracking-tighter text-yellow-300">₹ {totals.netAmt.toLocaleString('en-IN')}</p>
           </div>
        </div>
      </div>

      <div className="text-center opacity-30 italic font-black text-[8px] uppercase tracking-[10px] mt-6">
        Cold Storage Intelligence - Proforma Systems
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
