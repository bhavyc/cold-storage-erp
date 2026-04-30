"use client";

import React, { useEffect, useState, useCallback } from "react";
// ✅ Fixed: Added Save to the imports
import { Plus, Search, Trash2, Edit, FileSpreadsheet, Printer, X, Loader2, Info, Save } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State - All fields included
  const [formData, setFormData] = useState({
    code: "", 
    name: "", 
    type: "Company",
    emptyWeight: 0, 
    rateToContractorIn: 0, 
    rateToContractorOut: 0, 
    opBalance: 0
  });

  // 1. FETCH UNITS LIST
  const fetchUnits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/masters/units");
      const data = await res.json();
      setUnits(data || []);
    } catch (error) {
      toast.error("Failed to load units list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // 2. DELETE UNIT
  const handleDelete = async (id: string) => {
    if (!confirm("Bhai, Unit udaani hai? Soch lo, stock logic bigad sakta hai.")) return;
    
    const loadId = toast.loading("Deleting unit...");
    try {
      const res = await fetch(`/api/masters/units/${id}`, { method: "DELETE" });
      const result = await res.json();

      if (res.ok) {
        toast.success("Unit deleted successfully!", { id: loadId });
        fetchUnits();
      } else {
        toast.error(result.error || "Uda nahi paye!", { id: loadId });
      }
    } catch (error) {
      toast.error("Network error while deleting", { id: loadId });
    }
  };

  // 3. EDIT TRIGGER (Populate All Fields)
  const handleEdit = (unit: Unit) => {
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
    setIsModalOpen(true);
  };

  // 4. OPEN FOR NEW ENTRY (Reset All Fields)
  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      code: "", 
      name: "", 
      type: "Company", 
      emptyWeight: 0, 
      rateToContractorIn: 0, 
      rateToContractorOut: 0, 
      opBalance: 0
    });
    setIsModalOpen(true);
  };

  // 5. SAVE OR UPDATE LOGIC
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return toast.error("Code and Name are mandatory!");

    setIsSaving(true);
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/masters/units/${editingId}` : "/api/masters/units";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(editingId ? "Unit updated successfully!" : "New Unit created!");
        setIsModalOpen(false);
        setEditingId(null);
        fetchUnits();
      } else {
        toast.error(result.error || "Save failed!");
      }
    } catch (err) {
      toast.error("Server connection error!");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter Search
  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Blue Header Bar */}
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
        <h2 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <FileSpreadsheet size={18}/> Unit Master (Packaging)
        </h2>
        <div className="flex gap-2">
          <button className="bg-green-600 hover:bg-green-700 p-1.5 rounded shadow transition-all"><FileSpreadsheet size={16} /></button>
          <button className="bg-red-600 hover:bg-red-700 p-1.5 rounded shadow transition-all"><Printer size={16} /></button>
          <button 
            onClick={handleAddNew}
            className="bg-orange-500 hover:bg-orange-600 px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-lg active:scale-95 transition-all"
          >
            <Plus size={14} /> Add New Unit
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 border rounded shadow-sm flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search Unit Name or Code..." 
            className="pl-9 pr-4 py-2 border-2 border-slate-100 rounded-md text-sm w-full outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
 
      {/* Units Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden min-h-[400px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#f8f9fa] border-b font-black text-slate-600 uppercase">
            <tr>
              <th className="p-4 border-r">Unit Code</th>
              <th className="p-4 border-r">Unit Name</th>
              <th className="p-4 border-r">Type</th>
              <th className="p-4 border-r text-center">Tare Wgt (KG)</th>
              <th className="p-4 border-r text-center">Contractor (IN)</th>
              <th className="p-4 border-r text-center">Contractor (OUT)</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-20 text-center font-bold text-indigo-700 animate-pulse text-lg uppercase tracking-widest">Loading Masters...</td></tr>
            ) : filteredUnits.length === 0 ? (
              <tr><td colSpan={7} className="p-20 text-center text-gray-400 italic">No packaging units found.</td></tr>
            ) : filteredUnits.map((unit) => (
              <tr key={unit.id} className="border-b hover:bg-indigo-50/40 transition-colors font-bold group">
                <td className="p-4 border-r font-black text-indigo-700">{unit.code}</td>
                <td className="p-4 border-r uppercase text-slate-700">{unit.name}</td>
                <td className="p-4 border-r">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${unit.type === 'Grower' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {unit.type}
                  </span>
                </td>
                <td className="p-4 border-r text-center font-mono text-red-500">{Number(unit.emptyWeight).toFixed(3)} Kg</td>
                <td className="p-4 border-r text-center font-mono text-green-600">₹{Number(unit.rateToContractorIn).toFixed(2)}</td>
                <td className="p-4 border-r text-center font-mono text-green-600">₹{Number(unit.rateToContractorOut).toFixed(2)}</td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-4">
                    <button onClick={()=> handleEdit(unit)} className="text-blue-500 hover:scale-125 transition-transform"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(unit.id)} className="text-red-500 hover:scale-125 transition-transform"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Entry / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-[#5d5fb1] text-white p-4 flex justify-between items-center shadow-md">
              <h3 className="font-black uppercase text-sm tracking-widest italic">
                {editingId ? "Update Packaging Unit" : "New Unit Entry"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Unit Code *</label>
                  <input 
                    required 
                    className="w-full border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-500 font-bold bg-slate-50" 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Unit Name *</label>
                  <input 
                    required 
                    className="w-full border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-500 font-bold" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Unit Type</label>
                  <select 
                    className="w-full border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-500 font-bold bg-white" 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Company">Company Bag</option>
                    <option value="Grower">Grower Bag</option>
                    <option value="Peti">Peti / Box</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-red-500 uppercase tracking-tighter italic">Empty Wgt (Tare KG)</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    className="w-full border-2 border-red-100 p-2.5 rounded text-sm outline-none focus:border-red-500 font-mono font-bold" 
                    value={formData.emptyWeight} 
                    onChange={e => setFormData({...formData, emptyWeight: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border-2 border-dashed border-slate-200">
                <p className="text-[10px] font-black text-indigo-700 mb-4 uppercase italic flex items-center gap-2">
                  <Info size={14}/> Labor Liability Split (IN/OUT Logic)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Contractor Rate (IN)</label>
                    <input 
                      type="number" 
                      className="w-full border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-green-500 font-bold" 
                      value={formData.rateToContractorIn} 
                      onChange={e => setFormData({...formData, rateToContractorIn: parseFloat(e.target.value) || 0})} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Contractor Rate (OUT)</label>
                    <input 
                      type="number" 
                      className="w-full border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-green-500 font-bold" 
                      value={formData.rateToContractorOut} 
                      onChange={e => setFormData({...formData, rateToContractorOut: parseFloat(e.target.value) || 0})} 
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Opening Balance Qty (Manual)</label>
                    <input 
                      type="number" 
                      className="w-full border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-500 font-bold" 
                      value={formData.opBalance} 
                      onChange={e => setFormData({...formData, opBalance: parseInt(e.target.value) || 0})} 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-lg shadow-xl transition-all uppercase text-sm tracking-widest flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                  {editingId ? "Update Unit Configuration" : "Submit Unit Master"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
