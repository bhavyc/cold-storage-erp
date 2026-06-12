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
  const [printData, setPrintData] = useState<any>(null);
  const [printingBillId, setPrintingBillId] = useState<string | null>(null);

  // Print Invoice Handler
  const handlePrintInvoice = async (id: string) => {
    setPrintingBillId(id);
    const loadId = toast.loading("Fetching invoice print data...");
    try {
      const res = await fetch(`/api/billing/invoice?id=${id}`);
      const data = await res.json();
      if (res.ok) {
        setPrintData(data);
        toast.success("Print template ready!", { id: loadId });
        setTimeout(() => {
          window.print();
        }, 150);
      } else {
        toast.error(data.error || "Failed to load print data", { id: loadId });
      }
    } catch (err) {
      toast.error("Network Error!", { id: loadId });
    } finally {
      setPrintingBillId(null);
    }
  };

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
                       <button 
                         onClick={() => handlePrintInvoice(bill.id)}
                         disabled={printingBillId === bill.id}
                         className={`text-blue-500 hover:scale-125 transition-transform ${printingBillId === bill.id ? 'opacity-30' : ''}`}
                         title="Bill Print Karein"
                       >
                         {printingBillId === bill.id ? <Loader2 size={12} className="animate-spin" /> : <Printer size={14}/>}
                       </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- HIDDEN PRINT VIEW (TAX INVOICE STYLE) --- */}
      {printData && (
        <div id="print-area" className="hidden print:block p-8 font-mono text-[13px] leading-relaxed text-black bg-white w-full">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">
                {printData.billingType === 'Nill Lot Invoice' ? 'Bill Of Supply' : 'Tax Invoice'}
              </h1>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-black uppercase">DJ GREEN STORAGE SOLUTIONS (P) LTD.</h2>
              <p className="font-bold text-[12px]">PLOT NO. 1 NSM AZADPUR, DELHI-33</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-x-20 mb-4 border-t-2 border-black pt-4">
            <div className="space-y-1">
              <div className="flex"><span className="w-28 font-bold">Invoice No.</span> <span>: {printData.invoiceNo}</span></div>
              <div className="flex shrink-0"><span className="w-28 font-bold">Party Name</span> <span className="flex-1">: {printData.party?.tradeName || '---'}</span></div>
              <div className="flex"><span className="w-28 font-bold">GSTIN No.</span> <span>: {printData.party?.gstNo || 'UNREGISTERED'}</span></div>
              <div className="flex"><span className="w-28 font-bold">State</span> <span>: {printData.party?.stateName} ({printData.party?.stateCode})</span></div>
            </div>
            <div className="space-y-1 text-right">
              <div className="flex justify-end"><span className="w-28 font-bold text-left">Date</span> <span className="w-32 text-left">: {formatDate(printData.date)}</span></div>
              <div className="flex justify-end"><span className="w-28 font-bold text-left">Time</span> <span className="w-32 text-left">: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>
              <div className="flex justify-end"><span className="w-28 font-bold text-left">Status</span> <span className="w-32 text-left uppercase">: {printData.status}</span></div>
            </div>
          </div>

          {/* Table Header (Lines Only) */}
          <div className="border-t-2 border-b-2 border-black flex font-black uppercase py-2 mb-2 text-[11px]">
            <div className="w-[10%]">LOT-NO</div>
            <div className="w-[30%]">Item Name</div>
            <div className="w-[10%] text-center">Qty</div>
            <div className="w-[10%] text-center">Days</div>
            <div className="w-[10%] text-right">Rent Rate</div>
            <div className="w-[10%] text-right">Rent Amt</div>
            <div className="w-[10%] text-right">Lab Rate</div>
            <div className="w-[10%] text-right">Lab Amt</div>
          </div>

          {/* Table Rows (No Borders) */}
          <div className="min-h-[250px] border-b-2 border-black pb-4">
            {printData.items?.map((row: any, idx: number) => (
              <div key={idx} className="flex py-1 text-[12px]">
                <div className="w-[10%] font-bold">{row.lot?.lotNo || '---'}</div>
                <div className="w-[30%] font-black uppercase">{row.lot?.item?.name || '---'}</div>
                <div className="w-[10%] text-center font-black">{row.qty}</div>
                <div className="w-[10%] text-center">{row.period}</div>
                <div className="w-[10%] text-right">{Number(row.rentRate).toFixed(2)}</div>
                <div className="w-[10%] text-right font-bold">₹{Number(row.rentAmt).toFixed(2)}</div>
                <div className="w-[10%] text-right">{Number(row.labourRate).toFixed(2)}</div>
                <div className="w-[10%] text-right font-bold">₹{Number(row.labourAmt).toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Summary Calculations Section */}
          <div className="grid grid-cols-2 gap-20 mt-4 text-[12px]">
            <div className="space-y-1">
              <div className="flex"><span className="w-32 font-bold">Total Qty</span> <span>: {printData.totalQty} Bags</span></div>
              <div className="flex"><span className="w-32 font-bold">Base Rent</span> <span>: ₹{Number(printData.totalRent).toFixed(2)}</span></div>
              <div className="flex"><span className="w-32 font-bold">Base Labour</span> <span>: ₹{Number(printData.totalLabour).toFixed(2)}</span></div>
            </div>
            <div className="space-y-1 text-right">
              <div className="flex justify-end"><span className="w-36 font-bold text-left">Taxable Value</span> <span className="w-24 text-right">₹{Number(printData.taxableValue).toFixed(2)}</span></div>
              {Number(printData.cgst) > 0 && <div className="flex justify-end"><span className="w-36 font-bold text-left">CGST</span> <span className="w-24 text-right">₹{Number(printData.cgst).toFixed(2)}</span></div>}
              {Number(printData.sgst) > 0 && <div className="flex justify-end"><span className="w-36 font-bold text-left">SGST</span> <span className="w-24 text-right">₹{Number(printData.sgst).toFixed(2)}</span></div>}
              {Number(printData.igst) > 0 && <div className="flex justify-end"><span className="w-36 font-bold text-left">IGST</span> <span className="w-24 text-right">₹{Number(printData.igst).toFixed(2)}</span></div>}
              <div className="flex justify-end"><span className="w-36 font-bold text-left">Round Off</span> <span className="w-24 text-right">₹{Number(printData.roundOff).toFixed(2)}</span></div>
              <div className="flex justify-end border-t border-black pt-1 font-black text-sm"><span className="w-36 text-left uppercase">Net Payable</span> <span className="w-24 text-right">₹{Number(printData.netAmount).toLocaleString('en-IN')}</span></div>
            </div>
          </div>

          <div className="mt-16">
              <p className="text-[11px] font-bold leading-tight mb-20 text-center">
                  * Thank you for your business. Please settle outstanding dues within payment terms. *
              </p>
              <div className="flex justify-between items-end px-10">
                 <div className="border-t border-black pt-2 w-64 text-center font-black text-[12px]">(Customer Signature)</div>
                 <div className="border-t border-black pt-2 w-64 text-center font-black text-[12px]">Authorized Signatory</div>
              </div>
          </div>
        </div>
      )}

      {/* STYLES FOR PRINTING */}
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
          @page { size: portrait; margin: 15mm; }
        }
      `}</style>

    </div>
  );
}
