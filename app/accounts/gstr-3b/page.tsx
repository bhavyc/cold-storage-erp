"use client";

import React, { useState, useMemo } from "react";
import { FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { exportToJSON } from "@/lib/utils"; // Utils se download logic li

export default function GSTR3BPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: "2026-03-01",
    toDate: "2026-03-31"
  });

  // 1. SEARCH LOGIC (Fetch real GST data)
  const handleSearch = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/compliance/gst-data?${query}`);
      const json = await res.json();
      setData(json);
      if (json.length === 0) toast.error("Is period mein koi transactions nahi hain.");
      else toast.success(`${json.length} Invoices aggregated!`);
    } catch (err) {
      toast.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  // 2. DATA AGGREGATION (Section 3.1 calculation)
  const gstrTotals = useMemo(() => {
    return data.reduce((acc, inv) => ({
      taxable: acc.taxable + Number(inv.taxableValue || 0),
      igst: acc.igst + Number(inv.igst || 0),
      cgst: acc.cgst + Number(inv.cgst || 0),
      sgst: acc.sgst + Number(inv.sgst || 0),
    }), { taxable: 0, igst: 0, cgst: 0, sgst: 0 });
  }, [data]);

  return (
    <div className="space-y-4 text-[9px] animate-in slide-in-from-top-4">
      {/* FILTER BAR */}
      <div className="flex justify-between items-center bg-white p-2 border rounded shadow-sm">
         <div className="flex gap-4">
            <div>
              <label className="font-bold block uppercase text-gray-400">From Date</label>
              <input type="date" className="border p-1 rounded" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
            </div>
            <div>
              <label className="font-bold block uppercase text-gray-400">To Date</label>
              <input type="date" className="border p-1 rounded" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
            </div>
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="bg-red-600 text-white px-6 mt-4 rounded font-bold uppercase hover:bg-red-700 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 size={12} className="animate-spin"/> : "Search"}
            </button>
         </div>
         
         <button 
            onClick={() => data.length > 0 ? exportToJSON(data, "GSTR3B_Export") : toast.error("Pehle Search karein!")}
            className="bg-red-800 text-white px-6 py-2 mt-4 rounded font-black flex items-center gap-2 uppercase italic shadow-lg hover:bg-black transition-all active:scale-95"
         >
            <FileJson size={14}/> Download JSON
         </button>
      </div>

      <div className="bg-white border rounded shadow-md overflow-hidden">
        <div className="bg-[#f1f5f9] p-2 text-center font-black text-slate-700 text-xs border-b">
           FORM GSTR-3B <br/> <span className="text-[10px] font-normal text-gray-500">[Sec rule 61(5)]</span>
        </div>

        {/* SECTION 3.1: OUTWARD SUPPLIES */}
        <div className="p-0 border-b">
          <div className="bg-orange-500 text-white p-1 font-black px-4 uppercase tracking-tighter">
            3.1 Details of Outward supplies and inward supplies liable to reverse charge
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 font-bold text-gray-500 uppercase border-b">
              <tr>
                <th className="p-2 border-r w-[40%]">Nature of Supplies</th>
                <th className="p-2 border-r text-right">Total Taxable Value</th>
                <th className="p-2 border-r text-right">IGST</th>
                <th className="p-2 border-r text-right">CGST</th>
                <th className="p-2 border-r text-right">SGST</th>
                <th className="p-2 text-right">Cess</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {/* ROW (a) Populated with Real Data */}
              <tr className="border-b font-medium text-slate-900 bg-blue-50/20">
                <td className="p-2 border-r bg-slate-50/50">(a) Outward taxable supplies (other than zero rated, nil rated and exempted)</td>
                <td className="p-2 border-r text-right">{gstrTotals.taxable.toFixed(2)}</td>
                <td className="p-2 border-r text-right">{gstrTotals.igst.toFixed(2)}</td>
                <td className="p-2 border-r text-right">{gstrTotals.cgst.toFixed(2)}</td>
                <td className="p-2 border-r text-right">{gstrTotals.sgst.toFixed(2)}</td>
                <td className="p-2 text-right">0.00</td>
              </tr>
              {/* Baaki Rows defaults par */}
              {[
                "(b) Outward taxable supplies (zero rated)",
                "(c) Other outward supplies (Nil rated, exempted)",
                "(d) Inward supplies (liable to reverse charge)",
                "(e) Non-GST outward supplies"
              ].map((text, i) => (
                <tr key={i} className="border-b font-medium text-slate-500 opacity-60">
                  <td className="p-2 border-r bg-slate-50/50">{text}</td>
                  <td className="p-2 border-r text-right">0.00</td>
                  <td className="p-2 border-r text-right">0.00</td>
                  <td className="p-2 border-r text-right">0.00</td>
                  <td className="p-2 border-r text-right">0.00</td>
                  <td className="p-2 text-right">0.00</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 4: ELIGIBLE ITC */}
        <div className="p-0 mt-4 border-b">
           <div className="bg-orange-500 text-white p-1 font-black px-4 uppercase tracking-tighter">4. Eligible ITC</div>
           {data.length > 0 ? (
             <div className="p-10 text-center font-bold text-indigo-600 bg-slate-50">
               Total Eligible Input Tax Credit: ₹ 0.00 <br/>
               <span className="text-[8px] text-gray-400 font-normal">(System is currently tracking Outward supplies. Implement Purchase module for Section 4)</span>
             </div>
           ) : (
             <div className="p-20 text-center text-gray-400 italic">Data aggregation logic matching GSTR-3B schema...</div>
           )}
        </div>
      </div>
    </div>
  );
}