"use client";

import React, { useEffect, useState } from "react";
import { Plus, Warehouse, Save, ArrowLeft, Calculator, Ruler, Edit, Trash2, FileSpreadsheet, Printer } from "lucide-react";
import { toast } from "react-hot-toast";

interface Chamber {
  id: string;
  code: string;
  name: string;
  type: string;
  capacityMode: string;
  length: number;
  breadth: number;
  height: number;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [lumpSumRows, setLumpSumRows] = useState<LumpSumRow[]>([{ unitId: "", qty: 0 }]);

  const fetchChambers = async () => {
    const res = await fetch("/api/masters/chambers");
    const data = await res.json();
    setChambers(data);
  };

  useEffect(() => {
    fetchChambers();
    fetch("/api/masters/units").then(res => res.json()).then(setUnits);
  }, []);

  // Auto-calculate theoretical capacity
  useEffect(() => {
    if (formData.capacityMode === "Theoretical") {
      const vol = formData.length * formData.breadth * formData.height;
      const calc = Math.floor(vol / 2.5);
      setFormData(prev => ({ ...prev, totalCapacity: calc }));
    }
  }, [formData.length, formData.breadth, formData.height, formData.capacityMode]);

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
      arrivalDate: ch.arrivalDate || new Date().toISOString().split('T')[0]
    });
    setView("entry");
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setLumpSumRows([{ unitId: "", qty: 0 }]);
    setView("entry");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingId ? `/api/masters/chambers/${editingId}` : "/api/masters/chambers";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      toast.success(editingId ? "Chamber Updated Successfully!" : "Chamber Created Successfully!");
      setEditingId(null);
      setView("list");
      fetchChambers();
    } else {
      toast.error("Operation failed");
    }
  };

  // --- LIST VIEW ---
  if (view === "list") {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
          <h2 className="font-bold text-sm uppercase flex items-center gap-2">
            <Warehouse size={18} /> Chamber Master
          </h2>
          <div className="flex gap-2">
            <button onClick={handleAddNew} className="bg-orange-500 hover:bg-orange-600 p-1.5 rounded transition-all">
              <Plus size={18} />
            </button>
            <button className="bg-green-600 hover:bg-green-700 p-1.5 rounded">
              <FileSpreadsheet size={18} />
            </button>
            <button className="bg-red-600 hover:bg-red-700 p-1.5 rounded">
              <Printer size={18} />
            </button>
          </div>
        </div>

        <div className="bg-white border rounded shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b font-bold text-slate-600 uppercase">
              <tr>
                <th className="p-4 border-r">Code</th>
                <th className="p-4 border-r">Chamber Name</th>
                <th className="p-4 border-r">Type</th>
                <th className="p-4 border-r">Mode</th>
                <th className="p-4 border-r text-center">Capacity</th>
                <th className="p-4 border-r text-center">Pallets</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {chambers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 italic">No chambers found. Click + to add one.</td>
                </tr>
              ) : (
                chambers.map(ch => (
                  <tr key={ch.id} className="border-b hover:bg-indigo-50/30 transition-colors">
                    <td className="p-4 border-r font-bold text-indigo-700">{ch.code}</td>
                    <td className="p-4 border-r font-medium">{ch.name}</td>
                    <td className="p-4 border-r text-gray-600">{ch.type}</td>
                    <td className="p-4 border-r">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{ch.capacityMode}</span>
                    </td>
                    <td className="p-4 border-r text-center font-bold text-green-600">
                      {ch.totalCapacity.toLocaleString()} Bags
                    </td>
                    <td className="p-4 border-r text-center text-gray-700">{ch.totalPallets}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => handleEdit(ch)} className="text-blue-600 hover:scale-110 transition-transform">
                          <Edit size={16} />
                        </button>
                        <button className="text-red-500 hover:scale-110 transition-transform">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- ENTRY / EDIT VIEW ---
  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-in slide-in-from-right duration-300">
      <div className="flex gap-2">
        <button
          onClick={() => { setView("list"); setEditingId(null); }}
          className="bg-red-500 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-red-600"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button
          type="button"
          onClick={handleAddNew}
          className="bg-orange-500 text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm hover:bg-orange-600"
        >
          + Add New Chamber
        </button>
      </div>

      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg font-bold text-sm uppercase shadow-md">
        Chamber Master | {editingId ? "Edit Entry" : "New Entry"}
      </div>

      <form onSubmit={handleSave} className="bg-white p-8 border rounded-b-lg shadow-sm space-y-8">

        {/* Section 1: Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Chamber Code</label>
            <input
              required
              className="w-full border p-2.5 rounded text-sm bg-slate-50 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Chamber Name</label>
            <input
              required
              className="w-full border p-2.5 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-500"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Chamber Type</label>
            <select
              className="w-full border p-2.5 rounded text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
            >
              <option>Cold Storage (CS Store)</option>
              <option>Modified Atmosphere Storage (CA Store)</option>
            </select>
          </div>
        </div>

        {/* Section 2: Capacity Mode */}
        <div className="bg-slate-50 p-5 rounded-lg border border-dashed border-slate-300">
          <p className="text-[10px] font-bold text-indigo-700 mb-4 uppercase flex items-center gap-2">
            <Calculator size={14} /> Capacity Mode Selection
          </p>
          <div className="flex gap-6 mb-6">
            {["Exact", "Theoretical", "LumpSum"].map(mode => (
              <label key={mode} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.capacityMode === mode}
                  onChange={() => setFormData({ ...formData, capacityMode: mode })}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-xs font-bold text-slate-600">{mode} Holding Capacity</span>
              </label>
            ))}
          </div>

          {/* Exact Mode */}
          {formData.capacityMode === "Exact" && (
            <div className="animate-in fade-in zoom-in duration-200 space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Chamber Capacity (Total Bags)</label>
              <input
                type="number"
                className="w-full md:w-1/3 border p-2.5 rounded text-sm font-bold text-green-600 outline-none focus:ring-1 focus:ring-green-400"
                value={formData.totalCapacity}
                onChange={e => setFormData({ ...formData, totalCapacity: parseInt(e.target.value) || 0 })}
              />
            </div>
          )}

          {/* Theoretical Mode */}
          {formData.capacityMode === "Theoretical" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-left duration-200">
              {["length", "breadth", "height"].map(dim => (
                <div key={dim} className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                    <Ruler size={10} /> {dim}
                  </label>
                  <input
                    type="number"
                    className="w-full border p-2.5 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-400"
                    value={formData[dim as keyof typeof formData]}
                    onChange={e => setFormData({ ...formData, [dim]: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-red-500 uppercase italic">Auto Calc Capacity</label>
                <input
                  readOnly
                  className="w-full border p-2.5 rounded text-sm bg-indigo-50 font-bold text-indigo-700"
                  value={formData.totalCapacity}
                />
              </div>
            </div>
          )}

          {/* LumpSum Mode */}
          {formData.capacityMode === "LumpSum" && (
            <div className="space-y-3 animate-in slide-in-from-right duration-200">
              <table className="w-full text-left text-xs border rounded overflow-hidden">
                <thead className="bg-slate-800 text-white font-bold">
                  <tr>
                    <th className="p-2 border">Unit Name (Packaging)</th>
                    <th className="p-2 border">Quantity</th>
                    <th className="p-2 border text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lumpSumRows.map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-1 border">
                        <select
                          className="w-full p-2 outline-none bg-transparent"
                          value={row.unitId}
                          onChange={e => {
                            const newRows = [...lumpSumRows];
                            newRows[idx].unitId = e.target.value;
                            setLumpSumRows(newRows);
                          }}
                        >
                          <option value="">Select Unit</option>
                          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </td>
                      <td className="p-1 border">
                        <input
                          type="number"
                          className="w-full p-2 outline-none bg-transparent"
                          value={row.qty}
                          onChange={e => {
                            const newRows = [...lumpSumRows];
                            newRows[idx].qty = parseInt(e.target.value) || 0;
                            setLumpSumRows(newRows);
                          }}
                        />
                      </td>
                      <td className="p-1 border text-center">
                        <button
                          type="button"
                          onClick={() => setLumpSumRows([...lumpSumRows, { unitId: "", qty: 0 }])}
                          className="text-blue-600 font-bold mr-2 hover:text-blue-800"
                        >+</button>
                        <button
                          type="button"
                          onClick={() => setLumpSumRows(lumpSumRows.filter((_, i) => i !== idx))}
                          className="text-red-500 font-bold hover:text-red-700"
                        >×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 3: Pallets, Date, Remarks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Total Pallets / Bins</label>
            <input
              type="number"
              className="w-full border p-2.5 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-400"
              value={formData.totalPallets}
              onChange={e => setFormData({ ...formData, totalPallets: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">First Arrival Date</label>
            <input
              type="date"
              className="w-full border p-2.5 rounded text-sm font-mono outline-none focus:ring-1 focus:ring-indigo-400"
              value={formData.arrivalDate}
              onChange={e => setFormData({ ...formData, arrivalDate: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Internal Remarks</label>
            <textarea
              className="w-full border p-2.5 rounded text-sm h-20 outline-none focus:ring-1 focus:ring-indigo-400"
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-20 py-2.5 rounded shadow-xl transition-all uppercase text-sm tracking-widest flex items-center gap-2"
          >
            <Save size={18} />
            {editingId ? "Update Chamber Details" : "Submit Chamber Info"}
          </button>
        </div>
      </form>
    </div>
  );
}