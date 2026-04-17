"use client";

import React, { useEffect, useState } from "react";
import { FileSpreadsheet, Printer, Landmark } from "lucide-react";

export default function BalanceSheetPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/accounting/final-reports").then(res => res.json()).then(json => {
      setData(json.filter((item: any) => item.reportType === "Balance Sheet"));
    });
  }, []);

  const liabilities = data.filter(i => i.groupType === "Liability");
  const assets = data.filter(i => i.groupType === "Asset");

  const totalLiab = liabilities.reduce((s, i) => s + Math.abs(i.balance), 0);
  const totalAssets = assets.reduce((s, i) => s + Math.abs(i.balance), 0);

  return (
    <div className="space-y-4 text-[10px] animate-in slide-in-from-bottom-4">
      <div className="bg-white p-3 border rounded shadow-sm flex justify-between items-center">
         <div className="flex gap-4">
            <input type="date" className="border p-1 rounded" defaultValue="2026-03-31" />
            <button className="bg-red-600 text-white px-6 rounded font-bold uppercase">Search</button>
         </div>
         <div className="flex gap-2">
            <button className="bg-red-500 text-white p-1.5 rounded shadow"><Printer size={16}/></button>
            <button className="bg-green-600 text-white p-1.5 rounded shadow"><FileSpreadsheet size={16}/></button>
         </div>
      </div>

      <div className="bg-white p-6 border rounded shadow-sm text-center space-y-1">
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Visual Softech</h1>
        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest italic">Balance Sheet</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border rounded overflow-hidden shadow-2xl">
        {/* LEFT: LIABILITIES */}
        <div className="border-r">
          <div className="bg-[#5d5fb1] text-white p-2 text-center font-black border-b uppercase tracking-widest">Liabilities</div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-bold text-gray-400 border-b uppercase">
              <tr><th className="p-2 border-r">Group Desc</th><th className="p-2 border-r">A/c Desc</th><th className="p-2 text-right">Amount (INR)</th></tr>
            </thead>
            <tbody>
              {liabilities.map((l, idx) => (
                <tr key={idx} className="border-b"><td className="p-2 border-r">{l.groupName}</td><td className="p-2 border-r uppercase">{l.name}</td><td className="p-2 text-right">{Math.abs(l.balance).toLocaleString()}</td></tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-800 text-white font-black text-xs uppercase">
               <tr><td colSpan={2} className="p-3 text-right">Total Liabilities</td><td className="p-3 text-right">₹ {totalLiab.toLocaleString()}</td></tr>
            </tfoot>
          </table>
        </div>

        {/* RIGHT: ASSETS */}
        <div>
          <div className="bg-[#5d5fb1] text-white p-2 text-center font-black border-b uppercase tracking-widest">Assets</div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-bold text-gray-400 border-b uppercase">
              <tr><th className="p-2 border-r">Group Desc</th><th className="p-2 border-r">A/c Desc</th><th className="p-2 text-right">Amount (INR)</th></tr>

            </thead>
            <tbody>
              {assets.map((a, idx) => (
                <tr key={idx} className="border-b"><td className="p-2 border-r">{a.groupName}</td><td className="p-2 border-r uppercase">{a.name}</td><td className="p-2 text-right">{Math.abs(a.balance).toLocaleString()}</td></tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-800 text-white font-black text-xs uppercase">
               <tr><td colSpan={2} className="p-3 text-right">Total Assets</td><td className="p-3 text-right">₹ {totalAssets.toLocaleString()}</td></tr>
            </tfoot>
          </table>
          
        </div>
      </div>
    </div>
  );
}