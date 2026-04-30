"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Search, IndianRupee, Printer, FileSpreadsheet, Edit3, Loader2, Filter, RotateCcw, AlertCircle, FileText, Landmark } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

export default function BillSummaryPage() {
  const router = useRouter();
  const [bills, setBills] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. FILTER STATES (Image 71 Exact Replication)
  const [filters, setFilters] = useState({
    fromDate: "2025-04-01",
    toDate: new Date().toISOString().split('T')[0],
    partyId: "All",
    billingType: "All",
    status: "All" // Paid or Unpaid
  });

  // Load Parties for Dropdown
  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
    handleSearch();
  }, []);

  // 2. SEARCH FUNCTION
  const handleSearch = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams(filters).toString();
    try {
      const res = await fetch(`/api/billing/summary?${query}`);
      const data = await res.json();
      setBills(data || []);
    } catch (err) {
      toast.error("Data load karne mein galti hui!");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // 3. QUICK RECEIPT LOGIC (The Red Rupee Button - CASH SETTLEMENT)
  const handleQuickReceipt = async (bill: any) => {
    if (bill.status === "Paid") return toast.error("Ye bill pehle se Paid hai!");
    
    if (!confirm(`Kya aap ₹${Number(bill.netAmount).toLocaleString()} Cash prapt karna chahte hain?`)) return;
    
    const loadId = toast.loading("Settleing Invoice & Posting Cash Voucher...");
    try {
      const res = await fetch("/api/accounting/quick-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            invoiceId: bill.id, 
            paymentMode: "CASH" // Nagad settlement
        })
      });

      if (res.ok) {
        toast.success("Nagad Prapt! Bill 'Paid' mark ho gaya aur Cash Ledger badh gaya.", { id: loadId });
        handleSearch(); // Table refresh
      } else {
        const err = await res.json();
        toast.error(err.error || "Receipt failed", { id: loadId });
      }
    } catch (err) {
      toast.error("Network Error!", { id: loadId });
    }
  };

  return (
    <div className="space-y-4 text-[10px] animate-in fade-in duration-500">
      
      {/* FILTER BAR */}
      <div className="bg-[#f0f1f7] p-5 border-2 border-slate-200 rounded-xl shadow-sm grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-3 items-end no-print">
        <div>
          <label className="font-black text-slate-500 uppercase mb-1 block">From Date</label>
          <input type="date" className="w-full border-2 border-white p-1.5 rounded outline-none" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
        </div>
        <div>
          <label className="font-black text-slate-500 uppercase mb-1 block">To Date</label>
          <input type="date" className="w-full border-2 border-white p-1.5 rounded outline-none" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
        </div>
        <div className="lg:col-span-1">
          <label className="font-black text-indigo-700 uppercase mb-1 block">Merchant Name</label>
          <select className="w-full border-2 border-indigo-100 p-1.5 rounded bg-white font-black text-blue-900 outline-none" value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})}>
            <option value="All">--- ALL PARTIES ---</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
          </select>
        </div>
        <div>
          <label className="font-black text-slate-500 uppercase mb-1 block">Payment Status</label>
          <select className="w-full border-2 border-white p-1.5 rounded bg-white font-bold" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="All">All Bills</option>
            <option value="Unpaid">Unpaid (Udhaar)</option>
            <option value="Paid">Paid (Nagad)</option>
          </select>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleSearch} disabled={loading} className="bg-red-600 text-white px-4 py-1.5 rounded font-black uppercase shadow-md flex-1 hover:bg-red-700 transition-all active:scale-95">
            {loading ? <Loader2 className="animate-spin mx-auto" size={14}/> : "SEARCH"}
          </button>
          <button onClick={() => window.print()} className="bg-slate-700 text-white p-1.5 rounded shadow hover:bg-black"><Printer size={16}/></button>
        </div>
      </div>

      {/* BRANDING HEADER */}
      <div className="bg-white p-6 border-2 border-slate-100 rounded-lg shadow-sm text-center space-y-1 relative">
        <div className="flex justify-center gap-6 text-[10px] font-black text-indigo-600 mb-2">
           <span className="bg-indigo-50 px-3 py-0.5 rounded border border-indigo-100 uppercase">GST: 07AAXFV5416G1ZO</span>
        </div>
        <p className="text-xs font-black text-slate-700 uppercase tracking-[10px]">BILL SUMMARY BOOK</p>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border-2 border-slate-100 rounded-lg shadow-2xl overflow-hidden min-h-[450px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] border-b-2 border-indigo-200">
            <tr>
              <th className="p-3 border-r border-indigo-100">BILL DATE</th>
              <th className="p-3 border-r border-indigo-100">BILL NO</th>
              <th className="p-3 border-r border-indigo-100">MERCHANT NAME</th>
              <th className="p-3 border-r border-indigo-100 text-center">QTY</th>
              <th className="p-3 border-r border-indigo-100 text-right">RENT (₹)</th>
              <th className="p-3 border-r border-indigo-100 text-right">LABOUR (₹)</th>
              <th className="p-3 border-r border-indigo-100 text-right">GST (₹)</th>
              <th className="p-3 border-r border-indigo-100 text-right bg-indigo-50 text-indigo-900">NET AMT (₹)</th>
              <th className="p-3 border-r border-indigo-100 text-center">STATUS</th>
              <th className="p-3 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="p-20 text-center font-bold text-indigo-700 animate-pulse text-lg uppercase tracking-widest">Scanning Ledger Records...</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan={10} className="p-20 text-center text-gray-400 italic">No invoices found.</td></tr>
            ) : bills.map((bill) => {
              const totalGST = Number(bill.cgst) + Number(bill.sgst) + Number(bill.igst);
              return (
                <tr key={bill.id} className="border-b hover:bg-indigo-50/50 transition-all font-bold group even:bg-slate-50/30">
                  <td className="p-3 border-r border-slate-100 text-gray-500">{formatDate(bill.date)}</td>
                  <td className="p-3 border-r border-slate-100 font-black text-indigo-700">{bill.invoiceNo}</td>
                  <td className="p-3 border-r border-slate-100 uppercase truncate max-w-[200px]">{bill.party.tradeName}</td>
                  <td className="p-3 border-r border-slate-100 text-center">{bill.totalQty}</td>
                  <td className="p-3 border-r border-slate-100 text-right text-green-700">{Number(bill.totalRent).toFixed(2)}</td>
                  <td className="p-3 border-r border-slate-100 text-right text-blue-600">{Number(bill.totalLabour).toFixed(2)}</td>
                  <td className="p-3 border-r border-slate-100 text-right text-orange-600">{totalGST.toFixed(2)}</td>
                  <td className="p-3 border-r border-slate-100 text-right font-black text-slate-900 bg-indigo-50/50">₹{Number(bill.netAmount).toLocaleString()}</td>
                  <td className="p-3 border-r border-slate-100 text-center">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${bill.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                       {/* THE LAL RUPEE BUTTON (CASH COLLECTOR) */}
                       <button 
                         onClick={() => handleQuickReceipt(bill)}
                         disabled={bill.status === 'Paid'}
                         className={`p-1.5 rounded shadow-md transition-all active:scale-90 ${bill.status === 'Paid' ? 'bg-gray-100 text-gray-300' : 'bg-red-600 text-white hover:bg-red-700'}`}
                         title="Nagad Jama Karein"
                       >
                          <IndianRupee size={12}/>
                       </button>
                       <button className="text-blue-500 hover:scale-125 transition-transform"><Printer size={14}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
