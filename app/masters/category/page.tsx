"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Save, ArrowLeft, FileSpreadsheet, Printer, Layers } from "lucide-react";
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
  const [formData, setFormData] = useState<Partial<Category>>({
    code: "", name: "", minLot: null, maxLot: null, minMrGpNo: null, maxMrGpNo: null
  });

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/masters/category");
      const data = await res.json();
      setCategories(data);
      
      // Automation: Auto-suggest next Category Code if creating new
      if (view === "entry" && !formData.id) {
        const lastCode = data.length > 0 ? Math.max(...data.map((c: any) => parseInt(c.code))) : 0;
        setFormData(prev => ({ ...prev, code: (lastCode + 1).toString() }));
      }
    } catch (err) {
      toast.error("Error loading categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, [view]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Category Name is required");

    try {
      const res = await fetch("/api/masters/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("Category Details Saved!");
        setView("list");
      }
    } catch (err) {
      toast.error("Failed to save category");
    }
  };

  const handleDelete = async (id: string) => {
  if (!confirm("Bhai, kya sach mein ye Category delete karni hai?")) return;

  try {
    const res = await fetch(`/api/masters/category/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("Category saaf kar di gayi!");
      fetchCategories(); // List refresh karne ke liye function ko call karo
    } else {
      toast.error(data.error || "Kuch gadbad ho gayi!");
    }
  } catch (error) {
    toast.error("Network problem hai bhai!");
  }
};
  const handleEdit = (cat: Category) => {
    setFormData(cat);
    setView("entry");
  };

  // --- UI Layouts ---

  if (view === "list") {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
          <h2 className="font-bold text-sm uppercase flex items-center gap-2">
            <Layers size={18}/> Category Master
          </h2>
          <div className="flex gap-2">
            <button onClick={() => { setFormData({ code: "", name: "", minLot: null, maxLot: null, minMrGpNo: null, maxMrGpNo: null }); setView("entry"); }} className="bg-orange-500 p-1.5 rounded hover:bg-orange-600"><Plus size={18} /></button>
            <button className="bg-green-600 p-1.5 rounded hover:bg-green-700"><FileSpreadsheet size={18} /></button>
            <button className="bg-red-600 p-1.5 rounded hover:bg-red-700"><Printer size={18} /></button>
          </div>
        </div>

        <div className="bg-white border rounded shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b font-bold text-slate-600 uppercase">
              <tr>
                <th className="p-4 border-r">Category Code</th>
                <th className="p-4 border-r">Category Name</th>
                <th className="p-4 border-r text-center">Min Lot</th>
                <th className="p-4 border-r text-center">Max Lot</th>
                <th className="p-4 border-r text-center">Min MR/GP No.</th>
                <th className="p-4 border-r text-center">Max MR/GP No.</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b hover:bg-indigo-50/30 transition-colors">
                  <td className="p-4 border-r font-bold text-indigo-700">{cat.code}</td>
                  <td className="p-4 border-r font-medium uppercase">{cat.name}</td>
                  <td className="p-4 border-r text-center text-gray-700">{cat.minLot ?? "any"}</td>
                  <td className="p-4 border-r text-center text-gray-700">{cat.maxLot ?? "any"}</td>
                  <td className="p-4 border-r text-center">{cat.minMrGpNo ?? ""}</td>
                  <td className="p-4 border-r text-center">{cat.maxMrGpNo ?? ""}</td>
                  <td className="p-4 text-center flex justify-center gap-3">
                    <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:scale-110 transition-transform"><Edit size={16}/></button>
                    <button  onClick={() => handleDelete(cat.id)} className="text-red-500 hover:scale-110 transition-transform"><Trash2 size={16}/></button>
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
        <button onClick={() => setView("list")} className="bg-red-500 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-1">
          <ArrowLeft size={14}/> Back
        </button>
        <button className="bg-orange-500 text-white px-4 py-1.5 rounded text-xs font-bold shadow-sm">Add New Category</button>
      </div>

      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg font-bold text-sm uppercase shadow-md">
        Category Master | Entry
      </div>

      <form onSubmit={handleSave} className="bg-white p-8 border rounded-b-lg shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Category Code</label>
          <input 
            required 
            className="w-full border p-2.5 rounded text-sm bg-slate-50 font-bold outline-none focus:ring-1 focus:ring-indigo-500" 
            value={formData.code} 
            onChange={e => setFormData({...formData, code: e.target.value})}
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Category Name</label>
          <input 
            required 
            className="w-full border p-2.5 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-500" 
            placeholder="e.g. FRUITS, VEGETABLES"
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Min Lot</label>
          <input 
            type="number" 
            className="w-full border p-2.5 rounded text-sm outline-none" 
            placeholder="any"
            value={formData.minLot ?? ""} 
            onChange={e => setFormData({...formData, minLot: e.target.value ? parseInt(e.target.value) : null})}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Max Lot</label>
          <input 
            type="number" 
            className="w-full border p-2.5 rounded text-sm outline-none" 
            placeholder="any"
            value={formData.maxLot ?? ""} 
            onChange={e => setFormData({...formData, maxLot: e.target.value ? parseInt(e.target.value) : null})}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase font-mono tracking-tighter">Min Mr/Gp No.</label>
          <input 
            type="number" 
            className="w-full border p-2.5 rounded text-sm outline-none" 
            placeholder="any"
            value={formData.minMrGpNo ?? ""} 
            onChange={e => setFormData({...formData, minMrGpNo: e.target.value ? parseInt(e.target.value) : null})}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase font-mono tracking-tighter">Max Mr/Gp No.</label>
          <input 
            type="number" 
            className="w-full border p-2.5 rounded text-sm outline-none" 
            placeholder="any"
            value={formData.maxMrGpNo ?? ""} 
            onChange={e => setFormData({...formData, maxMrGpNo: e.target.value ? parseInt(e.target.value) : null})}
          />
        </div>

        <div className="md:col-span-2 flex justify-center pt-6">
          <button 
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-16 py-2.5 rounded-md shadow-lg transition-all uppercase text-sm tracking-widest flex items-center gap-2"
          >
            <Save size={18}/> Submit
          </button>
        </div>
      </form>
    </div>
  );
}