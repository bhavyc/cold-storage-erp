"use client";

import React, { useEffect, useState } from "react";
import { Search, IndianRupee, Printer, FileSpreadsheet, Edit3, Loader2, Filter, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";

export default function BillSummaryPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States (Exact mapping to Image 71)
  const [filters, setFilters] = useState({
    filterType: "Party Wise",
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    partyId: "All",
    billingType: "Nill Lot Bill",
    sortData: "OLD TO NEW"
  });

  // Load Parties
  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
  }, []);

  // SEARCH FUNCTION
  const handleSearch = async () => {
    setLoading(true);
    const query = new URLSearchParams(filters).toString();
    try {
      const res = await fetch(`/api/billing/summary?${query}`);
      const data = await res.json();
      setBills(data);
    } catch (err) {
      toast.error("Data fetch fail ho gaya!");
    } finally {
      setLoading(false);
    }
  };

  // AUTOMATION: Quick Receipt (The Red Rupee Function)
  const handleQuickReceipt = async (invoiceId: string) => {
    if (!confirm("Kya kisan ne paise de diye? Receipt entry auto-create karein?")) return;
    
    const loadId = toast.loading("Receipt generate ho rahi hai...");
    try {
      const res = await fetch("/api/accounting/quick-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, ledgerId: 'CASH_LEDGER_ID' }) // Assuming default Cash
      });
      if (res.ok) {
        toast.success("Receipt Generated! Bill Status PAID ho gaya.", { id: loadId });
        handleSearch(); // Refresh list
      }
    } catch (err) {
      toast.error("Error creating receipt", { id: loadId });
    }
  };

  return (
    <div className="space-y-4 text-[10px] animate-in fade-in duration-500">
      
      {/* FILTER BAR (Image 71 Exact Replication) */}
      <div className="bg-[#f0f1f7] p-5 border-2 border-slate-200 rounded-xl shadow-sm grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 items-end">
        <div>
          <label className="font-bold text-slate-500 uppercase mb-1 block">Filter Type</label>
          <select className="w-full border p-1.5 rounded bg-white font-bold" value={filters.filterType} onChange={e => setFilters({...filters, filterType: e.target.value})}>
            <option>Party Wise</option>
            <option>Bill Wise</option>
          </select>
        </div>
        <div><label className="font-bold text-slate-500 uppercase mb-1 block">From Date</label>
        <input type="date" className="w-full border p-1.5 rounded" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} /></div>
        <div><label className="font-bold text-slate-500 uppercase mb-1 block">To Date</label>
        <input type="date" className="w-full border p-1.5 rounded" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} /></div>
        <div><label className="font-bold text-slate-500 uppercase mb-1 block">Party Name</label>
          <select className="w-full border p-1.5 rounded bg-white font-bold text-indigo-700" value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})}>
            <option value="All">All</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
          </select>
        </div>
        <div><label className="font-bold text-slate-500 uppercase mb-1 block">Billing Type</label>
          <select className="w-full border p-1.5 rounded bg-white" value={filters.billingType} onChange={e => setFilters({...filters, billingType: e.target.value})}>
            <option>All</option>
            <option>Nill Lot Bill</option>
            <option>Monthly Bill</option>
            <option>CA Bill</option>
          </select>
        </div>
        <div><label className="font-bold text-slate-500 uppercase mb-1 block">Sort Data</label>
          <select className="w-full border p-1.5 rounded bg-white" value={filters.sortData} onChange={e => setFilters({...filters, sortData: e.target.value})}>
            <option>OLD TO NEW</option>
            <option>NEW TO OLD</option>
          </select>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleSearch} className="bg-red-600 text-white px-4 py-1.5 rounded font-black uppercase shadow-md flex-1 active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin" size={14}/> : "SEARCH"}
          </button>
          <button onClick={() => setFilters({...filters, partyId: "All"})} className="bg-red-600 text-white p-1.5 rounded shadow"><IndianRupee size={16}/></button>
          <button className="bg-green-600 text-white p-1.5 rounded shadow"><FileSpreadsheet size={16}/></button>
          <button className="bg-red-500 text-white p-1.5 rounded shadow"><Printer size={16}/></button>
          <button className="bg-orange-500 text-white p-1.5 rounded shadow"><Printer size={16}/></button>
        </div>
      </div>

      {/* BRANDING HEADER */}
      <div className="bg-white p-6 border rounded-lg shadow-sm text-center space-y-1">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">VISUAL SOFTECH</h1>
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">Block B, Plot No A 26, Mohan Cooperative, South Delhi, New Delhi 110044</p>
        <div className="flex justify-center gap-4 text-[9px] font-black text-indigo-600">
           <span>PAN: AAXFV5416G</span>
           <span>GST: 07AAXFV5416G1ZO</span>
        </div>
        <p className="text-xs font-bold text-slate-700 mt-4 border-b border-dashed inline-block pb-1 uppercase">BILL SUMMARY</p>
      </div>

      {/* DATA TABLE (Image 71 Columns Mapping) */}
      <div className="bg-white border rounded shadow-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px]">
            <tr>
              <th className="p-3 border-r border-slate-300">DATE</th>
              <th className="p-3 border-r border-slate-300">TYPE</th>
              <th className="p-3 border-r border-slate-300">BILL NO</th>
              <th className="p-3 border-r border-slate-300">PARTY NAME</th>
              <th className="p-3 border-r border-slate-300">GST NO</th>
              <th className="p-3 border-r border-slate-300 text-center">TOT QTY</th>
              <th className="p-3 border-r border-slate-300 text-right">RENT</th>
              <th className="p-3 border-r border-slate-300 text-right">LABOUR</th>
              <th className="p-3 border-r border-slate-300 text-right">GST</th>
              <th className="p-3 border-r border-slate-300 text-right">NET AMT</th>
              <th className="p-3 border-r border-slate-300 text-center">STATUS</th>
              <th className="p-3 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr><td colSpan={12} className="p-20 text-center text-gray-400 italic">No records found. Click Search to refresh.</td></tr>
            ) : bills.map((bill) => (
              <tr key={bill.id} className="border-b hover:bg-indigo-50/40 transition-colors font-bold group">
                <td className="p-3 border-r">{new Date(bill.date).toLocaleDateString('en-GB')}</td>
                <td className="p-3 border-r italic text-slate-500">{bill.billingType}</td>
                <td className="p-3 border-r font-black text-indigo-700">{bill.invoiceNo}</td>
                <td className="p-3 border-r font-black text-slate-700 uppercase">{bill.party.tradeName}</td>
                <td className="p-3 border-r font-mono text-gray-400">{bill.party.gstNo || "NA"}</td>
                <td className="p-3 border-r text-center font-black text-blue-600">{bill.totalQty}</td>
                <td className="p-3 border-r text-right font-black text-green-700">{Number(bill.totalRent).toFixed(2)}</td>
                <td className="p-3 border-r text-right font-black text-indigo-700">{Number(bill.totalLabour).toFixed(2)}</td>
                <td className="p-3 border-r text-right font-black text-orange-600">{(Number(bill.cgst) + Number(bill.sgst)).toFixed(2)}</td>
                <td className="p-3 border-r text-right font-black text-slate-900 bg-slate-50">₹ {Number(bill.netAmount).toLocaleString()}</td>
                <td className="p-3 border-r text-center">
                   <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${bill.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                     {bill.status}
                   </span>
                </td>
                <td className="p-3 text-center flex justify-center gap-2">
                   <button onClick={() => handleQuickReceipt(bill.id)} title="Quick Payment Settlement" className="bg-red-600 text-white p-1 rounded shadow-md hover:scale-125 transition-transform">
                      <IndianRupee size={12}/>
                   </button>
                   <button className="text-blue-500 hover:text-blue-700"><Edit3 size={14}/></button>
                   <button className="text-slate-400"><Printer size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}