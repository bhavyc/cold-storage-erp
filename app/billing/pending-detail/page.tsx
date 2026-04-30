"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Printer, FileSpreadsheet, ArrowLeft, FileCheck, Loader2, Search, Landmark, Calculator, Info, Tag } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function PendingBillDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const partyId = searchParams.get("partyId");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Report ke andar search karne ke liye

  useEffect(() => {
    if (partyId) {
      fetch(`/api/billing/pending-detail?partyId=${partyId}`)
        .then(res => res.json())
        .then(json => {
          setData(json);
          setLoading(false);
        })
        .catch(() => {
          toast.error("Data load nahi ho paya!");
          setLoading(false);
        });
    }
  }, [partyId]);

  // --- LOCAL FILTER LOGIC (Operator ki ease ke liye) ---
  const filteredReport = useMemo(() => {
    if (!data?.report) return [];
    return data.report.filter((row: any) => 
      row.lotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  // LIVE TOTALS (Filtered data ke hisab se calculate hoga)
  const totals = useMemo(() => {
    return filteredReport.reduce((acc: any, row: any) => ({
      qty: acc.qty + row.balQty,
      rent: acc.rent + row.accruedRent
    }), { qty: 0, rent: 0 });
  }, [filteredReport]);

  // if (loading) return (
  //   <div className="flex flex-col items-center justify-center h-96 space-y-4">
  //     <Loader2 className="animate-spin text-indigo-600" size={48} />
  //     <p className="font-black text-indigo-900 uppercase tracking-widest animate-pulse">Calculating Live Rent Accruals...</p>
  //   </div>
  // );

  return (
    <div className="space-y-4 text-[10px] animate-in fade-in duration-500">
      
      {/* ACTION TOP BAR */}
      <div className="flex justify-between items-center no-print">
        <button 
          onClick={() => router.push('/billing/pending-summary')}
          className="bg-white border-2 border-slate-200 text-slate-600 px-5 py-2 rounded-lg font-black flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all uppercase tracking-tighter"
        >
          <ArrowLeft size={16}/> Back To Summary
        </button>
        <div className="flex gap-2">
          <button className="bg-green-600 text-white p-2 rounded-lg shadow-lg hover:bg-green-700 transition-all"><FileSpreadsheet size={18}/></button>
          <button onClick={() => window.print()} className="bg-slate-800 text-white p-2 rounded-lg shadow-lg hover:bg-black transition-all"><Printer size={18}/></button>
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="bg-white border-2 border-slate-100 rounded-xl shadow-2xl overflow-hidden">
        
        {/* HEADER BRANDING */}
        <div className="bg-[#4a4ea3] text-white p-3 font-black uppercase tracking-[5px] text-center text-xs border-b-4 border-indigo-300">
          Individual Merchant Outstanding | Live Rent Estimation
        </div>
        
        {/* PARTY INFO & SEARCH BLOCK */}
        <div className="p-6 border-b grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-50/50">
          <div>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1"><Landmark size={10}/> Merchant / Farmer Account</p>
            <h3 className="text-2xl font-black text-indigo-900 uppercase tracking-tighter leading-none">
              {data?.partyName} <span className="text-indigo-400 text-sm font-bold ml-2">[{data?.partyCode}]</span>
            </h3>
          </div>

          {/* LOCAL SEARCH BOX (For common man ease) */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-indigo-300" size={16} />
            <input 
              className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-indigo-100 outline-none focus:border-indigo-500 font-bold uppercase placeholder:font-normal" 
              placeholder="Search Lot or Item..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="text-right">
            <button 
              onClick={() => router.push(`/billing/entry?partyId=${partyId}`)}
              className="bg-[#ef4444] hover:bg-red-700 text-white px-8 py-3 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl transition-all active:scale-95 ml-auto ring-4 ring-red-50"
            >
              <FileCheck size={20}/> Generate Tax Invoice
            </button>
          </div>
        </div>

        {/* DATA TABLE (9 Columns strictly mapped) */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="bg-[#f1f5f9] text-slate-600 uppercase font-black text-[9px] border-b-2 border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 border-r border-slate-200 bg-indigo-50 text-indigo-900 w-32 text-center">LOT NO.</th>
                <th className="p-4 border-r border-slate-200 w-32 text-center"><Info size={10} className="inline mr-1"/> REC DATE</th>
                <th className="p-4 border-r border-slate-200 w-52">ITEM NAME</th>
                <th className="p-4 border-r border-slate-200 w-28">PACKING</th>
                <th className="p-4 border-r border-slate-200 w-24 text-center">PHYSICAL BAL</th>
                <th className="p-4 border-r border-slate-200 w-32 text-center bg-yellow-50 text-orange-900">PERIOD (DAYS)</th>
                <th className="p-4 border-r border-slate-200 w-20 text-center">RATE</th>
                <th className="p-4 border-r border-slate-200 w-20 text-center">LAB</th>
                <th className="p-4 text-right pr-8 text-indigo-700 bg-indigo-50/30">EST. RENT (₹)</th>
              </tr>
            </thead>
            <tbody className="font-bold">
               {filteredReport.length === 0 ? (
                 <tr><td colSpan={9} className="p-20 text-center text-gray-300 italic font-medium uppercase tracking-widest text-sm">No pending lots found matching your search</td></tr>
               ) : (
                 filteredReport.map((row: any, idx: number) => (
                   <tr key={idx} className="border-b hover:bg-indigo-50 transition-all even:bg-slate-50/20 group">
                     <td className="p-4 border-r border-slate-100 text-blue-700 font-black text-sm text-center shadow-inner">{row.lotNo}</td>
                     <td className="p-4 border-r border-slate-100 text-gray-400 font-mono text-center">{new Date(row.arrivalDate).toLocaleDateString('en-GB')}</td>
                     <td className="p-4 border-r border-slate-100 uppercase text-slate-700 truncate max-w-[200px]">{row.itemName}</td>
                     <td className="p-4 border-r border-slate-100 uppercase text-gray-400 text-[9px]">{row.packing}</td>
                     <td className="p-4 border-r border-slate-100 text-center font-black text-slate-900 text-sm">{row.balQty}</td>
                     <td className="p-4 border-r border-slate-100 text-center bg-yellow-50/50 font-black text-indigo-950 text-xs">
                        {row.period} <span className="font-normal opacity-50 ml-1">Days</span>
                     </td>
                     <td className="p-4 border-r border-slate-100 text-center text-gray-500 italic">{Number(row.rate).toFixed(2)}</td>
                     <td className="p-4 border-r border-slate-100 text-center text-gray-500 italic">{Number(row.labour).toFixed(2)}</td>
                     <td className="p-4 text-right pr-8 font-black text-indigo-800 text-base">
                       {row.accruedRent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </td>
                   </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>

        {/* FOOTER TOTALS (Professional Dark Bar) */}
        <div className="bg-[#1e293b] text-white flex justify-between items-center p-4 px-12 border-t-4 border-indigo-500">
           <div className="flex gap-24 items-center">
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-[3px] text-slate-400 text-[9px] block">Aggregate Stock</span>
                <span className="font-black text-2xl text-blue-400 italic leading-none">{totals.qty} <span className="text-[10px] font-normal not-italic opacity-50 uppercase ml-1">Bags In Chamber</span></span>
              </div>
              <div className="h-10 w-[1px] bg-slate-700"></div>
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-[3px] text-slate-400 text-[9px] block">Live Accrued Valuation</span>
                <div className="flex items-baseline gap-2">
                   <span className="text-yellow-400 font-black text-2xl italic leading-none">₹ {totals.rent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                   <Tag size={14} className="text-slate-500"/>
                </div>
              </div>
           </div>
           
           <div className="text-right">
              <p className="text-[8px] font-black italic opacity-40 uppercase tracking-[10px]">Cold Storage Enterprise</p>
           </div>
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="flex justify-between items-center bg-slate-50 p-2 border rounded-lg opacity-60">
         <p className="font-bold uppercase tracking-widest text-[8px] flex items-center gap-1">
           <Calculator size={12}/> Calculations include grace days deduction where applicable.
         </p>
         <p className="text-[8px] font-black italic uppercase tracking-[5px]">v1.0.4 - Secure Document</p>
      </div>

    </div>
  );
}
