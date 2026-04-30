"use client";

import React, { useState, useEffect } from "react";
import { Search, Printer, FileSpreadsheet, Filter, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils"; // Date formatting utility

export default function VoucherSummaryPage() {
  const [data, setData] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Exact Filters from Image 74
  const [filters, setFilters] = useState({
    fromDate: "2025-04-01", 
    toDate: new Date().toISOString().split('T')[0],
    vocType: "ALL", 
    mode: "ALL", 
    partyId: "ALL", // Replaced partyName with partyId for accurate DB querying
    breakage: "Month Wise Total"
  });

  // Load Dropdown Data (Parties)
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const res = await fetch("/api/masters/party");
        const json = await res.json();
        setParties(json || []);
      } catch (err) {
        toast.error("Failed to load party list.");
      } finally {
        setIsInitialLoad(false);
      }
    };
    loadMasters();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    // Bind all filters into a query string
    const query = new URLSearchParams({
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      vocType: filters.vocType,
      mode: filters.mode,
      partyId: filters.partyId
    }).toString();

    try {
      const res = await fetch(`/api/accounting/vouchers?${query}`);
      if (!res.ok) throw new Error("Fetch Failed");
      
      const json = await res.json();
      setData(json);
      
      if (json.length === 0) toast.error("No vouchers found in this period.");
    } catch (err) {
      toast.error("Error fetching voucher summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-[10px] animate-in fade-in duration-500">
      {/* HEADER BAR */}
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg font-bold flex justify-between items-center shadow uppercase tracking-widest">
        <span className="flex items-center gap-2"><Filter size={14}/> Voucher Entry | Index (Register)</span>
        <div className="flex gap-2">
           <button className="bg-green-600 p-1.5 rounded shadow-sm hover:bg-green-700 transition-all" title="Export Excel"><FileSpreadsheet size={16}/></button>
           <button className="bg-red-500 p-1.5 rounded shadow-sm hover:bg-red-600 transition-all" title="Print Register"><Printer size={16}/></button>
        </div>
      </div>

      {/* FILTER BAR (Image 74 Replication) */}
      <div className="bg-[#b4b6e4]/20 p-5 border rounded shadow-sm grid grid-cols-2 md:grid-cols-6 gap-4 items-end font-bold text-slate-600">
        <div>
          <label className="uppercase text-[9px] mb-1 block">From Date</label>
          <input type="date" className="w-full border p-2 rounded bg-white outline-none focus:ring-1 focus:ring-indigo-400" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
        </div>
        <div>
          <label className="uppercase text-[9px] mb-1 block">To Date</label>
          <input type="date" className="w-full border p-2 rounded bg-white outline-none focus:ring-1 focus:ring-indigo-400" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
        </div>
        <div>
          <label className="uppercase text-[9px] mb-1 block">Voucher Type</label>
          <select className="w-full border p-2 rounded bg-white outline-none" value={filters.vocType} onChange={e => setFilters({...filters, vocType: e.target.value})}>
            <option>ALL</option>
            <option>Receipt</option>
            <option>Payment</option>
            <option>Journal</option>
            <option>Contra</option>
          </select>
        </div>
        <div>
          <label className="uppercase text-[9px] mb-1 block">Mode / Group</label>
          <select className="w-full border p-2 rounded bg-white outline-none" value={filters.mode} onChange={e => setFilters({...filters, mode: e.target.value})}>
            <option>ALL</option>
            <option>Cash</option>
            <option>Bank</option>
            <option>Journal</option>
          </select>
        </div>
        <div>
          <label className="uppercase text-[9px] mb-1 block">Party Name</label>
          <select className="w-full border p-2 rounded bg-white font-bold text-indigo-700 outline-none" value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})}>
            <option value="ALL">All Parties</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
           <div className="flex-1">
             <label className="uppercase text-[9px] mb-1 block">Breakage</label>
             <select className="w-full border p-2 rounded bg-white outline-none" value={filters.breakage} onChange={e => setFilters({...filters, breakage: e.target.value})}>
               <option>Month Wise Total</option>
             </select>
           </div>
           <button 
             onClick={handleSearch}
             disabled={loading || isInitialLoad} 
             className="bg-red-600 text-white px-4 rounded shadow-md hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center min-w-[40px] h-[32px] self-end mb-[3px]"
           >
             {loading ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
           </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-2">
         <div className="h-[1px] bg-slate-200 flex-1"></div>
         <h3 className="font-black text-slate-500 uppercase italic tracking-[5px]">Accounting Register | Detail View</h3>
         <div className="h-[1px] bg-slate-200 flex-1"></div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border rounded shadow-md overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className="bg-[#f1f5f9] text-slate-800 uppercase font-black text-[9px] sticky top-0 border-b border-slate-200 shadow-sm">
            <tr>
              <th className="p-3 border-r border-slate-200">VOC DATE</th>
              <th className="p-3 border-r border-slate-200">VOC NO</th>
              <th className="p-3 border-r border-slate-200 text-center">GROUP/MODE</th>
              <th className="p-3 border-r border-slate-200 text-center">TYPE</th>
              <th className="p-3 border-r border-slate-200">REMARKS / PARTICULARS</th>
              <th className="p-3 border-r border-slate-200 text-right">TOTAL DEBIT (₹)</th>
              <th className="p-3 border-r border-slate-200 text-right">TOTAL CREDIT (₹)</th>
              <th className="p-3 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-20 text-center font-bold text-indigo-700 animate-pulse text-lg tracking-[5px] uppercase">Fetching Ledger Vouchers...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} className="p-20 text-center text-gray-400 italic font-medium uppercase tracking-tighter">Enter criteria and click Search to view vouchers.</td></tr>
            ) : data.map((v: any) => (
              <tr key={v.id} className="border-b hover:bg-slate-50 transition-colors group">
                <td className="p-3 border-r border-slate-100 text-gray-600 font-mono">{formatDate(v.date)}</td>
                <td className="p-3 border-r border-slate-100 font-black text-indigo-700 uppercase">{v.voucherNo}</td>
                <td className="p-3 border-r border-slate-100 text-center font-bold text-blue-600 bg-blue-50/20">{v.group}</td>
                <td className="p-3 border-r border-slate-100 text-center">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${v.vocType === 'Receipt' ? 'bg-green-100 text-green-700' : v.vocType === 'Payment' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                    {v.vocType}
                  </span>
                </td>
                <td className="p-3 border-r border-slate-100 font-bold uppercase text-slate-600 truncate max-w-[300px]">
                  {v.remarks || "No Narrative"}
                </td>
                <td className="p-3 border-r border-slate-100 text-right font-black text-red-600 bg-red-50/10">
                  ₹ {Number(v.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 border-r border-slate-100 text-right font-black text-green-600 bg-green-50/10">
                  ₹ {Number(v.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-center">
                  <button className="text-blue-600 hover:underline font-black uppercase text-[9px] tracking-tighter">View</button>
                </td>
              </tr>
            ))}
          </tbody>

          {/* TOTALS FOOTER */}
          {data.length > 0 && (
            <tfoot className="bg-[#1e293b] text-white font-black text-sm uppercase">
               <tr>
                 <td colSpan={5} className="p-3 text-right tracking-[5px] italic border-r border-slate-600">Total Transaction Flow (Selected Range)</td>
                 <td className="p-3 text-right text-red-400 border-r border-slate-600">
                    ₹ {data.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                 </td>
                 <td className="p-3 text-right text-green-400">
                    ₹ {data.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                 </td>
                 <td></td>
               </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* FOOTER INFO BAR */}
      <div className="flex justify-between items-center bg-slate-50 p-2 border rounded opacity-60">
         <p className="font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
           <AlertCircle size={14}/> Double Entry Compliant (DR=CR)
         </p>
         <p className="text-[8px] font-black italic uppercase tracking-[10px]">Cold Storage Financials</p>
      </div>
    </div>
  );
}
