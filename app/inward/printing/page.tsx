"use client";

import React, { useState } from "react";
import { Search, Printer, QrCode, ArrowLeft, RefreshCcw } from "lucide-react";
import { toast } from "react-hot-toast";

// STRICT TYPES
interface LotLabelData {
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
    noOfTimes: 1,
    orientation: "Horizontal"
  });

  const [lots, setLots] = useState<LotLabelData[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Search Logic (Real Data fetch)
  const handleSearch = async () => {
    if (!filters.fromLot || !filters.toLot) {
      return toast.error("Please enter Lot Range");
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/inward/labels?fromLot=${filters.fromLot}&toLot=${filters.toLot}`);
      const data = await res.json();
      if (res.ok) {
        setLots(data);
        if (data.length === 0) toast.error("No lots found in this range");
      }
    } catch (err) {
      toast.error("Error fetching labels");
    } finally {
      setLoading(false);
    }
  };

  // 2. Automation: Print Trigger (Image 39 Icon)
  const handlePrint = () => {
    if (lots.length === 0) return toast.error("Search for lots first");
    window.print(); // In real app, this triggers a specific CSS print layout
  };

  return (
    <div className="space-y-4 text-xs no-print">
      {/* Visual Softech Purple Header */}
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-widest">
          <QrCode size={18}/> QR Label Printing
        </h2>
      </div>

      {/* FILTER BOX (Image 39 Exact Replication) */}
      <div className="bg-white p-6 border rounded-b shadow-sm flex flex-wrap items-end gap-6">
        <div className="space-y-1">
          <label className="font-bold text-gray-500 uppercase block">From Lot</label>
          <input 
            className="border p-2 rounded w-40 outline-none focus:ring-1 focus:ring-indigo-500 font-bold" 
            value={filters.fromLot}
            onChange={e => setFilters({...filters, fromLot: e.target.value})}
            placeholder="Start Lot No"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-gray-500 uppercase block">To Lot</label>
          <input 
            className="border p-2 rounded w-40 outline-none focus:ring-1 focus:ring-indigo-500 font-bold" 
            value={filters.toLot}
            onChange={e => setFilters({...filters, toLot: e.target.value})}
            placeholder="End Lot No"
          />
        </div>

        <div className="space-y-1 w-24">
          <label className="font-bold text-gray-500 uppercase block">No. Of Times</label>
          <input 
            type="number"
            min={1}
            className="border p-2 rounded w-full outline-none focus:ring-1 focus:ring-indigo-500 text-center font-bold" 
            value={filters.noOfTimes}
            onChange={e => setFilters({...filters, noOfTimes: parseInt(e.target.value) || 1})}
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-gray-500 uppercase block">Orientation</label>
          <select 
            className="border p-2 rounded w-40 outline-none bg-white font-medium"
            value={filters.orientation}
            onChange={e => setFilters({...filters, orientation: e.target.value})}
          >
            <option value="Horizontal">Horizontal</option>
            <option value="Vertical">Vertical</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleSearch}
            className="bg-red-600 text-white px-8 py-2 rounded font-bold uppercase hover:bg-red-700 flex items-center gap-2 transition-all shadow"
          >
            <Search size={16}/> Search
          </button>

          {/* Orange Print Button as per Image 39 */}
          <button 
            onClick={handlePrint}
            className="bg-orange-500 text-white p-2 rounded hover:bg-orange-600 transition-all shadow flex items-center justify-center"
          >
            <Printer size={18}/>
          </button>
        </div>
      </div>

      {/* SEARCH PREVIEW GRID */}
      {lots.length > 0 && (
        <div className="bg-white p-4 border rounded shadow-sm">
          <h3 className="font-bold text-gray-500 mb-4 uppercase border-b pb-2">Ready to Print: {lots.length} Records</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lots.map((lot, idx) => (
              <div key={idx} className="border p-3 rounded-md bg-slate-50 flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] px-2 font-bold uppercase">Preview</div>
                <p className="font-bold text-indigo-700">LOT NO: {lot.lotNo}</p>
                <p className="font-medium truncate">PARTY: {lot.party.tradeName}</p>
                <p>ITEM: {lot.item.name} ({lot.unit.name})</p>
                <p>DATE: {new Date(lot.arrivalDate).toLocaleDateString()}</p>
                <div className="mt-2 bg-white border-2 border-dashed border-gray-300 h-16 flex items-center justify-center text-gray-400">
                   [QR CODE PLACEHOLDER]
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRINT STYLES (Special CSS for Printer) */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; padding: 0; }
          .print-label { 
            width: 4in; 
            height: 2in; 
            border: 1px solid #000; 
            margin: 10px; 
            padding: 10px; 
            page-break-inside: avoid;
            display: inline-block;
          }
        }
      `}</style>
    </div>
  );
}