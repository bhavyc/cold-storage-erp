"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, Save, Printer, ArrowLeft, Search, Truck, Info, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation"; // 1. Router import kiya

// --- INITIAL STATES (Reset karne ke liye) ---
const initialHeader = {
  mrNo: "", 
  mrDate: new Date().toISOString().split('T')[0],
  partyId: "",
  address: "",
  deliveryPerson: "",
  truckNo: "",
  remarksEWay: "",
  billingType: "NA"
};

const initialGridRow = { 
  lotNo: "", itemId: "", unitId: "", qty: 0, marka: "", pMarka: "", 
  chamberId: "", floor: "", pillar: "", rate: 0, labour: 0, 
  perUnitWgt: 0, remarks: "" 
};

export default function MREntryPage() {
  const router = useRouter(); // 2. Router initialize kiya
  // Masters Data
  const [parties, setParties] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [chambers, setChambers] = useState<any[]>([]);
  
  // Controlled States
  const [header, setHeader] = useState(initialHeader);
  const [grid, setGrid] = useState([initialGridRow]);
  const [loading, setLoading] = useState(false);

  // 1. Load Master Data on Mount
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [p, i, u, c] = await Promise.all([
          fetch("/api/masters/party").then(res => res.json()),
          fetch("/api/masters/items").then(res => res.json()),
          fetch("/api/masters/units").then(res => res.json()),
          fetch("/api/masters/chambers").then(res => res.json())
        ]);
        setParties(p); setItems(i); setUnits(u); setChambers(c);
      } catch (err) {
        toast.error("Master data load nahi ho paya!");
      }
    };
    loadMasters();
  }, []);

  // 2. Automation: Party select hote hi Address bhar do
  const handlePartyChange = (id: string) => {
    const party = parties.find(p => p.id === id);
    setHeader({ ...header, partyId: id, address: party?.address || "" });
  };

  // 3. Grid Row Handlers
  const addRow = () => setGrid([...grid, initialGridRow]);
  
  const removeRow = (idx: number) => {
    if (grid.length > 1) {
      setGrid(grid.filter((_, i) => i !== idx));
    } else {
      setGrid([initialGridRow]);
    }
  };

  const updateGrid = (idx: number, field: string, val: any) => {
    const newGrid = [...grid];
    (newGrid[idx] as any)[field] = val;

    // Automation: Item/Unit select karte hi default Weight aur Rates uthao
    if (field === "itemId" || field === "unitId") {
      const selectedItem = items.find(it => it.id === newGrid[idx].itemId);
      const config = selectedItem?.itemUnits?.find((u: any) => 
        u.unitId === (field === "unitId" ? val : newGrid[idx].unitId)
      );
      if (config) {
        newGrid[idx].rate = Number(config.rentRate);
        newGrid[idx].labour = Number(config.labourRate);
        newGrid[idx].perUnitWgt = Number(config.weight);
      }
    }
    setGrid(newGrid);
  };

  // 4. Weight Engine (Live Calculations)
  const totals = useMemo(() => {
    return grid.reduce((acc, row) => {
      const unit = units.find(u => u.id === row.unitId);
      const tarePerUnit = unit ? Number(unit.emptyWeight) : 0;
      
      const tare = tarePerUnit * row.qty;
      const gross = row.qty * row.perUnitWgt;
      const net = gross - tare;

      return {
        qty: acc.qty + row.qty,
        tare: acc.tare + tare,
        gross: acc.gross + gross,
        net: acc.net + net
      };
    }, { qty: 0, tare: 0, gross: 0, net: 0 });
  }, [grid, units]);

  // 5. ASLI SAVE LOGIC (Popup + Reset)
  const handleSave = async () => {
    if (!header.partyId) return toast.error("Pehle Party toh select karlo!");
    if (grid.some(r => !r.itemId || r.qty <= 0)) return toast.error("Grid mein Item aur Quantity bharna zaroori hai!");

    const loadId = toast.loading("MR Entry database mein save ho rahi hai...");
    setLoading(true);

    try {
      const res = await fetch("/api/inward/mr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, items: grid })
      });

      const result = await res.json(); // Backend se result liya

      if (res.ok) {
        // SUCCESS POPUP (Backend se aaya hua real MR No. dikhayega)
        toast.success(`MR Entry saved! Receipt No: ${result.data.mrNo}`, { id: loadId, duration: 5000 });
        
        // --- FIELDS EMPTY KARNE KA LOGIC ---
        setHeader(initialHeader); 
        setGrid([initialGridRow]); 
      } else {
        toast.error(result.error || "Kuch gadbad ho gayi!", { id: loadId });
      }
    } catch (err) {
      toast.error("Network Error! Server check karo.", { id: loadId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-[11px]">
      {/* --- TOP BUTTONS BAR --- */}
      <div className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-slate-200">
        <div className="flex gap-2">
          {/* 3. Show All ko link kiya */}
          <button onClick={() => router.push('/inward/register')} className="bg-red-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow hover:bg-red-700">Show All</button>
          <button onClick={() => { setHeader(initialHeader); setGrid([initialGridRow]); }} className="bg-orange-500 text-white px-4 py-1.5 rounded font-bold uppercase shadow flex items-center gap-1">
            <RotateCcw size={14}/> Add New MR
          </button>
          <button onClick={addRow} className="bg-green-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow">Add New Row</button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={loading} className="bg-[#f39c12] hover:bg-orange-600 text-white px-8 py-1.5 rounded font-bold flex items-center gap-2 shadow-md transition-all active:scale-95">
            <Save size={16}/> {loading ? "SAVING..." : "SAVE"}
          </button>
          <button className="bg-[#3498db] text-white px-8 py-1.5 rounded font-bold flex items-center gap-2 shadow-md"><Printer size={16}/> PRINT</button>
        </div>
      </div>

      {/* --- PURPLE HEADER --- */}
      <div className="bg-[#5d5fb1] text-white p-2 rounded-t-md font-black text-center uppercase tracking-widest border border-b-0 border-indigo-300 italic">
        Material Receipt | Inward Entry Form
      </div>

      {/* --- HEADER FORM --- */}
      <div className="bg-white p-6 border rounded-b-md shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="font-bold text-gray-400 uppercase block mb-1">MR No</label>
          {/* 4. MR No ko readOnly kiya aur placeholder badla */}
          <input 
            readOnly 
            className="w-full border p-2 rounded bg-slate-100 font-bold text-indigo-700 outline-none" 
            value={header.mrNo} 
            placeholder="[ AUTO-GENERATED ]" 
          />
        </div>
        <div>
          <label className="font-bold text-gray-400 uppercase block mb-1">MR Date</label>
          <input type="date" className="w-full border p-2 rounded outline-none" value={header.mrDate} onChange={e => setHeader({...header, mrDate: e.target.value})} />
        </div>
        <div className="md:col-span-2">
          <label className="font-bold text-indigo-700 uppercase block mb-1">Party Name</label>
          <select className="w-full border p-2 rounded font-bold text-blue-800 outline-none focus:ring-1 focus:ring-indigo-400" value={header.partyId} onChange={e => handlePartyChange(e.target.value)}>
            <option value="">-- Select Party --</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName} [{p.partyCode}]</option>)}
          </select>
        </div>
        <div>
          <label className="font-bold text-gray-400 uppercase block mb-1">Delivery Person</label>
          <input className="w-full border p-2 rounded outline-none" value={header.deliveryPerson} onChange={e => setHeader({...header, deliveryPerson: e.target.value})} />
        </div>
        <div>
          <label className="font-bold text-gray-400 uppercase block mb-1">Truck No</label>
          <input className="w-full border p-2 rounded font-mono uppercase outline-none" value={header.truckNo} onChange={e => setHeader({...header, truckNo: e.target.value})} />
        </div>
        <div className="md:col-span-2">
          <label className="font-bold text-gray-400 uppercase block mb-1">Remarks / E-Way Bill No</label>
          <input className="w-full border p-2 rounded outline-none" value={header.remarksEWay} onChange={e => setHeader({...header, remarksEWay: e.target.value})} />
        </div>
        <div className="md:col-span-3">
          <label className="font-bold text-gray-400 uppercase block mb-1">Address</label>
          <input readOnly className="w-full border p-2 rounded bg-slate-100 text-gray-500 italic" value={header.address} />
        </div>
        <div>
          <label className="font-bold text-blue-600 uppercase block mb-1">Billing Type</label>
          <select className="w-full border border-blue-200 p-2 rounded bg-blue-50 font-bold outline-none" value={header.billingType} onChange={e => setHeader({...header, billingType: e.target.value})}>
            <option value="NA">NA</option>
            <option value="Weekly">Weekly Billing</option>
            <option value="Monthly">Monthly Billing</option>
            <option value="Nill Lot">Nill Lot Bill</option>
          </select>
        </div>
      </div>

      {/* --- GRID TABLE (Remaining same as yours) --- */}
      <div className="bg-white border rounded shadow-sm overflow-x-auto">
        <table className="w-full border-collapse min-w-[1600px] text-left">
          <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[10px] sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-2 border border-slate-300 w-48">Item Name</th>
              <th className="p-2 border border-slate-300 w-32">Packing</th>
              <th className="p-2 border border-slate-300 w-24 text-center">Qty</th>
              <th className="p-2 border border-slate-300 w-32">Marka</th>
              <th className="p-2 border border-slate-300 w-32">P.Marka</th>
              <th className="p-2 border border-slate-300 w-32">Chamber</th>
              <th className="p-2 border border-slate-300 w-20">Floor</th>
              <th className="p-2 border border-slate-300 w-32">Pillar/Pallet</th>
              <th className="p-2 border border-slate-300 w-20">Rate</th>
              <th className="p-2 border border-slate-300 w-20">Labour</th>
              <th className="p-2 border border-slate-300 w-24 text-center text-red-600">Unit Wgt</th>
              <th className="p-2 border border-slate-300">Remarks</th>
              <th className="p-2 border border-slate-300 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {grid.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-all border-b border-slate-200">
                <td className="p-1 border-r border-slate-200">
                  <select className="w-full p-1.5 outline-none font-bold bg-transparent" value={row.itemId} onChange={e => updateGrid(idx, "itemId", e.target.value)}>
                    <option value="">-- Select Item --</option>
                    {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                </td>
                <td className="p-1 border-r border-slate-200">
                  <select className="w-full p-1.5 outline-none bg-transparent" value={row.unitId} onChange={e => updateGrid(idx, "unitId", e.target.value)}>
                    <option value="">-- Unit --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </td>
                <td className="p-1 border-r border-slate-200">
                  <input type="number" className="w-full p-1.5 text-center font-bold text-blue-700 bg-transparent outline-none" value={row.qty || ""} onChange={e => updateGrid(idx, "qty", parseFloat(e.target.value))} />
                </td>
                <td className="p-1 border-r border-slate-200"><input className="w-full p-1.5 bg-transparent outline-none uppercase" value={row.marka} onChange={e => updateGrid(idx, "marka", e.target.value)} /></td>
                <td className="p-1 border-r border-slate-200"><input className="w-full p-1.5 bg-transparent outline-none uppercase" value={row.pMarka} onChange={e => updateGrid(idx, "pMarka", e.target.value)} /></td>
                <td className="p-1 border-r border-slate-200">
                  <select className="w-full p-1.5 bg-transparent outline-none" value={row.chamberId} onChange={e => updateGrid(idx, "chamberId", e.target.value)}>
                    <option value="">Select</option>
                    {chambers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                <td className="p-1 border-r border-slate-200"><input className="w-full p-1.5 text-center bg-transparent outline-none" value={row.floor} onChange={e => updateGrid(idx, "floor", e.target.value)} /></td>
                <td className="p-1 border-r border-slate-200"><input className="w-full p-1.5 text-center bg-transparent outline-none" value={row.pillar} onChange={e => updateGrid(idx, "pillar", e.target.value)} /></td>
                <td className="p-1 border-r border-slate-200 font-bold text-center text-gray-500">{row.rate}</td>
                <td className="p-1 border-r border-slate-200 font-bold text-center text-gray-500">{row.labour}</td>
                <td className="p-1 border-r border-slate-200"><input type="number" className="w-full p-1.5 text-center font-bold text-red-600 bg-transparent outline-none" value={row.perUnitWgt || ""} onChange={e => updateGrid(idx, "perUnitWgt", parseFloat(e.target.value))} /></td>
                <td className="p-1 border-r border-slate-200"><input className="w-full p-1.5 bg-transparent outline-none" value={row.remarks} onChange={e => updateGrid(idx, "remarks", e.target.value)} /></td>
                <td className="p-1 text-center flex justify-center items-center gap-2 py-2">
                   <Plus size={18} className="text-blue-600 cursor-pointer hover:scale-125 transition-all" onClick={addRow} />
                   <Trash2 size={16} className="text-red-500 cursor-pointer hover:scale-125 transition-all" onClick={() => removeRow(idx)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- FOOTER WEIGHT ENGINE (Remaining same) --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-white border rounded shadow-md border-t-4 border-t-indigo-500">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Unit Qty</p>
          <div className="text-4xl font-black text-slate-800">{totals.qty}</div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1 tracking-widest">Tare Weight <Info size={10}/></p>
          <div className="text-4xl font-black text-red-600">{totals.tare.toFixed(2)} <span className="text-sm">Kg</span></div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Total Produced Wgt</p>
          <div className="text-4xl font-black text-green-600">{totals.gross.toFixed(2)} <span className="text-sm">Kg</span></div>
        </div>
        <div className="bg-indigo-600 p-4 rounded-xl text-white text-center shadow-xl animate-pulse hover:animate-none transition-all">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Net Stored Weight</p>
          <div className="text-4xl font-black">{totals.net.toFixed(2)} <span className="text-sm">Kg</span></div>
        </div>
      </div>
    </div>
  );
}


// "use client";

// import React, { useEffect, useState, useMemo } from "react";
// import { Plus, Trash2, Save, Printer, ArrowLeft, Search, Truck, Info, RotateCcw } from "lucide-react";
// import { toast } from "react-hot-toast";

// // --- INITIAL STATES (Reset karne ke liye) ---
// const initialHeader = {
//   mrNo: "", 
//   mrDate: new Date().toISOString().split('T')[0],
//   partyId: "",
//   address: "",
//   deliveryPerson: "",
//   truckNo: "",
//   remarksEWay: "",
//   billingType: "NA"
// };

// const initialGridRow = { 
//   lotNo: "", itemId: "", unitId: "", qty: 0, marka: "", pMarka: "", 
//   chamberId: "", floor: "", pillar: "", rate: 0, labour: 0, 
//   perUnitWgt: 0, remarks: "" 
// };

// export default function MREntryPage() {
//   // Masters Data
//   const [parties, setParties] = useState<any[]>([]);
//   const [items, setItems] = useState<any[]>([]);
//   const [units, setUnits] = useState<any[]>([]);
//   const [chambers, setChambers] = useState<any[]>([]);
  
//   // Controlled States
//   const [header, setHeader] = useState(initialHeader);
//   const [grid, setGrid] = useState([initialGridRow]);
//   const [loading, setLoading] = useState(false);

//   // 1. Load Master Data on Mount
//   useEffect(() => {
//     const loadMasters = async () => {
//       try {
//         const [p, i, u, c] = await Promise.all([
//           fetch("/api/masters/party").then(res => res.json()),
//           fetch("/api/masters/items").then(res => res.json()),
//           fetch("/api/masters/units").then(res => res.json()),
//           fetch("/api/masters/chambers").then(res => res.json())
//         ]);
//         setParties(p); setItems(i); setUnits(u); setChambers(c);
//       } catch (err) {
//         toast.error("Master data load nahi ho paya!");
//       }
//     };
//     loadMasters();
//   }, []);

//   // 2. Automation: Party select hote hi Address bhar do
//   const handlePartyChange = (id: string) => {
//     const party = parties.find(p => p.id === id);
//     setHeader({ ...header, partyId: id, address: party?.address || "" });
//   };

//   // 3. Grid Row Handlers
//   const addRow = () => setGrid([...grid, initialGridRow]);
  
//   const removeRow = (idx: number) => {
//     if (grid.length > 1) {
//       setGrid(grid.filter((_, i) => i !== idx));
//     } else {
//       setGrid([initialGridRow]);
//     }
//   };

//   const updateGrid = (idx: number, field: string, val: any) => {
//     const newGrid = [...grid];
//     (newGrid[idx] as any)[field] = val;

//     // Automation: Item/Unit select karte hi default Weight aur Rates uthao
//     if (field === "itemId" || field === "unitId") {
//       const selectedItem = items.find(it => it.id === newGrid[idx].itemId);
//       const config = selectedItem?.itemUnits?.find((u: any) => 
//         u.unitId === (field === "unitId" ? val : newGrid[idx].unitId)
//       );
//       if (config) {
//         newGrid[idx].rate = Number(config.rentRate);
//         newGrid[idx].labour = Number(config.labourRate);
//         newGrid[idx].perUnitWgt = Number(config.weight);
//       }
//     }
//     setGrid(newGrid);
//   };

//   // 4. Weight Engine (Live Calculations)
//   const totals = useMemo(() => {
//     return grid.reduce((acc, row) => {
//       const unit = units.find(u => u.id === row.unitId);
//       const tarePerUnit = unit ? Number(unit.emptyWeight) : 0;
      
//       const tare = tarePerUnit * row.qty;
//       const gross = row.qty * row.perUnitWgt;
//       const net = gross - tare;

//       return {
//         qty: acc.qty + row.qty,
//         tare: acc.tare + tare,
//         gross: acc.gross + gross,
//         net: acc.net + net
//       };
//     }, { qty: 0, tare: 0, gross: 0, net: 0 });
//   }, [grid, units]);

//   // 5. ASLI SAVE LOGIC (Popup + Reset)
//   const handleSave = async () => {
//     if (!header.partyId) return toast.error("Pehle Party toh select karlo!");
//     if (grid.some(r => !r.itemId || r.qty <= 0)) return toast.error("Grid mein Item aur Quantity bharna zaroori hai!");

//     const loadId = toast.loading("MR Entry database mein save ho rahi hai...");
//     setLoading(true);

//     try {
//       const res = await fetch("/api/inward/mr", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ header, items: grid })
//       });

//       if (res.ok) {
//         // SUCCESS POPUP
//         toast.success("MR Entry successfully save ho gayi!", { id: loadId, duration: 4000 });
        
//         // --- FIELDS EMPTY KARNE KA LOGIC ---
//         setHeader(initialHeader); 
//         setGrid([initialGridRow]); 
//       } else {
//         const err = await res.json();
//         toast.error(err.error || "Kuch gadbad ho gayi!", { id: loadId });
//       }
//     } catch (err) {
//       toast.error("Network Error! Server check karo.", { id: loadId });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-4 text-[11px]">
//       {/* --- TOP BUTTONS BAR --- */}
//       <div className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-slate-200">
//         <div className="flex gap-2">
//           <button className="bg-red-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow hover:bg-red-700">Show All</button>
//           <button onClick={() => { setHeader(initialHeader); setGrid([initialGridRow]); }} className="bg-orange-500 text-white px-4 py-1.5 rounded font-bold uppercase shadow flex items-center gap-1">
//             <RotateCcw size={14}/> Add New MR
//           </button>
//           <button onClick={addRow} className="bg-green-600 text-white px-4 py-1.5 rounded font-bold uppercase shadow">Add New Row</button>
//         </div>
//         <div className="flex gap-2">
//           <button onClick={handleSave} disabled={loading} className="bg-[#f39c12] hover:bg-orange-600 text-white px-8 py-1.5 rounded font-bold flex items-center gap-2 shadow-md transition-all active:scale-95">
//             <Save size={16}/> {loading ? "SAVING..." : "SAVE"}
//           </button>
//           <button className="bg-[#3498db] text-white px-8 py-1.5 rounded font-bold flex items-center gap-2 shadow-md"><Printer size={16}/> PRINT</button>
//         </div>
//       </div>

//       {/* --- PURPLE HEADER --- */}
//       <div className="bg-[#5d5fb1] text-white p-2 rounded-t-md font-black text-center uppercase tracking-widest border border-b-0 border-indigo-300 italic">
//         Material Receipt | Inward Entry Form
//       </div>

//       {/* --- HEADER FORM --- */}
//       <div className="bg-white p-6 border rounded-b-md shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
//         <div>
//           <label className="font-bold text-gray-400 uppercase block mb-1">MR No</label>
//           <input className="w-full border p-2 rounded bg-slate-50 font-bold text-indigo-700 outline-none" value={header.mrNo} onChange={e => setHeader({...header, mrNo: e.target.value})} placeholder="Auto Generated" />
//         </div>
//         <div>
//           <label className="font-bold text-gray-400 uppercase block mb-1">MR Date</label>
//           <input type="date" className="w-full border p-2 rounded outline-none" value={header.mrDate} onChange={e => setHeader({...header, mrDate: e.target.value})} />
//         </div>
//         <div className="md:col-span-2">
//           <label className="font-bold text-indigo-700 uppercase block mb-1">Party Name</label>
//           <select className="w-full border p-2 rounded font-bold text-blue-800 outline-none focus:ring-1 focus:ring-indigo-400" value={header.partyId} onChange={e => handlePartyChange(e.target.value)}>
//             <option value="">-- Select Party --</option>
//             {parties.map(p => <option key={p.id} value={p.id}>{p.tradeName} [{p.partyCode}]</option>)}
//           </select>
//         </div>
//         <div>
//           <label className="font-bold text-gray-400 uppercase block mb-1">Delivery Person</label>
//           <input className="w-full border p-2 rounded outline-none" value={header.deliveryPerson} onChange={e => setHeader({...header, deliveryPerson: e.target.value})} />
//         </div>
//         <div>
//           <label className="font-bold text-gray-400 uppercase block mb-1">Truck No</label>
//           <input className="w-full border p-2 rounded font-mono uppercase outline-none" value={header.truckNo} onChange={e => setHeader({...header, truckNo: e.target.value})} />
//         </div>
//         <div className="md:col-span-2">
//           <label className="font-bold text-gray-400 uppercase block mb-1">Remarks / E-Way Bill No</label>
//           <input className="w-full border p-2 rounded outline-none" value={header.remarksEWay} onChange={e => setHeader({...header, remarksEWay: e.target.value})} />
//         </div>
//         <div className="md:col-span-3">
//           <label className="font-bold text-gray-400 uppercase block mb-1">Address</label>
//           <input readOnly className="w-full border p-2 rounded bg-slate-100 text-gray-500 italic" value={header.address} />
//         </div>
//         <div>
//           <label className="font-bold text-blue-600 uppercase block mb-1">Billing Type</label>
//           <select className="w-full border border-blue-200 p-2 rounded bg-blue-50 font-bold outline-none" value={header.billingType} onChange={e => setHeader({...header, billingType: e.target.value})}>
//             <option value="NA">NA</option>
//             <option value="Weekly">Weekly Billing</option>
//             <option value="Monthly">Monthly Billing</option>
//             <option value="Nill Lot">Nill Lot Bill</option>
//           </select>
//         </div>
//       </div>

//       {/* --- GRID TABLE --- */}
//       <div className="bg-white border rounded shadow-sm overflow-x-auto">
//         <table className="w-full border-collapse min-w-[1600px] text-left">
//           <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black text-[10px] sticky top-0 z-10 shadow-sm">
//             <tr>
//               <th className="p-2 border border-slate-300 w-48">Item Name</th>
//               <th className="p-2 border border-slate-300 w-32">Packing</th>
//               <th className="p-2 border border-slate-300 w-24 text-center">Qty</th>
//               <th className="p-2 border border-slate-300 w-32">Marka</th>
//               <th className="p-2 border border-slate-300 w-32">P.Marka</th>
//               <th className="p-2 border border-slate-300 w-32">Chamber</th>
//               <th className="p-2 border border-slate-300 w-20">Floor</th>
//               <th className="p-2 border border-slate-300 w-32">Pillar/Pallet</th>
//               <th className="p-2 border border-slate-300 w-20">Rate</th>
//               <th className="p-2 border border-slate-300 w-20">Labour</th>
//               <th className="p-2 border border-slate-300 w-24 text-center text-red-600">Unit Wgt</th>
//               <th className="p-2 border border-slate-300">Remarks</th>
//               <th className="p-2 border border-slate-300 w-16 text-center">Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {grid.map((row, idx) => (
//               <tr key={idx} className="hover:bg-slate-50 transition-all border-b border-slate-200">
//                 <td className="p-1 border-r border-slate-200">
//                   <select className="w-full p-1.5 outline-none font-bold bg-transparent" value={row.itemId} onChange={e => updateGrid(idx, "itemId", e.target.value)}>
//                     <option value="">-- Select Item --</option>
//                     {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
//                   </select>
//                 </td>
//                 <td className="p-1 border-r border-slate-200">
//                   <select className="w-full p-1.5 outline-none bg-transparent" value={row.unitId} onChange={e => updateGrid(idx, "unitId", e.target.value)}>
//                     <option value="">-- Unit --</option>
//                     {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
//                   </select>
//                 </td>
//                 <td className="p-1 border-r border-slate-200">
//                   <input type="number" className="w-full p-1.5 text-center font-bold text-blue-700 bg-transparent outline-none" value={row.qty || ""} onChange={e => updateGrid(idx, "qty", parseFloat(e.target.value))} />
//                 </td>
//                 <td className="p-1 border-r border-slate-200"><input className="w-full p-1.5 bg-transparent outline-none uppercase" value={row.marka} onChange={e => updateGrid(idx, "marka", e.target.value)} /></td>
//                 <td className="p-1 border-r border-slate-200"><input className="w-full p-1.5 bg-transparent outline-none uppercase" value={row.pMarka} onChange={e => updateGrid(idx, "pMarka", e.target.value)} /></td>
//                 <td className="p-1 border-r border-slate-200">
//                   <select className="w-full p-1.5 bg-transparent outline-none" value={row.chamberId} onChange={e => updateGrid(idx, "chamberId", e.target.value)}>
//                     <option value="">Select</option>
//                     {chambers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//                   </select>
//                 </td>
//                 <td className="p-1 border-r border-slate-200"><input className="w-full p-1.5 text-center bg-transparent outline-none" value={row.floor} onChange={e => updateGrid(idx, "floor", e.target.value)} /></td>
//                 <td className="p-1 border-r border-slate-200"><input className="w-full p-1.5 text-center bg-transparent outline-none" value={row.pillar} onChange={e => updateGrid(idx, "pillar", e.target.value)} /></td>
//                 <td className="p-1 border-r border-slate-200 font-bold text-center text-gray-500">{row.rate}</td>
//                 <td className="p-1 border-r border-slate-200 font-bold text-center text-gray-500">{row.labour}</td>
//                 <td className="p-1 border-r border-slate-200"><input type="number" className="w-full p-1.5 text-center font-bold text-red-600 bg-transparent outline-none" value={row.perUnitWgt || ""} onChange={e => updateGrid(idx, "perUnitWgt", parseFloat(e.target.value))} /></td>
//                 <td className="p-1 border-r border-slate-200"><input className="w-full p-1.5 bg-transparent outline-none" value={row.remarks} onChange={e => updateGrid(idx, "remarks", e.target.value)} /></td>
//                 <td className="p-1 text-center flex justify-center items-center gap-2 py-2">
//                    <Plus size={18} className="text-blue-600 cursor-pointer hover:scale-125 transition-all" onClick={addRow} />
//                    <Trash2 size={16} className="text-red-500 cursor-pointer hover:scale-125 transition-all" onClick={() => removeRow(idx)} />
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* --- FOOTER WEIGHT ENGINE --- */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-white border rounded shadow-md border-t-4 border-t-indigo-500">
//         <div className="space-y-1">
//           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Unit Qty</p>
//           <div className="text-4xl font-black text-slate-800">{totals.qty}</div>
//         </div>
//         <div className="space-y-1">
//           <p className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1 tracking-widest">Tare Weight <Info size={10}/></p>
//           <div className="text-4xl font-black text-red-600">{totals.tare.toFixed(2)} <span className="text-sm">Kg</span></div>
//         </div>
//         <div className="space-y-1">
//           <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Total Produced Wgt</p>
//           <div className="text-4xl font-black text-green-600">{totals.gross.toFixed(2)} <span className="text-sm">Kg</span></div>
//         </div>
//         <div className="bg-indigo-600 p-4 rounded-xl text-white text-center shadow-xl animate-pulse hover:animate-none transition-all">
//           <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Net Stored Weight</p>
//           <div className="text-4xl font-black">{totals.net.toFixed(2)} <span className="text-sm">Kg</span></div>
//         </div>
//       </div>
//     </div>
//   );
// }