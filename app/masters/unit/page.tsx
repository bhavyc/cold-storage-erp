"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, Trash2, Edit, FileSpreadsheet, Printer, X } from "lucide-react";
import { toast } from "react-hot-toast";

// STRICT TYPES
interface Unit {
  id: string;
  code: string;
  name: string;
  type: string;
  emptyWeight: number;
  rateToContractorIn: number;
  rateToContractorOut: number;
  opBalance: number;
}

export default function UnitMasterPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: "", name: "", type: "Company",
    emptyWeight: 0, rateToContractorIn: 0, rateToContractorOut: 0, opBalance: 0
  });

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await fetch("/api/masters/units");
        const data = await res.json();
        setUnits(data);
      } catch (error) {
        console.error("Failed to fetch units:", error);
        toast.error("Failed to load units");
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, []);


 
 

// 2. Delete Function define karo
const handleDelete = async (id: string) => {
  if (!confirm("Bhai, Unit udaani hai? Soch lo, stock logic bigad sakta hai.")) return;
  
  const res = await fetch(`/api/masters/units/${id}`, { method: "DELETE" });
  const result = await res.json();

  if (res.ok) {
    toast.success("Unit deleted!");
    // List refresh karne ke liye API call dobara karo
    const response = await fetch("/api/masters/units");
    setUnits(await response.json());
  } else {
    toast.error(result.error || "Uda nahi paye!");
  }
};

// 3. Edit Function (Form fill karna)
const handleEdit = (unit: any) => {
  setEditingId(unit.id);
  setFormData({
    code: unit.code,
    name: unit.name,
    type: unit.type,
    emptyWeight: Number(unit.emptyWeight),
    rateToContractorIn: Number(unit.rateToContractorIn),
    rateToContractorOut: Number(unit.rateToContractorOut),
    opBalance: unit.opBalance
  });
  setIsModalOpen(true); // Modal khul jayega bhari hui details ke saath
};

// 4. handleSave mein Logic switch karo
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  const method = editingId ? "PATCH" : "POST";
  const url = editingId ? `/api/masters/units/${editingId}` : "/api/masters/units";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  if (res.ok) {
    toast.success(editingId ? "Unit update ho gayi!" : "Nayi Unit ban gayi!");
    setIsModalOpen(false);
    setEditingId(null);
    // Refresh List...
     // Refetch units after save
        setLoading(true);
        const response = await fetch("/api/masters/units");
        const data = await response.json();
        setUnits(data);
        setLoading(false);
  }
};


  // const handleSave = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   try {
  //     const res = await fetch("/api/masters/units", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(formData),
  //     });
  //     if (res.ok) {
  //       toast.success("Unit Saved Successfully");
  //       setIsModalOpen(false);
  //       setFormData({ code: "", name: "", type: "Company", emptyWeight: 0, rateToContractorIn: 0, rateToContractorOut: 0, opBalance: 0 });
        
  //       // Refetch units after save
  //       setLoading(true);
  //       const response = await fetch("/api/masters/units");
  //       const data = await response.json();
  //       setUnits(data);
  //       setLoading(false);
  //     }
  //   } catch (err) {
  //     toast.error("Error saving unit");
  //   }
  // };

   

  return (
    <div className="space-y-4">
      {/* Blue Header Bar (As per Image 18) */}
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
        <h2 className="font-bold text-sm uppercase tracking-wider">Unit Master (Packaging)</h2>
        <div className="flex gap-2">
          <button className="bg-green-600 hover:bg-green-700 p-1.5 rounded transition-colors"><FileSpreadsheet size={16} /></button>
          <button className="bg-red-600 hover:bg-red-700 p-1.5 rounded transition-colors"><Printer size={16} /></button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Plus size={14} /> Add New Unit
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 border rounded-b-lg shadow-sm flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search Unit Name or Code..." 
            className="pl-9 pr-4 py-2 border rounded-md text-sm w-full outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
 
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b text-slate-600">
            <tr>
              <th className="p-4 font-bold">UNIT CODE</th>
              <th className="p-4 font-bold">UNIT NAME</th>
              <th className="p-4 font-bold">TYPE</th>
              <th className="p-4 font-bold text-center">TARE WEIGHT (KG)</th>
              <th className="p-4 font-bold text-center">CONTRACTOR (IN)</th>
              <th className="p-4 font-bold text-center">CONTRACTOR (OUT)</th>
              <th className="p-4 font-bold text-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-10 text-center animate-pulse">Fetching Units...</td></tr>
            ) : units.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map((unit) => (
              <tr key={unit.id} className="border-b hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-indigo-700">{unit.code}</td>
                <td className="p-4 font-medium">{unit.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${unit.type === 'Grower' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {unit.type}
                  </span>
                </td>
                <td className="p-4 text-center font-mono text-red-500">{unit.emptyWeight} Kg</td>
                <td className="p-4 text-center font-mono">₹{unit.rateToContractorIn}</td>
                <td className="p-4 text-center font-mono">₹{unit.rateToContractorOut}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={()=> handleEdit(unit)} className="text-blue-500 hover:text-blue-700"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(unit.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Entry Modal (Image 19 & 21 Logic) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#5d5fb1] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold uppercase text-sm">Unit Master | Entry</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Unit Code</label>
                <input required className="w-full border p-2 rounded text-sm outline-none focus:border-indigo-500" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Unit Name</label>
                <input required className="w-full border p-2 rounded text-sm outline-none focus:border-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Unit Type</label>
                <select className="w-full border p-2 rounded text-sm outline-none focus:border-indigo-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="Company">Company</option>
                  <option value="Grower">Grower</option>
                  <option value="Peti">Peti</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase italic text-red-500">Empty Wgt (Tare KG)</label>
                <input type="number" step="0.001" className="w-full border p-2 rounded text-sm outline-none border-red-200" value={formData.emptyWeight} onChange={e => setFormData({...formData, emptyWeight: parseFloat(e.target.value)})} />
              </div>
              <div className="space-y-1 border-t pt-2 mt-2 col-span-2 text-indigo-600 text-[11px] font-bold italic">Labor Liability Split (IN/OUT Logic)</div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Rate to Contractor (IN)</label>
                <input type="number" className="w-full border p-2 rounded text-sm outline-none" value={formData.rateToContractorIn} onChange={e => setFormData({...formData, rateToContractorIn: parseFloat(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Rate to Contractor (OUT)</label>
                <input type="number" className="w-full border p-2 rounded text-sm outline-none" value={formData.rateToContractorOut} onChange={e => setFormData({...formData, rateToContractorOut: parseFloat(e.target.value)})} />
              </div>
              <div className="col-span-2 pt-4">
                <button type="submit" className="w-full bg-red-600 text-white font-bold py-2 rounded shadow-md hover:bg-red-700 transition-all uppercase text-sm">Submit Unit Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}