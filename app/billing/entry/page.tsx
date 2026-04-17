"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Save, Printer, Import, FileText, X, RotateCcw, Loader2, Calendar } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation"; // 1. Router import kiya

export default function BillEntryPage() {
  const router = useRouter(); // 2. Router initialize
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 1. HEADER STATE
  const [header, setHeader] = useState({
    invoiceNo: "", // Initialize empty for auto-gen
    billDate: new Date().toISOString().split('T')[0],
    partyId: "", gstType: "NA", stateName: "NA", partyGst: "NA", graceDays: 0,
    gstOn: "GST On Both (Labour + Rent)"
  });

  // 2. GRID STATE
  const [items, setItems] = useState<any[]>([]);

  // 3. EDITABLE DISCOUNT & TAX RATES
  const [discount, setDiscount] = useState<number | string>("0");
  const [taxRates, setTaxRates] = useState({ cgst: 9, sgst: 9, igst: 0 });

  // Load Initial Data
  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
    // UI Preview number
    fetch("/api/billing/invoice/next-no").then(res => res.json()).then(d => setHeader(h => ({...h, invoiceNo: d.nextNo})));
  }, []);

  const handlePartyChange = (id: string) => {
    const p = parties.find(x => x.id === id);
    if (p) {
      setHeader({
        ...header, 
        partyId: id, 
        partyGst: p.gstNo || "NA", 
        stateName: p.stateName || "NA", 
        graceDays: p.graceDays || 0
      });

      if (p.stateCode === "06") {
        setTaxRates({ cgst: 9, sgst: 9, igst: 0 });
      } else if (p.stateCode && p.stateCode !== "06") {
        setTaxRates({ cgst: 0, sgst: 0, igst: 18 });
      }
    }
  };

  // ==========================================
  // 🔴 LIVE MATH ENGINE (Keeping your logic)
  // ==========================================
  const calculatedData = useMemo(() => {
    let totalRent = 0;
    let totalLab = 0;
    let totalQty = 0;

    const processedItems = items.map(it => {
      const prd = Number(it.prd) || 0;
      const rentRate = Number(it.rentRate) || 0;
      const labRate = Number(it.labRate) || 0;
      const qty = Number(it.qty) || 0;

      const rentAmt = qty * rentRate * prd;
      const labAmt = qty * labRate;
      
      totalRent += rentAmt;
      totalLab += labAmt;
      totalQty += qty;

      return { ...it, rentAmt, labourAmt: labAmt };
    });

    const parsedDiscount = Number(discount) || 0;
    const grossAmount = totalRent + totalLab;
    const taxableValue = grossAmount - parsedDiscount;

    const cgst = taxableValue * ((Number(taxRates.cgst) || 0) / 100);
    const sgst = taxableValue * ((Number(taxRates.sgst) || 0) / 100);
    const igst = taxableValue * ((Number(taxRates.igst) || 0) / 100);
    
    const net = Math.round(taxableValue + cgst + sgst + igst);
    const roundAmount = net - (taxableValue + cgst + sgst + igst);

    return {
      items: processedItems,
      totals: {
        totalQty: totalQty, 
        discount: parsedDiscount,
        grossAmount, 
        taxableValue,
        roundAmount,
        cgstAmt: cgst, 
        sgstAmt: sgst, 
        igstAmt: igst, 
        labourTotal: totalLab, 
        rentTotal: totalRent, 
        netAmt: net
      }
    };
  }, [items, discount, taxRates]);

  // ==========================================
  // 🔴 ACTION BUTTONS LOGIC 🔴
  // ==========================================

  const viewPending = () => {
    if(!header.partyId) return toast.error("Party select karo!");
    window.open(`/billing/pending-detail?partyId=${header.partyId}`, '_blank');
  };

  const handleImportData = async () => {
    if (!header.partyId) return toast.error("Bhai, pehle Party toh select karo!");
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/nill-lot-import?partyId=${header.partyId}`);
      const data = await res.json();
      if (data.length === 0) {
        toast.error("Is party ka koi pending maal nahi hai!");
      } else {
        setItems(data); 
        toast.success(`${data.length} Lots mil gayi hain.`);
      }
    } catch (err) {
      toast.error("Data load karne mein error!");
    } finally {
      setLoading(false);
    }
  };

  const calculatePeriod = () => {
    if (items.length === 0) return toast.error("Pehle 'Import Data' karo!");
    const updatedItems = items.map(it => {
      const start = it.uptoDate ? new Date(it.uptoDate) : new Date(it.mrDate);
      const end = new Date(header.billDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const finalPrd = it.uptoDate ? Math.max(0, diffDays) : Math.max(0, diffDays - header.graceDays);
      return { ...it, prd: finalPrd };
    });
    setItems(updatedItems);
    toast.success("Days calculate ho gaye!");
  };

  const importSpecialRates = async () => {
    if (!header.partyId) return toast.error("Select Party!");
    const res = await fetch(`/api/masters/party-rates?partyId=${header.partyId}`);
    const rates = await res.json();
    const updatedItems = items.map(it => {
      const special = rates.find((r: any) => r.itemId === it.itemId);
      return special ? { ...it, rentRate: Number(special.csRent), labRate: Number(special.csLab) } : it;
    });
    setItems(updatedItems);
    toast.success("Special Rates apply ho gaye!");
  };

  // ==========================================
  // 💾 SAVE BUTTON LOGIC 💾
  // ==========================================
  const handleSaveInvoice = async () => {
    if (calculatedData.items.length === 0) return toast.error("Maal toh dalo!");
    const loadId = toast.loading("Bill save ho raha hai...");
    try {
      const res = await fetch("/api/billing/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          header, 
          items: calculatedData.items, 
          totals: { ...calculatedData.totals, ...taxRates }
        })
      });
      
      const result = await res.json();

      if (res.ok) {
        toast.success(`Tax Invoice Saved! No: ${result.invoiceNo}`, { id: loadId });
        window.location.reload();
      } else { 
        toast.error(result.error || "Save fail hua!", { id: loadId }); 
      }
    } catch (err) { 
      toast.error("Network Error!", { id: loadId }); 
    }
  };

  return (
    <div className="space-y-3 text-[11px] animate-in fade-in">
      {/* ACTION TOP BAR */}
      <div className="flex justify-between bg-white p-2 border rounded shadow-sm">
        <div className="flex gap-2">
          {/* Link to Bill Book */}
          <button onClick={() => router.push('/billing/bill-book')} className="bg-red-600 text-white px-4 py-1 rounded font-bold uppercase">SHOW ALL</button>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-4 py-1 rounded font-bold uppercase">ADD NEW BILL</button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSaveInvoice} className="bg-[#f39c12] text-white px-8 py-1 rounded font-bold flex items-center gap-2 shadow-md hover:bg-orange-600 transition-all uppercase"><Save size={14}/> SAVE</button>
          <button className="bg-[#3498db] text-white px-8 py-1 rounded font-bold flex items-center gap-2 shadow-md uppercase"><Printer size={14}/> PRINT</button>
        </div>
      </div>

      <div className="bg-[#5d5fb1] text-white p-2 text-center font-black uppercase tracking-widest border border-indigo-400 italic">
        Nill Lot Billing | Entry Form
      </div>

      {/* HEADER SECTION */}
      <div className="bg-white p-5 border rounded shadow-sm grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 items-end">
        <div><label className="text-gray-400 font-bold uppercase">Series Type</label><input className="w-full border p-1 rounded bg-slate-50" value="Bill Of Supply" readOnly /></div>
        <div>
            <label className="text-gray-400 font-bold uppercase">Invoice No</label>
            <input 
              readOnly 
              className="w-full border p-1 rounded bg-slate-100 font-bold text-center text-indigo-700" 
              value={header.invoiceNo} 
              placeholder="[ AUTO ]"
            />
        </div>
        <div><label className="text-gray-400 font-bold uppercase">Bill Date</label><input type="date" className="w-full border p-1 rounded" value={header.billDate} onChange={e => setHeader({...header, billDate: e.target.value})} /></div>
        <div className="lg:col-span-1"><label className="text-indigo-700 font-black uppercase">Party Name</label>
          <select className="w-full border p-1 rounded font-bold text-blue-800 outline-none" value={header.partyId} onChange={e => handlePartyChange(e.target.value)}>
            <option value="">--Select Party--</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
          </select>
        </div>
        <div><label className="text-gray-400 font-bold uppercase">GST Type</label><input className="w-full border p-1 rounded bg-slate-50 uppercase" value={header.gstType} readOnly /></div>
        <div><label className="text-gray-400 font-bold uppercase">State Name</label><input className="w-full border p-1 rounded bg-slate-50 uppercase" value={header.stateName} readOnly /></div>
        <div><label className="text-gray-400 font-bold uppercase">Party GST</label><input className="w-full border p-1 rounded bg-slate-50 uppercase font-mono" value={header.partyGst} readOnly /></div>
      </div>

      {/* 🔴 RED ACTION BAR 🔴 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
         <div className="col-span-1">
           <select className="w-full border p-2 rounded bg-white font-bold text-slate-600" value={header.gstOn} onChange={e => setHeader({...header, gstOn: e.target.value})}>
             <option>GST On Both (Labour + Rent)</option>
             <option>Only Rent</option>
           </select>
         </div>
         <button onClick={viewPending} className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-black text-[9px] uppercase shadow">Pending Bill Statement</button>
         <button onClick={handleImportData} className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-black text-[9px] uppercase shadow flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={14}/> : <Import size={14}/>} Import Data
         </button>
         <button onClick={calculatePeriod} className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-black text-[9px] uppercase shadow flex items-center justify-center gap-2">
            <Calendar size={14}/> Calculate Period
         </button>
         <button onClick={importSpecialRates} className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-black text-[9px] uppercase shadow">Import Party Rates</button>
      </div>

      {/* GRID */}
      <div className="bg-white border rounded shadow-inner overflow-x-auto">
        <table className="w-full border-collapse min-w-[1400px] text-left">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px]">
            <tr>
              <th className="p-2 border">Lot No</th><th className="p-2 border">Marka</th>
              <th className="p-2 border">Item Name</th><th className="p-2 border">Packing</th>
              <th className="p-2 border">GP No</th><th className="p-2 border">MR Date</th>
              <th className="p-2 border">GP Date</th><th className="p-2 border bg-white text-indigo-700 text-center font-black">PRD</th>
              <th className="p-2 border text-center">GP Qty</th><th className="p-2 border text-center">Rent Rate</th>
              <th className="p-2 border text-right">Rent Amt</th><th className="p-2 border text-center">Lab Rate</th>
              <th className="p-2 border text-right">Labour Amt</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={13} className="p-10 text-center text-gray-400 italic">Party chuno aur 'Import Data' button dabao...</td></tr>
            ) : items.map((it, idx) => (
              <tr key={idx} className="border-b hover:bg-slate-50 font-medium">
                <td className="p-1.5 border font-black text-blue-700 text-center">{it.lotNo}</td>
                <td className="p-1.5 border">{it.marka || "-"}</td>
                <td className="p-1.5 border uppercase">{it.itemName}</td>
                <td className="p-1.5 border uppercase text-gray-500">{it.packing}</td>
                <td className="p-1.5 border text-center font-bold">{it.gpNo}</td>
                <td className="p-1.5 border text-gray-400">{new Date(it.mrDate).toLocaleDateString('en-GB')}</td>
                <td className="p-1.5 border text-gray-400">{new Date(it.gpDate).toLocaleDateString('en-GB')}</td>
                <td className="p-1.5 border bg-indigo-50 font-black text-center text-indigo-800 text-xs">
                  <input type="number" className="w-16 bg-transparent text-center outline-none font-bold" value={it.prd} onChange={e => {
                    const newItems = [...items];
                    newItems[idx].prd = e.target.value;
                    setItems(newItems);
                  }} />
                </td>
                <td className="p-1.5 border text-center font-black">{it.qty}</td>
                <td className="p-1.5 border text-center text-slate-600">
                  <input type="number" className="w-16 text-center outline-none bg-transparent font-bold" value={it.rentRate} onChange={e => {
                    const newItems = [...items];
                    newItems[idx].rentRate = e.target.value;
                    setItems(newItems);
                  }} />
                </td>
                <td className="p-1.5 border text-right font-black text-green-700">₹{it.rentAmt?.toFixed(2) || "0.00"}</td>
                <td className="p-1.5 border text-center text-slate-600">
                  <input type="number" className="w-16 text-center outline-none bg-transparent font-bold" value={it.labRate} onChange={e => {
                    const newItems = [...items];
                    newItems[idx].labRate = e.target.value;
                    setItems(newItems);
                  }} />
                </td>
                <td className="p-1.5 border text-right font-black text-green-700">₹{it.labourAmt?.toFixed(2) || "0.00"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER TOTALS */}
      <div className="bg-white p-4 border rounded shadow-md grid grid-cols-2 md:grid-cols-7 gap-4 items-end">
         <div>
           <label className="text-blue-500 font-bold uppercase text-[9px]">CGST %</label>
           <input className="w-full border-2 border-blue-100 p-1 rounded font-bold outline-none" value={taxRates.cgst} onChange={e => setTaxRates({...taxRates, cgst: e.target.value as any})} />
         </div>
         <div>
           <label className="text-blue-500 font-bold uppercase text-[9px]">SGST %</label>
           <input className="w-full border-2 border-blue-100 p-1 rounded font-bold outline-none" value={taxRates.sgst} onChange={e => setTaxRates({...taxRates, sgst: e.target.value as any})} />
         </div>
         <div>
           <label className="text-indigo-500 font-bold uppercase text-[9px]">IGST %</label>
           <input className="w-full border-2 border-indigo-100 p-1 rounded font-bold outline-none" value={taxRates.igst} onChange={e => setTaxRates({...taxRates, igst: e.target.value as any})} />
         </div>
         <div><label className="text-red-500 font-black uppercase text-[9px]">Total GP Qty</label><input className="w-full border p-1 rounded bg-slate-100 font-black text-center text-sm" value={calculatedData.totals.totalQty} readOnly /></div>
         <div className="col-span-1">
            <label className="text-red-500 font-black uppercase text-[8px] italic">Discount (₹)</label>
            <input className="w-full border-2 border-red-200 p-1 rounded font-black text-center bg-red-50" value={discount} onChange={e => setDiscount(e.target.value)} />
         </div>
         <div><label className="text-red-500 font-black uppercase text-[9px]">Gross Amount</label><input className="w-full border p-1 rounded bg-slate-100 font-black text-center text-sm" value={calculatedData.totals.grossAmount.toFixed(2)} readOnly /></div>
         <div><label className="text-red-500 font-black uppercase text-[9px]">Round Amount</label><input className="w-full border p-1 rounded bg-slate-100 font-black text-center" value={calculatedData.totals.roundAmount.toFixed(2)} readOnly /></div>
      </div>

      {/* FINAL BLUE TOTAL WIDGETS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
         <div className="border p-2 bg-slate-50 rounded text-center shadow-inner"><p className="text-[9px] font-bold uppercase text-slate-500">CGST AMT</p><p className="font-black text-xs text-indigo-900">₹ {calculatedData.totals.cgstAmt.toFixed(2)}</p></div>
         <div className="border p-2 bg-slate-50 rounded text-center shadow-inner"><p className="text-[9px] font-bold uppercase text-slate-500">SGST AMT</p><p className="font-black text-xs text-indigo-900">₹ {calculatedData.totals.sgstAmt.toFixed(2)}</p></div>
         <div className="border p-2 bg-slate-50 rounded text-center shadow-inner"><p className="text-[9px] font-bold uppercase text-slate-500">IGST AMT</p><p className="font-black text-xs text-indigo-900">₹ {calculatedData.totals.igstAmt.toFixed(2)}</p></div>
         <div className="border p-2 bg-slate-50 rounded text-center shadow-inner"><p className="text-[9px] font-bold uppercase text-slate-500">LABOUR AMT</p><p className="font-black text-xs text-blue-600">₹ {calculatedData.totals.labourTotal.toFixed(2)}</p></div>
         <div className="border p-2 bg-slate-50 rounded text-center shadow-inner"><p className="text-[9px] font-bold uppercase text-slate-500">RENT AMT</p><p className="font-black text-xs text-green-600">₹ {calculatedData.totals.rentTotal.toFixed(2)}</p></div>
         <div className="bg-indigo-600 col-span-1 rounded-lg p-2 text-center shadow-lg transition-transform hover:scale-105">
            <p className="text-white font-bold uppercase text-[8px] tracking-widest">NET PAYABLE</p>
            <p className="text-white font-black text-lg italic">₹ {calculatedData.totals.netAmt.toFixed(2)}</p>
         </div>
      </div>
    </div>
  );
}


// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import { Save, Printer, Import, FileText, X, RotateCcw, Loader2, Calendar } from "lucide-react";
// import { toast } from "react-hot-toast";

// export default function BillEntryPage() {
//   const [parties, setParties] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
  
//   // 1. HEADER STATE
//   const [header, setHeader] = useState({
//     invoiceNo: "...", billDate: new Date().toISOString().split('T')[0],
//     partyId: "", gstType: "NA", stateName: "NA", partyGst: "NA", graceDays: 0,
//     gstOn: "GST On Both (Labour + Rent)"
//   });

//   // 2. GRID STATE
//   const [items, setItems] = useState<any[]>([]);

//   // 3. EDITABLE DISCOUNT & TAX RATES (Fixed hardcoded 9%)
//   const [discount, setDiscount] = useState<number | string>("0");
//   const [taxRates, setTaxRates] = useState({ cgst: 9, sgst: 9, igst: 0 }); // Editable by user

//   // Load Initial Data
//   useEffect(() => {
//     fetch("/api/masters/party").then(res => res.json()).then(setParties);
//     fetch("/api/billing/invoice/next-no").then(res => res.json()).then(d => setHeader(h => ({...h, invoiceNo: d.nextNo})));
//   }, []);

//   const handlePartyChange = (id: string) => {
//     const p = parties.find(x => x.id === id);
//     if (p) {
//       setHeader({
//         ...header, 
//         partyId: id, 
//         partyGst: p.gstNo || "NA", 
//         stateName: p.stateName || "NA", 
//         graceDays: p.graceDays || 0
//       });

//       // AUTOMATION: If State Code is 06 (Haryana), set CGST/SGST 9%. Else set IGST 18%.
//       if (p.stateCode === "06") {
//         setTaxRates({ cgst: 9, sgst: 9, igst: 0 });
//       } else if (p.stateCode && p.stateCode !== "06") {
//         setTaxRates({ cgst: 0, sgst: 0, igst: 18 });
//       }
//     }
//   };

//   // ==========================================
//   // 🔴 LIVE MATH ENGINE (Fully Dynamic Now)
//   // ==========================================
//   const calculatedData = useMemo(() => {
//     let totalRent = 0;
//     let totalLab = 0;
//     let totalQty = 0;

//     // Auto-calculate row amounts
//     const processedItems = items.map(it => {
//       const prd = Number(it.prd) || 0;
//       const rentRate = Number(it.rentRate) || 0;
//       const labRate = Number(it.labRate) || 0;
//       const qty = Number(it.qty) || 0;

//       const rentAmt = qty * rentRate * prd;
//       const labAmt = qty * labRate;
      
//       totalRent += rentAmt;
//       totalLab += labAmt;
//       totalQty += qty;

//       return { ...it, rentAmt, labourAmt: labAmt };
//     });

//     const parsedDiscount = Number(discount) || 0;
//     const grossAmount = totalRent + totalLab;
//     const taxableValue = grossAmount - parsedDiscount;

//     // Calculate taxes based on user's input in the UI
//     const cgst = taxableValue * ((Number(taxRates.cgst) || 0) / 100);
//     const sgst = taxableValue * ((Number(taxRates.sgst) || 0) / 100);
//     const igst = taxableValue * ((Number(taxRates.igst) || 0) / 100);
    
//     const net = Math.round(taxableValue + cgst + sgst + igst);
//     const roundAmount = net - (taxableValue + cgst + sgst + igst);

//     return {
//       items: processedItems,
//       totals: {
//         totalGpQty: totalQty, 
//         discount: parsedDiscount,
//         grossAmount, 
//         taxableValue,
//         roundAmount,
//         cgstAmt: cgst, 
//         sgstAmt: sgst, 
//         igstAmt: igst, 
//         labourTotal: totalLab, 
//         rentTotal: totalRent, 
//         netAmt: net
//       }
//     };
//   }, [items, discount, taxRates]);

//   // ==========================================
//   // 🔴 ACTION BUTTONS LOGIC 🔴
//   // ==========================================

//   const viewPending = () => {
//     if(!header.partyId) return toast.error("Party select karo!");
//     window.open(`/billing/pending-detail?partyId=${header.partyId}`, '_blank');
//   };

//   const handleImportData = async () => {
//     if (!header.partyId) return toast.error("Bhai, pehle Party toh select karo!");
    
//     setLoading(true);
//     try {
//       const res = await fetch(`/api/billing/nill-lot-import?partyId=${header.partyId}`);
//       const data = await res.json();
      
//       if (data.length === 0) {
//         toast.error("Is party ka koi pending maal nahi hai!");
//       } else {
//         setItems(data); 
//         toast.success(`${data.length} Lots mil gayi hain.`);
//       }
//     } catch (err) {
//       toast.error("Data load karne mein error!");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculatePeriod = () => {
//     if (items.length === 0) return toast.error("Pehle 'Import Data' karo!");

//     const updatedItems = items.map(it => {
//       const start = it.uptoDate ? new Date(it.uptoDate) : new Date(it.mrDate);
//       const end = new Date(header.billDate);
      
//       const diffTime = end.getTime() - start.getTime();
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
//       const finalPrd = it.uptoDate ? Math.max(0, diffDays) : Math.max(0, diffDays - header.graceDays);
      
//       return { ...it, prd: finalPrd };
//     });

//     setItems(updatedItems);
//     toast.success("Sabhi din (Days) calculate ho gaye!");
//   };

//   const importSpecialRates = async () => {
//     if (!header.partyId) return toast.error("Select Party!");
    
//     const res = await fetch(`/api/masters/party-rates?partyId=${header.partyId}`);
//     const rates = await res.json();
    
//     const updatedItems = items.map(it => {
//       const special = rates.find((r: any) => r.itemId === it.itemId);
//       return special ? { 
//         ...it, 
//         rentRate: Number(special.csRent), 
//         labRate: Number(special.csLab) 
//       } : it;
//     });

//     setItems(updatedItems);
//     toast.success("Special Rates apply kar diye gaye hain!");
//   };

//   // ==========================================
//   // 💾 SAVE BUTTON LOGIC 💾
//   // ==========================================
//   const handleSaveInvoice = async () => {
//     if (calculatedData.items.length === 0) return toast.error("Maal toh dalo!");
//     const loadId = toast.loading("Bill save ho raha hai...");
//     try {
//       const res = await fetch("/api/billing/invoice", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ 
//           header, 
//           items: calculatedData.items, 
//           // Inject actual UI tax rates into the payload so backend can use them if needed
//           totals: { ...calculatedData.totals, ...taxRates }
//         })
//       });
      
//       if (res.ok) {
//         toast.success("Tax Invoice successfully save ho gaya!", { id: loadId });
//         window.location.reload();
//       } else { 
//         toast.error("Save fail hua!", { id: loadId }); 
//       }
//     } catch (err) { 
//       toast.error("Network Error!", { id: loadId }); 
//     }
//   };

//   return (
//     <div className="space-y-3 text-[11px] animate-in fade-in">
//       {/* ACTION TOP BAR */}
//       <div className="flex justify-between bg-white p-2 border rounded shadow-sm">
//         <div className="flex gap-2">
//           <button className="bg-red-600 text-white px-4 py-1 rounded font-bold">SHOW ALL</button>
//           <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-4 py-1 rounded font-bold">ADD NEW BILL</button>
//         </div>
//         <div className="flex gap-2">
//           <button onClick={handleSaveInvoice} className="bg-[#f39c12] text-white px-8 py-1 rounded font-bold flex items-center gap-2 shadow-md hover:bg-orange-600 transition-all"><Save size={14}/> SAVE</button>
//           <button className="bg-[#3498db] text-white px-8 py-1 rounded font-bold flex items-center gap-2 shadow-md"><Printer size={14}/> PRINT</button>
//         </div>
//       </div>

//       <div className="bg-[#5d5fb1] text-white p-2 text-center font-black uppercase tracking-widest border border-indigo-400 italic">
//         Nill Lot Billing | Entry Form
//       </div>

//       {/* HEADER SECTION */}
//       <div className="bg-white p-5 border rounded shadow-sm grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 items-end">
//         <div><label className="text-gray-400 font-bold uppercase">Series Type</label><input className="w-full border p-1 rounded bg-slate-50" value="Bill Of Supply" readOnly /></div>
//         <div><label className="text-gray-400 font-bold uppercase">Invoice No</label><input className="w-full border p-1 rounded bg-slate-50 font-bold text-center text-indigo-700" value={header.invoiceNo} readOnly /></div>
//         <div><label className="text-gray-400 font-bold uppercase">Bill Date</label><input type="date" className="w-full border p-1 rounded" value={header.billDate} onChange={e => setHeader({...header, billDate: e.target.value})} /></div>
//         <div className="lg:col-span-1"><label className="text-indigo-700 font-black uppercase">Party Name</label>
//           <select className="w-full border p-1 rounded font-bold text-blue-800 outline-none" value={header.partyId} onChange={e => handlePartyChange(e.target.value)}>
//             <option value="">--Select Party--</option>
//             {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
//           </select>
//         </div>
//         <div><label className="text-gray-400 font-bold uppercase">GST Type</label><input className="w-full border p-1 rounded bg-slate-50 uppercase" value={header.gstType} readOnly /></div>
//         <div><label className="text-gray-400 font-bold uppercase">State Name</label><input className="w-full border p-1 rounded bg-slate-50 uppercase" value={header.stateName} readOnly /></div>
//         <div><label className="text-gray-400 font-bold uppercase">Party GST</label><input className="w-full border p-1 rounded bg-slate-50 uppercase font-mono" value={header.partyGst} readOnly /></div>
//       </div>

//       {/* 🔴 RED ACTION BAR 🔴 */}
//       <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
//          <div className="col-span-1">
//            <select className="w-full border p-2 rounded bg-white font-bold text-slate-600" value={header.gstOn} onChange={e => setHeader({...header, gstOn: e.target.value})}>
//              <option>GST On Both (Labour + Rent)</option>
//              <option>Only Rent</option>
//            </select>
//          </div>
//          <button onClick={viewPending} className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-black text-[9px] uppercase shadow">Pending Bill Statement</button>
//          <button onClick={handleImportData} className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-black text-[9px] uppercase shadow flex items-center justify-center gap-2">
//             {loading ? <Loader2 className="animate-spin" size={14}/> : <Import size={14}/>} Import Data
//          </button>
//          <button onClick={calculatePeriod} className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-black text-[9px] uppercase shadow flex items-center justify-center gap-2">
//             <Calendar size={14}/> Calculate Period
//          </button>
//          <button onClick={importSpecialRates} className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-black text-[9px] uppercase shadow">Import Party Rates</button>
//       </div>

//       {/* GRID */}
//       <div className="bg-white border rounded shadow-inner overflow-x-auto">
//         <table className="w-full border-collapse min-w-[1400px] text-left">
//           <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px]">
//             <tr>
//               <th className="p-2 border">Lot No</th><th className="p-2 border">Marka</th>
//               <th className="p-2 border">Item Name</th><th className="p-2 border">Packing</th>
//               <th className="p-2 border">GP No</th><th className="p-2 border">MR Date</th>
//               <th className="p-2 border">GP Date</th><th className="p-2 border bg-white text-indigo-700 text-center font-black">PRD</th>
//               <th className="p-2 border text-center">GP Qty</th><th className="p-2 border text-center">Rent Rate</th>
//               <th className="p-2 border text-right">Rent Amt</th><th className="p-2 border text-center">Lab Rate</th>
//               <th className="p-2 border text-right">Labour Amt</th>
//             </tr>
//           </thead>
//           <tbody>
//             {calculatedData.items.length === 0 ? (
//               <tr><td colSpan={13} className="p-10 text-center text-gray-400 italic">Party chuno aur 'Import Data' button dabao...</td></tr>
//             ) : calculatedData.items.map((it, idx) => (
//               <tr key={idx} className="border-b hover:bg-slate-50 font-medium">
//                 <td className="p-1.5 border font-black text-blue-700 text-center">{it.lotNo}</td>
//                 <td className="p-1.5 border">{it.marka || "-"}</td>
//                 <td className="p-1.5 border uppercase">{it.itemName}</td>
//                 <td className="p-1.5 border uppercase text-gray-500">{it.packing}</td>
//                 <td className="p-1.5 border text-center font-bold">{it.gpNo}</td>
//                 <td className="p-1.5 border text-gray-400">{new Date(it.mrDate).toLocaleDateString('en-GB')}</td>
//                 <td className="p-1.5 border text-gray-400">{new Date(it.gpDate).toLocaleDateString('en-GB')}</td>
//                 <td className="p-1.5 border bg-indigo-50 font-black text-center text-indigo-800 text-xs">
//                   <input type="number" className="w-16 bg-transparent text-center outline-none" value={it.prd} onChange={e => {
//                     const newItems = [...items];
//                     newItems[idx].prd = e.target.value;
//                     setItems(newItems);
//                   }} />
//                 </td>
//                 <td className="p-1.5 border text-center font-black">{it.qty}</td>
//                 <td className="p-1.5 border text-center text-slate-600">
//                   <input type="number" className="w-16 text-center outline-none bg-transparent" value={it.rentRate} onChange={e => {
//                     const newItems = [...items];
//                     newItems[idx].rentRate = e.target.value;
//                     setItems(newItems);
//                   }} />
//                 </td>
//                 <td className="p-1.5 border text-right font-black text-green-700">₹{it.rentAmt?.toFixed(2) || "0.00"}</td>
//                 <td className="p-1.5 border text-center text-slate-600">
//                   <input type="number" className="w-16 text-center outline-none bg-transparent" value={it.labRate} onChange={e => {
//                     const newItems = [...items];
//                     newItems[idx].labRate = e.target.value;
//                     setItems(newItems);
//                   }} />
//                 </td>
//                 <td className="p-1.5 border text-right font-black text-green-700">₹{it.labourAmt?.toFixed(2) || "0.00"}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* FOOTER TOTALS */}
//       <div className="bg-white p-4 border rounded shadow-md grid grid-cols-2 md:grid-cols-7 gap-4 items-end">
//          <div>
//            <label className="text-blue-500 font-bold uppercase text-[9px]">CGST %</label>
//            <input className="w-full border-2 border-blue-100 p-1 rounded font-bold outline-none focus:border-blue-400" value={taxRates.cgst} onChange={e => setTaxRates({...taxRates, cgst: e.target.value as any})} />
//          </div>
//          <div>
//            <label className="text-blue-500 font-bold uppercase text-[9px]">SGST %</label>
//            <input className="w-full border-2 border-blue-100 p-1 rounded font-bold outline-none focus:border-blue-400" value={taxRates.sgst} onChange={e => setTaxRates({...taxRates, sgst: e.target.value as any})} />
//          </div>
//          <div>
//            <label className="text-indigo-500 font-bold uppercase text-[9px]">IGST %</label>
//            <input className="w-full border-2 border-indigo-100 p-1 rounded font-bold outline-none focus:border-indigo-400" value={taxRates.igst} onChange={e => setTaxRates({...taxRates, igst: e.target.value as any})} />
//          </div>
//          <div><label className="text-red-500 font-black uppercase text-[9px]">Total GP Qty</label><input className="w-full border p-1 rounded bg-slate-100 font-black text-center text-sm" value={calculatedData.totals.totalGpQty} readOnly /></div>
//          <div className="col-span-1">
//             <label className="text-red-500 font-black uppercase text-[8px] italic">Discount (₹)</label>
//             <input className="w-full border-2 border-red-200 p-1 rounded font-black text-center bg-red-50 outline-none focus:ring-1 focus:ring-red-400" value={discount} onChange={e => setDiscount(e.target.value)} />
//          </div>
//          <div><label className="text-red-500 font-black uppercase text-[9px]">Gross Amount</label><input className="w-full border p-1 rounded bg-slate-100 font-black text-center text-sm" value={calculatedData.totals.grossAmount.toFixed(2)} readOnly /></div>
//          <div><label className="text-red-500 font-black uppercase text-[9px]">Round Amount</label><input className="w-full border p-1 rounded bg-slate-100 font-black text-center" value={calculatedData.totals.roundAmount.toFixed(2)} readOnly /></div>
//       </div>

//       {/* FINAL BLUE TOTAL WIDGETS */}
//       <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
//          <div className="border p-2 bg-slate-50 rounded text-center"><p className="text-[9px] font-bold uppercase text-slate-500">CGST AMT</p><p className="font-black text-xs text-indigo-900">₹ {calculatedData.totals.cgstAmt.toFixed(2)}</p></div>
//          <div className="border p-2 bg-slate-50 rounded text-center"><p className="text-[9px] font-bold uppercase text-slate-500">SGST AMT</p><p className="font-black text-xs text-indigo-900">₹ {calculatedData.totals.sgstAmt.toFixed(2)}</p></div>
//          <div className="border p-2 bg-slate-50 rounded text-center"><p className="text-[9px] font-bold uppercase text-slate-500">IGST AMT</p><p className="font-black text-xs text-indigo-900">₹ {calculatedData.totals.igstAmt.toFixed(2)}</p></div>
//          <div className="border p-2 bg-slate-50 rounded text-center"><p className="text-[9px] font-bold uppercase text-slate-500">LABOUR AMT</p><p className="font-black text-xs text-blue-600">₹ {calculatedData.totals.labourTotal.toFixed(2)}</p></div>
//          <div className="border p-2 bg-slate-50 rounded text-center"><p className="text-[9px] font-bold uppercase text-slate-500">RENT AMT</p><p className="font-black text-xs text-green-600">₹ {calculatedData.totals.rentTotal.toFixed(2)}</p></div>
//          <div className="bg-indigo-600 col-span-1 rounded-lg p-2 text-center shadow-lg transition-transform hover:scale-105">
//             <p className="text-white font-bold uppercase text-[8px] tracking-widest">NET PAYABLE</p>
//             <p className="text-white font-black text-lg italic">₹ {calculatedData.totals.netAmt.toFixed(2)}</p>
//          </div>
//       </div>
//     </div>
//   );
// }