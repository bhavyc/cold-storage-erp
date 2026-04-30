"use client";

import React, { useState, useEffect } from "react";
import { Search, Printer, QrCode, Landmark, Tag, Calendar ,RefreshCcw} from "lucide-react";
import { toast } from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";

// STRICT TYPES
interface LotLabelData {
  id: string;
  lotNo: string;
  arrivalDate: string;
  receivedQty: number;
  marka: string | null;
  party: { tradeName: string };
  item: { name: string };
  unit: { name: string };
}

export default function LabelPrintingPage() {
  const [filters, setFilters] = useState({
    fromLot: "",
    toLot: "",
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    partyId: "All",
    itemId: "All",
    noOfTimes: 1,
    orientation: "Horizontal"
  });

  const [lots, setLots] = useState<LotLabelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [masters, setMasters] = useState({ parties: [], items: [] });

  // 1. Initial Load: Fetch Masters for Dropdowns
  useEffect(() => {
    Promise.all([
      fetch("/api/masters/party").then(res => res.json()),
      fetch("/api/masters/items").then(res => res.json())
    ]).then(([p, i]) => setMasters({ parties: p, items: i }));
  }, []);

  // 2. Search Logic (Enhanced with Multiple Filters)
  const handleSearch = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters as any).toString();
      const res = await fetch(`/api/inward/labels?${query}`);
      const data = await res.json();
      if (res.ok) {
        setLots(data);
        if (data.length === 0) toast.error("No lots found for these filters");
        else toast.success(`Found ${data.length} lots`);
      } else {
        toast.error(data.error || "Search failed");
      }
    } catch (err) {
      toast.error("Error fetching labels");
    } finally {
      setLoading(false);
    }
  };

  // 3. Automation: Print Trigger
  const handlePrint = () => {
    if (lots.length === 0) return toast.error("Search for lots first");
    window.print();
  };

  return (
    <div className="space-y-4 text-xs">
      {/* UI SECTION (Hidden during print) */}
      <div className="no-print space-y-4">
        {/* Cold Storage Header */}
        <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
          <h2 className="font-bold uppercase flex items-center gap-2 tracking-widest italic">
            <QrCode size={18}/> Warehouse Logistics | Smart Label Printing
          </h2>
          <span className="text-[9px] opacity-60 uppercase font-black">Cold Storage Intelligence</span>
        </div>

        {/* ENHANCED FILTER BOX */}
        <div className="bg-white p-6 border rounded-b-lg shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
             {/* Lot Range */}
             <div className="space-y-1">
                <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest">From Lot</label>
                <input 
                  className="w-full border-2 border-slate-100 p-2 rounded font-black text-indigo-700 outline-none focus:border-indigo-400" 
                  value={filters.fromLot}
                  onChange={e => setFilters({...filters, fromLot: e.target.value})}
                  placeholder="e.g. 1001"
                />
             </div>
             <div className="space-y-1">
                <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest">To Lot</label>
                <input 
                  className="w-full border-2 border-slate-100 p-2 rounded font-black text-indigo-700 outline-none focus:border-indigo-400" 
                  value={filters.toLot}
                  onChange={e => setFilters({...filters, toLot: e.target.value})}
                  placeholder="e.g. 1010"
                />
             </div>

             {/* Date Range */}
             <div className="space-y-1">
                <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest flex items-center gap-1"><Calendar size={10}/> From Date</label>
                <input 
                  type="date"
                  className="w-full border-2 border-slate-100 p-2 rounded font-bold outline-none" 
                  value={filters.fromDate}
                  onChange={e => setFilters({...filters, fromDate: e.target.value})}
                />
             </div>
             <div className="space-y-1">
                <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest flex items-center gap-1"><Calendar size={10}/> To Date</label>
                <input 
                  type="date"
                  className="w-full border-2 border-slate-100 p-2 rounded font-bold outline-none" 
                  value={filters.toDate}
                  onChange={e => setFilters({...filters, toDate: e.target.value})}
                />
             </div>

             {/* Copies & Orientation */}
             <div className="space-y-1">
                <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest">No. Of Copies</label>
                <input 
                  type="number"
                  min={1}
                  className="w-full border-2 border-slate-100 p-2 rounded font-black text-center text-orange-600 outline-none" 
                  value={filters.noOfTimes}
                  onChange={e => setFilters({...filters, noOfTimes: parseInt(e.target.value) || 1})}
                />
             </div>
             <div className="space-y-1">
                <label className="font-black text-gray-400 uppercase text-[9px] tracking-widest">Layout</label>
                <select 
                  className="w-full border-2 border-slate-100 p-2 rounded font-bold outline-none bg-white"
                  value={filters.orientation}
                  onChange={e => setFilters({...filters, orientation: e.target.value})}
                >
                  <option value="Horizontal">2 Per Row (A4)</option>
                  <option value="Vertical">1 Per Row (Single)</option>
                </select>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
             {/* Party & Item */}
             <div className="md:col-span-1 space-y-1">
                <label className="font-black text-indigo-700 uppercase text-[9px] tracking-widest flex items-center gap-1"><Landmark size={10}/> Filter By Merchant</label>
                <select 
                  className="w-full border-2 border-indigo-50 p-2 rounded-lg font-black text-blue-900 outline-none shadow-sm"
                  value={filters.partyId}
                  onChange={e => setFilters({...filters, partyId: e.target.value})}
                >
                  <option value="All">--- ALL REGISTERED PARTIES ---</option>
                  {masters.parties.map((p: any) => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
                </select>
             </div>
             <div className="md:col-span-1 space-y-1">
                <label className="font-black text-indigo-700 uppercase text-[9px] tracking-widest flex items-center gap-1"><Tag size={10}/> Filter By Item</label>
                <select 
                  className="w-full border-2 border-indigo-50 p-2 rounded-lg font-bold outline-none shadow-sm"
                  value={filters.itemId}
                  onChange={e => setFilters({...filters, itemId: e.target.value})}
                >
                  <option value="All">--- ALL ITEMS ---</option>
                  {masters.items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
             </div>

             <div className="flex gap-2">
                <button 
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black uppercase hover:bg-indigo-800 transition-all shadow-xl flex-1 flex items-center justify-center gap-3 active:scale-95"
                >
                  {loading ? <RefreshCcw size={18} className="animate-spin"/> : <><Search size={18}/> Smart Search</>}
                </button>

                <button 
                  onClick={handlePrint}
                  className="bg-orange-500 text-white p-3 rounded-xl hover:bg-orange-600 transition-all shadow-xl flex items-center justify-center active:scale-90"
                  title="Print Labels"
                >
                  <Printer size={20}/>
                </button>
             </div>
          </div>
        </div>

        {/* PREVIEW GRID */}
        {lots.length > 0 && (
          <div className="bg-white p-4 border-2 border-slate-100 rounded-xl shadow-inner">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
               <h3 className="font-black text-slate-500 uppercase tracking-widest">Printing Preview: {lots.length} Records</h3>
               <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full font-black text-[10px]">TOTAL LABELS: {lots.length * filters.noOfTimes}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lots.map((lot, idx) => (
                <div key={idx} className="border-2 border-slate-50 p-4 rounded-2xl bg-slate-50/50 flex flex-col gap-1 relative group hover:border-indigo-200 transition-all">
                  <div className="absolute top-2 right-2 bg-indigo-500 text-white text-[7px] px-2 py-0.5 rounded font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Smart Preview</div>
                  <p className="font-black text-indigo-900 text-sm">LOT: {lot.lotNo}</p>
                  <p className="font-bold truncate text-slate-600 uppercase text-[10px]">{lot.party.tradeName}</p>
                  <p className="text-gray-500 font-bold text-[9px]">{lot.item.name} | {lot.unit.name}</p>
                  <div className="mt-2 bg-white p-2 border rounded-lg shadow-sm flex items-center justify-center">
                    <QRCodeSVG value={lot.lotNo} size={60} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ACTUAL PRINTABLE SECTION */}
      <div className="print-only hidden">
        <div className={`grid ${filters.orientation === 'Horizontal' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
          {lots.map((lot) => (
            Array.from({ length: filters.noOfTimes }).map((_, copyIdx) => (
              <div key={`${lot.id}-${copyIdx}`} className="label-box">
                <div className="label-content">
                  <div className="label-header">
                    <h1 className="company-name text-indigo-900">COLD STORAGE ERP</h1>
                    <span className="copy-indicator">{copyIdx + 1}/{filters.noOfTimes}</span>
                  </div>
                  
                  <div className="label-main">
                    <div className="info-section">
                      <div className="lot-badge">LOT NO: {lot.lotNo}</div>
                      <div className="party-name">{lot.party.tradeName}</div>
                      <div className="item-details">{lot.item.name}</div>
                      <div className="sub-info">
                        <span>UNIT: {lot.unit.name}</span>
                        <span>QTY: {lot.receivedQty}</span>
                      </div>
                      <div className="marka-info">MARKA: {lot.marka || "---"}</div>
                      <div className="date-info italic">DATE: {new Date(lot.arrivalDate).toLocaleDateString()}</div>
                    </div>
                    
                    <div className="qr-section">
                      <QRCodeSVG value={lot.lotNo} size={110} />
                      <p className="text-[8px] text-center font-black mt-1">{lot.lotNo}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ))}
        </div>
      </div>

      {/* STYLES */}
      <style jsx global>{`
        @media screen {
          .print-only { display: none !important; }
        }

        @media print {
          .no-print { display: none !important; }
          .print-only { 
            display: block !important; 
            background: white;
            width: 100%;
          }
          body { background: white !important; margin: 0; padding: 0; }
          
          .label-box {
            width: 95%;
            height: 2.8in;
            border: 3px solid #000;
            margin-bottom: 15px;
            padding: 15px;
            page-break-inside: avoid;
            background: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }

          .label-header {
            display: flex;
            justify-content: space-between;
            border-bottom: 3px solid #000;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }

          .company-name {
            font-size: 16px;
            font-weight: 900;
            letter-spacing: 3px;
          }

          .label-main {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .info-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .lot-badge {
            background: #000;
            color: #fff;
            padding: 5px 15px;
            font-size: 24px;
            font-weight: 900;
            width: fit-content;
            letter-spacing: 2px;
          }

          .party-name {
            font-size: 15px;
            font-weight: 900;
            text-transform: uppercase;
            border-bottom: 1px solid #ddd;
            padding-bottom: 2px;
          }

          .item-details {
            font-size: 18px;
            font-weight: 800;
          }

          .sub-info {
            display: flex;
            gap: 30px;
            font-size: 13px;
            font-weight: bold;
          }

          .marka-info {
            font-size: 16px;
            font-weight: 900;
            border: 2px solid #000;
            padding: 3px 8px;
            width: fit-content;
            margin-top: 5px;
          }

          .date-info {
            font-size: 11px;
            font-weight: bold;
            color: #444;
          }

          .qr-section {
            padding: 8px;
            background: #fff;
            border: 2px solid #000;
          }
        }
      `}</style>
    </div>
  );
}
