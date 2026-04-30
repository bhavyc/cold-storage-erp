"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Warehouse, Save, ArrowLeft, Calculator, Ruler, Edit, Trash2, FileSpreadsheet, Printer, Loader2, X, Info ,Search } from "lucide-react";
import { toast } from "react-hot-toast";

interface Chamber {
  id: string;
  code: string;
  name: string;
  type: string;
  capacityMode: string;
  length: number | null;
  breadth: number | null;
  height: number | null;
  totalCapacity: number;
  totalPallets: number;
  arrivalDate: string;
  remarks: string;
}

interface LumpSumRow {
  unitId: string;
  qty: number;
}

const defaultForm = {
  code: "", name: "", remarks: "",
  type: "Cold Storage (CS Store)",
  capacityMode: "Exact",
  length: 0, breadth: 0, height: 0,
  totalCapacity: 0, totalPallets: 0,
  arrivalDate: new Date().toISOString().split('T')[0]
};

export default function ChamberMasterPage() {
  const [view, setView] = useState<"list" | "entry">("list");
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState(defaultForm);
  const [lumpSumRows, setLumpSumRows] = useState<LumpSumRow[]>([{ unitId: "", qty: 0 }]);

  // 1. FETCH LIST
  const fetchChambers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/masters/chambers");
      const data = await res.json();
      setChambers(data || []);
    } catch (err) {
      toast.error("Failed to load chambers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChambers();
    fetch("/api/masters/units").then(res => res.json()).then(setUnits);
  }, [fetchChambers]);

  // 2. AUTOMATION: Capacity Calculations
  useEffect(() => {
    if (formData.capacityMode === "Theoretical") {
      const vol = (Number(formData.length) || 0) * (Number(formData.breadth) || 0) * (Number(formData.height) || 0);
      const calc = Math.floor(vol / 2.5); // Standard storage volume factor
      setFormData(prev => ({ ...prev, totalCapacity: calc }));
    } else if (formData.capacityMode === "LumpSum") {
      const total = lumpSumRows.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
      setFormData(prev => ({ ...prev, totalCapacity: total }));
    }
  }, [formData.length, formData.breadth, formData.height, formData.capacityMode, lumpSumRows]);

  // 3. EDIT TRIGGER
  const handleEdit = (ch: Chamber) => {
    setEditingId(ch.id);
    setFormData({
      code: ch.code,
      name: ch.name,
      remarks: ch.remarks || "",
      type: ch.type,
      capacityMode: ch.capacityMode,
      length: Number(ch.length) || 0,
      breadth: Number(ch.breadth) || 0,
      height: Number(ch.height) || 0,
      totalCapacity: ch.totalCapacity,
      totalPallets: ch.totalPallets,
      arrivalDate: ch.arrivalDate ? new Date(ch.arrivalDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setView("entry");
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setLumpSumRows([{ unitId: "", qty: 0 }]);
    setView("entry");
  };

  // 4. SAVE OR UPDATE
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return toast.error("Chamber Code and Name are mandatory!");

    setIsSaving(true);
    const url = editingId ? `/api/masters/chambers/${editingId}` : "/api/masters/chambers";
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(editingId ? "Chamber configuration updated!" : "New Chamber added to registry!");
        setEditingId(null);
        setView("list");
        fetchChambers();
      } else {
        const error = await res.json();
        toast.error(error.error || "Save failed");
      }
    } catch (err) {
      toast.error("Network connection error");
    } finally {
      setIsSaving(false);
    }
  };

  // 5. DELETE LOGIC
  const handleDelete = async (id: string) => {
    if (!confirm("Bhai, kya aap sure hain? Chamber delete karne se pehle ensure karein ki usme koi active Lot nahi hai.")) return;
    
    const loadId = toast.loading("Deleting chamber...");
    try {
      const res = await fetch(`/api/masters/chambers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Chamber deleted!", { id: loadId });
        fetchChambers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Uda nahi paye!", { id: loadId });
      }
    } catch (err) {
      toast.error("Server Error", { id: loadId });
    }
  };

  const filteredChambers = chambers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- UI COMPONENTS ---

  if (view === "list") {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-lg">
          <h2 className="font-bold text-sm uppercase flex items-center gap-2 tracking-widest">
            <Warehouse size={18} /> Chamber Master (Storage Facilities)
          </h2>
          <div className="flex gap-2">
            <button onClick={handleAddNew} className="bg-orange-500 hover:bg-orange-600 p-1.5 rounded transition-all shadow-md active:scale-95">
              <Plus size={18} />
            </button>
            <button className="bg-green-600 hover:bg-green-700 p-1.5 rounded shadow"><FileSpreadsheet size={18} /></button>
            <button className="bg-red-600 hover:bg-red-700 p-1.5 rounded shadow"><Printer size={18} /></button>
          </div>
        </div>

        <div className="bg-white p-4 border rounded shadow-sm">
           <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input 
                placeholder="Search Chamber Name or Code..." 
                className="pl-10 pr-4 py-2 border-2 border-slate-100 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="bg-white border rounded shadow-sm overflow-hidden text-xs min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f8f9fa] border-b font-black text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="p-4 border-r">Code</th>
                <th className="p-4 border-r">Chamber Description</th>
                <th className="p-4 border-r">Storage Type</th>
                <th className="p-4 border-r">Mode</th>
                <th className="p-4 border-r text-center">Total Capacity</th>
                <th className="p-4 border-r text-center">Pallets</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-20 text-center font-bold text-indigo-700 animate-pulse uppercase tracking-widest">Syncing Chambers...</td></tr>
              ) : filteredChambers.length === 0 ? (
                <tr><td colSpan={7} className="p-20 text-center text-gray-400 italic font-medium">No chambers found in registry.</td></tr>
              ) : filteredChambers.map(ch => (
                <tr key={ch.id} className="border-b hover:bg-indigo-50/40 transition-colors font-bold group">
                  <td className="p-4 border-r font-black text-indigo-700">{ch.code}</td>
                  <td className="p-4 border-r uppercase text-slate-700">{ch.name}</td>
                  <td className="p-4 border-r">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${ch.type.includes('CA') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {ch.type}
                    </span>
                  </td>
                  <td className="p-4 border-r">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200">{ch.capacityMode}</span>
                  </td>
                  <td className="p-4 border-r text-center font-black text-green-600">
                    {ch.totalCapacity.toLocaleString()} <span className="text-[9px] font-normal text-gray-400">BAGS</span>
                  </td>
                  <td className="p-4 border-r text-center text-gray-700">{ch.totalPallets}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-4">
                      <button onClick={() => handleEdit(ch)} className="text-blue-600 hover:scale-125 transition-transform"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(ch.id)} className="text-red-500 hover:scale-125 transition-transform"><Trash2 size={16} /></button>
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

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-in slide-in-from-right duration-400 text-[11px]">
      <div className="flex gap-2">
        <button onClick={() => setView("list")} className="bg-red-500 text-white px-5 py-2 rounded font-black flex items-center gap-2 shadow-lg uppercase transition-all active:scale-95">
          <ArrowLeft size={16} /> Back to List
        </button>
      </div>

      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg font-black text-sm uppercase shadow-md text-center tracking-widest italic">
        {editingId ? "Edit Storage Chamber Details" : "Register New Storage Chamber"}
      </div>

      <form onSubmit={handleSave} className="bg-white p-8 border rounded-b-lg shadow-2xl space-y-10">

        {/* Section 1: Basic Registry */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chamber Code *</label>
            <input
              required
              className="w-full border-2 border-slate-100 p-2.5 rounded text-sm bg-slate-50 font-black text-indigo-700 outline-none focus:border-indigo-500"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Name *</label>
            <input
              required
              className="w-full border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-500 font-bold uppercase"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chamber Technology</label>
            <select
              className="w-full border-2 border-slate-100 p-2.5 rounded text-sm bg-white outline-none focus:border-indigo-500 font-bold"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
            >
              <option>Cold Storage (CS Store)</option>
              <option>Modified Atmosphere (CA Store)</option>
            </select>
          </div>
        </div>

        {/* Section 2: Capacity Logic Engine */}
        <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-200 shadow-inner">
          <p className="text-[10px] font-black text-indigo-700 mb-6 uppercase flex items-center gap-2 italic">
            <Calculator size={16} /> Capacity Configuration Engine
          </p>
          <div className="flex gap-10 mb-8 justify-center">
            {["Exact", "Theoretical", "LumpSum"].map(mode => (
              <label key={mode} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  checked={formData.capacityMode === mode}
                  onChange={() => setFormData({ ...formData, capacityMode: mode })}
                  className="w-5 h-5 text-indigo-600"
                />
                <span className={`text-[11px] font-black uppercase tracking-tighter ${formData.capacityMode === mode ? 'text-indigo-800' : 'text-slate-400'}`}>{mode} Holding Mode</span>
              </label>
            ))}
          </div>

          {/* Mode UI Switcher */}
          {formData.capacityMode === "Exact" && (
            <div className="flex justify-center animate-in zoom-in duration-200">
              <div className="w-1/2 space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase block text-center mb-1">Fixed Bag Capacity</label>
                <input
                  type="number"
                  className="w-full border-2 border-green-100 p-4 rounded-xl text-4xl font-black text-green-600 text-center outline-none focus:border-green-500"
                  value={formData.totalCapacity}
                  onChange={e => setFormData({ ...formData, totalCapacity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}

          {formData.capacityMode === "Theoretical" && (
            <div className="grid grid-cols-4 gap-6 animate-in slide-in-from-left duration-200 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              {["length", "breadth", "height"].map(dim => (
                <div key={dim} className="space-y-1 text-center">
                  <label className="text-[9px] font-black text-gray-400 uppercase flex items-center justify-center gap-1">
                    <Ruler size={12} /> {dim} (ft)
                  </label>
                  <input
                    type="number"
                    className="w-full border-2 border-slate-100 p-2.5 rounded text-lg font-black text-slate-700 text-center outline-none focus:border-indigo-400"
                    value={(formData as any)[dim]}
                    onChange={e => setFormData({ ...formData, [dim]: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              ))}
              <div className="space-y-1 text-center bg-indigo-50 p-2 rounded-lg border border-indigo-200">
                <label className="text-[9px] font-black text-red-500 uppercase italic">Est. Capacity</label>
                <div className="text-3xl font-black text-indigo-700 mt-1">{formData.totalCapacity}</div>
                <div className="text-[8px] text-gray-400 uppercase mt-1">Total Bags</div>
              </div>
            </div>
          )}

          {formData.capacityMode === "LumpSum" && (
            <div className="space-y-3 animate-in slide-in-from-right duration-200 bg-white p-4 rounded-xl shadow-sm border">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-white font-black uppercase text-[9px]">
                  <tr>
                    <th className="p-3">Packaging Unit</th>
                    <th className="p-3 text-center w-40">Bags Capacity</th>
                    <th className="p-3 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lumpSumRows.map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">
                        <select
                          className="w-full border p-2 rounded font-bold"
                          value={row.unitId}
                          onChange={e => {
                            const newRows = [...lumpSumRows];
                            newRows[idx].unitId = e.target.value;
                            setLumpSumRows(newRows);
                          }}
                        >
                          <option value="">Select Packaging</option>
                          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          className="w-full border p-2 rounded text-center font-black text-indigo-600"
                          value={row.qty}
                          onChange={e => {
                            const newRows = [...lumpSumRows];
                            newRows[idx].qty = parseInt(e.target.value) || 0;
                            setLumpSumRows(newRows);
                          }}
                        />
                      </td>
                      <td className="p-2 text-center flex justify-center items-center gap-2 py-4">
                        <button type="button" onClick={() => setLumpSumRows([...lumpSumRows, { unitId: "", qty: 0 }])} className="text-blue-600 font-bold hover:scale-125 transition-transform"><Plus size={20}/></button>
                        <button type="button" onClick={() => lumpSumRows.length > 1 && setLumpSumRows(lumpSumRows.filter((_, i) => i !== idx))} className="text-red-500 font-bold hover:scale-125 transition-transform"><X size={20}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-indigo-900 text-white p-3 rounded-lg flex justify-between items-center px-8">
                 <span className="font-black uppercase text-[10px] tracking-widest italic">Calculated Aggregate Capacity:</span>
                 <span className="text-2xl font-black">{formData.totalCapacity} <span className="text-[10px] font-normal">BAGS</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Pallets & Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Fixed Pallets / Slots</label>
            <input
              type="number"
              className="w-full border-2 border-slate-100 p-2.5 rounded text-lg font-black text-slate-800 outline-none focus:border-indigo-400"
              value={formData.totalPallets}
              onChange={e => setFormData({ ...formData, totalPallets: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Commissioning / First Arrival Date</label>
            <input
              type="date"
              className="w-full border-2 border-slate-100 p-2.5 rounded text-sm font-mono font-bold outline-none focus:border-indigo-400"
              value={formData.arrivalDate}
              onChange={e => setFormData({ ...formData, arrivalDate: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Internal Remarks & Instructions</label>
            <textarea
              className="w-full border-2 border-slate-100 p-4 rounded-xl text-sm h-24 outline-none focus:border-indigo-400 font-medium"
              placeholder="Enter special storage instructions or location notes..."
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-center pt-10">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-red-600 hover:bg-red-700 text-white font-black px-32 py-4 rounded-lg shadow-2xl transition-all uppercase text-sm tracking-widest flex items-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24} />}
            {editingId ? "Update Chamber Registry" : "Register Storage Chamber"}
          </button>
        </div>
      </form>
    </div>
  );
}
