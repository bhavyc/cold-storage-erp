"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Search, Printer, AlertCircle, Loader2, ArrowLeft, Calendar, UserCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface LabourRow {
  itemName: string;
  packing: string;
  inQty: number;
  outQty: number;
  total: number;
  rate: number;
  amount: number;
}

export default function LabourBillReportPage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [billData, setBillData] = useState<LabourRow[]>([]);
  
  // Save dates used for the active report for print display
  const [reportDates, setReportDates] = useState({ from: today, to: today });

  const fetchLabourBill = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ fromDate, toDate }).toString();
      const res = await fetch(`/api/reports/labour-bill?${query}`);
      const json = await res.json();
      
      if (res.ok) {
        setBillData(json || []);
        setReportDates({ from: fromDate, to: toDate });
        if (json.length === 0) {
          toast.error("Is date range mein koi entries nahi mili!");
        }
      } else {
        toast.error(json.error || "Labour bill fetch fail ho gaya.");
      }
    } catch (err) {
      toast.error("Server se connect karne mein issue aayi.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchLabourBill();
  }, []);

  // Compute Grand Totals
  const totals = useMemo(() => {
    return billData.reduce(
      (acc, curr) => {
        return {
          inQty: acc.inQty + curr.inQty,
          outQty: acc.outQty + curr.outQty,
          total: acc.total + curr.total,
          amount: acc.amount + curr.amount,
        };
      },
      { inQty: 0, outQty: 0, total: 0, amount: 0 }
    );
  }, [billData]);

  const handlePrint = () => {
    if (billData.length === 0) {
      return toast.error("Pehle data search karein, phir print nikalein!");
    }
    window.print();
  };

  return (
    <>
      <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
        
        {/* --- PRINTABLE SLIP CONTAINER (Hides in Web View, Shows on Print) --- */}
        <div id="print-area" className="hidden print:block p-8 font-mono text-[13px] leading-relaxed text-black bg-white w-full">
          
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black uppercase tracking-widest border-b-2 border-black pb-2 inline-block">
              Labour Bill
            </h1>
          </div>

          {/* Metadata */}
          <div className="flex justify-between items-center mb-6 font-bold">
            <div className="flex gap-4">
              <span>From : {formatDate(reportDates.from)}</span>
              <span>To : {formatDate(reportDates.to)}</span>
            </div>
            <span>Page 1 of 1</span>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border-t border-b-2 border-black text-left">
            <thead>
              <tr className="border-b border-black font-black uppercase py-2">
                <th className="py-2 pr-4 w-[40%]">Item Name</th>
                <th className="py-2 px-2 w-[15%] text-left">Packing</th>
                <th className="py-2 px-2 w-[10%] text-right">IN</th>
                <th className="py-2 px-2 w-[10%] text-right">OUT</th>
                <th className="py-2 px-2 w-[10%] text-right">Total</th>
                <th className="py-2 px-2 w-[10%] text-right">Rate</th>
                <th className="py-2 pl-4 w-[15%] text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {billData.map((row, idx) => (
                <tr key={idx} className="border-b border-dotted border-gray-400 py-1">
                  <td className="py-1.5 pr-4 font-bold uppercase">{row.itemName}</td>
                  <td className="py-1.5 px-2 uppercase text-left">{row.packing}</td>
                  <td className="py-1.5 px-2 text-right font-mono">{row.inQty || ""}</td>
                  <td className="py-1.5 px-2 text-right font-mono">{row.outQty || ""}</td>
                  <td className="py-1.5 px-2 text-right font-mono font-bold">{row.total}</td>
                  <td className="py-1.5 px-2 text-right font-mono">{row.rate.toFixed(2)}</td>
                  <td className="py-1.5 pl-4 text-right font-mono font-bold">{row.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Row */}
          <div className="border-b-2 border-black py-2.5 flex justify-between font-black text-sm mb-16">
            <div className="w-[40%] uppercase">Total...</div>
            <div className="w-[15%]"></div>
            <div className="w-[10%] text-right font-mono">{totals.inQty}</div>
            <div className="w-[10%] text-right font-mono">{totals.outQty}</div>
            <div className="w-[10%] text-right font-mono">{totals.total}</div>
            <div className="w-[10%]"></div>
            <div className="w-[15%] text-right font-mono underline underline-offset-4 decoration-double">
              ₹ {totals.amount.toFixed(2)}
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 mt-20 pt-8">
            <div className="space-y-16">
              <div className="text-[10px] italic leading-tight w-3/4">
                Verify kiya gaya aur Contractor dwara sweekar kiya gaya.
              </div>
              <div className="border-t border-black pt-1.5 w-56 text-center font-bold">
                (Contractor/Worker Signature)
              </div>
            </div>
            <div className="flex flex-col items-center justify-end">
              <p className="font-bold mb-16 uppercase">For DJ GREEN STORAGE SOLUTIONS (P) LTD.</p>
              <div className="border-t border-black pt-1.5 w-64 text-center font-black uppercase">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>

        {/* --- WEB INTERFACE ACTION BAR (no-print) --- */}
        <div className="flex justify-between bg-white p-3 rounded shadow-sm border no-print">
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/dashboard/stats")}
              className="bg-slate-600 text-white px-5 py-1.5 rounded font-black uppercase shadow hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <div className="px-6 py-1.5 rounded-full font-black uppercase bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1.5">
              <UserCheck size={14} /> Contractor Billing Mode
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={billData.length === 0}
              className={`px-8 py-1.5 rounded font-black flex items-center gap-2 shadow uppercase transition-all ${
                billData.length === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              }`}
            >
              <Printer size={16} /> Print Labour Bill
            </button>
          </div>
        </div>

        {/* Title Banner */}
        <div className="bg-[#4a4ea3] text-white p-2.5 rounded-t-lg font-black text-center uppercase tracking-[5px] italic shadow-md border-b-4 border-indigo-400 no-print">
          Daily Contractor Labour Bill Summary
        </div>

        {/* FILTER BAR (no-print) */}
        <div className="bg-white p-6 border rounded-b-lg shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-end no-print">
          <div className="space-y-1">
            <label className="font-black text-indigo-900 uppercase text-[9px] tracking-widest flex items-center gap-1.5">
              <Calendar size={12} /> From Date *
            </label>
            <input
              type="date"
              className="w-full border-2 border-slate-100 p-2.5 rounded bg-white font-bold outline-none focus:border-indigo-400"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="font-black text-indigo-900 uppercase text-[9px] tracking-widest flex items-center gap-1.5">
              <Calendar size={12} /> To Date *
            </label>
            <input
              type="date"
              className="w-full border-2 border-slate-100 p-2.5 rounded bg-white font-bold outline-none focus:border-indigo-400"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div>
            <button
              onClick={fetchLabourBill}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-black uppercase tracking-widest shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
              Generate Bill
            </button>
          </div>
        </div>

        {/* WEB SUMMARY TABLE (no-print) */}
        <div className="bg-white border rounded shadow-md overflow-hidden min-h-[350px] no-print">
          <table className="w-full border-collapse text-left">
            <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] shadow-sm">
              <tr>
                <th className="p-4 border-r border-indigo-200 bg-indigo-100 w-16 text-center text-indigo-900">SR.</th>
                <th className="p-4 border-r border-slate-300">Item Description</th>
                <th className="p-4 border-r border-slate-300 text-center w-36">Packing Unit</th>
                <th className="p-4 border-r border-slate-300 text-right w-28 bg-green-50/30 text-green-800">IN Qty</th>
                <th className="p-4 border-r border-slate-300 text-right w-28 bg-blue-50/30 text-blue-800">OUT Qty</th>
                <th className="p-4 border-r border-slate-300 text-right w-28 bg-slate-50 text-slate-700">Total Qty</th>
                <th className="p-4 border-r border-slate-300 text-right w-28 text-orange-600">Rate (₹)</th>
                <th className="p-4 text-right w-36 bg-indigo-50/20 text-indigo-900">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-24 text-center font-black text-indigo-700 animate-pulse text-lg uppercase tracking-widest">
                    Compiling daily transaction registers...
                  </td>
                </tr>
              ) : billData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-24 text-center text-gray-400 italic">
                    Chuni hui dates ke liye koi labour entry nahi mili.
                  </td>
                </tr>
              ) : (
                billData.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-all">
                    <td className="p-4 border-r border-indigo-100 text-center text-gray-400 font-mono">{idx + 1}</td>
                    <td className="p-4 border-r border-slate-100 font-black text-indigo-950 uppercase">{row.itemName}</td>
                    <td className="p-4 border-r border-slate-100 text-center uppercase">{row.packing}</td>
                    <td className="p-4 border-r border-slate-100 text-right text-green-700 font-mono">{row.inQty || "-"}</td>
                    <td className="p-4 border-r border-slate-100 text-right text-blue-600 font-mono">{row.outQty || "-"}</td>
                    <td className="p-4 border-r border-slate-100 text-right text-slate-800 font-mono bg-slate-50/50">{row.total}</td>
                    <td className="p-4 border-r border-slate-100 text-right text-orange-600 font-mono">₹{row.rate.toFixed(2)}</td>
                    <td className="p-4 text-right text-indigo-900 font-mono bg-indigo-50/10">₹{row.amount.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* WEB TOTALS BANNER (no-print) */}
        {billData.length > 0 && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-[#1e293b] rounded-xl shadow-xl text-white no-print">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Inward Bags</p>
              <div className="text-3xl font-black text-green-400 italic font-mono">{totals.inQty}</div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Outward Bags</p>
              <div className="text-3xl font-black text-blue-400 italic font-mono">{totals.outQty}</div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aggregate Bags Lifted</p>
              <div className="text-3xl font-black text-slate-200 italic font-mono">{totals.total}</div>
            </div>
            <div className="bg-indigo-600 p-4 rounded-xl text-center shadow-inner ring-2 ring-indigo-500/50">
              <p className="text-[9px] font-black uppercase tracking-[3px] text-white/80 mb-1">Total Wages Payable</p>
              <div className="text-3xl font-black text-yellow-300 italic font-mono">₹{totals.amount.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* STYLES FOR PRINT ONLY LAYOUT */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area,
          #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            size: portrait;
            margin: 1.5cm;
          }
        }
      `}</style>
    </>
  );
}
