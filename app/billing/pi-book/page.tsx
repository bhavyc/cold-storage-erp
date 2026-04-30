"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Search, FileText, CheckCircle, Trash2, Eye, Loader2, Printer, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils"; // Date formatter utility
import { useRouter } from "next/navigation";

export default function PIBookPage() {
  const router = useRouter();
  const [piList, setPiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. FETCH PI SUMMARY (Connects to your Proforma API)
  const fetchPIs = useCallback(async () => {
    setLoading(true);
    try {
      // Logic: Fetching only proforma (isProforma: true) invoices
      const res = await fetch("/api/compliance/gst-data?isProforma=true"); 
      const json = await res.json();
      
      // Filtering in frontend as safety if API doesn't handle isProforma param
      const filteredPIs = json.filter((inv: any) => inv.isProforma === true || inv.billingType.includes("PI"));
      setPiList(filteredPIs || []);
    } catch (err) {
      toast.error("Failed to load PI records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPIs();
  }, [fetchPIs]);

  // 2. DELETE PI LOGIC
  const handleDelete = async (id: string) => {
    if (!confirm("Bhai, kya aap is Proforma Invoice ko delete karna chahte hain?")) return;
    try {
      const res = await fetch(`/api/billing/invoice/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("PI Deleted successfully");
        fetchPIs();
      }
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  // 3. SEARCH FILTER
  const filteredData = piList.filter(pi => 
    pi.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    pi.party.tradeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 text-xs animate-in fade-in duration-500">
      
      {/* HEADER BAR */}
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg font-bold flex justify-between items-center uppercase tracking-widest shadow-lg">
        <span className="flex items-center gap-2"><FileText size={16}/> PI Book | Proforma Invoice Summary Registry</span>
        <div className="flex gap-2">
           <button onClick={() => router.push('/billing/pi')} className="bg-orange-500 hover:bg-orange-600 px-4 py-1 rounded text-[10px] shadow transition-all">+ NEW PI</button>
           <button onClick={fetchPIs} className="bg-white/10 hover:bg-white/20 p-1.5 rounded transition-all"><Loader2 size={14} className={loading ? "animate-spin" : ""}/></button>
        </div>
      </div>

      {/* SEARCH BAR BOX */}
      <div className="bg-white p-4 border rounded shadow-sm flex gap-4 no-print">
         <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2 text-gray-400" size={16} />
            <input 
               type="text" 
               placeholder="Search by Merchant Name or PI Number..." 
               className="w-full pl-10 pr-4 py-1.5 border-2 border-slate-100 rounded-md outline-none focus:border-indigo-400 font-bold"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-2 text-slate-400 font-bold italic uppercase text-[9px]">
            <AlertCircle size={12}/> Only Draft/Proforma Invoices are listed here
         </div>
      </div>

      {/* DATA TABLE (All 7 Columns Mapped) */}
      <div className="bg-white border-2 border-slate-100 rounded-lg shadow-xl overflow-hidden min-h-[450px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f1f5f9] text-slate-700 uppercase font-black text-[9px] border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="p-4 border-r border-slate-200">Date</th>
              <th className="p-4 border-r border-slate-200">PI No</th>
              <th className="p-4 border-r border-slate-200">Merchant / Party Name</th>
              <th className="p-4 border-r border-slate-200 text-center">Bags Qty</th>
              <th className="p-4 border-r border-slate-200 text-right">Estimate Amt (₹)</th>
              <th className="p-4 border-r border-slate-200 text-center">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
             {loading ? (
               <tr><td colSpan={7} className="p-24 text-center font-bold text-indigo-700 animate-pulse text-lg uppercase tracking-widest">Scanning PI Records...</td></tr>
             ) : filteredData.length === 0 ? (
               <tr><td colSpan={7} className="p-24 text-center text-gray-400 italic">No Proforma Invoices found for the current search.</td></tr>
             ) : filteredData.map((row) => (
               <tr key={row.id} className="border-b hover:bg-indigo-50/50 transition-all font-bold group even:bg-slate-50/30">
                 <td className="p-4 border-r border-slate-100 text-gray-500 font-mono">{formatDate(row.date)}</td>
                 <td className="p-4 border-r border-slate-100 font-black text-indigo-700 uppercase">{row.invoiceNo}</td>
                 <td className="p-4 border-r border-slate-100 uppercase text-slate-800 truncate max-w-[250px]">{row.party?.tradeName || "Unknown"}</td>
                 <td className="p-4 border-r border-slate-100 text-center text-blue-600 font-black">{row.totalQty}</td>
                 <td className="p-4 border-r border-slate-100 text-right font-black text-slate-900 bg-indigo-50/20">
                   ₹ {Number(row.netAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                 </td>
                 <td className="p-4 border-r border-slate-100 text-center">
                    <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter bg-yellow-100 text-yellow-700 border border-yellow-200">
                       DRAFT ESTIMATE
                    </span>
                 </td>
                 <td className="p-4 text-center">
                    <div className="flex justify-center gap-3">
                       <button onClick={() => router.push(`/billing/pi/view/${row.id}`)} className="text-blue-600 hover:scale-125 transition-transform" title="View PI"><Eye size={16}/></button>
                       <button onClick={() => window.print()} className="text-slate-400 hover:text-black transition-all" title="Print PI"><Printer size={16}/></button>
                       <button onClick={() => handleDelete(row.id)} className="text-red-400 hover:text-red-600 transition-all" title="Delete PI"><Trash2 size={16}/></button>
                    </div>
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER SUMMARY */}
      <div className="flex justify-between items-center bg-[#f8f9fa] p-3 border rounded shadow-inner opacity-50">
         <p className="font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
            <AlertCircle size={14}/> Total PI in Registry: {filteredData.length}
         </p>
         <p className="text-[8px] font-black italic uppercase tracking-[10px]">Cold Storage Intelligence</p>
      </div>
    </div>
  );
}
