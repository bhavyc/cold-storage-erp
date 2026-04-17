"use client";

import React, { useState, useEffect } from "react";
import { Search, Printer, FileSpreadsheet, RefreshCcw, IndianRupee } from "lucide-react";
import { toast } from "react-hot-toast";

interface StatementRow {
  date: string;
  particular: string;
  billedQty: number;
  debit: number;
  credit: number;
  balance: number;
}

export default function LedgerStatementPage() {
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [data, setData] = useState<StatementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    ledgerId: "",
    fromDate: "2025-04-01",
    toDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetch("/api/accounting/ledgers").then(res => res.json()).then(setLedgers);
  }, []);

  const handleSearch = async () => {
    if (!filters.ledgerId) return toast.error("Please select an Account Head");
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/accounting/ledger-statement?${query}`);
      const json = await res.json();
      setData(json);
    } catch (err) { toast.error("Fetch failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-3 text-[10px] animate-in fade-in duration-500">
      {/* FILTER BAR (Image 75 Replication) */}
      <div className="bg-[#b4b6e4]/30 p-4 border rounded shadow-sm flex flex-wrap items-end gap-4 font-bold text-slate-600">
        <div><label>From Date</label><input type="date" className="w-full border p-1.5 rounded bg-white" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} /></div>
        <div><label>To Date</label><input type="date" className="w-full border p-1.5 rounded bg-white" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} /></div>
        <div className="flex-1 min-w-[300px]"><label>A/c Head</label>
          <select className="w-full border p-1.5 rounded bg-white font-black text-indigo-700 uppercase" value={filters.ledgerId} onChange={e => setFilters({...filters, ledgerId: e.target.value})}>
            <option value="">-- Select A/c Head --</option>
            {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSearch} className="bg-red-600 text-white px-6 py-1.5 rounded font-black uppercase shadow hover:bg-red-700 transition-all">Search</button>
          
          {/* THE RED SERVER REFRESH BUTTON (Image 75) */}
          <button className="bg-red-600 text-white px-4 py-1.5 rounded font-black uppercase shadow flex items-center gap-1 hover:bg-red-700 animate-pulse hover:animate-none">
            <RefreshCcw size={12}/> Server Refresh
          </button>
          
          <button className="bg-green-600 text-white p-1.5 rounded"><FileSpreadsheet size={16}/></button>
          <button className="bg-red-500 text-white p-1.5 rounded"><Printer size={16}/></button>
        </div>
      </div>

      <div className="bg-white p-6 border rounded shadow-sm text-center space-y-1">
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Visual Softech</h1>
        <p className="text-[9px] text-gray-500 font-bold">Block B, Plot No A 26, Mohan Cooperative, South Delhi, New Delhi 110044</p>
        <p className="text-[10px] font-black text-indigo-600">Party Ledger Statement</p>
      </div>

      {/* DATA TABLE (Image 75 Columns) */}
      <div className="bg-white border rounded shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#5d5fb1] text-white uppercase font-black text-[9px]">
            <tr>
              <th className="p-3 border-r border-indigo-400 w-24">Date</th>
              <th className="p-3 border-r border-indigo-400">Particular</th>
              <th className="p-3 border-r border-indigo-400 text-center">Billed Qty</th>
              <th className="p-3 border-r border-indigo-400 text-right">Debit (₹)</th>
              <th className="p-3 border-r border-indigo-400 text-right">Credit (₹)</th>
              <th className="p-3 text-right">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={6} className="p-20 text-center text-gray-400 italic">Select A/c Head and click Search to view statement</td></tr>
            ) : data.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-indigo-50/50 transition-all font-bold">
                <td className="p-3 border-r text-gray-600">{new Date(row.date).toLocaleDateString()}</td>
                <td className="p-3 border-r text-slate-800 uppercase">{row.particular}</td>
                <td className="p-3 border-r text-center text-blue-600">{row.billedQty}</td>
                <td className="p-3 border-r text-right text-red-600">₹ {row.debit.toLocaleString()}</td>
                <td className="p-3 border-r text-right text-green-600">₹ {row.credit.toLocaleString()}</td>
                <td className="p-3 text-right text-indigo-900 bg-slate-50">₹ {row.balance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}