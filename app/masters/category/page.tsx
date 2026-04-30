"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit, Save, ArrowLeft, FileSpreadsheet, Printer, Layers, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

// --- Strict Types ---
interface Category {
  id: string;
  code: string;
  name: string;
  minLot: number | null;
  maxLot: number | null;
  minMrGpNo: number | null;
  maxMrGpNo: number | null;
}

export default function CategoryMasterPage() {
  const [view, setView] = useState<"list" | "entry">("list");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Category>>({
    code: "", name: "", minLot: null, maxLot: null, minMrGpNo: null, maxMrGpNo: null
  });

  // 1. FETCH LIST
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/masters/category");
      const data = await res.json();
      setCategories(data);
      
      // Auto-suggest next Category Code for New Entry only
      if (view === "entry" && !formData.id) {
        const lastCode = data.length > 0 ? Math.max(...data.map((c: any) => parseInt(c.code) || 0)) : 0;
        setFormData(prev => ({ ...prev, code: (lastCode + 1).toString() }));
      }
    } catch (err) {
      toast.error("Error loading categories");
    } finally {
      setLoading(false);
    }
  }, [view, formData.id]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // 2. SAVE OR UPDATE LOGIC
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return toast.error("Code and Name are mandatory!");

    setIsSaving(true);
    const isUpdate = !!formData.id; // Check if editing
    const url = isUpdate ? `/api/masters/category/${formData.id}` : "/api/masters/category";
    const method = isUpdate ? "PUT" : "POST"; // PUT for update, POST for create

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(isUpdate ? "Category updated successfully!" : "New Category created!");
        setView("list");
        setFormData({ code: "", name: "", minLot: null, maxLot: null, minMrGpNo: null, maxMrGpNo: null });
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch (err) {
      toast.error("Network Error! Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  // 3. DELETE LOGIC
  const handleDelete = async (id: string) => {
    if (!confirm("Bhai, kya sach mein ye Category delete karni hai?")) return;

    try {
      const res = await fetch(`/api/masters/category/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        toast.success("Category successfully deleted!");
        fetchCategories();
      } else {
        toast.error(data.error || "Could not delete category");
      }
    } catch (error) {
      toast.error("Server connection error!");
    }
  };

  // 4. EDIT TRIGGER
  const handleEdit = (cat: Category) => {
    setFormData({
      id: cat.id,
      code: cat.code,
      name: cat.name,
      minLot: cat.minLot,
      maxLot: cat.maxLot,
      minMrGpNo: cat.minMrGpNo,
      maxMrGpNo: cat.maxMrGpNo
    });
    setView("entry");
  };

  // --- UI LAYOUTS ---

  if (view === "list") {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
          <h2 className="font-bold text-sm uppercase flex items-center gap-2 tracking-widest">
            <Layers size={18}/> Category Master
          </h2>
          <div className="flex gap-2">
            <button 
                onClick={() => { 
                    setFormData({ code: "", name: "", minLot: null, maxLot: null, minMrGpNo: null, maxMrGpNo: null }); 
                    setView("entry"); 
                }} 
                className="bg-orange-500 p-1.5 rounded hover:bg-orange-600 transition-all shadow"
            >
                <Plus size={18} />
            </button>
            <button className="bg-green-600 p-1.5 rounded hover:bg-green-700 shadow"><FileSpreadsheet size={18} /></button>
            <button className="bg-red-600 p-1.5 rounded hover:bg-red-700 shadow"><Printer size={18} /></button>
          </div>
        </div>

        <div className="bg-white border rounded shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 border-b font-black text-slate-600 uppercase">
              <tr>
                <th className="p-4 border-r">Code</th>
                <th className="p-4 border-r">Category Name</th>
                <th className="p-4 border-r text-center">Min Lot</th>
                <th className="p-4 border-r text-center">Max Lot</th>
                <th className="p-4 border-r text-center">Min MR/GP No.</th>
                <th className="p-4 border-r text-center">Max MR/GP No.</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-20 text-center font-bold text-indigo-500 animate-pulse uppercase tracking-widest">Syncing Categories...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={7} className="p-20 text-center text-gray-400 italic">No categories found. Click + to add.</td></tr>
              ) : categories.map((cat) => (
                <tr key={cat.id} className="border-b hover:bg-indigo-50/40 transition-colors font-bold group">
                  <td className="p-4 border-r font-black text-indigo-700">{cat.code}</td>
                  <td className="p-4 border-r font-medium uppercase text-slate-700">{cat.name}</td>
                  <td className="p-4 border-r text-center text-gray-500">{cat.minLot ?? "Any"}</td>
                  <td className="p-4 border-r text-center text-gray-500">{cat.maxLot ?? "Any"}</td>
                  <td className="p-4 border-r text-center font-mono">{cat.minMrGpNo ?? "-"}</td>
                  <td className="p-4 border-r text-center font-mono">{cat.maxMrGpNo ?? "-"}</td>
                  <td className="p-4 text-center flex justify-center gap-4">
                    <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:scale-125 transition-transform"><Edit size={16}/></button>
                    <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:scale-125 transition-transform"><Trash2 size={16}/></button>
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
    <div className="max-w-4xl mx-auto space-y-4 animate-in slide-in-from-right duration-300">
      <div className="flex gap-2">
        <button onClick={() => setView("list")} className="bg-red-500 text-white px-5 py-2 rounded text-xs font-black flex items-center gap-2 shadow-lg uppercase tracking-tighter active:scale-95 transition-all">
          <ArrowLeft size={14}/> Back to List
        </button>
      </div>

      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg font-black text-sm uppercase shadow-md tracking-widest italic text-center">
        {formData.id ? "Update Existing Category" : "Create New Category Entry"}
      </div>

      <form onSubmit={handleSave} className="bg-white p-8 border rounded-b-lg shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category Code *</label>
          <input 
            required 
            className="w-full border-2 border-slate-100 p-2.5 rounded text-sm bg-slate-50 font-black text-indigo-700 outline-none focus:border-indigo-400 transition-all" 
            value={formData.code} 
            onChange={e => setFormData({...formData, code: e.target.value})}
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category Name *</label>
          <input 
            required 
            className="w-full border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-400 font-bold uppercase transition-all" 
            placeholder="e.g. FRUITS, VEGETABLES"
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min Lot Range</label>
          <input 
            type="number" 
            className="w-full border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-400" 
            placeholder="No Limit"
            value={formData.minLot ?? ""} 
            onChange={e => setFormData({...formData, minLot: e.target.value ? parseInt(e.target.value) : null})}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Lot Range</label>
          <input 
            type="number" 
            className="w-full border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-400" 
            placeholder="No Limit"
            value={formData.maxLot ?? ""} 
            onChange={e => setFormData({...formData, maxLot: e.target.value ? parseInt(e.target.value) : null})}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min MR/GP Number</label>
          <input 
            type="number" 
            className="w-full border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-400 font-mono" 
            value={formData.minMrGpNo ?? ""} 
            onChange={e => setFormData({...formData, minMrGpNo: e.target.value ? parseInt(e.target.value) : null})}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max MR/GP Number</label>
          <input 
            type="number" 
            className="w-full border-2 border-slate-100 p-2.5 rounded text-sm outline-none focus:border-indigo-400 font-mono" 
            value={formData.maxMrGpNo ?? ""} 
            onChange={e => setFormData({...formData, maxMrGpNo: e.target.value ? parseInt(e.target.value) : null})}
          />
        </div>

        <div className="md:col-span-2 flex justify-center pt-6">
          <button 
            type="submit"
            disabled={isSaving}
            className="bg-red-600 hover:bg-red-700 text-white font-black px-24 py-3 rounded-md shadow-xl transition-all uppercase text-sm tracking-widest flex items-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
            {formData.id ? "Update Category Data" : "Submit Category Data"}
          </button>
        </div>
      </form>
    </div>
  );
}
