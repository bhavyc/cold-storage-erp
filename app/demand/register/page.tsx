"use client";

import React, { useEffect, useState } from "react";
import { Search, Plus, FileSpreadsheet, Printer, ListFilter, LayoutList, RefreshCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function DemandRegisterPage() {
  const router = useRouter();
  const [demands, setDemands] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    partyId: "All",
    filterType: "Search By Party"
  });

  // 1. Initial Load: Get Parties for Dropdown
  useEffect(() => {
    fetch("/api/masters/party").then(res => res.json()).then(setParties);
    handleSearch(); // Load initial data
  }, []);

  // 2. SEARCH FUNCTION (Search Button)
  const handleSearch = async () => {
    setLoading(true);
    const query = new URLSearchParams(filters).toString();
    try {
      const res = await fetch(`/api/outward/demand/register?${query}`);
      const data = await res.json();
      if (res.ok) setDemands(data);
    } catch (err) {
      toast.error("Data load nahi hua!");
    } finally {
      setLoading(false);
    }
  };

  // 3. MARK ALL COMPLETE (Purple Button Logic)
  const handleMarkComplete = async () => {
    if (!confirm("Bhai, kya saari pending demands ko 'Complete' mark karna hai?")) return;
    
    const loadId = toast.loading("Updating status...");
    try {
      const res = await fetch("/api/outward/demand/register", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId: filters.partyId })
      });
      if (res.ok) {
        toast.success("Sabhi Demands Complete ho gayi!", { id: loadId });
        handleSearch(); // Refresh list
      }
    } catch (err) {
      toast.error("Update fail ho gaya", { id: loadId });
    }
  };

  return (
    <div className="space-y-4 text-xs animate-in fade-in">
      {/* HEADER SECTION */}
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-widest">
          <LayoutList size={16}/> Demand Register
        </h2>
        <div className="flex gap-2">
           <button 
             onClick={handleMarkComplete}
             className="bg-gray-700 hover:bg-black px-4 py-1.5 rounded text-[10px] font-bold uppercase transition-all shadow"
           >
             Mark All Demand Complete
           </button>
           <button onClick={() => router.push('/demand/entry')} className="bg-orange-500 p-1.5 rounded hover:bg-orange-600 transition-all shadow"><Plus size={16}/></button>
           <button className="bg-green-600 p-1.5 rounded shadow"><FileSpreadsheet size={16}/></button>
           <button className="bg-red-600 p-1.5 rounded shadow"><Printer size={16}/></button>
        </div>
      </div>

      {/* FILTERS SECTION */}
      <div className="bg-white p-6 border border-t-0 rounded-b-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="font-bold text-gray-400 uppercase block mb-1">Select Filter Type</label>
            <select className="w-full border p-2 rounded bg-white" value={filters.filterType} onChange={e => setFilters({...filters, filterType: e.target.value})}>
              <option>Search By Party</option>
              <option>Search By Date</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-gray-400 uppercase block mb-1">From Date</label>
            <input type="date" className="w-full border p-2 rounded" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
          </div>
          <div>
            <label className="font-bold text-gray-400 uppercase block mb-1">To Date</label>
            <input type="date" className="w-full border p-2 rounded" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
          </div>
          <div>
            <label className="font-bold text-gray-400 uppercase block mb-1">Party Name</label>
            <select className="w-full border p-2 rounded bg-white font-bold" value={filters.partyId} onChange={e => setFilters({...filters, partyId: e.target.value})}>
              <option value="All">All Parties</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSearch} className="bg-red-600 text-white px-8 py-2 rounded font-black uppercase hover:bg-red-700 transition-all flex-1 shadow">
              {loading ? "..." : "SEARCH"}
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded font-black uppercase italic flex items-center gap-1 shadow">
              <ListFilter size={14}/> ITEM WISE
            </button>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border rounded shadow-md overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f8f9fa] border-b text-slate-700 uppercase font-black text-[10px]">
            <tr>
              <th className="p-3 border-r border-slate-200">Demand No</th>
              <th className="p-3 border-r border-slate-200">Demand Date</th>
              <th className="p-3 border-r border-slate-200">Party Code</th>
              <th className="p-3 border-r border-slate-200">Party Name</th>
              <th className="p-3 border-r border-slate-200">Lot No</th>
              <th className="p-3 border-r border-slate-200 text-center">Demand Qty</th>
              <th className="p-3 text-center">Action/Status</th>
            </tr>
          </thead>
          <tbody>
            {demands.length === 0 ? (
              <tr><td colSpan={7} className="p-20 text-center text-gray-400 italic font-medium">No Data Available. Adjust filters and search.</td></tr>
            ) : (
              demands.flatMap((demand) => 
                demand.items.map((item: any, idx: number) => (
                  <tr key={`${demand.id}-${idx}`} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="p-3 border-r font-bold text-indigo-700">{demand.demandNo}</td>
                    <td className="p-3 border-r">{new Date(demand.date).toLocaleDateString('en-GB')}</td>
                    <td className="p-3 border-r font-mono text-gray-500">{demand.party.partyCode}</td>
                    <td className="p-3 border-r font-black text-slate-700 uppercase">{demand.party.tradeName}</td>
                    <td className="p-3 border-r font-bold text-blue-600">{item.lot.lotNo}</td>
                    <td className="p-3 border-r text-center font-black text-green-600">{item.qty}</td>
                    <td className="p-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${demand.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                        {demand.status}
                      </span>
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
