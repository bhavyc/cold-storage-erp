"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, FileSpreadsheet, Printer, Edit, Trash2, Landmark, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function AccountMasterList() {
  const router = useRouter();
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounting/ledgers?name=${searchName}&group=${selectedGroup}`);
      const data = await res.json();
      setLedgers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLedgers(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Kya aap is Ledger ko delete karna chahte hain? Isse juda saara hisab mit jayega!")) return;
    const res = await fetch(`/api/accounting/ledgers/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Ledger successfully uda diya gaya!");
      fetchLedgers();
    } else {
      toast.error("Delete nahi ho paya. Shayad is ledger mein transactions hain.");
    }
  };

  return (
    <div className="space-y-4 text-xs animate-in fade-in duration-500">
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg flex justify-between items-center shadow-lg">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-widest">
          <Landmark size={16}/> Account Master (Ledger Summary)
        </h2>
        <div className="flex gap-2">
           <button onClick={() => router.push('/accounts/master/add')} className="bg-orange-500 hover:bg-orange-600 px-4 py-1 rounded font-bold shadow-md transition-all">+ Add New Ledger</button>
           <button className="bg-green-600 p-1.5 rounded shadow hover:bg-green-700"><FileSpreadsheet size={16}/></button>
           <button className="bg-red-500 p-1.5 rounded shadow hover:bg-red-600"><Printer size={16}/></button>
        </div>
      </div>

      {/* FILTER BAR (Image Mapping) */}
      <div className="bg-white p-4 border rounded shadow-sm flex gap-4 items-end">
        <div className="flex-1 max-w-xs space-y-1">
          <label className="font-bold text-gray-400 uppercase text-[10px]">Group Head</label>
          <select 
            className="w-full border p-2 rounded bg-white font-medium outline-none focus:ring-1 focus:ring-indigo-400"
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="All">All Groups</option>
            <option value="G01">Sundry Debtors</option>
            <option value="G07">Cash In Hand</option>
            <option value="G08">Bank Accounts</option>
          </select>
        </div>
        <div className="flex-1 max-w-xs space-y-1">
          <label className="font-bold text-gray-400 uppercase text-[10px]">Account Name</label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 text-gray-400" size={14} />
            <input 
               className="w-full border p-2 pl-8 rounded outline-none focus:ring-1 focus:ring-indigo-400" 
               placeholder="Search Ledger Name..." 
               value={searchName}
               onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
        </div>
        <button onClick={fetchLedgers} className="bg-red-600 text-white px-10 py-2 rounded font-black uppercase shadow-md hover:bg-red-700 transition-all">
          {loading ? <Loader2 className="animate-spin" size={16}/> : "SEARCH"}
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border rounded shadow-sm overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f1f5f9] text-slate-700 uppercase font-black border-b text-[9px]">
            <tr>
              <th className="p-3 border-r w-24">A/C Code</th>
              <th className="p-3 border-r">Group Head</th>
              <th className="p-3 border-r">Account Name</th>
              <th className="p-3 border-r">Address</th>
              <th className="p-3 border-r text-center">Op Mode</th>
              <th className="p-3 border-r text-right">Opening Amt</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {ledgers.length === 0 ? (
              <tr><td colSpan={7} className="p-20 text-center text-gray-400 italic">No ledgers found. Click Search or add a new one.</td></tr>
            ) : ledgers.map(l => (
              <tr key={l.id} className="border-b hover:bg-indigo-50/40 transition-colors group font-bold">
                <td className="p-3 border-r text-indigo-700">{l.code}</td>
                <td className="p-3 border-r text-gray-500 uppercase italic">{l.group?.name}</td>
                <td className="p-3 border-r text-slate-800 uppercase tracking-tighter">{l.name}</td>
                <td className="p-3 border-r text-gray-400 truncate max-w-[150px]">{l.address || "---"}</td>
                <td className="p-3 border-r text-center">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${l.openingMode === 'Debit' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                    {l.openingMode}
                  </span>
                </td>
                <td className="p-3 border-r text-right font-black text-indigo-900">₹ {Number(l.openingBalance).toLocaleString()}</td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-3">
                    <Edit size={14} className="text-blue-500 cursor-pointer hover:scale-125 transition-transform" onClick={() => router.push(`/accounts/master/edit/${l.id}`)}/>
                    <Trash2 size={14} className="text-red-500 cursor-pointer hover:scale-125 transition-transform" onClick={() => handleDelete(l.id)}/>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}