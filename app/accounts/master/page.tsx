"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, FileSpreadsheet, Printer, Edit, Trash2, Landmark, Loader2, Filter, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function AccountMasterList() {
  const router = useRouter();
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]); // To load real groups from DB
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchName, setSearchName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");

  // 1. FETCH LEDGERS (With Search & Group Filter)
  const fetchLedgers = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        name: searchName,
        group: selectedGroup
      }).toString();
      
      const res = await fetch(`/api/accounting/ledgers?${query}`);
      const data = await res.json();
      setLedgers(data || []);
    } catch (err) {
      toast.error("Ledgers fetch karne mein error!");
    } finally {
      setLoading(false);
    }
  }, [searchName, selectedGroup]);

  // 2. FETCH GROUPS (For Filter Dropdown)
  useEffect(() => {
    fetch("/api/accounting/groups") // Ensure this API exists to return G01, G02 etc.
      .then(res => res.json())
      .then(setGroups)
      .catch(() => console.log("Groups could not be loaded"));
    
    fetchLedgers();
  }, []);

  // 3. DELETE LEDGER
  const handleDelete = async (id: string) => {
    if (!confirm("Kya aap is Ledger ko delete karna chahte hain? Isse juda saara hisab (Transactions) mit jayega!")) return;
    
    const loadId = toast.loading("Deleting ledger...");
    try {
      const res = await fetch(`/api/accounting/ledgers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Ledger successfully removed!", { id: loadId });
        fetchLedgers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Delete nahi ho paya. Is ledger mein transactions ho sakte hain.", { id: loadId });
      }
    } catch (err) {
      toast.error("Server Error!", { id: loadId });
    }
  };

  return (
    <div className="space-y-4 text-xs animate-in fade-in duration-500">
      
      {/* HEADER BAR */}
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg flex justify-between items-center shadow-lg border-b-4 border-indigo-300">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-widest text-sm">
          <Landmark size={18}/> Account Master | Ledger Summary
        </h2>
        <div className="flex gap-2">
           <button 
             onClick={() => router.push('/accounts/master/add')} 
             className="bg-orange-500 hover:bg-orange-600 px-5 py-1.5 rounded font-black shadow-md transition-all active:scale-95 text-[10px] uppercase"
           >
             + ADD NEW LEDGER
           </button>
           <button className="bg-green-600 p-2 rounded shadow hover:bg-green-700"><FileSpreadsheet size={16}/></button>
           <button className="bg-red-500 p-2 rounded shadow hover:bg-red-600"><Printer size={16}/></button>
        </div>
      </div>

      {/* FILTER BAR (Mapping Image UI) */}
      <div className="bg-white p-6 border rounded shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-end shadow-inner">
        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px] flex items-center gap-1">
            <Filter size={10}/> Filter By Group Head
          </label>
          <select 
            className="w-full border-2 border-slate-100 p-2 rounded-md bg-white font-bold text-indigo-700 outline-none focus:border-indigo-400 transition-all"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="All">--- ALL GROUPS ---</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name} [{g.code}]</option>
            ))}
            {/* Fallback agar groups load na ho sakein */}
            {groups.length === 0 && (
              <>
                <option value="G01">Sundry Debtors</option>
                <option value="G07">Cash In Hand</option>
                <option value="G08">Bank Accounts</option>
              </>
            )}
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-black text-gray-400 uppercase text-[9px]">Search Account Name</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <input 
               className="w-full border-2 border-slate-100 p-2 pl-10 rounded-md outline-none focus:border-indigo-400 font-bold" 
               placeholder="Search by name..." 
               value={searchName}
               onChange={(e) => setSearchName(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && fetchLedgers()}
            />
          </div>
        </div>

        <button 
          onClick={fetchLedgers} 
          disabled={loading}
          className="bg-red-600 text-white px-10 py-2.5 rounded font-black uppercase shadow-md hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={16}/> : "SEARCH REGISTRY"}
        </button>
      </div>

      {/* DATA TABLE (7 Columns Mapping) */}
      <div className="bg-white border-2 border-slate-100 rounded-lg shadow-xl overflow-hidden min-h-[450px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f1f5f9] text-slate-800 uppercase font-black border-b border-slate-200 text-[10px]">
            <tr>
              <th className="p-4 border-r border-slate-200 w-32">A/C Code</th>
              <th className="p-4 border-r border-slate-200">Group Head</th>
              <th className="p-4 border-r border-slate-200">Full Account Name</th>
              <th className="p-4 border-r border-slate-200">Address / Location</th>
              <th className="p-4 border-r border-slate-200 text-center w-24">Op Mode</th>
              <th className="p-4 border-r border-slate-200 text-right w-40">Opening Amt (₹)</th>
              <th className="p-4 text-center w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-24 text-center font-bold text-indigo-700 animate-pulse text-lg uppercase tracking-widest">Fetching Ledger Data...</td></tr>
            ) : ledgers.length === 0 ? (
              <tr><td colSpan={7} className="p-24 text-center text-gray-400 italic">No account ledgers found. Try adjusting your search filters.</td></tr>
            ) : ledgers.map(l => (
              <tr key={l.id} className="border-b hover:bg-indigo-50/40 transition-colors group font-bold">
                <td className="p-4 border-r border-slate-100 font-black text-indigo-800 uppercase tracking-tighter">{l.code}</td>
                <td className="p-4 border-r border-slate-100 text-gray-500 uppercase italic text-[9px]">{l.group?.name}</td>
                <td className="p-4 border-r border-slate-100 text-slate-700 uppercase">{l.name}</td>
                <td className="p-4 border-r border-slate-100 text-gray-400 truncate max-w-[200px]">{l.address || "---"}</td>
                <td className="p-4 border-r border-slate-100 text-center">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${l.openingMode === 'Debit' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                    {l.openingMode}
                  </span>
                </td>
                <td className="p-4 border-r border-slate-100 text-right font-black text-indigo-900 bg-slate-50/50">
                   {Number(l.openingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-5">
                    <button 
                      onClick={() => router.push(`/accounts/master/edit/${l.id}`)}
                      className="text-blue-600 hover:scale-125 transition-transform p-1 bg-blue-50 rounded"
                      title="Edit Ledger Details"
                    >
                      <Edit size={16}/>
                    </button>
                    <button 
                      onClick={() => handleDelete(l.id)}
                      className="text-red-500 hover:scale-125 transition-transform p-1 bg-red-50 rounded"
                      title="Delete Ledger"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER INFO */}
      <div className="flex justify-between items-center bg-slate-50 p-2 border rounded opacity-60">
         <p className="font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
           <AlertCircle size={14}/> Total Ledgers in Registry: {ledgers.length}
         </p>
         <p className="text-[8px] font-black italic uppercase tracking-[5px]">Cold Storage Financial Core</p>
      </div>

    </div>
  );
}
