"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Save, Plus, Trash2, IndianRupee, Calculator, ArrowLeft, RotateCcw, Loader2, AlertCircle, CheckCircle2, Bookmark } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface VoucherRow {
  ledgerId: string;
  narration: string;
  amt: number;
  mode: string;
  refNo: string;
  type: "Debit" | "Credit";
  tds: boolean;
}

export default function VoucherEntryPage() {
  const router = useRouter();
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [narrations, setNarrations] = useState<any[]>([]);
  const [tdsRules, setTdsRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mainBalance, setMainBalance] = useState<string>("₹ 0.00 Dr");

  // 1. HEADER STATE (All Original Fields)
  const [header, setHeader] = useState({
    group: "CASH", 
    voucherNo: "", // Backend will generate
    date: new Date().toISOString().split('T')[0],
    vocType: "Payment", 
    remarks: "", 
    mainLedgerId: ""
  });

  // 2. GRID STATE (All Original Fields: TDS, RefNo, Mode included)
  const [rows, setRows] = useState<VoucherRow[]>([
    { ledgerId: "", narration: "", amt: 0, mode: "NA", refNo: "", type: "Debit", tds: false }
  ]);

  // Load Masters
  useEffect(() => {
    Promise.all([
      fetch("/api/accounting/ledgers").then(res => res.json()),
      fetch("/api/masters/narrations").then(res => res.json()),
      fetch("/api/masters/tds").then(res => res.json())
    ]).then(([l, n, t]) => {
      setLedgers(l || []);
      setNarrations(n || []);
      setTdsRules(t || []);
    }).finally(() => setLoading(false));
  }, []);

  // Live Balance Fetching for Main Ledger
  useEffect(() => {
    if (header.mainLedgerId) {
      fetch(`/api/accounting/ledger-statement?ledgerId=${header.mainLedgerId}&limit=1`)
        .then(res => res.json())
        .then(json => {
            const bal = json.length > 0 ? json[json.length-1].balance : 0;
            setMainBalance(`₹ ${Math.abs(bal).toLocaleString()} ${bal >= 0 ? 'Dr' : 'Cr'}`);
        });
    }
  }, [header.mainLedgerId]);

  const addRow = () => setRows([...rows, { ledgerId: "", narration: "", amt: 0, mode: "NA", refNo: "", type: "Debit", tds: false }]);
  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx || prev.length === 1));

  const updateRow = (idx: number, field: keyof VoucherRow, val: any) => {
    setRows(prev => prev.map((row, i) => i === idx ? { ...row, [field]: val } : row));
  };

  // 3. LIVE MATH ENGINE: Footer Totals
  const totals = useMemo(() => {
    const dr = rows.filter(r => r.type === "Debit").reduce((s, r) => s + (Number(r.amt) || 0), 0);
    const cr = rows.filter(r => r.type === "Credit").reduce((s, r) => s + (Number(r.amt) || 0), 0);
    return { dr, cr, diff: Math.abs(dr - cr) };
  }, [rows]);

  // 4. WORKFLOW EXPLANATION & SAVE LOGIC
  // Workflow: Operator grid mein kharche dalta hai. System "Main Ledger" (Cash/Bank) 
  // ko automatic balance karne ke liye payload mein add kar deta hai.
  const handleSave = async () => {
    if (!header.mainLedgerId) return toast.error("Kripya Cash ya Bank ka Main Account Head chunein!");
    if (rows.some(r => !r.ledgerId || r.amt <= 0)) return toast.error("Grid mein Account aur Amount bharna zaroori hai!");

    const gridBalance = totals.dr - totals.cr;
    if (gridBalance === 0) return toast.error("Voucher balance nahi hai! Debit aur Credit entries barabar honi chahiye.");

    setIsSaving(true);
    const loadId = toast.loading("Voucher post ho raha hai...");

    // Final Payload with Offsetting Entry
    const finalItems = rows.map(r => ({
        ledgerId: r.ledgerId,
        debit: r.type === "Debit" ? Number(r.amt) : 0,
        credit: r.type === "Credit" ? Number(r.amt) : 0,
        narration: r.narration
    }));

    // Auto-balance logic: Cash/Bank entry addition
    finalItems.push({
        ledgerId: header.mainLedgerId,
        debit: gridBalance < 0 ? Math.abs(gridBalance) : 0,
        credit: gridBalance > 0 ? Math.abs(gridBalance) : 0,
        narration: `Voucher Offset: ${header.remarks || 'General Entry'}`
    });

    try {
      const res = await fetch("/api/accounting/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, items: finalItems })
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(`${header.vocType} Voucher Posted Successfully! Ref No: ${result.voucherNo} ✅`, { id: loadId, duration: 5000 });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error(result.error || "Save fail hua ❌", { id: loadId });
      }
    } catch (err) {
      toast.error("Server Connection Error!", { id: loadId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-indigo-700 animate-pulse uppercase tracking-widest">Initialising Accounts Module...</div>;

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      
      {/* ACTION TOP BAR */}
      <div className="flex justify-between bg-white p-3 rounded border shadow-sm no-print">
        <div className="flex gap-2">
          <button onClick={() => router.push('/accounts/voucher-summary')} className="bg-red-600 text-white px-5 py-1.5 rounded font-black uppercase shadow hover:bg-red-700 transition-all">Show Register</button>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-5 py-1.5 rounded font-black uppercase flex items-center gap-1 shadow hover:bg-orange-600"><RotateCcw size={14}/> Reset Form</button>
          <button onClick={() => router.push('/accounts/master/add')} className="bg-gray-700 text-white px-5 py-1.5 rounded font-black uppercase shadow hover:bg-black">Create Account</button>
        </div>
        <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#f39c12] text-white px-12 py-1.5 rounded font-black flex items-center gap-2 shadow-lg hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50 uppercase"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Post Voucher
        </button>
      </div>

      <div className="bg-[#5d5fb1] text-white p-2 rounded-t font-black text-center uppercase tracking-[5px] border border-b-0 italic shadow-md">
        Financial Accounting | Voucher Entry Interface
      </div>

      <div className="bg-white p-8 border rounded-b shadow-2xl space-y-8">
        
        {/* HEADER SECTION (All Fields from Image 72) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
          <div className="space-y-1">
            <label className="font-black text-gray-400 uppercase text-[9px]">Accounting Group</label>
            <input readOnly className="w-full border-2 border-slate-100 p-2.5 rounded bg-slate-100 font-bold" value={header.group} />
          </div>
          <div className="space-y-1">
            <label className="font-black text-gray-500 uppercase text-[9px]">Voucher No</label>
            <input readOnly className="w-full border-2 border-slate-100 p-2.5 rounded bg-slate-200 font-black text-center text-indigo-700" placeholder="[ AUTO ]" value={header.voucherNo} />
          </div>
          <div className="space-y-1">
            <label className="font-black text-gray-400 uppercase text-[9px]">Voucher Date</label>
            <input type="date" className="w-full border-2 border-slate-100 p-2.5 rounded font-bold outline-none focus:border-indigo-400" value={header.date} onChange={e => setHeader({...header, date: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="font-black text-indigo-600 uppercase text-[9px]">Voc Type</label>
            <select className="w-full border-2 border-indigo-100 p-2.5 rounded bg-white font-black outline-none focus:border-indigo-500" value={header.vocType} onChange={e => setHeader({...header, vocType: e.target.value})}>
              <option>Payment</option><option>Receipt</option><option>Journal</option><option>Contra</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-black text-gray-400 uppercase text-[9px]">General Remarks</label>
            <input className="w-full border-2 border-slate-100 p-2.5 rounded outline-none focus:border-indigo-400" placeholder="Overall details..." value={header.remarks} onChange={e => setHeader({...header, remarks: e.target.value})} />
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="font-black text-blue-600 uppercase text-[9px] flex items-center gap-1">
                <Bookmark size={10}/> Main Offset Account Head (Cash / Bank) *
            </label>
            <select 
              className="w-full border-2 border-blue-100 p-2.5 rounded bg-white font-black text-blue-900 outline-none focus:border-blue-500 shadow-sm" 
              value={header.mainLedgerId} 
              onChange={e => setHeader({...header, mainLedgerId: e.target.value})}
            >
              <option value="">-- Choose Account --</option>
              {ledgers.map(l => <option key={l.id} value={l.id}>{l.name} [{l.code}]</option>)}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1 text-center">
            <label className="font-black text-gray-400 uppercase text-[9px]">Live Closing Balance</label>
            <div className={`p-2.5 rounded-lg font-black text-xl border-2 border-dashed ${mainBalance.includes('Cr') ? 'text-red-600 bg-red-50 border-red-100' : 'text-green-600 bg-green-50 border-green-100'}`}>
                {mainBalance}
            </div>
          </div>
        </div>

        {/* GRID SECTION (Restored all columns: Account, Narration, Amt, Mode, Ref, Type, TDS) */}
        <div className="overflow-x-auto border-2 border-slate-100 rounded-xl shadow-inner bg-white">
          <table className="w-full border-collapse text-left min-w-[1200px]">
            <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[9px] sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 border-r border-indigo-200">Account Head / Ledger</th>
                <th className="p-4 border-r border-indigo-200">Particulars / Narration</th>
                <th className="p-4 border-r border-indigo-200 text-center w-32">Amount (₹)</th>
                <th className="p-4 border-r border-indigo-200 text-center w-24">Mode</th>
                <th className="p-4 border-r border-indigo-200 text-center w-32">Ref / Chq #</th>
                <th className="p-4 border-r border-indigo-200 text-center w-24">Type</th>
                <th className="p-4 border-r border-indigo-200 text-center w-20">TDS</th>
                <th className="p-4 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/50 border-b border-slate-100 font-bold transition-all group">
                  <td className="p-2 border-r border-slate-100 w-1/4">
                    <select className="w-full p-2 outline-none bg-transparent font-black text-indigo-800 uppercase" value={row.ledgerId} onChange={e => updateRow(idx, "ledgerId", e.target.value)}>
                      <option value="">-- Choose A/c --</option>
                      {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </td>
                  <td className="p-2 border-r border-slate-100 flex items-center gap-1 group/narr">
                    <input className="flex-1 p-2 outline-none bg-transparent font-medium" placeholder="Narration..." value={row.narration} onChange={e => updateRow(idx, "narration", e.target.value)} />
                    <select 
                      className="w-8 h-8 opacity-0 group-hover/narr:opacity-100 transition-opacity bg-slate-100 rounded text-[10px] cursor-pointer"
                      onChange={(e) => updateRow(idx, "narration", e.target.value)}
                    >
                      <option value="">💬</option>
                      {narrations.map(n => <option key={n.id} value={n.description}>{n.code}</option>)}
                    </select>
                  </td>
                  <td className="p-2 border-r border-slate-100 bg-indigo-50/20">
                    <input type="number" className="w-full p-2 text-center font-black text-lg text-blue-700 bg-transparent outline-none" value={row.amt || ""} onChange={e => updateRow(idx, "amt", parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <select className="w-full p-2 outline-none bg-transparent text-[9px] uppercase font-black" value={row.mode} onChange={e => updateRow(idx, "mode", e.target.value)}>
                      <option>NA</option><option>UPI</option><option>CASH</option><option>CHEQUE</option><option>NEFT</option>
                    </select>
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <input className="w-full p-2 text-center outline-none bg-transparent font-mono text-[10px]" placeholder="REF NO" value={row.refNo} onChange={e => updateRow(idx, "refNo", e.target.value)} />
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <select className={`w-full p-2 text-center font-black rounded uppercase ${row.type === 'Debit' ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`} value={row.type} onChange={e => updateRow(idx, "type", e.target.value as any)}>
                      <option value="Debit">DEBIT</option><option value="Credit">CREDIT</option>
                    </select>
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <div className="flex flex-col gap-1">
                      <select className="w-full text-center bg-transparent font-black text-[9px] outline-none" value={row.tds ? "Yes" : "No"} onChange={e => updateRow(idx, "tds", e.target.value === "Yes")}>
                        <option>No</option><option>Yes</option>
                      </select>
                      {row.tds && (
                        <select 
                          className="w-full text-[8px] bg-indigo-50 font-bold border-t border-indigo-200 outline-none"
                          onChange={(e) => {
                             const rule = tdsRules.find(r => r.id === e.target.value);
                             if (rule) {
                               const taxAmt = (row.amt * Number(rule.tdsPercentage)) / 100;
                               toast.success(`TDS: ₹${taxAmt.toFixed(2)} (${rule.tdsPercentage}%)`, { icon: '💰' });
                               // Optional: We could add a row here, but let's keep it simple for now
                             }
                          }}
                        >
                          <option value="">Rule</option>
                          {tdsRules.map(r => <option key={r.id} value={r.id}>{r.section} ({r.tdsPercentage}%)</option>)}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex justify-center gap-3">
                       <button onClick={addRow} className="text-blue-600 hover:scale-125 transition-transform"><Plus size={20}/></button>
                       <button onClick={() => removeRow(idx)} className="text-red-500 hover:scale-125 transition-transform"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER TOTALS (Image 72 Exact Replication) */}
        <div className="bg-[#1e293b] p-6 rounded-2xl flex justify-between items-center text-white shadow-2xl border-t-4 border-indigo-500">
           <div className="flex gap-20">
             <div className="space-y-1">
               <p className="text-[9px] font-black uppercase text-indigo-400 tracking-[3px]">Total Debit (Dr)</p>
               <span className="text-2xl font-black text-red-400 italic">₹ {totals.dr.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
             </div>
             <div className="space-y-1">
               <p className="text-[9px] font-black uppercase text-indigo-400 tracking-[3px]">Total Credit (Cr)</p>
               <span className="text-2xl font-black text-green-400 italic">₹ {totals.cr.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
             </div>
           </div>
           
           <div className="text-right flex items-center gap-8">
             {totals.diff > 0.01 ? (
                <div className="bg-red-900/50 border border-red-500 px-6 py-2 rounded-xl flex items-center gap-4 animate-pulse shadow-inner">
                   <AlertCircle className="text-red-400" size={28}/>
                   <div className="text-left">
                      <p className="text-[9px] font-black uppercase text-red-300">Voucher Imbalance</p>
                      <p className="text-lg font-black text-white italic leading-none">Gap: ₹ {totals.diff.toFixed(2)}</p>
                   </div>
                </div>
             ) : (
                <div className="text-green-400 flex items-center gap-3 font-black uppercase tracking-[3px] italic text-xs">
                   <CheckCircle2 size={32}/> Double-Entry Tally Active
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import { Save, Plus, Trash2, IndianRupee, Calculator, ArrowLeft, RotateCcw } from "lucide-react";
// import { toast } from "react-hot-toast";

// interface VoucherRow {
//   ledgerId: string;
//   narration: string;
//   amt: number;
//   mode: string;
//   refNo: string;
//   type: "Debit" | "Credit";
//   tds: boolean;
// }

// export default function VoucherEntryPage() {
//   const [ledgers, setLedgers] = useState<any[]>([]);
//   const [header, setHeader] = useState({
//     group: "CASH", voucherNo: "1", date: new Date().toISOString().split('T')[0],
//     vocType: "Payment", remarks: "", mainLedgerId: ""
//   });

//   const [rows, setRows] = useState<VoucherRow[]>([
//     { ledgerId: "", narration: "", amt: 0, mode: "NA", refNo: "", type: "Debit", tds: false }
//   ]);

//   useEffect(() => {
//     fetch("/api/accounting/ledgers").then(res => res.json()).then(setLedgers);
//   }, []);

//   const addRow = () => setRows([...rows, { ledgerId: "", narration: "", amt: 0, mode: "NA", refNo: "", type: "Debit", tds: false }]);
  
//   const updateRow = (idx: number, field: keyof VoucherRow, val: any) => {
//     const newRows = [...rows];
//     (newRows[idx] as any)[field] = val;
//     setRows(newRows);
//   };

//   // AUTOMATION: DR/CR Totals (Image 72 Footer)
//   const totals = useMemo(() => {
//     const dr = rows.filter(r => r.type === "Debit").reduce((s, r) => s + Number(r.amt), 0);
//     const cr = rows.filter(r => r.type === "Credit").reduce((s, r) => s + Number(r.amt), 0);
//     return { dr, cr };
//   }, [rows]);

//   const handleSave = async () => {
//     if (Math.abs(totals.dr - totals.cr) > 0) return toast.error("Debit and Credit must match!");
//     const res = await fetch("/api/accounting/vouchers", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ 
//         header, 
//         items: rows.map(r => ({ 
//           ledgerId: r.ledgerId, 
//           debit: r.type === "Debit" ? r.amt : 0, 
//           credit: r.type === "Credit" ? r.amt : 0,
//           narration: r.narration
//         })) 
//       })
//     });
//     if (res.ok) {
//       toast.success("Voucher Saved!");
//       window.location.reload();
//     }
//   };

//   return (
//     <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
//       {/* Header Buttons (Image 72 Style) */}
//       <div className="flex justify-between bg-white p-2 border rounded shadow-sm">
//         <div className="flex gap-2">
//           <button className="bg-red-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow">Show All</button>
//           <button className="bg-orange-500 text-white px-4 py-1.5 rounded font-bold uppercase flex items-center gap-1"><RotateCcw size={12}/> Add New</button>
//           <button className="bg-red-600 text-white px-4 py-1.5 rounded font-bold uppercase">Create Account</button>
//         </div>
//         <button onClick={handleSave} className="bg-[#f39c12] text-white px-10 py-1.5 rounded font-bold flex items-center gap-2 uppercase shadow hover:bg-orange-600 transition-all">
//           <Save size={14}/> Save Voucher
//         </button>
//       </div>

//       <div className="bg-[#5d5fb1] text-white p-2 rounded-t font-black text-center uppercase tracking-widest">
//         Voucher Entry | Create New Transaction
//       </div>

//       <div className="bg-white p-6 border rounded-b shadow-sm space-y-6">
//         {/* HEADER FIELDS (Image 72 Mapping) */}
//         <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-lg border">
//           <div>
//             <label className="font-bold text-gray-500 uppercase block mb-1">Group</label>
//             <input className="w-full border p-2 rounded bg-white font-bold" value={header.group} readOnly />
//           </div>
//           <div>
//             <label className="font-bold text-gray-500 uppercase block mb-1">Voucher No</label>
//             <input className="w-full border p-2 rounded bg-white font-bold text-indigo-700 text-center" value={header.voucherNo} readOnly />
//           </div>
//           <div>
//             <label className="font-bold text-gray-500 uppercase block mb-1">Date</label>
//             <input type="date" className="w-full border p-2 rounded" value={header.date} onChange={e => setHeader({...header, date: e.target.value})} />
//           </div>
//           <div>
//             <label className="font-bold text-indigo-600 uppercase block mb-1">Voc Type</label>
//             <select className="w-full border p-2 rounded bg-white font-bold" value={header.vocType} onChange={e => setHeader({...header, vocType: e.target.value})}>
//               <option>Payment</option><option>Receipt</option><option>Journal</option><option>Contra</option>
//             </select>
//           </div>
//           <div>
//             <label className="font-bold text-gray-400 uppercase block mb-1">Remarks</label>
//             <input className="w-full border p-2 rounded outline-none" value={header.remarks} onChange={e => setHeader({...header, remarks: e.target.value})} />
//           </div>
//           <div className="md:col-span-3">
//             <label className="font-bold text-blue-600 uppercase block mb-1">Account Head (Main)</label>
//             <select className="w-full border p-2 rounded bg-white font-black" value={header.mainLedgerId} onChange={e => setHeader({...header, mainLedgerId: e.target.value})}>
//               <option value="">-- Select Cash/Bank Ledger --</option>
//               {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
//             </select>
//           </div>
//           <div className="md:col-span-2">
//             <label className="font-bold text-gray-400 uppercase block mb-1 tracking-tighter">Closing Bal (Auto)</label>
//             <input readOnly className="w-full border p-2 rounded bg-slate-100 font-bold text-red-500" value="0.00 Cr" />
//           </div>
//         </div>

//         {/* GRID SECTION (Image 72 Table) */}
//         <div className="overflow-x-auto border rounded-lg shadow-inner">
//           <table className="w-full border-collapse text-left min-w-[1000px]">
//             <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-bold text-[10px]">
//               <tr>
//                 <th className="p-2 border-r border-slate-300">Account Head</th>
//                 <th className="p-2 border-r border-slate-300">Narration</th>
//                 <th className="p-2 border-r border-slate-300 text-center">Amt</th>
//                 <th className="p-2 border-r border-slate-300 text-center">Mode</th>
//                 <th className="p-2 border-r border-slate-300 text-center">Reference No</th>
//                 <th className="p-2 border-r border-slate-300 text-center">Type</th>
//                 <th className="p-2 border-r border-slate-300 text-center">TDS</th>
//                 <th className="p-2 text-center">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map((row, idx) => (
//                 <tr key={idx} className="hover:bg-slate-50 transition-all">
//                   <td className="p-1 border border-slate-200 w-1/4">
//                     <select className="w-full p-2 outline-none font-bold text-indigo-700" value={row.ledgerId} onChange={e => updateRow(idx, "ledgerId", e.target.value)}>
//                       <option value="">Select Account</option>
//                       {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
//                     </select>
//                   </td>
//                   <td className="p-1 border border-slate-200">
//                     <input className="w-full p-2 outline-none" placeholder="Enter Narration..." value={row.narration} onChange={e => updateRow(idx, "narration", e.target.value)} />
//                   </td>
//                   <td className="p-1 border border-slate-200">
//                     <input type="number" className="w-full p-2 text-center font-bold text-blue-600 outline-none" value={row.amt} onChange={e => updateRow(idx, "amt", e.target.value)} />
//                   </td>
//                   <td className="p-1 border border-slate-200">
//                     <select className="w-full p-2 outline-none" value={row.mode} onChange={e => updateRow(idx, "mode", e.target.value)}>
//                       <option>NA</option><option>UPI</option><option>CASH</option><option>CHEQUE</option><option>NEFT</option>
//                     </select>
//                   </td>
//                   <td className="p-1 border border-slate-200">
//                     <input className="w-full p-2 text-center outline-none" value={row.refNo} onChange={e => updateRow(idx, "refNo", e.target.value)} />
//                   </td>
//                   <td className="p-1 border border-slate-200">
//                     <select className="w-full p-2 text-center font-bold" value={row.type} onChange={e => updateRow(idx, "type", e.target.value)}>
//                       <option value="Debit">Debit</option><option value="Credit">Credit</option>
//                     </select>
//                   </td>
//                   <td className="p-1 border border-slate-200">
//                     <select className="w-full p-2 text-center" value={row.tds ? "Yes" : "No"} onChange={e => updateRow(idx, "tds", e.target.value === "Yes")}>
//                       <option>No</option><option>Yes</option>
//                     </select>
//                   </td>
//                   <td className="p-1 border border-slate-200 text-center">
//                     <div className="flex justify-center gap-2">
//                        <button onClick={addRow} className="text-blue-600 font-bold text-lg">+</button>
//                        <button onClick={() => removeRow(idx)} className="text-red-500 font-bold text-lg">×</button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* FOOTER TOTALS (Self-Balancing Logic - Image 72) */}
//         <div className="flex gap-12 p-4 bg-slate-50 border rounded shadow-inner font-bold text-sm">
//            <div className="flex gap-4 items-center">
//              <span className="text-gray-400 uppercase">Total DR Amt:</span>
//              <span className="text-red-600 font-black">₹ {totals.dr.toFixed(2)}</span>
//            </div>
//            <div className="flex gap-4 items-center">
//              <span className="text-gray-400 uppercase">Total CR Amt:</span>
//              <span className="text-green-600 font-black">₹ {totals.cr.toFixed(2)}</span>
//            </div>
//            {totals.dr !== totals.cr && (
//              <div className="text-red-500 animate-pulse italic">Difference: ₹ {(totals.dr - totals.cr).toFixed(2)}</div>
//            )}
//         </div>
//       </div>
//     </div>
//   );
// }
