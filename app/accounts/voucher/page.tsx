"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Save, Plus, Trash2, IndianRupee, Calculator, ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation"; // 1. Router import kiya

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
  const router = useRouter(); // 2. Router initialize
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [header, setHeader] = useState({
    group: "CASH", 
    voucherNo: "", // Empty for auto-gen
    date: new Date().toISOString().split('T')[0],
    vocType: "Payment", 
    remarks: "", 
    mainLedgerId: ""
  });

  const [rows, setRows] = useState<VoucherRow[]>([
    { ledgerId: "", narration: "", amt: 0, mode: "NA", refNo: "", type: "Debit", tds: false }
  ]);

  useEffect(() => {
    fetch("/api/accounting/ledgers").then(res => res.json()).then(setLedgers);
  }, []);

  const addRow = () => setRows([...rows, { ledgerId: "", narration: "", amt: 0, mode: "NA", refNo: "", type: "Debit", tds: false }]);
  
  // 3. Remove Row Logic fix
  const removeRow = (idx: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== idx));
    } else {
      setRows([{ ledgerId: "", narration: "", amt: 0, mode: "NA", refNo: "", type: "Debit", tds: false }]);
    }
  };

  const updateRow = (idx: number, field: keyof VoucherRow, val: any) => {
    const newRows = [...rows];
    (newRows[idx] as any)[field] = val;
    setRows(newRows);
  };

  // AUTOMATION: DR/CR Totals (Image 72 Footer)
  const totals = useMemo(() => {
    const dr = rows.filter(r => r.type === "Debit").reduce((s, r) => s + Number(r.amt), 0);
    const cr = rows.filter(r => r.type === "Credit").reduce((s, r) => s + Number(r.amt), 0);
    return { dr, cr };
  }, [rows]);

  const handleSave = async () => {
    if (Math.abs(totals.dr - totals.cr) > 0.01) return toast.error("Debit and Credit must match exactly!");
    if (rows.some(r => !r.ledgerId || r.amt <= 0)) return toast.error("Please fill all Account Heads and Amounts!");

    const loadId = toast.loading("Voucher entry posting to ledgers...");
    try {
      const res = await fetch("/api/accounting/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          header, 
          items: rows.map(r => ({ 
            ledgerId: r.ledgerId, 
            debit: r.type === "Debit" ? r.amt : 0, 
            credit: r.type === "Credit" ? r.amt : 0,
            narration: r.narration
          })) 
        })
      });

      const result = await res.json();

      if (res.ok) {
        // Result mein backend se aaya hua auto-number dikhayenge
        toast.success(`Voucher Posted! Reference No: ${result.voucherNo}`, { id: loadId, duration: 5000 });
        window.location.reload();
      } else {
        toast.error(result.error || "Save Failed", { id: loadId });
      }
    } catch (err) {
      toast.error("Network Error!", { id: loadId });
    }
  };

  return (
    <div className="space-y-4 text-[11px] animate-in fade-in duration-500">
      {/* Header Buttons (Image 72 Style) */}
      <div className="flex justify-between bg-white p-2 border rounded shadow-sm">
        <div className="flex gap-2">
          {/* 4. Link to Voucher Register */}
          <button onClick={() => router.push('/accounts/voucher-summary')} className="bg-red-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow hover:bg-red-700">Show All</button>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-4 py-1.5 rounded font-bold uppercase flex items-center gap-1 shadow hover:bg-orange-600"><RotateCcw size={12}/> Add New</button>
          <button onClick={() => router.push('/accounts/master/add')} className="bg-red-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow hover:bg-red-700">Create Account</button>
        </div>
        <button onClick={handleSave} className="bg-[#f39c12] text-white px-10 py-1.5 rounded font-bold flex items-center gap-2 uppercase shadow hover:bg-orange-600 transition-all">
          <Save size={14}/> Save Voucher
        </button>
      </div>

      <div className="bg-[#5d5fb1] text-white p-2 rounded-t font-black text-center uppercase tracking-widest border border-b-0 italic">
        Voucher Entry | Create New Transaction
      </div>

      <div className="bg-white p-6 border rounded-b shadow-sm space-y-6">
        {/* HEADER FIELDS (Image 72 Mapping) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div>
            <label className="font-bold text-gray-500 uppercase block mb-1">Group</label>
            <input className="w-full border p-2 rounded bg-slate-100 font-bold" value={header.group} readOnly />
          </div>
          <div>
            <label className="font-bold text-gray-500 uppercase block mb-1">Voucher No</label>
            {/* 5. Auto-gen readOnly */}
            <input 
              readOnly 
              className="w-full border p-2 rounded bg-slate-100 font-bold text-indigo-700 text-center" 
              value={header.voucherNo} 
              placeholder="[ AUTO-GEN ]"
            />
          </div>
          <div>
            <label className="font-bold text-gray-500 uppercase block mb-1">Date</label>
            <input type="date" className="w-full border p-2 rounded outline-none focus:ring-1 focus:ring-indigo-400" value={header.date} onChange={e => setHeader({...header, date: e.target.value})} />
          </div>
          <div>
            <label className="font-bold text-indigo-600 uppercase block mb-1">Voc Type</label>
            <select className="w-full border p-2 rounded bg-white font-bold outline-none" value={header.vocType} onChange={e => setHeader({...header, vocType: e.target.value})}>
              <option>Payment</option><option>Receipt</option><option>Journal</option><option>Contra</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-gray-400 uppercase block mb-1">Remarks</label>
            <input className="w-full border p-2 rounded outline-none focus:ring-1 focus:ring-indigo-400" placeholder="General Narrative..." value={header.remarks} onChange={e => setHeader({...header, remarks: e.target.value})} />
          </div>
          <div className="md:col-span-3">
            <label className="font-bold text-blue-600 uppercase block mb-1">Account Head (Main/Contra)</label>
            <select className="w-full border-2 border-blue-50 p-2 rounded bg-white font-black outline-none focus:border-blue-400" value={header.mainLedgerId} onChange={e => setHeader({...header, mainLedgerId: e.target.value})}>
              <option value="">-- Select Cash/Bank/Offset Ledger --</option>
              {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="font-bold text-gray-400 uppercase block mb-1 tracking-tighter">Closing Bal (Auto Calc)</label>
            <input readOnly className="w-full border p-2 rounded bg-slate-100 font-bold text-red-500 italic" value="₹ 0.00 Dr" />
          </div>
        </div>

        {/* GRID SECTION (Image 72 Table) */}
        <div className="overflow-x-auto border rounded-lg shadow-inner">
          <table className="w-full border-collapse text-left min-w-[1000px]">
            <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-2 border-r border-slate-300">Account Head</th>
                <th className="p-2 border-r border-slate-300">Narration</th>
                <th className="p-2 border-r border-slate-300 text-center">Amt (₹)</th>
                <th className="p-2 border-r border-slate-300 text-center">Mode</th>
                <th className="p-2 border-r border-slate-300 text-center">Reference No</th>
                <th className="p-2 border-r border-slate-300 text-center">Type</th>
                <th className="p-2 border-r border-slate-300 text-center">TDS</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-all border-b border-slate-200">
                  <td className="p-1 border-r border-slate-200 w-1/4">
                    <select className="w-full p-2 outline-none font-bold text-indigo-700 bg-transparent" value={row.ledgerId} onChange={e => updateRow(idx, "ledgerId", e.target.value)}>
                      <option value="">Select Account</option>
                      {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <input className="w-full p-2 outline-none bg-transparent" placeholder="Enter Narration..." value={row.narration} onChange={e => updateRow(idx, "narration", e.target.value)} />
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <input type="number" className="w-full p-2 text-center font-bold text-blue-600 outline-none bg-transparent" value={row.amt || ""} onChange={e => updateRow(idx, "amt", parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <select className="w-full p-2 outline-none bg-transparent" value={row.mode} onChange={e => updateRow(idx, "mode", e.target.value)}>
                      <option>NA</option><option>UPI</option><option>CASH</option><option>CHEQUE</option><option>NEFT</option>
                    </select>
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <input className="w-full p-2 text-center outline-none bg-transparent" placeholder="Ref#" value={row.refNo} onChange={e => updateRow(idx, "refNo", e.target.value)} />
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <select className={`w-full p-2 text-center font-bold bg-transparent ${row.type === 'Debit' ? 'text-red-600' : 'text-green-600'}`} value={row.type} onChange={e => updateRow(idx, "type", e.target.value as any)}>
                      <option value="Debit">Debit</option><option value="Credit">Credit</option>
                    </select>
                  </td>
                  <td className="p-1 border-r border-slate-200">
                    <select className="w-full p-2 text-center bg-transparent" value={row.tds ? "Yes" : "No"} onChange={e => updateRow(idx, "tds", e.target.value === "Yes")}>
                      <option>No</option><option>Yes</option>
                    </select>
                  </td>
                  <td className="p-1 text-center">
                    <div className="flex justify-center gap-2">
                       <button onClick={addRow} className="text-blue-600 font-bold text-lg hover:scale-125 transition-transform">+</button>
                       <button onClick={() => removeRow(idx)} className="text-red-500 font-bold text-lg hover:scale-125 transition-transform">×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER TOTALS (Image 72) */}
        <div className="flex gap-12 p-4 bg-slate-50 border rounded shadow-inner font-bold text-sm">
           <div className="flex gap-4 items-center">
             <span className="text-gray-400 uppercase tracking-tighter">Total DR Amt:</span>
             <span className="text-red-600 font-black text-lg">₹ {totals.dr.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
           </div>
           <div className="flex gap-4 items-center">
             <span className="text-gray-400 uppercase tracking-tighter">Total CR Amt:</span>
             <span className="text-green-600 font-black text-lg">₹ {totals.cr.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
           </div>
           {Math.abs(totals.dr - totals.cr) > 0.01 && (
             <div className="text-red-500 animate-pulse italic flex items-center gap-1 font-black">
               [ MISMATCH: ₹ {(totals.dr - totals.cr).toFixed(2)} ]
             </div>
           )}
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