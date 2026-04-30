"use client";

import React, { useEffect, useState } from "react";
import { FileSpreadsheet, Printer, Landmark, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function BalanceSheetPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]); // Default to today

  // 1. FETCH DATA FUNCTION
  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/final-reports?toDate=${toDate}`);
      if (!res.ok) throw new Error("Fetch Failed");
      const json = await res.json();
      
      // Store all ledgers to calculate Net Profit transfer
      setData(json);
      toast.success("Balance Sheet Synchronized!");
    } catch (err) {
      toast.error("Financial reports load karne mein error!");
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    handleSearch();
  }, []);

  // Splitting Data & Calculating Totals
  const liabilities = data.filter(i => i.reportType === "Balance Sheet" && i.groupType === "Liability");
  const assets = data.filter(i => i.reportType === "Balance Sheet" && i.groupType === "Asset");

  const incomes = data.filter(i => i.reportType === "Profit Loss" && i.groupType === "Income");
  const expenses = data.filter(i => i.reportType === "Profit Loss" && i.groupType === "Expense");

  const totalInc = incomes.reduce((s, i) => s + Math.abs(i.balance || 0), 0);
  const totalExp = expenses.reduce((s, i) => s + Math.abs(i.balance || 0), 0);
  const netProfit = totalInc - totalExp;

  const displayLiabilities = [...liabilities];
  const displayAssets = [...assets];

  let totalLiab = liabilities.reduce((s, i) => s + (i.balance || 0), 0);
  let totalAssets = assets.reduce((s, i) => s + (i.balance || 0), 0);

  // Accounting Rule: Transfer Net Profit to Liability or Net Loss to Asset
  if (netProfit > 0) {
    displayLiabilities.push({
      groupName: "P&L Transfer",
      name: "Net Profit",
      balance: netProfit,
      isProfit: true
    });
    totalLiab += netProfit;
  } else if (netProfit < 0) {
    displayAssets.push({
      groupName: "P&L Transfer",
      name: "Net Loss",
      balance: Math.abs(netProfit),
      isProfit: true
    });
    totalAssets += Math.abs(netProfit);
  }

  // 2. EXPORT TO CSV (Excel)
  const handleExport = () => {
    if (data.length === 0) return toast.error("No data to export!");

    // CSV Header
    let csvContent = "Type,Group Desc,Account Desc,Amount (INR)\n";

    // Append Liabilities
    displayLiabilities.forEach(l => {
      csvContent += `Liability,"${l.groupName}","${l.name}",${Math.abs(l.balance)}\n`;
    });
    csvContent += `TOTAL LIABILITIES,,,${totalLiab}\n\n`;

    // Append Assets
    displayAssets.forEach(a => {
      csvContent += `Asset,"${a.groupName}","${a.name}",${Math.abs(a.balance)}\n`;
    });
    csvContent += `TOTAL ASSETS,,,${totalAssets}\n`;

    // Download Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Balance_Sheet_${toDate}.csv`;
    link.click();
    toast.success("Excel/CSV Downloaded!");
  };

  return (
    <div className="space-y-4 text-[10px] animate-in slide-in-from-bottom-4 duration-500">
      
      {/* FILTER & ACTION BAR */}
      <div className="bg-white p-3 border rounded shadow-sm flex justify-between items-center no-print">
         <div className="flex gap-4 items-center">
            <label className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">As On Date:</label>
            <input 
              type="date" 
              className="border-2 border-indigo-100 p-1.5 rounded font-bold text-indigo-700 outline-none focus:border-indigo-400" 
              value={toDate} 
              onChange={e => setToDate(e.target.value)} 
            />
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="bg-red-600 text-white px-8 py-1.5 rounded font-black uppercase hover:bg-red-700 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-md"
            >
              {loading ? <Loader2 size={14} className="animate-spin"/> : "SEARCH"}
            </button>
         </div>
         <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-red-500 text-white p-2 rounded shadow hover:bg-red-600 transition-all" title="Print Balance Sheet"><Printer size={16}/></button>
            <button onClick={handleExport} className="bg-green-600 text-white p-2 rounded shadow hover:bg-green-700 transition-all" title="Export to Excel"><FileSpreadsheet size={16}/></button>
         </div>
      </div>

      {/* HEADER DISPLAY */}
      <div className="bg-white p-6 border rounded shadow-sm text-center space-y-1 relative">
        <Landmark className="absolute text-slate-100 right-10 top-5 opacity-50" size={60}/>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Cold Storage ERP</h1>
        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[5px] mt-2">
          Balance Sheet <span className="text-gray-400 text-[8px] tracking-normal">(As on {new Date(toDate).toLocaleDateString('en-GB')})</span>
        </p>
      </div>

      {/* DOUBLE ENTRY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-slate-700 rounded-lg overflow-hidden shadow-2xl">
        
        {/* LEFT: LIABILITIES */}
        <div className="border-r-2 border-slate-700 bg-white flex flex-col">
          <div className="bg-[#5d5fb1] text-white p-3 text-center font-black border-b-2 border-indigo-300 uppercase tracking-[5px]">Liabilities</div>
          <table className="w-full text-left flex-1">
            <thead className="bg-slate-100 text-[9px] font-black text-slate-500 border-b uppercase">
              <tr>
                <th className="p-3 border-r border-slate-200">Group Desc</th>
                <th className="p-3 border-r border-slate-200">A/c Desc</th>
                <th className="p-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="p-10 text-center text-indigo-500 animate-pulse font-bold">Compiling Liabilities...</td></tr>
              ) : displayLiabilities.length === 0 ? (
                <tr><td colSpan={3} className="p-10 text-center text-gray-400 italic">No Liability Records</td></tr>
              ) : displayLiabilities.map((l, idx) => (
                <tr key={idx} className={`border-b border-slate-100 hover:bg-indigo-50/30 transition-all font-bold text-[10px] 
                  ${l.isProfit ? 'text-green-600 bg-green-50/30 italic' : ''}
                  ${l.name === 'Difference in Opening Balances' ? 'text-red-600 bg-red-50 italic animate-pulse' : ''}
                  ${!l.isProfit && l.name !== 'Difference in Opening Balances' ? 'text-slate-700' : ''}
                `}>
                  <td className="p-3 border-r border-slate-200 truncate max-w-[120px]">{l.groupName}</td>
                  <td className="p-3 border-r border-slate-200 uppercase">{l.name}</td>
                  <td className="p-3 text-right">
                    {(l.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-slate-800 text-white font-black text-sm uppercase flex justify-between p-4 border-t-2 border-slate-700">
            <span className="tracking-widest">Total Liabilities</span>
            <span className="text-red-400">₹ {totalLiab.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* RIGHT: ASSETS */}
        <div className="bg-white flex flex-col">
          <div className="bg-[#5d5fb1] text-white p-3 text-center font-black border-b-2 border-indigo-300 uppercase tracking-[5px]">Assets</div>
          <table className="w-full text-left flex-1">
            <thead className="bg-slate-100 text-[9px] font-black text-slate-500 border-b uppercase">
              <tr>
                <th className="p-3 border-r border-slate-200">Group Desc</th>
                <th className="p-3 border-r border-slate-200">A/c Desc</th>
                <th className="p-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="p-10 text-center text-indigo-500 animate-pulse font-bold">Compiling Assets...</td></tr>
              ) : displayAssets.length === 0 ? (
                <tr><td colSpan={3} className="p-10 text-center text-gray-400 italic">No Asset Records</td></tr>
              ) : displayAssets.map((a, idx) => (
                <tr key={idx} className={`border-b border-slate-100 hover:bg-indigo-50/30 transition-all font-bold text-[10px] 
                  ${a.isProfit ? 'text-red-600 bg-red-50/30 italic' : ''}
                  ${a.name === 'Difference in Opening Balances' ? 'text-red-600 bg-red-50 italic animate-pulse' : ''}
                  ${!a.isProfit && a.name !== 'Difference in Opening Balances' ? 'text-slate-700' : ''}
                `}>
                  <td className="p-3 border-r border-slate-200 truncate max-w-[120px]">{a.groupName}</td>
                  <td className="p-3 border-r border-slate-200 uppercase">{a.name}</td>
                  <td className="p-3 text-right">
                    {(a.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-slate-800 text-white font-black text-sm uppercase flex justify-between p-4 border-t-2 border-slate-700">
            <span className="tracking-widest">Total Assets</span>
            <span className="text-green-400">₹ {totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

      </div>

      {/* Difference Warning (If Any) */}
      {Math.abs(totalLiab - totalAssets) > 0.01 && !loading && (
        <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded text-center font-black animate-pulse uppercase tracking-widest no-print">
          Mismatch Detected: Difference of ₹ {Math.abs(totalLiab - totalAssets).toLocaleString('en-IN', { minimumFractionDigits: 2 })} 
          <span className="block text-[9px] font-bold text-red-400 mt-1 lowercase tracking-normal">(Please check Profit & Loss transfer or unsynced ledgers)</span>
        </div>
      )}
    </div>
  );
}
