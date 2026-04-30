"use client";

import React, { useEffect, useState } from "react";
import { Search, FileText, Calculator, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function PendingBillSummary() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [selectedParty, setSelectedParty] = useState("All");
  const [loading, setLoading] = useState(false);

  // 1. Load Parties for dropdown
  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
  }, []);

  // 2. SEARCH FUNCTION (Wired to Red Button)
  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/pending/summary?partyId=${selectedParty}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.length === 0) toast.error("Koi pending bill nahi mila!");
      }
    } catch (err) {
      toast.error("Fetch failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in">
      {/* Visual Header */}
      <div className="bg-[#4a4ea3] text-white p-2.5 rounded-t-lg shadow flex items-center gap-2 uppercase tracking-widest font-bold">
        <Calculator size={16}/> Pending Bill Statement | Summary
      </div>

      {/* FILTER BAR (Image Replication) */}
      <div className="bg-white p-6 border rounded shadow-sm flex items-end gap-6">
        <div className="space-y-1">
          <label className="font-bold text-gray-500 uppercase text-[10px]">Select Party</label>
          <select 
            className="border-2 border-indigo-100 p-2 rounded-md w-80 bg-white font-bold text-indigo-700 outline-none focus:border-indigo-500 transition-all"
            value={selectedParty}
            onChange={(e) => setSelectedParty(e.target.value)}
          >
            <option value="All">All Parties</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName} [{p.partyCode}]</option>)}
          </select>
        </div>
        
        <button 
          onClick={handleSearch}
          disabled={loading}
          className="bg-red-600 text-white px-10 py-2.5 rounded font-bold uppercase hover:bg-red-700 shadow-md flex items-center gap-2 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>}
          VIEW STATEMENT
        </button>
      </div>

      {/* SUMMARY TABLE */}
      <div className="bg-white border rounded shadow-sm overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[10px]">
            <tr>
              <th className="p-4 border-r border-slate-300">Party Code</th>
               <th className="p-4 border-r border-slate-300">Party Name</th>
              <th className="p-4 border-r border-slate-300 text-center">Billing Mode</th>
              <th className="p-4 border-r border-slate-300 text-center">No. of Lots</th>
              <th className="p-4 border-r border-slate-300 text-center">Total Balance Qty</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-20 text-center text-gray-400 italic font-medium">
                  {loading ? "Scanning storage for unbilled items..." : "Select a party to view unbilled items"}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-colors">
                  <td className="p-4 border-r border-slate-200 font-bold text-indigo-700">{row.partyCode}</td>
                   <td className="p-4 border-r border-slate-200 font-black text-slate-700 uppercase">{row.tradeName}</td>
                  <td className="p-4 border-r border-slate-200 text-center">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-[8px] font-bold border border-indigo-100">
                      {row.billingMode}
                    </span>
                  </td>
                  <td className="p-4 border-r border-slate-200 text-center font-bold">{row.noOfLots}</td>
                  <td className="p-4 border-r border-slate-200 text-center font-black text-red-600 bg-red-50/30">
                    {row.totalBalQty} <span className="text-[8px] font-normal text-gray-400">BAGS</span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => router.push(`/billing/pending-detail?partyId=${row.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-[10px] font-bold flex items-center gap-1 mx-auto shadow transition-transform active:scale-90"
                    >
                      View Details <ArrowRight size={12}/>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Information Footer */}
      <div className="p-2 bg-slate-50 border rounded text-[9px] text-gray-400 italic text-center">
        * This summary shows only those parties who have active stock or unbilled dispatches in the system.
      </div>
    </div>
  );
}
