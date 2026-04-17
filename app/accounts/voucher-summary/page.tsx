"use client";

import React, { useState, useEffect } from "react";
import { Search, Printer, FileSpreadsheet, Filter } from "lucide-react";

export default function VoucherSummaryPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Exact Filters from Image 74
  const [filters, setFilters] = useState({
    fromDate: "2025-04-01", toDate: new Date().toISOString().split('T')[0],
    vocType: "ALL", mode: "ALL", partyName: "ALL", breakage: "Month Wise Total"
  });

  const handleSearch = async () => {
    setLoading(true);
    const res = await fetch(`/api/accounting/vouchers?fromDate=${filters.fromDate}&toDate=${filters.toDate}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  return (
    <div className="space-y-4 text-[10px] animate-in fade-in duration-500">
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg font-bold flex justify-between items-center shadow uppercase tracking-widest">
        <span>Voucher Entry | Index (Register)</span>
        <div className="flex gap-2">
           <button className="bg-green-600 p-1.5 rounded"><FileSpreadsheet size={16}/></button>
           <button className="bg-red-500 p-1.5 rounded"><Printer size={16}/></button>
        </div>
      </div>

      {/* FILTER BAR (Image 74 Replication) */}
      <div className="bg-[#b4b6e4]/20 p-4 border rounded shadow-sm grid grid-cols-2 md:grid-cols-6 gap-3 items-end font-bold text-slate-600">
        <div><label>From Date</label><input type="date" className="w-full border p-1 rounded" value={filters.fromDate} /></div>
        <div><label>To Date</label><input type="date" className="w-full border p-1 rounded" value={filters.toDate} /></div>
        <div><label>Voucher Type</label><select className="w-full border p-1 rounded bg-white"><option>ALL</option><option>Receipt</option><option>Payment</option></select></div>
        <div><label>Mode</label><select className="w-full border p-1 rounded bg-white"><option>ALL</option><option>CASH</option><option>UPI</option></select></div>
        <div><label>Party Name</label><select className="w-full border p-1 rounded bg-white"><option>ALL</option></select></div>
        <div className="flex gap-2">
           <div className="flex-1"><label>Breakage</label><select className="w-full border p-1 rounded bg-white"><option>Month Wise Total</option></select></div>
           <button onClick={handleSearch} className="bg-red-600 text-white p-2 rounded shadow"><Search size={16}/></button>
        </div>
      </div>

      <div className="bg-white border rounded shadow-sm overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f1f5f9] text-slate-800 uppercase font-black text-[9px]">
            <tr>
              <th className="p-3 border-r">VOC DATE</th>
              <th className="p-3 border-r">VOC NO</th>
              <th className="p-3 border-r text-center">MODE</th>
              <th className="p-3 border-r text-center">TYPE</th>
              <th className="p-3 border-r">ACCOUNT HEAD</th>
              <th className="p-3 border-r">NARRATION</th>
              <th className="p-3 border-r text-right">DEBIT (₹)</th>
              <th className="p-3 border-r text-right">CREDIT (₹)</th>
              <th className="p-3 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {data.map((v: any) => (
              <tr key={v.id} className="border-b hover:bg-slate-50 transition-colors">
                <td className="p-3 border-r">{new Date(v.date).toLocaleDateString()}</td>
                <td className="p-3 border-r font-bold text-indigo-700">{v.voucherNo}</td>
                <td className="p-3 border-r text-center font-bold text-blue-600">{v.group}</td>
                <td className="p-3 border-r text-center italic">{v.vocType}</td>
                <td className="p-3 border-r font-bold uppercase">{v.remarks}</td>
                <td className="p-3 border-r text-gray-500 italic">Voucher Entry</td>
                <td className="p-3 border-r text-right font-black text-red-600">₹ {v.totalAmount}</td>
                <td className="p-3 border-r text-right font-black text-green-600">₹ 0.00</td>
                <td className="p-3 text-center text-blue-600">Edit</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}