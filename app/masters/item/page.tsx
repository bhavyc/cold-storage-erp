"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Save, ArrowLeft, FileSpreadsheet, Printer, Search, Edit2, Loader2, Info } from "lucide-react";
import { toast } from "react-hot-toast";

// --- Types ---
interface Unit {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface ItemUnitRow {
  unitId: string;
  rentRate: number;
  labourRate: number;
  weight: number;
  lotValue: number;
  period: number;
}

export default function ItemMasterPage() {
  const [view, setView] = useState<"list" | "add">("list");
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [items, setItems] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Search aur Editing States
  const [searchName, setSearchName] = useState("");
  const [searchHsn, setSearchHsn] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    categoryId: "",
    hsnCode: "",
    gstRate: 18,
    opBal: 0
  });

  const [gridRows, setGridRows] = useState<ItemUnitRow[]>([
    { unitId: "", rentRate: 0, labourRate: 0, weight: 0, lotValue: 0, period: 0 }
  ]);

  // 1. SEARCH FUNCTION
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/masters/items?name=${searchName}&hsn=${searchHsn}`);
      const data = await res.json();
      setItems(data || []);
    } catch (error) {
      toast.error("Search fail ho gaya!");
    } finally {
      setLoading(false);
    }
  }, [searchName, searchHsn]);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, unitRes] = await Promise.all([
          fetch("/api/masters/category"),
          fetch("/api/masters/units")
        ]);
        setCategories(await catRes.json());
        setUnits(await unitRes.json());
        handleSearch();
      } catch (err) {
        toast.error("Failed to load master data");
      }
    };
    fetchData();
  }, []);

  // 2. DELETE ITEM
  const handleDelete = async (id: string) => {
    if (!confirm("Bhai, kya sach mein delete karna hai?")) return;
    const loadId = toast.loading("Deleting item...");
    try {
      const res = await fetch(`/api/masters/items/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (res.ok) {
        toast.success("Item successfully deleted!", { id: loadId });
        handleSearch(); 
      } else {
        toast.error(result.error || "Pehle stock check karein!", { id: loadId });
      }
    } catch (err) {
      toast.error("Network Error", { id: loadId });
    }
  };

  // 3. EDIT TRIGGER (Populate Full Object)
  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      code: item.code,
      name: item.name,
      categoryId: item.categoryId,
      hsnCode: item.hsnCode || "",
      gstRate: Number(item.gstRate),
      opBal: 0
    });
    // Grid mein saare packaging configs load karna
    setGridRows(item.itemUnits.map((u: any) => ({
      unitId: u.unitId,
      rentRate: Number(u.rentRate),
      labourRate: Number(u.labourRate),
      weight: Number(u.weight),
      lotValue: Number(u.lotValue),
      period: u.period
    })));
    setView("add");
  };

  // 4. SAVE OR UPDATE
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.name || !formData.code) {
      return toast.error("Kripya saari mandatory fields bharein!");
    }
    if (gridRows.some(r => !r.unitId)) {
      return toast.error("Kam se kam ek Unit (Bag/Peti) select karni hogi!");
    }

    setIsSaving(true);
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/masters/items/${editingId}` : "/api/masters/items";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, unitConfigs: gridRows }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(editingId ? "Item details updated!" : "New Item created!");
        setEditingId(null);
        // Reset and back to list
        setView("list");
        handleSearch();
      } else {
        toast.error(result.error || "Save failed");
      }
    } catch (err) {
      toast.error("Server Connection Error");
    } finally {
      setIsSaving(false);
    }
  };

  // Grid row management
  const addRow = () => {
    setGridRows([...gridRows, { unitId: "", rentRate: 0, labourRate: 0, weight: 0, lotValue: 0, period: 0 }]);
  };

  const removeRow = (index: number) => {
    if (gridRows.length > 1) {
      setGridRows(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateGrid = (index: number, field: keyof ItemUnitRow, value: any) => {
    setGridRows(prev => prev.map((row, i) => 
      i === index ? { ...row, [field]: value } : row
    ));
  };

  // --- VIEW: LIST ---
  if (view === "list") {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
          <h2 className="font-bold text-sm uppercase flex items-center gap-2">
            <Plus size={18}/> Item Master Registry
          </h2>
          <div className="flex gap-2">
            <button onClick={() => { setEditingId(null); setView("add"); setFormData({code:"", name:"", categoryId:"", hsnCode:"", gstRate:18, opBal:0}); setGridRows([{ unitId: "", rentRate: 0, labourRate: 0, weight: 0, lotValue: 0, period: 0 }]); }} className="bg-orange-500 p-1.5 rounded hover:bg-orange-600 transition-all shadow"><Plus size={18} /></button>
            <button className="bg-green-600 p-1.5 rounded"><FileSpreadsheet size={18} /></button>
            <button className="bg-red-600 p-1.5 rounded"><Printer size={18} /></button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="bg-white p-6 border rounded shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Item Name</label>
            <input className="w-full border-2 border-slate-100 p-2 text-xs rounded outline-none focus:border-indigo-400" placeholder="Search Item..." value={searchName} onChange={(e) => setSearchName(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">HSN Code</label>
            <input className="w-full border-2 border-slate-100 p-2 text-xs rounded outline-none" placeholder="Search HSN..." value={searchHsn} onChange={(e) => setSearchHsn(e.target.value)} />
          </div>
          <button onClick={handleSearch} disabled={loading} className="bg-indigo-600 text-white text-xs font-black py-2.5 rounded shadow-md flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin" size={14}/> : <><Search size={14}/> SEARCH ITEM</>}
          </button>
        </div>

        <div className="bg-white border rounded shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8f9fa] border-b font-black text-slate-600 uppercase">
              <tr>
                <th className="p-4 border-r">Category</th>
                <th className="p-4 border-r w-32">Item Code</th>
                <th className="p-4 border-r">Item Name</th>
                <th className="p-4 border-r text-center">HSN Code</th>
                <th className="p-4 border-r text-center">Packaging (Base)</th>
                <th className="p-4 text-center w-32">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-20 text-center font-bold text-indigo-700 animate-pulse uppercase tracking-widest">Compiling Item Database...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center text-gray-400 italic">No records found. Click + to add.</td></tr>
              ) : (
                items.map((item: any) => (
                  <tr key={item.id} className="border-b hover:bg-indigo-50/30 transition-colors font-bold group">
                    <td className="p-4 border-r text-gray-500 uppercase">{item.category?.name}</td>
                    <td className="p-4 border-r font-black text-indigo-700">{item.code}</td>
                    <td className="p-4 border-r uppercase text-slate-800">{item.name}</td>
                    <td className="p-4 border-r text-center font-mono">{item.hsnCode || "-"}</td>
                    <td className="p-4 border-r text-center">
  <div className="flex flex-wrap justify-center gap-1">
    {item.itemUnits && item.itemUnits.length > 0 ? (
      item.itemUnits.map((u: any, idx: number) => (
        <span 
          key={idx} 
          className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[9px] font-black border border-indigo-100 uppercase"
        >
          {u.unit?.name}
        </span>
      ))
    ) : (
      <span className="text-gray-400 italic">NA</span>
    )}
  </div>
</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-4">
                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:scale-125 transition-transform"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:scale-125 transition-transform"><Trash2 size={16} /></button>
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

  // --- VIEW: ENTRY / EDIT ---
  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-in slide-in-from-right duration-400">
      <div className="flex gap-2">
        <button onClick={() => setView("list")} className="bg-red-500 text-white px-5 py-2 rounded text-xs font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all uppercase tracking-tighter">
          <ArrowLeft size={16}/> Back to Registry
        </button>
      </div>

      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg font-black text-sm uppercase tracking-widest shadow-md text-center italic">
        {editingId ? "Update Existing Item Configuration" : "New Item Master Entry"}
      </div>

      <div className="bg-white p-8 border rounded-b-lg shadow-2xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Item Code *</label>
            <input className="w-full border-2 border-slate-100 p-2.5 rounded text-sm bg-slate-50 font-black text-indigo-700 outline-none focus:border-indigo-400" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Item Description / Name *</label>
            <input className="w-full border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-400 font-bold uppercase" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Category *</label>
            <select className="w-full border-2 border-slate-100 p-2.5 rounded text-sm bg-white font-bold outline-none focus:border-indigo-400" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
              <option value="">-- Select Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">HSN Code</label>
            <input className="w-full border-2 border-slate-100 p-2.5 rounded text-sm font-mono" value={formData.hsnCode} onChange={e => setFormData({...formData, hsnCode: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Tax (GST Rate %)</label>
            <input type="number" className="w-full border-2 border-slate-100 p-2.5 rounded text-sm font-black text-blue-600" value={formData.gstRate} onChange={e => setFormData({...formData, gstRate: parseFloat(e.target.value) || 0})} />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Opening Bal (Initial)</label>
            <input type="number" className="w-full border-2 border-slate-100 p-2.5 rounded text-sm bg-slate-50" placeholder="0" value={formData.opBal} onChange={e => setFormData({...formData, opBal: parseFloat(e.target.value) || 0})} />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border-2 border-dashed border-slate-200">
           <p className="text-[10px] font-black text-indigo-700 mb-4 uppercase flex items-center gap-2 italic">
              <Info size={14}/> Unit-Wise Rate & Weight Configurations
           </p>
           <div className="overflow-x-auto rounded shadow-inner bg-white border">
            <table className="w-full text-[11px] border-collapse">
                <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-black">
                <tr>
                    <th className="p-3 border-r border-slate-300 w-1/4">Packaging Unit</th>
                    <th className="p-3 border-r border-slate-300 text-center">Rent Rate</th>
                    <th className="p-3 border-r border-slate-300 text-center">Labour Rate</th>
                    <th className="p-3 border-r border-slate-300 text-center">Weight (Kg)</th>
                    <th className="p-3 border-r border-slate-300 text-center">Lot Value</th>
                    <th className="p-3 border-r border-slate-300 text-center">Period</th>
                    <th className="p-3 text-center">Action</th>
                </tr>
                </thead>
                <tbody>
                {gridRows.map((row, index) => (
                    <tr key={index} className="hover:bg-indigo-50/50 transition-colors border-b">
                    <td className="p-2 border-r">
                        <select className="w-full p-1 outline-none bg-transparent font-bold text-slate-700" value={row.unitId} onChange={e => updateGrid(index, "unitId", e.target.value)}>
                        <option value="">-- Choose Unit --</option>
                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </td>
                    <td className="p-2 border-r"><input type="number" className="w-full p-1 text-center font-bold text-green-600 outline-none" value={row.rentRate} onChange={e => updateGrid(index, "rentRate", parseFloat(e.target.value) || 0)} /></td>
                    <td className="p-2 border-r"><input type="number" className="w-full p-1 text-center font-bold text-green-600 outline-none" value={row.labourRate} onChange={e => updateGrid(index, "labourRate", parseFloat(e.target.value) || 0)} /></td>
                    <td className="p-2 border-r"><input type="number" className="w-full p-1 text-center font-black text-red-500 outline-none" value={row.weight} onChange={e => updateGrid(index, "weight", parseFloat(e.target.value) || 0)} /></td>
                    <td className="p-2 border-r"><input type="number" className="w-full p-1 text-center outline-none" value={row.lotValue} onChange={e => updateGrid(index, "lotValue", parseFloat(e.target.value) || 0)} /></td>
                    <td className="p-2 border-r"><input type="number" className="w-full p-1 text-center outline-none" value={row.period} onChange={e => updateGrid(index, "period", parseInt(e.target.value) || 0)} /></td>
                    <td className="p-2 text-center">
                        <div className="flex justify-center gap-3">
                            <button onClick={addRow} className="text-blue-600 font-bold text-lg hover:scale-125 transition-transform">+</button>
                            <button onClick={() => removeRow(index)} className="text-red-500 font-bold text-lg hover:scale-125 transition-transform">×</button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
           </div>
        </div>

        <div className="flex justify-center pt-6">
          <button onClick={handleSave} disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white font-black px-24 py-3 rounded-lg shadow-2xl transition-all uppercase text-sm tracking-widest flex items-center gap-3 active:scale-95 disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
            {editingId ? "Update Item Configuration" : "Save New Item Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
