"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Save, Printer, Import, FileText, X, RotateCcw, Loader2, Calendar, Calculator, Landmark, Tag, AlertCircle, ArrowRight, History, Search, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

// --- SEARCHABLE SELECT COMPONENT (Common Man Logic: Type + Select) ---
const SearchableSelect = ({ options, value, onChange, placeholder, displayKey = "name", secondaryKey = "code" }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<any>(null);

  const filtered = options.filter((opt: any) =>
    opt[displayKey]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (secondaryKey && opt[secondaryKey]?.toLowerCase().includes(searchTerm.toLowerCase()))
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
          {selectedOption ? `${selectedOption[displayKey]} [${selectedOption[secondaryKey]}]` : placeholder}
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
            )) : <div className="p-4 text-center text-slate-400 italic text-[11px]">No matching merchant found</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN BILL ENTRY COMPONENT ---
export default function BillEntryPage() {
  const router = useRouter();
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 1. HEADER STATE (Ensuring no field is missed)
  const [header, setHeader] = useState({
    invoiceNo: "", 
    billDate: new Date().toISOString().split('T')[0],
    partyId: "", 
    gstType: "Registered", 
    stateName: "Haryana", 
    stateCode: "06",
    partyGst: "NA", 
    graceDays: 0,
    gstOn: "GST On Both (Labour + Rent)",
    remarks: ""
  });

  // 2. GRID & TAX STATE
  const [items, setItems] = useState<any[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRates, setTaxRates] = useState({ cgst: 9, sgst: 9, igst: 0 });
  const [billingConfig, setBillingConfig] = useState<any>({
    billNilLot: false, billMonthly: false, billTransport: false, billSpace: false,
    billBalance: false, billItemDay: false, billFixed: false, billLabour: false,
    billCA: false, billWeekly: false
  });

  // Initial Load
  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
    fetch("/api/billing/invoice/next-no")
      .then(res => res.json())
      .then(d => setHeader(h => ({...h, invoiceNo: d.nextNo || "1"})));
  }, []);

  // 3. AUTOMATION: Party Selection & Smart Auto-Fill
  const handlePartyChange = (id: string) => {
    const p = parties.find(x => x.id === id);
    if (p) {
      setHeader({
        ...header, 
        partyId: id, 
        partyGst: p.gstNo || "UNREGISTERED", 
        stateName: p.stateName || "Haryana", 
        stateCode: p.stateCode || "06",
        graceDays: p.graceDays || 0,
        gstType: p.gstType || "Registered"
      });

      // Haryana Logic (06) vs Outside
      if (p.stateCode === "06") {
        setTaxRates({ cgst: 9, sgst: 9, igst: 0 });
      } else {
        setTaxRates({ cgst: 0, sgst: 0, igst: 18 });
      }
      toast.success(`Merchant ${p.tradeName} Selected`);
    }
  };

  // 4. LIVE MATH ENGINE (Calculates everything on the fly)
  const calculatedData = useMemo(() => {
    let totalRent = 0;
    let totalLab = 0;
    let totalQty = 0;

    const processedItems = items.map(it => {
      const qty = Number(it.qty) || 0;
      const rent = Number(it.rentRate) || 0;
      const lab = Number(it.labRate) || 0;
      const prd = Number(it.prd) || 0;

      const rentAmt = qty * rent * prd;
      const labAmt = billingConfig.billLabour ? (qty * lab) : 0;
      
      totalRent += rentAmt;
      totalLab += labAmt;
      totalQty += qty;

      return { ...it, rentAmt, labourAmt: labAmt, prd, rentRate: rent, labRate: lab };
    });

    let taxableValue = 0;
    let nonTaxableValue = 0;

    if (header.gstOn === "Only Rent (Labour Exempt)") {
      // GST only on Rent minus discount
      taxableValue = Math.max(0, totalRent - Number(discount));
      nonTaxableValue = totalLab;
    } else {
      // GST on both Rent + Labour minus discount
      const grossAmount = totalRent + totalLab;
      taxableValue = Math.max(0, grossAmount - Number(discount));
      nonTaxableValue = 0;
    }

    const cgstAmt = taxableValue * (taxRates.cgst / 100);
    const sgstAmt = taxableValue * (taxRates.sgst / 100);
    const igstAmt = taxableValue * (taxRates.igst / 100);
    
    const baseForRounding = taxableValue + nonTaxableValue + cgstAmt + sgstAmt + igstAmt;
    const netAmt = Math.round(baseForRounding);
    const roundOff = netAmt - baseForRounding;

    const grossAmount = totalRent + totalLab;

    return {
      processedItems,
      totals: {
        totalQty, grossAmount, taxableValue, cgstAmt, sgstAmt, igstAmt, 
        labourTotal: totalLab, rentTotal: totalRent, netAmt, roundOff
      }
    };
  }, [items, discount, taxRates, billingConfig.billLabour, header.gstOn]);

  // 🔴 IMPORT DATA
  const handleImportData = async () => {
    if (!header.partyId) return toast.error("Bhai, pehle Merchant select karo!");
    setLoading(true);
    setItems([]); 
    try {
      const res = await fetch(`/api/billing/nill-lot-import?partyId=${header.partyId}`);
      const data = await res.json();
      if (!res.ok || data.items.length === 0) {
        toast.error("Is kisan ka koi unbilled dispatch nahi mila!");
      } else {
        setItems([...data.items]);
        setBillingConfig(data.partyFlags);
        toast.success(`${data.items.length} Lots imported. Mode: ${data.partyFlags.billNilLot ? 'Nill Lot' : 'Running'}`);
      }
    } catch (err) { toast.error("Data load karne mein error!"); }
    finally { setLoading(false); }
  };

  // 🔴 CALCULATE PERIOD
  const calculatePeriod = () => {
    if (items.length === 0) return toast.error("Pehle 'Import Data' button dabaye!");
    const updated = items.map(it => {
      const start = it.uptoDate ? new Date(it.uptoDate) : new Date(it.mrDate);
      const end = new Date(header.billDate);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      let finalPrd = it.uptoDate ? Math.max(0, diff) : Math.max(0, diff - header.graceDays);
      
      // APPLY BILLING FLAGS
      if (billingConfig.billFixed) finalPrd = 1;
      else if (billingConfig.billWeekly) finalPrd = Math.ceil(finalPrd / 7);
      else if (billingConfig.billMonthly) finalPrd = Math.ceil(finalPrd / 30);

      return { ...it, prd: finalPrd };
    });
    setItems(updated);
    toast.success("Billing period calculated!");
  };

  // 💾 SAVE INVOICE
  const handleSave = async () => {
    if (items.length === 0) return toast.error("Bill khali hai!");
    setIsSaving(true);
    const loadId = toast.loading("Finalizing Tax Invoice...");
    try {
      const res = await fetch("/api/billing/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          header, 
          items: calculatedData.processedItems, 
          totals: calculatedData.totals 
        })
      });
      const result = await res.json();
      if (res.ok) {
        const party = parties.find(p => p.id === header.partyId);
        if (party?.paymentPreference === "Cash") {
          toast.success(`Bill Generated & PAID Automatically! No: ${result.invoiceNo}`, { id: loadId, duration: 5000 });
        } else {
          toast.success(`Invoice Generated (Unpaid). Bill No: ${result.invoiceNo}`, { id: loadId, duration: 5000 });
        }
        setTimeout(() => window.location.reload(), 2000);
      } else { toast.error(result.error || "Save fail", { id: loadId }); }
    } catch (err) { toast.error("Server Connection Error!", { id: loadId }); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* --- TOP ACTION BAR --- */}
      <div className="flex justify-between bg-white p-3 rounded-lg border shadow-sm no-print">
        <div className="flex gap-2">
          <button onClick={() => router.push('/billing/bill-book')} className="bg-red-600 text-white px-5 py-1.5 rounded font-black uppercase flex items-center gap-2 shadow hover:bg-red-700 transition-all">
            <Search size={14}/> View Bill Book
          </button>
          <button onClick={() => router.push('/billing/bill-book')} className="bg-indigo-600 text-white px-5 py-1.5 rounded font-black flex items-center gap-2 shadow hover:bg-indigo-700 transition-all uppercase">
            <History size={14}/> Previous Entries
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={isSaving || items.length === 0} className="bg-[#10b981] hover:bg-green-700 text-white px-12 py-1.5 rounded font-black flex items-center gap-2 shadow-xl active:scale-95 transition-all disabled:opacity-50 uppercase text-[12px]">
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} SAVE TAX INVOICE
          </button>
          <button 
            onClick={() => {
              if (items.length === 0) return toast.error("Bill khali hai! Pehle data import karein.");
              window.print();
            }}
            disabled={items.length === 0}
            className={`px-8 py-1.5 rounded font-black flex items-center gap-2 shadow uppercase transition-all ${items.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'}`}
          >
            <Printer size={16}/> Print Bill
          </button>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white p-1.5 rounded shadow hover:bg-orange-600 transition-all">
            <RotateCcw size={18}/>
          </button>
        </div>
      </div>

      <div className="bg-[#4a4ea3] text-white p-2 text-center font-black uppercase tracking-[5px] border border-b-0 border-indigo-300 italic shadow-md relative group">
        Tax Invoice Generation | Merchant Revenue Settlement
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
            {billingConfig.billNilLot && <span className="bg-yellow-400 text-black px-2 py-0.5 rounded text-[8px] animate-pulse">Nill Lot</span>}
            {billingConfig.billLabour && <span className="bg-green-400 text-black px-2 py-0.5 rounded text-[8px]">Auto Labour</span>}
            {billingConfig.billFixed && <span className="bg-blue-400 text-white px-2 py-0.5 rounded text-[8px]">Fixed Rate</span>}
        </div>
      </div>

      {/* --- HEADER FORM (AUTO-FILL) --- */}
      <div className="bg-white p-8 border rounded-b-lg shadow-2xl grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-6 items-end">
        <div className="space-y-1">
          <label className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Series Type</label>
          <input readOnly className="w-full border-2 border-slate-100 p-2 rounded-lg bg-slate-50 font-bold" value="Tax Invoice" />
        </div>
        <div className="space-y-1">
          <label className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Invoice No.</label>
          <input readOnly className="w-full border-2 border-slate-100 p-2 rounded-lg bg-slate-100 font-black text-center text-indigo-700 text-lg shadow-inner" value={header.invoiceNo} />
        </div>
        <div className="space-y-1">
          <label className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Billing Date</label>
          <input type="date" className="w-full border-2 border-slate-100 p-2 rounded-lg font-bold outline-none focus:border-indigo-400 shadow-inner" value={header.billDate} onChange={e => setHeader({...header, billDate: e.target.value})} />
        </div>
        <div className="lg:col-span-1 space-y-1">
          <label className="text-indigo-700 font-black uppercase text-[9px] tracking-widest flex items-center gap-1"><Landmark size={10}/> Search Merchant *</label>
          <SearchableSelect 
            options={parties} value={header.partyId} onChange={handlePartyChange} 
            placeholder="--- SEARCH NAME ---" displayKey="tradeName" secondaryKey="partyCode"
          />
        </div>
        <div className="space-y-1">
          <label className="text-gray-400 font-black uppercase text-[9px] block">Merchant GSTIN</label>
          <input readOnly className="w-full border-2 border-slate-50 p-2 rounded-lg bg-slate-50 font-mono font-bold text-indigo-600 shadow-inner" value={header.partyGst} />
        </div>
        <div className="space-y-1">
          <label className="text-gray-400 font-black uppercase text-[9px] block">Location / State</label>
          <input readOnly className="w-full border-2 border-slate-50 p-2 rounded-lg bg-slate-50 uppercase font-bold text-slate-500" value={`${header.stateName} [${header.stateCode}]`} />
        </div>
        <div className="space-y-1">
          <label className="text-gray-400 font-black uppercase text-[9px] block">Tax Strategy</label>
          <select className="w-full border-2 border-indigo-50 p-2 rounded-lg bg-white font-bold outline-none" value={header.gstOn} onChange={e => setHeader({...header, gstOn: e.target.value})}>
            <option>GST On Both (Labour + Rent)</option>
            <option>Only Rent (Labour Exempt)</option>
          </select>
        </div>
        <div className="md:col-span-7 space-y-1">
          <label className="text-gray-400 font-black uppercase text-[9px] block">General Bill Remarks</label>
          <input className="w-full border-2 border-slate-100 p-2 rounded-lg outline-none italic placeholder:font-normal shadow-inner" placeholder="Enter special notes for this invoice..." value={header.remarks} onChange={e => setHeader({...header, remarks: e.target.value})} />
        </div>
      </div>

      {/* --- AUTOMATION TOOLS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
         <button onClick={() => router.push(`/billing/pending-detail?partyId=${header.partyId}`)} className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
            <AlertCircle size={16}/> Show Pending History
         </button>
         <button onClick={handleImportData} disabled={loading || !header.partyId} className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
            {loading ? <Loader2 className="animate-spin" size={16}/> : <Import size={16}/>} Load Unbilled Dispatch
         </button>
         <button onClick={calculatePeriod} className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
            <Calendar size={16}/> Auto-Calculate Days
         </button>
         <button className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
            <Tag size={16}/> Apply Special Rates
         </button>
      </div>

      {/* --- DATA GRID (LOT NO FIRST) --- */}
      <div className="bg-white border-2 border-slate-100 rounded-xl shadow-2xl overflow-x-auto min-h-[300px]">
        <table className="w-full border-collapse min-w-[1750px] text-left">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10 shadow-md">
            <tr>
              <th className="p-4 border-r border-indigo-200 bg-indigo-100 text-indigo-900 w-28 text-center">LOT NO.</th>
              <th className="p-4 border-r border-slate-300 w-32">MARKA</th>
              <th className="p-4 border-r border-slate-300 w-52">ITEM DESCRIPTION</th>
              <th className="p-4 border-r border-slate-300 w-32">PACKING</th>
              <th className="p-4 border-r border-slate-300 w-28 text-center">GP REF NO.</th>
              <th className="p-4 border-r border-slate-300 w-28 text-center">IN DATE</th>
              <th className="p-4 border-r border-slate-300 w-28 text-center">OUT DATE</th>
              <th className="p-4 border-r border-white bg-indigo-600 text-white text-center w-24">PRD (DAYS)</th>
              <th className="p-4 border-r border-slate-300 w-24 text-center">QTY</th>
              <th className="p-4 border-r border-slate-300 w-24 text-center">RENT RATE</th>
              <th className="p-4 border-r border-indigo-100 bg-green-50 text-green-700 text-right">RENT AMT</th>
              <th className="p-4 border-r border-slate-300 w-24 text-center">LAB RATE</th>
              <th className="p-4 text-right bg-green-50 text-green-700">LABOUR AMT</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={13} className="p-24 text-center text-gray-300 italic font-medium uppercase tracking-[5px]">Select merchant and click 'Load Unbilled Dispatch' to generate invoice</td></tr>
            ) : calculatedData.processedItems.map((it, idx) => (
              <tr key={it.lotId || idx} className="border-b hover:bg-indigo-50/50 transition-all font-bold group even:bg-slate-50/30">
                <td className="p-2 border-r border-indigo-200 bg-indigo-50/50 text-blue-900 text-center font-black text-sm shadow-inner">{it.lotNo}</td>
                <td className="p-2 border-r border-slate-100 uppercase text-gray-400">{it.marka || "-"}</td>
                <td className="p-2 border-r border-slate-100 uppercase text-slate-700 truncate max-w-[200px] font-black">{it.itemName}</td>
                <td className="p-2 border-r border-slate-100 uppercase text-gray-500 text-[10px]">{it.packing}</td>
                <td className="p-2 border-r border-slate-100 text-center font-mono text-indigo-700">{it.gpNo}</td>
                <td className="p-2 border-r border-slate-100 text-gray-400 text-center font-mono text-[9px]">{formatDate(it.mrDate)}</td>
                <td className="p-2 border-r border-slate-100 text-gray-400 text-center font-mono text-[9px]">{formatDate(it.gpDate)}</td>
                <td className="p-2 border-r border-slate-100 bg-indigo-50/80">
                  <input type="number" className="w-full bg-transparent text-center font-black text-indigo-950 outline-none" value={it.prd} onChange={e => setItems(prev => prev.map((item, i) => i === idx ? {...item, prd: e.target.value} : item))} />
                </td>
                <td className="p-2 border-r border-slate-100 text-center font-black text-slate-900">{it.qty}</td>
                <td className="p-2 border-r border-slate-100">
                   <input type="number" className="w-full bg-transparent text-center font-bold text-slate-600 outline-none" value={it.rentRate} onChange={e => setItems(prev => prev.map((item, i) => i === idx ? {...item, rentRate: e.target.value} : item))} />
                </td>
                <td className="p-2 border-r border-slate-100 text-right text-green-700 bg-green-50/20 font-black">₹{Number(it.rentAmt || 0).toFixed(2)}</td>
                <td className="p-2 border-r border-slate-100">
                   <input type="number" className="w-full bg-transparent text-center font-bold text-slate-600 outline-none" value={it.labRate} onChange={e => setItems(prev => prev.map((item, i) => i === idx ? {...item, labRate: e.target.value} : item))} />
                </td>
                <td className="p-2 text-right text-green-700 bg-green-50/20 font-black">₹{Number(it.labourAmt || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- FINANCIAL TOTALS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end bg-white p-6 border-2 border-slate-100 rounded-xl shadow-lg no-print font-bold">
         <div className="space-y-1">
            <label className="text-blue-600 uppercase text-[9px] font-black">CGST (%)</label>
            <input className="w-full border-2 border-blue-50 p-2 rounded-lg font-black text-center text-blue-700 shadow-inner" value={taxRates.cgst} onChange={e => setTaxRates({...taxRates, cgst: parseFloat(e.target.value) || 0})} />
         </div>
         <div className="space-y-1">
            <label className="text-blue-600 uppercase text-[9px] font-black">SGST (%)</label>
            <input className="w-full border-2 border-blue-50 p-2 rounded-lg font-black text-center text-blue-700 shadow-inner" value={taxRates.sgst} onChange={e => setTaxRates({...taxRates, sgst: parseFloat(e.target.value) || 0})} />
         </div>
         <div className="space-y-1">
            <label className="text-indigo-600 uppercase text-[9px] font-black">IGST (%)</label>
            <input className="w-full border-2 border-indigo-50 p-2 rounded-lg font-black text-center text-indigo-700 shadow-inner" value={taxRates.igst} onChange={e => setTaxRates({...taxRates, igst: parseFloat(e.target.value) || 0})} />
         </div>
         <div className="space-y-1">
            <label className="text-slate-400 uppercase text-[9px] font-black">Gross Qty</label>
            <input readOnly className="w-full border-2 border-slate-100 p-2 rounded-lg font-black text-center bg-slate-100" value={calculatedData.totals.totalQty} />
         </div>
         <div className="space-y-1">
            <label className="text-red-500 uppercase text-[9px] font-black italic">Special Disc (₹)</label>
            <input className="w-full border-2 border-red-50 p-2 rounded-lg font-black text-center text-red-600 shadow-inner" value={discount} onChange={e => setDiscount(Number(e.target.value) || 0)} />
         </div>
         <div className="space-y-1">
            <label className="text-slate-400 uppercase text-[9px] font-black">Taxable Amt</label>
            <input readOnly className="w-full border-2 border-slate-100 p-2 rounded-lg font-black text-center bg-slate-100" value={calculatedData.totals.taxableValue.toFixed(2)} />
         </div>
         <div className="space-y-1">
            <label className="text-slate-400 uppercase text-[9px] font-black">Round Off</label>
            <input readOnly className="w-full border-2 border-slate-100 p-2 rounded-lg font-black text-center bg-slate-100" value={calculatedData.totals.roundOff.toFixed(2)} />
         </div>
      </div>

      {/* --- FINAL SUMMARY WIDGETS --- */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
         <div className="border-b-4 border-indigo-500 p-3 bg-white rounded-lg text-center shadow-md"><p className="text-[9px] font-black uppercase text-slate-400">CGST AMT</p><p className="font-black text-sm text-indigo-900">₹ {calculatedData.totals.cgstAmt.toFixed(2)}</p></div>
         <div className="border-b-4 border-indigo-500 p-3 bg-white rounded-lg text-center shadow-md"><p className="text-[9px] font-black uppercase text-slate-400">SGST AMT</p><p className="font-black text-sm text-indigo-900">₹ {calculatedData.totals.sgstAmt.toFixed(2)}</p></div>
         <div className="border-b-4 border-slate-200 p-3 bg-white rounded-lg text-center shadow-md opacity-40"><p className="text-[9px] font-black uppercase text-slate-400">IGST AMT</p><p className="font-black text-sm text-indigo-900">₹ {calculatedData.totals.igstAmt.toFixed(2)}</p></div>
         <div className="border-b-4 border-blue-400 p-3 bg-white rounded-lg text-center shadow-md"><p className="text-[9px] font-black uppercase text-slate-400">TOTAL LABOUR</p><p className="font-black text-sm text-blue-600">₹ {calculatedData.totals.labourTotal.toFixed(2)}</p></div>
         <div className="border-b-4 border-green-400 p-3 bg-white rounded-lg text-center shadow-md"><p className="text-[9px] font-black uppercase text-slate-400">TOTAL RENT</p><p className="font-black text-sm text-green-600">₹ {calculatedData.totals.rentTotal.toFixed(2)}</p></div>
         <div className="bg-indigo-800 col-span-1 rounded-xl p-4 text-center shadow-2xl ring-4 ring-indigo-100 transition-transform hover:scale-105 relative overflow-hidden group">
            <p className="text-white font-black uppercase text-[10px] tracking-[4px]">NET PAYABLE</p>
            <p className="text-yellow-300 font-black text-2xl italic tracking-tighter">₹ {calculatedData.totals.netAmt.toLocaleString('en-IN')}</p>
         </div>
      </div>

      {/* --- HIDDEN PRINT VIEW (TAX INVOICE STYLE) --- */}
      <div id="print-area" className="hidden print:block p-8 font-mono text-[13px] leading-relaxed text-black bg-white w-full">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">{header.gstType === 'Registered' ? 'Tax Invoice' : 'Bill Of Supply'}</h1>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black uppercase">DJ GREEN STORAGE SOLUTIONS (P) LTD.</h2>
            <p className="font-bold text-[12px]">PLOT NO. 1 NSM AZADPUR, DELHI-33</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-20 mb-4 border-t-2 border-black pt-4">
          <div className="space-y-1">
            <div className="flex"><span className="w-28 font-bold">Invoice No.</span> <span>: {header.invoiceNo}</span></div>
            <div className="flex shrink-0"><span className="w-28 font-bold">Party Name</span> <span className="flex-1">: {parties.find(p => p.id === header.partyId)?.tradeName || '---'}</span></div>
            <div className="flex"><span className="w-28 font-bold">GSTIN No.</span> <span>: {header.partyGst || 'UNREGISTERED'}</span></div>
            <div className="flex"><span className="w-28 font-bold">State</span> <span>: {header.stateName} ({header.stateCode})</span></div>
          </div>
          <div className="space-y-1 text-right">
            <div className="flex justify-end"><span className="w-28 font-bold text-left">Date</span> <span className="w-32 text-left">: {formatDate(header.billDate)}</span></div>
            <div className="flex justify-end"><span className="w-28 font-bold text-left">Time</span> <span className="w-32 text-left">: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>
            <div className="flex justify-end"><span className="w-28 font-bold text-left">Remarks</span> <span className="w-32 text-left truncate">: {header.remarks || "---"}</span></div>
          </div>
        </div>

        {/* Table Header (Lines Only) */}
        <div className="border-t-2 border-b-2 border-black flex font-black uppercase py-2 mb-2 text-[11px]">
          <div className="w-[10%]">LOT-NO</div>
          <div className="w-[30%]">Item Name</div>
          <div className="w-[10%] text-center">Qty</div>
          <div className="w-[10%] text-center">Days</div>
          <div className="w-[10%] text-right">Rent Rate</div>
          <div className="w-[10%] text-right">Rent Amt</div>
          <div className="w-[10%] text-right">Lab Rate</div>
          <div className="w-[10%] text-right">Lab Amt</div>
        </div>

        {/* Table Rows (No Borders) */}
        <div className="min-h-[250px] border-b-2 border-black pb-4">
          {calculatedData.processedItems.map((row: any, idx: number) => (
            <div key={idx} className="flex py-1 text-[12px]">
              <div className="w-[10%] font-bold">{row.lotNo}</div>
              <div className="w-[30%] font-black uppercase">{row.itemName}</div>
              <div className="w-[10%] text-center font-black">{row.qty}</div>
              <div className="w-[10%] text-center">{row.prd}</div>
              <div className="w-[10%] text-right">{Number(row.rentRate).toFixed(2)}</div>
              <div className="w-[10%] text-right font-bold">₹{Number(row.rentAmt).toFixed(2)}</div>
              <div className="w-[10%] text-right">{Number(row.labRate).toFixed(2)}</div>
              <div className="w-[10%] text-right font-bold">₹{Number(row.labourAmt).toFixed(2)}</div>
            </div>
          ))}
        </div>

        {/* Summary Calculations Section */}
        <div className="grid grid-cols-2 gap-20 mt-4 text-[12px]">
          <div className="space-y-1">
            <div className="flex"><span className="w-32 font-bold">Total Qty</span> <span>: {calculatedData.totals.totalQty} Bags</span></div>
            <div className="flex"><span className="w-32 font-bold">Base Rent</span> <span>: ₹{calculatedData.totals.rentTotal.toFixed(2)}</span></div>
            <div className="flex"><span className="w-32 font-bold">Base Labour</span> <span>: ₹{calculatedData.totals.labourTotal.toFixed(2)}</span></div>
            {discount > 0 && <div className="flex text-red-600"><span className="w-32 font-bold">Discount</span> <span>: -₹{Number(discount).toFixed(2)}</span></div>}
          </div>
          <div className="space-y-1 text-right">
            <div className="flex justify-end"><span className="w-36 font-bold text-left">Taxable Value</span> <span className="w-24 text-right">₹{calculatedData.totals.taxableValue.toFixed(2)}</span></div>
            {calculatedData.totals.cgstAmt > 0 && <div className="flex justify-end"><span className="w-36 font-bold text-left">CGST ({taxRates.cgst}%)</span> <span className="w-24 text-right">₹{calculatedData.totals.cgstAmt.toFixed(2)}</span></div>}
            {calculatedData.totals.sgstAmt > 0 && <div className="flex justify-end"><span className="w-36 font-bold text-left">SGST ({taxRates.sgst}%)</span> <span className="w-24 text-right">₹{calculatedData.totals.sgstAmt.toFixed(2)}</span></div>}
            {calculatedData.totals.igstAmt > 0 && <div className="flex justify-end"><span className="w-36 font-bold text-left">IGST ({taxRates.igst}%)</span> <span className="w-24 text-right">₹{calculatedData.totals.igstAmt.toFixed(2)}</span></div>}
            <div className="flex justify-end"><span className="w-36 font-bold text-left">Round Off</span> <span className="w-24 text-right">₹{calculatedData.totals.roundOff.toFixed(2)}</span></div>
            <div className="flex justify-end border-t border-black pt-1 font-black text-sm"><span className="w-36 text-left uppercase">Net Payable</span> <span className="w-24 text-right">₹{calculatedData.totals.netAmt.toLocaleString('en-IN')}</span></div>
          </div>
        </div>

        <div className="mt-16">
            <p className="text-[11px] font-bold leading-tight mb-20 text-center">
                * Thank you for your business. Please settle outstanding dues within payment terms. *
            </p>
            <div className="flex justify-between items-end px-10">
               <div className="border-t border-black pt-2 w-64 text-center font-black text-[12px]">(Customer Signature)</div>
               <div className="border-t border-black pt-2 w-64 text-center font-black text-[12px]">Authorized Signatory</div>
            </div>
        </div>
      </div>

      {/* STYLES FOR PRINTING */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 0 !important;
            margin: 0 !important;
          }
          @page { size: portrait; margin: 15mm; }
        }
      `}</style>

    </div>
  );
}
