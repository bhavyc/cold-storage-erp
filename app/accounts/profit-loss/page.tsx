"use client";

import React, { useEffect, useState } from "react";
import { FileSpreadsheet, Printer, TrendingUp, Search } from "lucide-react";

export default function ProfitLossPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounting/final-reports").then(res => res.json()).then(json => {
      setData(json.filter((item: any) => item.reportType === "Profit Loss"));
      setLoading(false);
    });
  }, []);

  const expenses = data.filter(i => i.groupType === "Expense");
  const incomes = data.filter(i => i.groupType === "Income");

  const totalExp = expenses.reduce((s, i) => s + Math.abs(i.balance), 0);
  const totalInc = incomes.reduce((s, i) => s + Math.abs(i.balance), 0);
  const netProfit = totalInc - totalExp;

  return (
    <div className="space-y-4 text-[10px] animate-in fade-in duration-500">
      {/* Filter Bar */}
      <div className="bg-white p-3 border rounded shadow-sm flex justify-between items-end">
        <div className="flex gap-4">
          <div><label className="font-bold text-gray-400 block uppercase">To Date</label><input type="date" className="border p-1 rounded" defaultValue="2026-03-31" /></div>
          <button className="bg-red-600 text-white px-6 rounded font-bold uppercase shadow">Search</button>
        </div>
        <div className="flex gap-2">
          <button className="bg-red-500 text-white p-1.5 rounded shadow"><Printer size={16}/></button>
          <button className="bg-green-600 text-white p-1.5 rounded shadow"><FileSpreadsheet size={16}/></button>
        </div>
      </div>

      <div className="bg-white p-6 border rounded shadow-sm text-center space-y-1">
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Visual Softech</h1>
        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Block B, Plot No A 26, Mohan Cooperative, South Delhi, New Delhi 110044</p>
        <p className="text-xs font-bold text-slate-700 mt-4 border-b border-dashed inline-block pb-1">PROFIT & LOSS AC</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border rounded overflow-hidden shadow-xl">
        {/* LEFT: EXPENSES */}
        <div className="border-r">
          <div className="bg-slate-100 p-2 text-center font-black border-b uppercase">Expenses</div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-bold text-gray-400 border-b uppercase">
              <tr><th className="p-2 border-r">Group Desc</th><th className="p-2 border-r">A/c Desc</th><th className="p-2 text-right">Amount (INR)</th></tr>
            </thead>
            <tbody>
              {expenses.map((ex, idx) => (
                <tr key={idx} className="border-b"><td className="p-2 border-r">{ex.groupName}</td><td className="p-2 border-r uppercase">{ex.name}</td><td className="p-2 text-right">{Math.abs(ex.balance).toLocaleString()}</td></tr>
              ))}
              <tr className="bg-yellow-50 font-black text-indigo-700">
                <td colSpan={2} className="p-2 text-right uppercase italic">Net Profit Transferred to B/S</td>
                <td className="p-2 text-right underline underline-offset-4">{netProfit > 0 ? netProfit.toLocaleString() : "0.00"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RIGHT: INCOME */}
        <div>
          <div className="bg-slate-100 p-2 text-center font-black border-b uppercase">Income</div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-bold text-gray-400 border-b uppercase">
              <tr><th className="p-2 border-r">Group Desc</th><th className="p-2 border-r">A/c Desc</th><th className="p-2 text-right">Amount (INR)</th></tr>
            </thead>
            <tbody>
              {incomes.map((inc, idx) => (
                <tr key={idx} className="border-b"><td className="p-2 border-r">{inc.groupName}</td><td className="p-2 border-r uppercase">{inc.name}</td><td className="p-2 text-right">{Math.abs(inc.balance).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}