"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Printer, FileSpreadsheet, ArrowLeft, FileCheck, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function PendingBillDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const partyId = searchParams.get("partyId");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (partyId) {
      fetch(`/api/billing/pending-detail?partyId=${partyId}`)
        .then(res => res.json())
        .then(json => {
          setData(json);
          setLoading(false);
        });
    }
  }, [partyId]);

  // LIVE TOTALS (Footer Logic)
  const totals = useMemo(() => {
    if (!data) return { qty: 0, rent: 0 };
    return data.report.reduce((acc: any, row: any) => ({
      qty: acc.qty + row.balQty,
      rent: acc.rent + row.accruedRent
    }), { qty: 0, rent: 0 });
  }, [data]);

  // if (loading) return <div className="p-10 text-center font-bold animate-pulse text-indigo-600">Calculating Live Rent...</div>;

  return (
    <div className="space-y-4 text-[10px] animate-in slide-in-from-right-4">
      {/* Action Header */}
      <div className="flex justify-between items-center px-1">
        <button 
          onClick={() => router.push('/billing/pending-summary')}
          className="bg-[#ef4444] text-white px-4 py-1.5 rounded font-black flex items-center gap-1 shadow hover:bg-red-700 transition-all uppercase tracking-tighter"
        >
          <ArrowLeft size={14}/> Back to Summary
        </button>
        <div className="flex gap-2">
          <button className="bg-[#10b981] text-white p-2 rounded shadow hover:bg-green-700"><FileSpreadsheet size={16}/></button>
          <button className="bg-[#f97316] text-white p-2 rounded shadow hover:bg-orange-600"><Printer size={16}/></button>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="bg-white border-2 border-slate-200 rounded shadow-lg overflow-hidden">
        <div className="bg-[#5d5fb1] text-white p-2.5 font-bold uppercase tracking-widest text-center text-[11px]">
          Lot Wise Pending Bill Report
        </div>
        
        {/* PARTY INFO & INVOICE TRIGGER */}
        <div className="p-5 border-b flex justify-between items-center bg-white">
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Selected Party</p>
            <h3 className="text-xl font-black text-[#5d5fb1] uppercase tracking-tighter">
              {data?.partyName} ({data?.partyCode})
            </h3>
          </div>
          <button 
            onClick={() => router.push(`/billing/entry?partyId=${partyId}`)}
            className="bg-[#f1948a] hover:bg-[#ec7063] text-white px-8 py-3 rounded-md font-black uppercase text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <FileCheck size={18}/> Create Final Tax Invoice
          </button>
        </div>

        {/* DATA TABLE (Image Columns Mapping) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f8f9fa] text-slate-600 uppercase font-black border-b border-slate-300">
              <tr>
                <th className="p-4 border-r border-slate-200 w-28">Lot No</th>
                <th className="p-4 border-r border-slate-200 w-32">Rec Date</th>
                <th className="p-4 border-r border-slate-200">Item Name</th>
                <th className="p-4 border-r border-slate-200 w-24">Packing</th>
                <th className="p-4 border-r border-slate-200 w-24 text-center">Bal Qty</th>
                <th className="p-4 border-r border-slate-200 w-32 text-center bg-yellow-50/50">Period (Days)</th>
                <th className="p-4 border-r border-slate-200 w-24 text-center">Rate</th>
                <th className="p-4 border-r border-slate-200 w-24 text-center">Labour</th>
                <th className="p-4 text-right pr-6 text-indigo-700">Accrued Rent (₹)</th>
              </tr>
            </thead>
            <tbody className="font-bold">
               {data?.report?.map((row: any, idx: number) => (
                 <tr key={idx} className="border-b hover:bg-indigo-50/40 transition-colors even:bg-slate-50/30">
                   <td className="p-4 border-r border-slate-100 text-blue-700 font-black">{row.lotNo}</td>
                   <td className="p-4 border-r border-slate-100 text-gray-500 font-mono">{new Date(row.arrivalDate).toLocaleDateString('en-GB')}</td>
                   <td className="p-4 border-r border-slate-100 uppercase text-slate-700">{row.itemName}</td>
                   <td className="p-4 border-r border-slate-100 uppercase text-gray-500">{row.packing}</td>
                   <td className="p-4 border-r border-slate-100 text-center font-black text-red-600">{row.balQty}</td>
                   <td className="p-4 border-r border-slate-100 text-center bg-yellow-50/80 font-black text-slate-800 text-xs">{row.period}</td>
                   <td className="p-4 border-r border-slate-100 text-center text-gray-600">{Number(row.rate).toFixed(2)}</td>
                   <td className="p-4 border-r border-slate-100 text-center text-gray-600">{Number(row.labour).toFixed(2)}</td>
                   <td className="p-4 text-right pr-6 font-black text-indigo-800 text-sm">
                     {row.accruedRent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER TOTALS (Black Bar in Image) */}
        <div className="bg-[#1e293b] text-white flex justify-between items-center p-3 px-10">
           <div className="flex gap-20">
              <span className="font-black uppercase tracking-widest text-[11px]">Total Outstanding</span>
              <span className="font-black text-lg ml-10">{totals.qty} <span className="text-[9px] font-normal text-slate-400">BAGS</span></span>
           </div>
           <div className="text-right">
              <span className="text-xl font-black text-yellow-400 italic">
                ₹ {totals.rent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
           </div>
        </div>
      </div>

      <div className="text-center opacity-40 italic text-[8px] uppercase tracking-widest font-bold">
        * Accrued rent is a live estimation and might vary during final tax invoice generation.
      </div>
    </div>
  );
}