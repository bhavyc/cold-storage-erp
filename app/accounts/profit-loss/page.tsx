"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FileSpreadsheet, Printer, TrendingUp, Search, Loader2, ArrowUpRight, ArrowDownRight, Wallet, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ProfitLossPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  // 1. FETCH DATA FUNCTION
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/final-reports?toDate=${toDate}`);
      if (!res.ok) throw new Error("Server Error");
      const json = await res.json();
      
      // Filter strictly for Profit Loss type groups
      const plData = json.filter((item: any) => item.reportType === "Profit Loss");
      setData(plData);
      toast.success("Accounts Synchronized!");
    } catch (err) {
      toast.error("Finance data fetch fail ho gaya!");
    } finally {
      setLoading(false);
    }
  }, [toDate]);

  useEffect(() => {
    handleSearch();
  }, []);

  // 2. LIVE CALCULATIONS ENGINE
  const summary = useMemo(() => {
    const expenses = data.filter(i => i.groupType === "Expense");
    const incomes = data.filter(i => i.groupType === "Income");

    const totalExp = expenses.reduce((s, i) => s + (i.balance || 0), 0);
    const totalInc = incomes.reduce((s, i) => s + (i.balance || 0), 0);
    const netProfit = totalInc - totalExp;

    return { totalExp, totalInc, netProfit, expenses, incomes };
  }, [data]);

  // 3. EXPORT TO EXCEL logic
  const handleExport = () => {
    if (data.length === 0) return toast.error("Export ke liye data nahi hai!");
    let csvContent = "Category,Group Description,Account Name,Amount (INR)\n";
    
    summary.expenses.forEach(ex => {
      csvContent += `EXPENSE,"${ex.groupName}","${ex.name}",${Math.abs(ex.balance)}\n`;
    });
    csvContent += `,,,TOTAL EXPENSES: ${summary.totalExp}\n\n`;

    summary.incomes.forEach(inc => {
      csvContent += `INCOME,"${inc.groupName}","${inc.name}",${Math.abs(inc.balance)}\n`;
    });
    csvContent += `,,,TOTAL INCOME: ${summary.totalInc}\n`;
    csvContent += `,,,NET SURPLUS/DEFICIT: ${summary.netProfit}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Profit_Loss_Report_${toDate}.csv`;
    link.click();
    toast.success("Excel/CSV File Downloaded!");
  };

  return (
    <div className="space-y-6 text-[10px] animate-in fade-in duration-500">
      
      {/* FILTER & ACTION BAR */}
      <div className="bg-white p-3 border rounded shadow-sm flex justify-between items-end no-print">
        <div className="flex gap-4 items-end">
          <div className="space-y-1">
            <label className="font-black text-gray-400 block uppercase mb-1">Up to Date:</label>
            <input 
              type="date" 
              className="border-2 border-indigo-100 p-1.5 rounded font-bold text-indigo-700 outline-none focus:border-indigo-400 shadow-inner" 
              value={toDate} 
              onChange={e => setToDate(e.target.value)}
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-red-600 text-white px-10 py-2 rounded font-black uppercase shadow-md hover:bg-red-700 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>} SEARCH ANALYSIS
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-red-500 text-white p-2 rounded shadow hover:bg-red-600 transition-all" title="Print P&L Statement"><Printer size={18}/></button>
          <button onClick={handleExport} className="bg-green-600 text-white p-2 rounded shadow hover:bg-green-700 transition-all" title="Export to Excel"><FileSpreadsheet size={18}/></button>
        </div>
      </div>

      {/* 📊 TOP FINANCIAL DASHBOARD 📊 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="bg-white p-6 rounded-2xl border-b-4 border-b-green-500 shadow-xl group hover:scale-105 transition-all">
           <div className="flex justify-between items-center mb-2">
             <span className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Gross/Indirect Revenue</span>
             <ArrowUpRight className="text-green-500" size={24}/>
           </div>
           <h3 className="text-3xl font-black text-slate-800">₹ {summary.totalInc.toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border-b-4 border-b-red-500 shadow-xl group hover:scale-105 transition-all">
           <div className="flex justify-between items-center mb-2">
             <span className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Operational Expenditure</span>
             <ArrowDownRight className="text-red-500" size={24}/>
           </div>
           <h3 className="text-3xl font-black text-slate-800">₹ {summary.totalExp.toLocaleString('en-IN')}</h3>
        </div>
        <div className={`p-6 rounded-2xl border-b-4 shadow-xl group hover:scale-105 transition-all text-white ${summary.netProfit >= 0 ? 'bg-indigo-600 border-b-indigo-400' : 'bg-red-900 border-b-red-400'}`}>
           <div className="flex justify-between items-center mb-2">
             <span className="font-black uppercase tracking-widest text-[9px] opacity-70">Net {summary.netProfit >= 0 ? 'Surplus (Profit)' : 'Deficit (Loss)'}</span>
             <Wallet size={24}/>
           </div>
           <h3 className="text-3xl font-black italic tracking-tighter">₹ {Math.abs(summary.netProfit).toLocaleString('en-IN')}</h3>
        </div>
      </div>

      {/* MAIN P&L REPORT CONTAINER */}
      <div className="bg-white border-2 border-slate-700 rounded-lg overflow-hidden shadow-2xl">
        <div className="bg-[#1e293b] text-white p-5 text-center relative overflow-hidden">
           <TrendingUp className="absolute -left-4 -top-4 opacity-10" size={120}/>
           <h1 className="text-3xl font-black uppercase tracking-[8px] italic">Profit & Loss Account</h1>
           <p className="text-[10px] opacity-60 mt-1 uppercase tracking-widest font-bold italic">Cold Storage ERP - Real Time Intelligence Core</p>
           <p className="text-[9px] mt-2 bg-white/10 inline-block px-4 py-0.5 rounded-full">Reporting Period: 01-04-2025 TO {formatDate(toDate)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-white">
          {/* LEFT SIDE: EXPENDITURE (DEBIT) */}
          <div className="border-r-2 border-slate-700 flex flex-col">
            <div className="bg-red-50 p-3 text-center font-black border-b-2 border-red-100 uppercase text-red-700 tracking-widest italic">Expenditure Side (Debit)</div>
            <table className="w-full text-left flex-1">
              <thead className="bg-slate-100 text-[9px] font-black text-slate-500 border-b uppercase">
                <tr><th className="p-3 border-r border-slate-200">Group Desc</th><th className="p-3 border-r border-slate-200">Account Particulars</th><th className="p-3 text-right">Amount (₹)</th></tr>
              </thead>
              <tbody className="font-bold">
                {loading ? (
                  <tr><td colSpan={3} className="p-20 text-center text-indigo-500 animate-pulse font-black uppercase">Analyzing Expenses...</td></tr>
                ) : summary.expenses.length === 0 ? (
                  <tr><td colSpan={3} className="p-10 text-center text-gray-400 italic">No Expenses Logged</td></tr>
                ) : summary.expenses.map((ex, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-red-50/30 transition-all group">
                    <td className="p-3 border-r border-slate-100 text-gray-400 text-[9px]">{ex.groupName}</td>
                    <td className="p-3 border-r border-slate-100 uppercase text-slate-700">{ex.name}</td>
                    <td className="p-3 text-right text-red-600">{(ex.balance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>
                ))}
                
                {/* 💸 NET PROFIT TRANSFER LINE */}
                {summary.netProfit > 0 && (
                  <tr className="bg-green-50 font-black border-t-2 border-green-200">
                    <td colSpan={2} className="p-3 text-right uppercase italic text-green-700 tracking-widest">
                       Net Profit Transferred to Balance Sheet
                    </td>
                    <td className="p-3 text-right text-green-800 underline underline-offset-4 text-xs font-black">
                      {summary.netProfit.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* RIGHT SIDE: REVENUE (CREDIT) */}
          <div className="flex flex-col">
            <div className="bg-green-50 p-3 text-center font-black border-b-2 border-green-100 uppercase text-green-700 tracking-widest italic">Revenue Side (Credit)</div>
            <table className="w-full text-left flex-1">
              <thead className="bg-slate-100 text-[9px] font-black text-slate-500 border-b uppercase">
                <tr><th className="p-3 border-r border-slate-200">Group Desc</th><th className="p-3 border-r border-slate-200">Account Particulars</th><th className="p-3 text-right">Amount (₹)</th></tr>
              </thead>
              <tbody className="font-bold">
                {loading ? (
                  <tr><td colSpan={3} className="p-20 text-center text-green-500 animate-pulse font-black uppercase">Calculating Revenue Streams...</td></tr>
                ) : summary.incomes.length === 0 ? (
                  <tr><td colSpan={3} className="p-10 text-center text-gray-400 italic">No Income Logged</td></tr>
                ) : summary.incomes.map((inc, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-green-50/30 transition-all group">
                    <td className="p-3 border-r border-slate-100 text-gray-400 text-[9px]">{inc.groupName}</td>
                    <td className="p-3 border-r border-slate-100 uppercase text-slate-700">{inc.name}</td>
                    <td className="p-3 text-right text-green-700">{(inc.balance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>
                ))}

                {/* 📉 NET LOSS LINE */}
                {summary.netProfit < 0 && (
                  <tr className="bg-red-900 text-white font-black border-t-2 border-red-700">
                    <td colSpan={2} className="p-3 text-right uppercase italic tracking-widest">
                       Business Operating Deficit (Net Loss)
                    </td>
                    <td className="p-3 text-right text-yellow-300 underline underline-offset-4 text-xs">
                      {Math.abs(summary.netProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TALLY FOOTER */}
        <div className="grid grid-cols-2 bg-slate-800 text-white font-black text-xs border-t-2 border-slate-700">
           <div className="p-4 flex justify-between border-r-2 border-slate-700 shadow-inner">
             <span className="uppercase tracking-[3px]">Total (Debit)</span>
             <span className="text-sm">₹ {Math.max(summary.totalExp, summary.totalInc).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
           </div>
           <div className="p-4 flex justify-between shadow-inner">
             <span className="uppercase tracking-[3px]">Total (Credit)</span>
             <span className="text-sm">₹ {Math.max(summary.totalExp, summary.totalInc).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
           </div>
        </div>
      </div>

      {/* FOOTER NOTE */}
      <div className="p-3 bg-[#f8f9fa] border rounded-lg flex justify-between items-center opacity-60 font-black text-[8px] uppercase tracking-widest no-print">
         <div className="flex items-center gap-2"><AlertCircle size={12}/> Audit-Ready Statement</div>
         <span>Cold Storage Intelligence Reporting v1.0.4</span>
      </div>

    </div>
  );
}

// Reuse logic from Register for date formatting
function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
}
