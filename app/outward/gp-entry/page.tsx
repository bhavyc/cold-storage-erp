"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Save, Printer, Database, Search, X, Trash2, Plus, ClipboardCheck, RotateCcw, Import, Info, History, LayoutList, Truck, MapPin, Tag, Landmark, Check, ChevronsUpDown, Package, Wallet, ShieldAlert } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

// --- SEARCHABLE SELECT COMPONENT ---
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
            placeholder="Type name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {filtered.length > 0 ? filtered.map((opt: any) => (
              <div 
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(""); }}
                className="p-2.5 hover:bg-indigo-600 hover:text-white cursor-pointer flex justify-between items-center border-b border-slate-50 font-bold text-[11px]"
              >
                <span>{opt[displayKey]} <span className="opacity-60 text-[9px]">({opt[secondaryKey]})</span></span>
                {value === opt.id && <Check size={14} />}
              </div>
            )) : <div className="p-4 text-center text-slate-400 italic text-[11px]">No Merchant Found</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE ---
const initialRow = { 
  lotId: "", lotNo: "", itemName: "", packing: "", marka: "", 
  balQty: 0, recQty: 0, recWgt: 0, perUnitWgt: 0, gpQty: 0, gpWgt: 0, 
  location: "", demandNo: "", demandId: "", lotValue: 0
};

export default function GPEntryPage() {
  const router = useRouter();
  const [parties, setParties] = useState<any[]>([]);
  const [partyStats, setPartyStats] = useState<any>(null); // To store Cash/Credit info
  const [header, setHeader] = useState({
    gpNo: "", gpDate: new Date().toISOString().split('T')[0],
    partyId: "", partyCode: "", stateCode: "06", stateName: "Haryana",
    deliveryPerson: "", transportRequired: "Yes", grNo: "", truckNo: "", 
    remarks: "", transporterName: ""
  });
  const [grid, setGrid] = useState<any[]>([initialRow]);
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [pendingDemands, setPendingDemands] = useState<any[]>([]);
  const [modalSearch, setModalSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableLots, setAvailableLots] = useState<any[]>([]); // For manual searching

  // Success Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  // Navigation States
  const [viewMode, setViewMode] = useState<"NEW" | "HISTORY">("NEW");
  const [lastNextNo, setLastNextNo] = useState(""); 

  const initGP = async () => {
    try {
      const res = await fetch("/api/outward/gp/next-no");
      const data = await res.json();
      setHeader(h => ({...h, gpNo: data.nextNo || "1"}));
      setLastNextNo(data.nextNo || "1");
    } catch (err) {
      toast.error("Failed to load GP sequence");
    }
  };

  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
    initGP();
  }, []);

  // Fetch Lots for the selected party for manual entry
  const fetchAvailableLots = async (partyId: string) => {
    try {
      const res = await fetch(`/api/outward/gp/lot-lookup?partyId=${partyId}`);
      const data = await res.json();
      setAvailableLots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch available lots:", err);
    }
  };

  const fetchHistory = async (dir: "back" | "next") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/outward/gp/history?currentNo=${header.gpNo}&direction=${dir}`);
      const data = await res.json();

      if (res.ok) {
        setHeader(data.header);
        setGrid(data.items);
        setViewMode("HISTORY");
        
        // Sync party stats (Balance/Credit info)
        const party = parties.find(p => p.id === data.header.partyId);
        if (party) {
          fetch(`/api/masters/party/${party.id}/balance`)
            .then(r => r.json())
            .then(balData => {
              setPartyStats({
                preference: party.paymentPreference || "Credit",
                limit: Number(party.maxAllowedCredit) || 0,
                outstanding: balData.outstanding || 0,
              });
            });
        }

        toast.success(`Viewing GP # ${data.header.gpNo}`);
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
    setHeader({
      gpNo: lastNextNo, gpDate: new Date().toISOString().split('T')[0],
      partyId: "", partyCode: "", stateCode: "06", stateName: "Haryana",
      deliveryPerson: "", transportRequired: "Yes", grNo: "", truckNo: "", 
      remarks: "", transporterName: ""
    });
    setGrid([initialRow]);
    setViewMode("NEW");
    setPartyStats(null);
    initGP();
    toast.success("Ready for New Entry");
  };

  const handlePartyChange = async (id: string) => {
    const party = parties.find(p => p.id === id);
    if (party) {
      setHeader({...header, partyId: id, partyCode: party.partyCode, stateCode: party.stateCode || "06", stateName: party.stateName || "Haryana"});
      fetchAvailableLots(id); // <--- Fetch lots for manual entry
      
      try {
        const balRes = await fetch(`/api/masters/party/${id}/balance`);
        const balData = await balRes.json();
        const outstanding = balData.outstanding || 0;

        setPartyStats({
          preference: party.paymentPreference || "Credit",
          limit: Number(party.maxAllowedCredit) || 0,
          outstanding,
        });
        toast.success(`Account Loaded: ${party.tradeName}`);
      } catch (err) {
        console.error("Failed to fetch balance:", err);
        setPartyStats({
          preference: party.paymentPreference || "Credit",
          limit: Number(party.maxAllowedCredit) || 0,
          outstanding: 0,
        });
        toast.error(`Account Loaded, but failed to fetch live balance.`);
      }
    }
  };

  const addManualRow = () => {
    if (!header.partyId) return toast.error("Select Merchant first!");
    setGrid([...grid, { ...initialRow, isManual: true }]);
  };

  

  const handleLotSelect = (idx: number, lotId: string) => {
    const lot = availableLots.find(l => l.id === lotId);
    if (!lot) return;

    const newGrid = [...grid];
    newGrid[idx] = {
      ...newGrid[idx],
      lotId: lot.id,
      lotNo: lot.lotNo,
      itemName: lot.itemName,
      packing: lot.unitName,
      balQty: lot.balanceQty,
      recQty: lot.receivedQty,
      recWgt: lot.totalNetWgt,
      perUnitWgt: lot.perUnitWgt,
      location: lot.location,
      marka: lot.marka,
      lotValue: lot.lotValue,
      isManual: true
    };
    setGrid(newGrid);
    toast.success(`Lot ${lot.lotNo} selected!`);
  };

  const updateGridRow = (idx: number, field: string, val: any) => {
    const newGrid = [...grid];
    newGrid[idx][field] = val;

    if (field === "gpQty") {
      const qty = parseInt(val) || 0;
      if (qty > newGrid[idx].balQty) {
        toast.error(`Error: Only ${newGrid[idx].balQty} left!`);
        newGrid[idx].gpQty = 0;
      } else {
        newGrid[idx].gpWgt = (qty * (Number(newGrid[idx].perUnitWgt) || 0)).toFixed(2);
      }
    }
    setGrid(newGrid);
  };

  const fetchDemands = async () => {
    if (!header.partyId) return toast.error("Select Merchant!");
    setLoading(true);
    try {
      const res = await fetch(`/api/outward/demand/register?partyId=${header.partyId}&status=Pending`);
      const data = await res.json();
      setPendingDemands(Array.isArray(data) ? data : []);
      setShowDemandModal(true);
    } finally { setLoading(false); }
  };

  const importDemand = (demand: any) => {
    const newRows = demand.items.map((it: any) => ({
      lotId: it.lotId, lotNo: it.lot.lotNo, itemName: it.lot.item.name,
      packing: it.lot.unit.name, marka: `${it.lot.lotNo}/${it.qty}`,
      recQty: it.lot.receivedQty, balQty: it.lot.balanceQty, 
      recWgt: Number(it.lot.totalNetWgt), perUnitWgt: Number(it.lot.perUnitWgt),
      gpQty: it.qty, gpWgt: (it.qty * Number(it.lot.perUnitWgt)).toFixed(2),
      location: `${it.lot.chamber.name}/${it.lot.floor || '0'}/${it.lot.pole || '0'}`,
      demandNo: demand.demandNo, demandId: demand.id, 
      lotValue: Number(it.lot.lotValue) || 0 
    }));
    setGrid(newRows);
    setShowDemandModal(false);
  };

  const totals = useMemo(() => grid.reduce((acc, r) => ({
    qty: acc.qty + (Number(r.gpQty) || 0),
    net: acc.net + (Number(r.gpWgt) || 0),
    tare: acc.tare + ((Number(r.gpQty) || 0) * 0.5) 
  }), { qty: 0, net: 0, tare: 0 }), [grid]);

  // 🚨 PRINT HANDLER
  const handlePrint = () => {
    if (viewMode === "NEW" && !printData) {
      return toast.error("Pehle Record Save karein, phir print nikalein!");
    }
    window.print();
  };

  const handleSave = async () => {
    if (!header.partyId) return toast.error("Select Merchant!");
    
    // BODYGUARD LOGIC
    if (partyStats?.preference === "Cash" && partyStats.outstanding > 0 && viewMode === "NEW") {
      return toast.error(`BLOCK: Kisan has ₹${partyStats.outstanding} pending! Cash party must settle bills first.`);
    }

    const validItems = grid
      .filter((r) => r.lotId && Number(r.gpQty) > 0)
      .map((r) => ({
        ...r,
        gpQty: Number(r.gpQty),
      }));

    if (validItems.length === 0) {
      return toast.error("Please add at least one valid item with quantity > 0");
    }

    const loadId = toast.loading(viewMode === "NEW" ? "Processing Gate Pass..." : "Updating Gate Pass...");
    
    const url = viewMode === "NEW" ? "/api/outward/gp" : "/api/outward/gp/update";
    const method = viewMode === "NEW" ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, items: validItems })
      });
      if (res.ok) {
        toast.success(viewMode === "NEW" ? "Gate Pass Generated Successfully! ✅" : "Gate Pass Updated! ✅", { id: loadId, duration: 5000 });
        if (viewMode === "NEW") {
            // Prepare Print Data & Show Modal
            setPrintData({ 
              header: { 
                ...header, 
                partyName: parties.find((p:any) => p.id === header.partyId)?.tradeName,
                gstNo: parties.find((p:any) => p.id === header.partyId)?.gstNo,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
              }, 
              items: validItems,
              totalQty: totals.qty
            });
            setShowSuccessModal(true);
            
            // Clear form
            handleNew();
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Operation Failed! ❌", { id: loadId, duration: 6000 });
      }
    } finally { toast.dismiss(loadId); }
  };

  return (
    <>
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* TOP ACTIONS */}
      <div className="flex justify-between items-center bg-white p-3 rounded border shadow-sm no-print">
        <div className="flex gap-2 text-[10px]">
          <button onClick={() => router.push('/outward/register-summary')} className="bg-red-600 text-white px-4 py-1.5 rounded font-black uppercase shadow hover:bg-red-700">Summary</button>
          <button onClick={() => router.push('/outward/register-detail')} className="bg-indigo-600 text-white px-4 py-1.5 rounded font-black uppercase shadow hover:bg-indigo-700">Entries</button>
        </div>

        {/* PAYMENT TYPE BADGE */}
        {partyStats && (
            <div className={`px-6 py-1.5 rounded-full font-black uppercase flex items-center gap-2 border-2 ${partyStats.preference === 'Cash' ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
               {partyStats.preference === 'Cash' ? <Wallet size={14}/> : <ShieldAlert size={14}/>}
               {partyStats.preference} PARTY 
               <span className="text-[9px] opacity-60 ml-2">| Bal: ₹{partyStats.outstanding}</span>
            </div>
        )}

        <div className="flex items-center gap-4">
          {/* NAVIGATION GROUP */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border shadow-inner">
            <button 
              onClick={() => fetchHistory("back")} 
              disabled={loading}
              className="p-1.5 hover:bg-white rounded-md transition-all disabled:opacity-30"
              title="Previous Record"
            >
              <History size={18} className="text-slate-600"/>
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button 
              onClick={() => fetchHistory("next")} 
              disabled={loading || viewMode === "NEW"}
              className="p-1.5 hover:bg-white rounded-md transition-all disabled:opacity-30"
              title="Next Record"
            >
              <History size={18} className="text-slate-600 rotate-180 scale-x-[-1]"/>
            </button>
            {viewMode === "HISTORY" && (
              <>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button 
                  onClick={handleNew}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-md font-bold text-[10px] hover:bg-indigo-700 transition-all"
                >
                  NEW
                </button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-[#10b981] hover:bg-green-700 text-white px-8 py-2 rounded font-black flex items-center gap-2 shadow-lg active:scale-95 uppercase transition-all">
              {viewMode === "NEW" ? <Save size={16}/> : <Database size={16}/>} 
              {viewMode === "NEW" ? "Save GP" : "Update"}
            </button>
            <button 
              onClick={handlePrint} 
              disabled={viewMode === "NEW"}
              className={`px-8 py-2 rounded font-black flex items-center gap-2 shadow uppercase transition-all ${viewMode === "NEW" ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'}`}
            >
              <Printer size={16}/> Print
            </button>
            <button onClick={() => window.location.reload()} className="bg-slate-100 text-slate-500 p-2 rounded hover:bg-slate-200 transition-all">
              <RotateCcw size={18}/>
            </button>
          </div>
        </div>
      </div>

      <div className={`${viewMode === "NEW" ? 'bg-[#5d5fb1]' : 'bg-slate-600'} text-white p-2 rounded-t font-black text-center uppercase tracking-[5px] italic shadow-md border-b-4 ${viewMode === "NEW" ? 'border-indigo-400' : 'border-slate-400'} transition-colors duration-500`}>
        {viewMode === "NEW" ? "Material Outward (Gate Pass) | Dispatch authorization" : `Editing Historical Dispatch | GP No. ${header.gpNo}`}
      </div>

      {/* HEADER FORM */}
      <div className="bg-white p-8 border rounded-b shadow-2xl grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end no-print">
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest text-center block">Gate Pass No.</label>
          <input readOnly className="w-full border-2 border-slate-100 p-2.5 rounded-lg bg-slate-100 font-black text-indigo-700 text-center text-lg" value={header.gpNo || ""} />
        </div>
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest">GP Date *</label>
          <input type="date" className="w-full border-2 border-slate-100 p-2.5 rounded-lg font-bold outline-none focus:border-indigo-400 shadow-inner" value={header.gpDate || ""} onChange={e => setHeader({...header, gpDate: e.target.value})} />
        </div>
        <div className="md:col-span-1 space-y-1">
          <label className="font-black text-indigo-700 uppercase text-[9px] tracking-widest flex items-center gap-1"><Landmark size={10}/> Search Merchant *</label>
          <SearchableSelect 
            options={parties} value={header.partyId || ""} onChange={handlePartyChange} 
            placeholder="--- SEARCH NAME ---" displayKey="tradeName" secondaryKey="partyCode"
          />
        </div>
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px] block">Transporter / Agency</label>
          <input className="w-full border-2 border-slate-100 p-2.5 rounded-lg outline-none font-bold uppercase shadow-inner text-blue-700" value={header.transporterName || ""} onChange={e => setHeader({...header, transporterName: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px] block">Driver/Rep Name</label>
          <input className="w-full border-2 border-slate-100 p-2.5 rounded-lg outline-none font-bold uppercase shadow-inner" value={header.deliveryPerson || ""} onChange={e => setHeader({...header, deliveryPerson: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px] block">Truck Number</label>
          <input className="w-full border-2 border-slate-100 p-2.5 rounded-lg font-mono uppercase font-black text-slate-700 shadow-inner" placeholder="UP-14..." value={header.truckNo || ""} onChange={e => setHeader({...header, truckNo: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px] block">GR/Bilty Ref</label>
          <input className="w-full border-2 border-slate-100 p-2.5 rounded-lg outline-none font-bold shadow-inner" value={header.grNo || ""} onChange={e => setHeader({...header, grNo: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px] block">Transport Req?</label>
          <select className="w-full border-2 border-slate-100 p-2.5 rounded-lg bg-white font-bold outline-none" value={header.transportRequired || "No"} onChange={e => setHeader({...header, transportRequired: e.target.value})}>
            <option>Yes</option><option>No</option>
          </select>
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px] block">Special Remarks</label>
          <input className="w-full border-2 border-slate-100 p-2.5 rounded-lg outline-none italic font-normal shadow-inner" value={header.remarks || ""} onChange={e => setHeader({...header, remarks: e.target.value})} />
        </div>
      </div>

      {/* GRID ACTIONS TOOLBAR */}
      <div className="flex justify-between items-center bg-indigo-50/50 p-2 rounded border border-indigo-100 no-print">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-md">
            <LayoutList size={16}/>
          </div>
          <span className="font-black uppercase tracking-widest text-[10px] text-indigo-900">Dispatch Grid</span>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={fetchDemands} 
             disabled={!header.partyId} 
             className="bg-white border-2 border-red-500 text-red-600 px-4 py-1.5 rounded-lg font-black uppercase text-[10px] flex items-center gap-2 hover:bg-red-50 transition-all disabled:opacity-50 shadow-sm"
           >
             <Import size={14}/> Import Booking
           </button>
           <button 
             onClick={addManualRow} 
             disabled={!header.partyId} 
             className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-black uppercase text-[10px] flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md border-b-2 border-indigo-900"
           >
             <Plus size={14}/> Add Manual Row
           </button>
        </div>
      </div>

      {/* --- GRID TABLE --- */}
      <div className="bg-white border rounded shadow-xl overflow-x-auto min-h-[250px]">
        <table className="w-full border-collapse min-w-[1800px] text-left">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 border-r border-indigo-200 bg-indigo-100 w-28 text-center">LOT NO.</th>
              <th className="p-3 border-r border-slate-300 w-48">ITEM NAME</th>
              <th className="p-3 border-r border-slate-300 w-32 text-center">PACKING</th>
              <th className="p-3 border-r border-slate-300 w-20 text-center">REC. QTY</th>
              <th className="p-3 border-r border-slate-300 w-40 bg-yellow-50 text-indigo-900 text-center italic font-black">MARKA (LOT/QTY)</th>
              <th className="p-3 border-r border-slate-300 w-24 text-center text-red-600 bg-red-50">BAL. QTY</th>
              <th className="p-3 border-r border-blue-300 bg-blue-100 text-blue-900 text-center w-28">GP QTY (OUT) *</th>
              <th className="p-3 border-r border-slate-300 text-center font-bold bg-slate-50 w-28">GP WGT (OUT)</th>
              <th className="p-4 border-r border-slate-300 w-48 text-center">LOCATION</th>
              <th className="p-3 border-r border-slate-300 w-24 text-center">BOOKING REF</th>
              <th className="p-3 border-r border-slate-300 w-28 text-center text-green-700 bg-green-50">LOT VALUE (₹)</th>
              <th className="p-3 text-center w-20 bg-indigo-50 no-print">ACTION</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {grid.map((row, idx) => (
              <tr key={idx} className="hover:bg-indigo-50/50 transition-all border-b border-slate-200 group">
                <td className="p-1 border-r border-indigo-200 bg-indigo-50/30 text-center font-black text-indigo-800 text-sm">
                  {row.isManual ? (
                    <SearchableSelect 
                      options={availableLots} 
                      value={row.lotId} 
                      onChange={(id: string) => handleLotSelect(idx, id)} 
                      placeholder="Search Lot"
                      displayKey="lotNo"
                      secondaryKey="itemName"
                    />
                  ) : (
                    row.lotNo || '---'
                  )}
                </td>
                <td className="p-1 border-r border-slate-200"><input className="w-full p-2 bg-transparent outline-none uppercase text-slate-700 font-black" value={row.itemName || ""} onChange={e => updateGridRow(idx, "itemName", e.target.value.toUpperCase())} /></td>
                <td className="p-1 border-r border-slate-200"><input className="w-full p-2 bg-transparent outline-none uppercase text-gray-500 text-center" value={row.packing || ""} onChange={e => updateGridRow(idx, "packing", e.target.value.toUpperCase())} /></td>
                <td className="p-1 border-r border-slate-200 text-center text-gray-400 font-normal">{row.recQty || 0}</td>
                <td className="p-1 border-r border-slate-200 bg-yellow-50 shadow-inner"><input className="w-full p-2 bg-transparent outline-none text-indigo-900 text-center font-black uppercase italic" value={row.marka || ""} onChange={e => updateGridRow(idx, "marka", e.target.value.toUpperCase())} /></td>
                <td className="p-1 border-r border-slate-200 text-center font-black text-red-600 bg-red-50/20">{row.balQty || 0}</td>
                <td className="p-1 border-r border-blue-300 bg-blue-50 shadow-inner">
                  <input type="number" className="w-full p-2 text-center font-black text-blue-700 bg-transparent outline-none text-lg" value={row.gpQty || ""} onChange={e => updateGridRow(idx, "gpQty", e.target.value)} />
                </td>
                <td className="p-1 border-r border-slate-200 bg-slate-50/50 shadow-inner"><input type="number" className="w-full p-2 text-center font-black text-slate-900 bg-transparent outline-none" value={row.gpWgt || ""} onChange={e => updateGridRow(idx, "gpWgt", e.target.value)} /></td>
                <td className="p-1 border-r border-slate-200 italic text-gray-400 text-[10px] text-center"><input className="w-full p-2 bg-transparent outline-none text-center" value={row.location || ""} onChange={e => updateGridRow(idx, "location", e.target.value)} /></td>
                <td className="p-3 border-r border-slate-200 text-center font-black text-indigo-900 uppercase">{row.demandNo || '---'}</td>
                <td className="p-1 border-r border-slate-200 bg-green-50/30 shadow-inner"><input type="number" className="w-full p-2 text-center font-black text-green-700 bg-transparent outline-none" value={row.lotValue || ""} onChange={e => updateGridRow(idx, "lotValue", e.target.value)} /></td>
                <td className="p-1 text-center bg-indigo-50/50 no-print">
                   <button onClick={() => setGrid(grid.filter((_, i) => i !== idx || grid.length > 1))} className="text-red-500 hover:scale-125 transition-all p-1"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- FOOTER WEIGHTS (Image Exact Replication) --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 p-8 bg-[#1e293b] rounded-xl shadow-2xl border-t-4 border-indigo-500 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 p-2 opacity-5"><Truck size={120}/></div>
        <div className="space-y-1 text-center border-r border-slate-700">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Total Dispatch Bags</p>
          <div className="text-5xl font-black italic text-blue-400">{totals.qty}</div>
        </div>
        <div className="space-y-1 text-center border-r border-slate-700">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-[3px]">Tare Weight Deduction</p>
          <div className="text-5xl font-black italic text-red-400">{totals.tare.toFixed(2)} <span className="text-xs">Kg</span></div>
        </div>
        <div className="space-y-1 text-center border-r border-slate-700">
          <p className="text-[10px] font-black text-green-400 uppercase tracking-[3px]">Gross Material Load</p>
          <div className="text-5xl font-black italic text-green-400">{totals.net.toFixed(2)} <span className="text-xs">Kg</span></div>
        </div>
        <div className="bg-indigo-600 p-6 rounded-2xl text-center shadow-inner ring-4 ring-indigo-500/50 relative z-10">
          <p className="text-[11px] font-black uppercase tracking-[5px] text-white/80 mb-2 underline underline-offset-8">Net Stored Deduction</p>
          <div className="text-5xl font-black tracking-tighter text-yellow-300 italic">{totals.net.toFixed(2)} <span className="text-sm font-black text-white ml-1">KG</span></div>
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

      {/* MODAL (WITH SEARCH) */}
      {showDemandModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col h-[75vh] animate-in zoom-in duration-300 overflow-hidden">
            <div className="bg-[#4a4ea3] text-white p-6 flex justify-between items-center border-b-4 border-indigo-400">
              <div className="flex items-center gap-4">
                 <div className="bg-white/20 p-3 rounded-2xl shadow-inner"><ClipboardCheck size={32}/></div>
                 <div><h3 className="font-black uppercase tracking-[3px] text-lg leading-none">Import Verified Booking</h3><p className="text-xs opacity-70 mt-1">Select a booking record to fulfill the dispatch</p></div>
              </div>
              <button onClick={() => setShowDemandModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-all"><X size={32}/></button>
            </div>
            <div className="p-4 bg-slate-50 border-b flex gap-4 items-center">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                  <input placeholder="Search Booking No..." className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-indigo-400 font-bold" value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6"><th>Demand No</th><th>Date</th><th>Stock Breakdown</th><th className="text-center">Action</th></tr></thead>
                <tbody>
                  {pendingDemands.filter(d => d.demandNo.includes(modalSearch)).map(d => (
                    <tr key={d.id} className="bg-white shadow-sm hover:shadow-xl transition-all rounded-2xl group border border-slate-100">
                      <td className="p-5 font-black text-blue-700 text-lg rounded-l-2xl border-l-4 border-blue-500">{d.demandNo}</td>
                      <td className="p-5 text-slate-500 font-bold">{new Date(d.date).toLocaleDateString('en-GB')}</td>
                      <td className="p-5 font-black text-slate-800 uppercase text-xs">{d.items.length} Distinct Lots</td>
                      <td className="p-5 text-center rounded-r-2xl">
                        <button onClick={() => importDemand(d)} className="bg-[#10b981] text-white px-10 py-2.5 rounded-full font-black text-[10px] shadow-lg hover:bg-black uppercase tracking-tighter active:scale-95 transition-all">Select booking</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendingDemands.length === 0 && <div className="text-center py-20 text-gray-400 italic font-black uppercase tracking-widest text-xs">No pending bookings found for this merchant</div>}
            </div>
          </div>
        </div>
      )}
      {/* --- HIDDEN PRINT VIEW (DJ GREEN STORAGE SOLUTIONS STYLE) --- */}
      <div id="print-area" className="hidden print:block p-8 font-mono text-[14px] leading-relaxed text-black bg-white w-full">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Gate Pass</h1>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black uppercase">DJ GREEN STORAGE SOLUTIONS (P) LTD.</h2>
            <p className="font-bold text-[12px]">PLOT NO. 1 NSM AZADPUR, DELHI-33</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-20 mb-4 border-t-2 border-black pt-4">
          <div className="space-y-1">
            <div className="flex"><span className="w-28 font-bold">G.P. No.</span> <span>: {printData?.header?.gpNo || header.gpNo}</span></div>
            <div className="flex shrink-0"><span className="w-28 font-bold">Party Name</span> <span className="flex-1">: {printData?.header?.partyName || parties.find((p:any) => p.id === (printData?.header?.partyId || header.partyId))?.tradeName || '---'} {printData?.header?.gstNo || parties.find((p:any) => p.id === (printData?.header?.partyId || header.partyId))?.gstNo ? `, GSTIN NO ${printData?.header?.gstNo || parties.find((p:any) => p.id === (printData?.header?.partyId || header.partyId))?.gstNo}` : ""}</span></div>
          </div>
          <div className="space-y-1 text-right">
            <div className="flex justify-end"><span className="w-28 font-bold text-left">Time</span> <span className="w-32 text-left">: {printData?.header?.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>
            <div className="flex justify-end"><span className="w-28 font-bold text-left">Date</span> <span className="w-32 text-left">: {formatDate(printData?.header?.gpDate || header.gpDate)}</span></div>
            <div className="flex justify-end"><span className="w-28 font-bold text-left">Driver</span> <span className="w-32 text-left">: {printData?.header?.deliveryPerson || header.deliveryPerson || "---"}</span></div>
          </div>
        </div>

        {/* Table Header (Lines Only) */}
        <div className="border-t-2 border-b-2 border-black flex font-black uppercase py-2 mb-2">
          <div className="w-[15%]">LOT-NO</div>
          <div className="w-[35%]">Item Name</div>
          <div className="w-[15%] text-center">Quantity</div>
          <div className="w-[15%] text-center">Packing</div>
          <div className="w-[20%] text-right pr-2">Location/Remarks</div>
        </div>

        {/* Table Rows (No Borders) */}
        <div className="min-h-[250px]">
          {(printData?.items || grid).map((row: any, idx: number) => (
            <div key={idx} className="flex py-1 text-[13px]">
              <div className="w-[15%] font-bold">{row.lotNo || "---"}</div>
              <div className="w-[35%] font-black uppercase">{row.itemName || "---"}</div>
              <div className="w-[15%] text-center font-black">{row.gpQty || 0}</div>
              <div className="w-[15%] text-center uppercase">{row.packing || "CASES"}</div>
              <div className="w-[20%] text-right pr-2 uppercase font-bold">{row.location || "---"}</div>
            </div>
          ))}
        </div>

        {/* Footer Section */}
        <div className="border-t-2 border-black pt-4 flex flex-col items-center mb-8">
          <div className="flex gap-4">
            <span className="font-black text-xl uppercase">Total :</span>
            <span className="font-black text-xl underline underline-offset-8 decoration-2">{printData?.totalQty || totals.qty}</span>
          </div>
        </div>

        <div className="mt-8">
            <p className="text-[12px] font-bold leading-tight mb-20">
                Received the above goods in good and satisfactory condition with copy of Gate Pass.
            </p>
            <div className="flex justify-between items-end px-10">
               <div className="border-t-2 border-black pt-2 w-64 text-center font-black text-[13px]">(Customer Signature)</div>
               <div className="border-t-2 border-black pt-2 w-64 text-center font-black text-[13px]">Store Keeper : ( admin )</div>
            </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-6 backdrop-blur-md no-print">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col items-center p-10 animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            <div className="bg-blue-100 text-blue-600 p-6 rounded-full mb-6 shadow-inner">
               <ClipboardCheck size={64} strokeWidth={3}/>
            </div>

            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2 text-center">
               Gate Pass Generated!
            </h2>
            <p className="text-slate-500 font-bold text-lg mb-8 text-center">
               GP No <span className="text-indigo-600">#{printData?.header?.gpNo}</span> is ready for dispatch.
            </p>

            <div className="grid grid-cols-1 w-full gap-4">
               <button 
                 onClick={() => { window.print(); }} 
                 className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 text-lg uppercase tracking-widest"
               >
                 <Printer size={24}/> Print Gate Pass
               </button>
               
               <button 
                 onClick={() => { 
                   setShowSuccessModal(false); 
                   setPrintData(null); 
                 }} 
                 className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition-all text-sm uppercase tracking-widest"
               >
                 Go Back to Entry
               </button>
            </div>

            <div className="mt-8 text-[10px] text-slate-300 font-black uppercase tracking-[3px]">
               Cold Storage Management System v2.0
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
