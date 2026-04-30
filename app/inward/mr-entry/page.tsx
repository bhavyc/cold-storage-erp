"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Plus, Trash2, Save, History, Search, Truck, Info, RotateCcw, Landmark, Package, MapPin, ClipboardList, Check, ChevronsUpDown, Printer, Wallet, Tag, Loader2, QrCode, Database, ClipboardCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

// --- 1. SEARCHABLE SELECT COMPONENT (Writing + Selection) ---
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
      <div onClick={() => setIsOpen(!isOpen)} className="w-full border-2 border-slate-200 p-2 rounded-lg bg-white flex justify-between items-center cursor-pointer hover:border-indigo-400 transition-all shadow-sm">
        <span className={`truncate font-bold text-[11px] ${selectedOption ? 'text-blue-900' : 'text-slate-400'}`}>
          {selectedOption ? `${selectedOption[displayKey]} [${selectedOption[secondaryKey] || ''}]` : placeholder}
        </span>
        <ChevronsUpDown size={14} className="text-slate-400" />
      </div>
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-indigo-100 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-150">
          <input autoFocus className="w-full p-2 border-b border-slate-100 outline-none font-bold text-indigo-600 sticky top-0 bg-indigo-50 text-[11px]" placeholder="Type to search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {filtered.length > 0 ? filtered.map((opt: any) => (
              <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(""); }} className="p-2.5 hover:bg-indigo-600 hover:text-white cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 font-bold text-[11px]">
                <span>{opt[displayKey]} {secondaryKey && <span className="opacity-60 text-[9px]">({opt[secondaryKey]})</span>}</span>
                {value === opt.id && <Check size={14} />}
              </div>
            )) : <div className="p-4 text-center text-slate-400 italic text-[11px]">No results</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// --- 2. MAIN PAGE COMPONENT ---
const initialHeader = { 
  mrNo: "", mrDate: new Date().toISOString().split('T')[0], 
  partyId: "", address: "", deliveryPerson: "", truckNo: "", 
  remarksEWay: "", billingType: "Nill Lot Bill", paymentPref: "Credit" 
};

// Variety aur Lot Value fields grid mein initialized hain
const initialGridRow = (ln: string) => ({ 
  lotNo: ln, itemId: "", unitId: "", qty: 0, marka: "", variety: "",
  chamberId: "", floor: "0", pillar: "0", lotValue: 0, perUnitWgt: 0, rate: 0, labour: 0, remarks: "" 
});

export default function MREntryPage() {
  const router = useRouter();
  const [masters, setMasters] = useState<any>({ parties: [], items: [], units: [], chambers: [] });
  const [header, setHeader] = useState(initialHeader);
  const [grid, setGrid] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSelectedParty, setLastSelectedParty] = useState<any>(null);
  
  // Success Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  // Navigation States
  const [viewMode, setViewMode] = useState<"NEW" | "HISTORY">("NEW");
  const [lastNextNo, setLastNextNo] = useState(""); 
  const [lastNextLot, setLastNextLot] = useState("");

  const init = async () => {
    try {
      const [p, i, u, c, seq] = await Promise.all([
        fetch("/api/masters/party").then(res => res.json()),
        fetch("/api/masters/items").then(res => res.json()),
        fetch("/api/masters/units").then(res => res.json()),
        fetch("/api/masters/chambers").then(res => res.json()),
        fetch("/api/inward/next-numbers").then(res => res.json())
      ]);
      setMasters({ parties: p, items: i, units: u, chambers: c });
      setHeader(h => ({ ...h, mrNo: seq.nextMR || "1" }));
      setLastNextNo(seq.nextMR || "1");
      setLastNextLot(seq.nextLot || "1");
      setGrid([initialGridRow(seq.nextLot || "1")]);
    } catch (err) {
      toast.error("Database connection failed!");
    }
  };

  const fetchHistory = async (dir: "back" | "next") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inward/mr/history?currentNo=${header.mrNo}&direction=${dir}`);
      const data = await res.json();

      if (res.ok) {
        setHeader(data.header);
        setGrid(data.items);
        setViewMode("HISTORY");
        toast.success(`Viewing MR # ${data.header.mrNo}`);
      } else {
        toast.error(dir === "back" ? "Peeche aur koi record nahi mila!" : "Aage aur koi record nahi mila!");
      }
    } catch (err) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setHeader({ ...initialHeader, mrNo: lastNextNo });
    setGrid([initialGridRow(lastNextLot)]);
    setViewMode("NEW");
    setLastSelectedParty(null);
    toast.success("Ready for New Entry");
  };

  const handlePrint = () => {
    if (viewMode === "NEW" && !printData) {
      return toast.error("Pehle Record Save karein, phir print nikalein!");
    }
    window.print();
  };

  useEffect(() => { init(); }, []);

  const handlePartyChange = (id: string) => {
    const p = masters.parties.find((x: any) => x.id === id);
    if (p) {
        setLastSelectedParty(p);
        let detectedMode = "General";
        if (p.billNilLot) detectedMode = "Nill Lot Bill";
        else if (p.billBalance) detectedMode = "Balance Only";
        else if (p.billMonthly) detectedMode = "Monthly Bill";
        else if (p.billWeekly) detectedMode = "Weekly Bill";
        else if (p.billFixed) detectedMode = "Fixed Rate";
        else if (p.billItemDay) detectedMode = "Item/Day Logic";
        else if (p.billTransport) detectedMode = "Transport Bill";
        else if (p.billSpace) detectedMode = "Space Occupancy";
        else if (p.billCA) detectedMode = "CA Commission";

        setHeader({
          ...header, 
          partyId: id, 
          address: p.address || "N/A", 
          paymentPref: p.paymentPreference || "Credit",
          billingType: detectedMode
        });
        toast.success(`Merchant Locked | Billing: ${detectedMode}`);
    }
  };

  const addRow = () => {
    const lastLot = parseInt(grid[grid.length - 1].lotNo);
    setGrid([...grid, initialGridRow((lastLot + 1).toString())]);
  };

  const removeRow = (idx: number) => {
    if (grid.length > 1) {
      setGrid(prev => prev.filter((_, i) => i !== idx));
    } else {
      toast.error("At least one row is required!");
    }
  };

  const updateGrid = (idx: number, field: string, val: any) => {
    const newGrid = [...grid];
    newGrid[idx][field] = val;

    if (field === "itemId" || field === "unitId") {
      const itm = masters.items.find((i: any) => i.id === newGrid[idx].itemId);
      const conf = itm?.itemUnits?.find((u: any) => u.unitId === (field === "unitId" ? val : newGrid[idx].unitId));
      if (conf) {
        newGrid[idx].rate = Number(conf.rentRate);
        newGrid[idx].labour = Number(conf.labourRate);
        newGrid[idx].perUnitWgt = Number(conf.weight);
        newGrid[idx].lotValue = Number(conf.lotValue);
      }
    }
    
    if (field === "qty") {
      newGrid[idx].marka = `${newGrid[idx].lotNo}/${val || 0}`;
    }

    setGrid(newGrid);
  };

  const totals = useMemo(() => grid.reduce((acc, row) => {
    const unit = masters.units.find((u: any) => u.id === row.unitId);
    const rowQty = Number(row.qty) || 0;
    const gross = rowQty * (Number(row.perUnitWgt) || 0);
    const tare = rowQty * (unit ? Number(unit.emptyWeight) : 0);
    return { qty: acc.qty + rowQty, tare: acc.tare + tare, gross: acc.gross + gross, net: acc.net + (gross - tare) };
  }, { qty: 0, tare: 0, gross: 0, net: 0 }), [grid, masters.units]);

  const handleSave = async () => {
    if (!header.partyId) return toast.error("Select Merchant first!");
    setLoading(true);
    const loadId = toast.loading(viewMode === "NEW" ? "Saving Material Receipt..." : "Updating Material Receipt...");
    
    const url = viewMode === "NEW" ? "/api/inward/mr" : "/api/inward/mr/update";
    const method = viewMode === "NEW" ? "POST" : "PUT";

    try {
        const res = await fetch(url, { 
            method, 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ header, items: grid }) 
        });
        if (res.ok) { 
            const data = await res.json();
            toast.success(viewMode === "NEW" ? "MR Generated Successfully! ✅" : "MR Updated! ✅", { id: loadId, duration: 5000 }); 
            
            if (viewMode === "NEW") {
                const itemsWithNames = grid.map(g => ({
                    ...g,
                    itemName: masters.items.find((i:any) => i.id === g.itemId)?.tradeName || 'N/A',
                    unitName: masters.units.find((u:any) => u.id === g.unitId)?.unitName || 'N/A',
                    receivedQty: g.qty
                }));
                setPrintData({ 
                  header: { ...header, partyName: lastSelectedParty?.tradeName }, 
                  items: itemsWithNames,
                  totalQty: totals.qty
                });
                setShowSuccessModal(true);
                init();
            }
        } else { 
            const err = await res.json();
            toast.error(err.error || "Operation failed! ❌", { id: loadId }); 
        }
    } catch (err) { toast.error("Network Error! ❌", { id: loadId }); }
    finally { setLoading(false); }
  };

  return (
    <>
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* --- HIDDEN PRINT VIEW (DJ GREEN STORAGE SOLUTIONS STYLE) --- */}
      <div id="print-area" className="hidden print:block p-4 font-mono text-[13px] leading-relaxed text-black bg-white w-full">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tight">Material Receipt</h1>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black uppercase">DJ GREEN STORAGE SOLUTIONS (P) LTD.</h2>
            <p className="font-bold text-[11px]">PLOT NO. 1 NSM AZADPUR, DELHI-33</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-1 mb-4 border-t border-black pt-4">
          <div className="space-y-1">
            <div className="flex"><span className="w-28 font-bold">M.R.No.</span> <span>: {printData?.header?.mrNo || header.mrNo}</span></div>
            <div className="flex"><span className="w-28 font-bold">Party Name</span> <span>: {printData?.header?.partyName || lastSelectedParty?.tradeName || "---"}</span></div>
            <div className="flex"><span className="w-28 font-bold">Address</span> <span>: {printData?.header?.address || header.address || ":"}</span></div>
          </div>
          <div className="space-y-1">
            <div className="flex"><span className="w-28 font-bold text-right pr-4">Date</span> <span>: {formatDate(printData?.header?.mrDate || header.mrDate)}</span></div>
            <div className="flex"><span className="w-28 font-bold text-right pr-4">Truck-No.</span> <span>: {printData?.header?.truckNo || header.truckNo || ":"}</span></div>
            <div className="flex"><span className="w-28 font-bold text-right pr-4">Person</span> <span>: {printData?.header?.deliveryPerson || header.deliveryPerson || ":"}</span></div>
          </div>
        </div>

        {/* Table Header (Line Above & Below Only) */}
        <div className="border-t border-b border-black flex font-bold uppercase py-2 mb-2">
          <div className="w-[20%]">Marka</div>
          <div className="w-[35%]">Item</div>
          <div className="w-[15%] text-center">Qty</div>
          <div className="w-[10%] text-center">Unit</div>
          <div className="w-[20%] text-right pr-2">Location/Remarks</div>
        </div>

        {/* Table Rows (No Vertical Borders) */}
        <div className="min-h-[300px]">
          {(printData?.items || grid).map((row: any, idx: number) => (
            <div key={idx} className="flex py-1.5 border-b border-dotted border-gray-300">
              <div className="w-[20%]">{row.marka || "---"}</div>
              <div className="w-[35%] font-bold">{row.itemName || masters.items.find((i:any) => i.id === row.itemId)?.tradeName || "---"}</div>
              <div className="w-[15%] text-center font-bold">{row.qty || row.receivedQty || 0}</div>
              <div className="w-[10%] text-center uppercase">{row.unitName || masters.units.find((u:any) => u.id === row.unitId)?.unitName || "CASES"}</div>
              <div className="w-[20%] text-right pr-2 italic">{row.location || row.remarks || "---"}</div>
            </div>
          ))}
        </div>

        {/* Footer Section (Line Above Total) */}
        <div className="border-t-2 border-black pt-2 flex flex-col items-end mb-8">
          <div className="flex gap-4">
            <span className="font-bold text-lg uppercase">Total :</span>
            <span className="font-black text-xl underline underline-offset-4 decoration-double">{printData?.totalQty || totals.qty}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 mt-16">
          <div className="space-y-12">
             <div className="text-[10px] italic leading-tight w-3/4">
                <span className="font-bold">Terms and Conditions :</span><br/>
                I have read, accepted and received a copy of the terms and conditions of storage of goods in the cold storage.
             </div>
             <div className="border-t border-black pt-1 w-56 text-center font-bold">(Customer Signature)</div>
          </div>
          <div className="flex flex-col items-center justify-end">
             <p className="font-bold mb-12 uppercase">For DJ GREEN STORAGE SOLUTIONS (P) LTD.</p>
             <div className="border-t border-black pt-1 w-64 text-center font-black uppercase">Authorized Signatory</div>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-6 backdrop-blur-md no-print">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col items-center p-10 animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
            
            <div className="bg-green-100 text-green-600 p-6 rounded-full mb-6 shadow-inner">
               <Check size={64} strokeWidth={3}/>
            </div>

            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2 text-center">
               Record Saved Successfully!
            </h2>
            <p className="text-slate-500 font-bold text-lg mb-8 text-center">
              Material Receipt <span className="text-indigo-600">#{printData?.header?.mrNo}</span> has been committed to the database.
            </p>

            <div className="grid grid-cols-1 w-full gap-4">
               <button 
                 onClick={() => { window.print(); }} 
                 className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 text-lg uppercase tracking-widest"
               >
                 <Printer size={24}/> Print Receipt Now
               </button>
               
               <button 
                 onClick={() => { 
                   setShowSuccessModal(false); 
                   setPrintData(null); 
                 }} 
                 className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition-all text-sm uppercase tracking-widest"
               >
                 Create Next Entry
               </button>
            </div>

            <div className="mt-8 text-[10px] text-slate-300 font-black uppercase tracking-[3px]">
               Cold Storage Management System v2.0
            </div>
          </div>
        </div>
      )}

      {/* TOP ACTIONS */}
      <div className="flex justify-between bg-white p-3 rounded shadow-sm border no-print">
        <div className="flex gap-2">
          <button onClick={() => router.push('/inward/register')} className="bg-red-600 text-white px-5 py-1.5 rounded font-black uppercase shadow hover:bg-red-700 transition-all flex items-center gap-2">
            <Search size={14}/> View Register
          </button>
          <button onClick={() => router.push('/inward/printing')} className="bg-purple-600 text-white px-5 py-1.5 rounded font-black uppercase shadow hover:bg-purple-700 transition-all flex items-center gap-2">
            <QrCode size={14}/> QR Labels
          </button>
          <div className={`px-6 py-1.5 rounded-full font-black uppercase flex items-center gap-2 border-2 ${header.paymentPref === 'Cash' ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
             {header.paymentPref} PARTY
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchHistory("back")} 
            disabled={loading}
            className="bg-slate-700 text-white px-4 py-1.5 rounded font-black flex items-center gap-2 shadow hover:bg-black transition-all active:scale-95"
          >
             Back
          </button>
          <button 
            onClick={() => fetchHistory("next")} 
            disabled={loading || viewMode === "NEW"}
            className="bg-slate-700 text-white px-4 py-1.5 rounded font-black flex items-center gap-2 shadow hover:bg-black transition-all active:scale-95 disabled:opacity-30"
          >
             Next
          </button>
          {viewMode === "HISTORY" && (
            <button 
              onClick={handleNew}
              className="bg-orange-500 text-white px-4 py-1.5 rounded font-black uppercase shadow animate-bounce"
            >
              New Entry
            </button>
          )}
          <button onClick={handleSave} className="bg-[#10b981] hover:bg-green-700 text-white px-8 py-1.5 rounded font-black flex items-center gap-2 shadow-lg active:scale-95 uppercase">
            {viewMode === "NEW" ? <Save size={16}/> : <Database size={16}/>} 
            {viewMode === "NEW" ? "Save & Finalize" : "Update Record"}
          </button>
          
          <button 
            onClick={handlePrint} 
            disabled={viewMode === "NEW"}
            className={`px-8 py-1.5 rounded font-black flex items-center gap-2 shadow uppercase transition-all ${viewMode === "NEW" ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#3498db] text-white hover:bg-blue-600'}`}
          >
            <Printer size={16}/> Print
          </button>

          <button onClick={() => window.location.reload()} className="bg-slate-200 text-slate-700 p-1.5 rounded shadow hover:bg-slate-300">
            <RotateCcw size={18}/>
          </button>
        </div>
      </div>

      <div className={`${viewMode === "NEW" ? 'bg-[#4a4ea3]' : 'bg-slate-600'} text-white p-2 rounded-t-lg font-black text-center uppercase tracking-[5px] italic shadow-md border-b-4 ${viewMode === "NEW" ? 'border-indigo-400' : 'border-slate-400'} transition-colors duration-500`}>
        {viewMode === "NEW" ? "Material Inward (MR) | Warehouse Receipt Entry" : `Editing Historical Record | MR No. ${header.mrNo}`}
      </div>

      {/* HEADER FORM */}
      <div className="bg-white p-8 border rounded-b-lg shadow-2xl grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end no-print">
        <div className="md:col-span-3 space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest text-center block">Material Receipt No.</label>
          <input readOnly className="w-full border-2 border-slate-100 p-2.5 rounded-lg bg-slate-100 font-black text-indigo-700 text-center text-lg" value={header.mrNo || ""} />
        </div>
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest">Entry Date *</label>
          <input type="date" className="w-full border-2 border-slate-100 p-2.5 rounded bg-white font-bold outline-none focus:border-indigo-400" value={header.mrDate} onChange={e => setHeader({...header, mrDate: e.target.value})} />
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="font-black text-indigo-700 uppercase text-[9px] tracking-widest flex items-center gap-1"><Landmark size={10}/> Search Merchant / Kisan Account *</label>
          <SearchableSelect 
            options={masters.parties} value={header.partyId} 
            onChange={handlePartyChange} displayKey="tradeName" secondaryKey="partyCode" 
            placeholder="--- TYPE NAME TO SEARCH ---" 
          />
        </div>
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px]">Billing Mode</label>
          <select disabled className="w-full border-2 border-slate-100 p-2.5 rounded bg-slate-50 font-bold outline-none shadow-inner text-indigo-700 cursor-not-allowed" value={header.billingType}>
            <option>General</option>
            <option>Nill Lot Bill</option>
            <option>Balance Only</option>
            <option>Monthly Bill</option>
            <option>Weekly Bill</option>
            <option>Fixed Rate</option>
            <option>Item/Day Logic</option>
            <option>Transport Bill</option>
            <option>Space Occupancy</option>
            <option>CA Commission</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px]">Truck Number</label>
          <input className="w-full border-2 border-slate-100 p-2.5 rounded bg-white font-mono uppercase font-black text-slate-700 shadow-inner" placeholder="UP-14-BT-..." value={header.truckNo || ""} onChange={e => setHeader({...header, truckNo: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px]">Delivery Boy</label>
          <input className="w-full border-2 border-slate-100 p-2.5 rounded bg-white font-bold uppercase shadow-inner" placeholder="NAME" value={header.deliveryPerson || ""} onChange={e => setHeader({...header, deliveryPerson: e.target.value})} />
        </div>
        <div className="md:col-span-3 space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px]">Merchant Address (Auto-Fill)</label>
          <input readOnly className="w-full border-2 border-slate-50 p-2.5 rounded bg-slate-50 text-gray-400 italic" value={header.address || ""} />
        </div>
        <div className="md:col-span-5 space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px]">Special Remarks / E-Way Bill</label>
          <input className="w-full border-2 border-slate-100 p-2.5 rounded bg-white outline-none italic shadow-inner font-bold" placeholder="E-Way Bill or notes..." value={header.remarksEWay || ""} onChange={e => setHeader({...header, remarksEWay: e.target.value})} />
        </div>
      </div>

      {/* --- GRID TABLE (LOT NO FIRST + ALL FIELDS) --- */}
      <div className="bg-white border rounded shadow-xl overflow-x-auto min-h-[250px] no-print">
        <table className="w-full border-collapse min-w-[2100px] text-left">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 border-r border-indigo-200 bg-indigo-100 w-28 text-center text-indigo-900">LOT NO.</th>
              <th className="p-3 border-r border-slate-300 w-64">ITEM DESCRIPTION *</th>
              <th className="p-3 border-r border-slate-300 w-48">PACKING TYPE *</th>
              <th className="p-3 border-r border-slate-300 w-24 text-center">BAG QTY *</th>
              <th className="p-3 border-r border-slate-300 w-32">MARKA</th>
              <th className="p-3 border-r border-slate-300 w-32">VARIETY</th>
              <th className="p-3 border-r border-slate-300 w-48"><MapPin size={10} className="inline mr-1"/> CHAMBER *</th>
              <th className="p-3 border-r border-slate-300 w-16 text-center">FLR</th>
              <th className="p-3 border-r border-slate-300 w-16 text-center">PLR</th>
              <th className="p-3 border-r border-slate-300 w-28 text-center text-green-700 bg-green-50">LOT VALUE</th>
              <th className="p-3 border-r border-slate-300 w-24 text-center text-red-600">UNIT WGT</th>
              <th className="p-3 border-r border-slate-300 w-20 text-center italic">RENT</th>
              <th className="p-3 border-r border-slate-300 w-20 text-center italic">LAB</th>
              <th className="p-3 border-r border-slate-300">REMARKS</th>
              <th className="p-3 text-center w-20 bg-indigo-50">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {grid.map((row, idx) => (
              <tr key={idx} className="hover:bg-indigo-50/50 transition-all border-b border-slate-200 font-bold group">
                <td className="p-1 border-r border-indigo-200 bg-indigo-50/30 text-center font-black text-indigo-800 text-sm">{row.lotNo}</td>
                <td className="p-1 border-r border-slate-200"><SearchableSelect options={masters.items} value={row.itemId} onChange={(val: any) => updateGrid(idx, "itemId", val)} placeholder="-- ITEM --" /></td>
                <td className="p-1 border-r border-slate-200"><SearchableSelect options={masters.units} value={row.unitId} onChange={(val: any) => updateGrid(idx, "unitId", val)} placeholder="-- UNIT --" /></td>
                <td className="p-1 border-r border-slate-200 bg-yellow-50/30"><input type="number" className="w-full p-2 text-center font-black text-blue-700 bg-transparent outline-none text-lg" value={row.qty || ""} onChange={e => updateGrid(idx, "qty", parseFloat(e.target.value))} /></td>
                <td className="p-1 border-r border-slate-200"><input className="w-full p-2 bg-transparent outline-none uppercase font-bold" placeholder="MARKA" value={row.marka || ""} onChange={e => updateGrid(idx, "marka", e.target.value.toUpperCase())} /></td>
                <td className="p-1 border-r border-slate-200"><input className="w-full p-2 bg-transparent outline-none uppercase font-bold text-orange-800" placeholder="VARIETY" value={row.variety || ""} onChange={e => updateGrid(idx, "variety", e.target.value.toUpperCase())} /></td>
                <td className="p-1 border-r border-slate-200"><SearchableSelect options={masters.chambers} value={row.chamberId || ""} onChange={(val: any) => updateGrid(idx, "chamberId", val)} placeholder="CHAMBER" /></td>
                <td className="p-1 border-r border-slate-200"><input className="w-full p-2 text-center bg-transparent outline-none shadow-inner" placeholder="0" value={row.floor || ""} onChange={e => updateGrid(idx, "floor", e.target.value)} /></td>
                <td className="p-1 border-r border-slate-200"><input className="w-full p-2 text-center bg-transparent outline-none shadow-inner" placeholder="0" value={row.pillar || ""} onChange={e => updateGrid(idx, "pillar", e.target.value)} /></td>
                <td className="p-1 border-r border-slate-200 bg-green-50/30">
                  <div className="flex items-center justify-center gap-1 font-black text-green-700">
                    <span>₹</span><input type="number" className="w-full text-center bg-transparent outline-none" value={row.lotValue || ""} onChange={e => updateGrid(idx, "lotValue", parseFloat(e.target.value))} />
                  </div>
                </td>
                <td className="p-1 border-r border-slate-200 bg-red-50/20"><input type="number" className="w-full p-2 text-center font-black text-red-600 bg-transparent outline-none" value={row.perUnitWgt || ""} onChange={e => updateGrid(idx, "perUnitWgt", parseFloat(e.target.value))} /></td>
                <td className="p-1 border-r border-slate-200 text-center text-slate-400 italic">₹{row.rate || 0}</td>
                <td className="p-1 border-r border-slate-200 text-center text-slate-400 italic">₹{row.labour || 0}</td>
                <td className="p-1 border-r border-slate-200"><input className="w-full p-2 bg-transparent outline-none font-normal" placeholder="..." value={row.remarks || ""} onChange={e => updateGrid(idx, "remarks", e.target.value)} /></td>
                <td className="p-1 text-center bg-indigo-50/50">
                   <div className="flex justify-center items-center gap-3 py-2">
                    <button onClick={addRow} className="text-blue-600 hover:scale-125 transition-all"><Plus size={20}/></button>
                    <button onClick={() => removeRow(idx)} className="text-red-500 hover:scale-125 transition-all"><Trash2 size={18}/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- FOOTER WEIGHT ENGINE --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 p-8 bg-[#1e293b] rounded-xl shadow-2xl border-t-4 border-indigo-500 text-white relative overflow-hidden no-print">
        <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Total Unit Qty</p><div className="text-5xl font-black italic">{totals.qty}</div></div>
        <div className="space-y-1 text-red-400"><p className="text-[10px] font-black uppercase tracking-[3px]">Tare Weight (Bori)</p><div className="text-5xl font-black italic">{totals.tare.toFixed(2)} <span className="text-xs uppercase font-normal text-white">Kg</span></div></div>
        <div className="space-y-1 text-green-400"><p className="text-[10px] font-black uppercase tracking-[3px]">Gross Weight</p><div className="text-5xl font-black italic">{totals.gross.toFixed(2)} <span className="text-xs uppercase font-normal text-white">Kg</span></div></div>
        <div className="bg-indigo-600 p-6 rounded-2xl text-center shadow-inner ring-4 ring-indigo-500/50">
          <p className="text-[11px] font-black uppercase tracking-[5px] text-white/80 mb-2">Net Stored Weight</p>
          <div className="text-5xl font-black text-yellow-300 italic">{totals.net.toFixed(2)} <span className="text-sm font-black">KG</span></div>
        </div>
      </div>
    </div>

    {/* STYLES FOR PRINTING (Master Rule to hide everything except print-area) */}
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
        @page { size: landscape; margin: 0; }
      }
    `}</style>
    </>
  );
}
