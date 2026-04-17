"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Save, ArrowLeft, FileSpreadsheet, Printer, Search, Edit2 } from "lucide-react";
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
  qty: number;
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

  // 1. Search aur Editing States (Added)
  const [searchName, setSearchName] = useState("");
  const [searchHsn, setSearchHsn] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Form State ---
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    categoryId: "",
    hsnCode: "",
    gstRate: 18,
    opBal: 0
  });

  const [gridRows, setGridRows] = useState<ItemUnitRow[]>([
    { unitId: "", qty: 0, rentRate: 0, labourRate: 0, weight: 0, lotValue: 0, period: 0 }
  ]);

  // 2. Search Function (Added)
  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/masters/items?name=${searchName}&hsn=${searchHsn}`);
      const data = await res.json();
      setItems(data);
    } catch (error) {
      toast.error("Search fail ho gaya!");
    } finally {
      setLoading(false);
    }
  };

  // --- Initial Data Fetch ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, unitRes] = await Promise.all([
          fetch("/api/masters/category"),
          fetch("/api/masters/units")
        ]);
        setCategories(await catRes.json());
        setUnits(await unitRes.json());
        handleSearch(); // Initial list load
      } catch (err) {
        toast.error("Failed to load master data");
      }
    };
    fetchData();
  }, []);

  // 3. Delete Function (Added)
  const handleDelete = async (id: string) => {
    if (!confirm("Bhai, kya sach mein delete karna hai?")) return;
    const res = await fetch(`/api/masters/items/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Item saaf kar diya gaya!");
      handleSearch(); 
    } else {
      toast.error("Maal (Lots) andar pada hai, delete nahi ho sakta!");
    }
  };

  // 4. Edit Function (Added)
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
    setGridRows(item.itemUnits.map((u: any) => ({
      unitId: u.unitId,
      qty: 0,
      rentRate: Number(u.rentRate),
      labourRate: Number(u.labourRate),
      weight: Number(u.weight),
      lotValue: Number(u.lotValue),
      period: u.period
    })));
    setView("add");
  };

  // 5. Modified handleSave (PATCH logic added)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) return toast.error("Select Category first");

    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/masters/items/${editingId}` : "/api/masters/items";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, unitConfigs: gridRows }),
      });

      if (response.ok) {
        toast.success(editingId ? "Update ho gaya!" : "Naya Item ban gaya!");
        setEditingId(null);
        // Form Reset
        setFormData({ code: "", name: "", categoryId: "", hsnCode: "", gstRate: 18, opBal: 0 });
        setGridRows([{ unitId: "", qty: 0, rentRate: 0, labourRate: 0, weight: 0, lotValue: 0, period: 0 }]);
        setView("list");
        handleSearch();
      } else {
        toast.error("Database save failed");
      }
    } catch (err) {
      toast.error("Connection error");
    }
  };

  const addRow = () => {
    setGridRows([...gridRows, { unitId: "", qty: 0, rentRate: 0, labourRate: 0, weight: 0, lotValue: 0, period: 0 }]);
  };

  const removeRow = (index: number) => {
    if (gridRows.length > 1) {
      setGridRows(gridRows.filter((_, i) => i !== index));
    }
  };

  const updateGrid = (index: number, field: keyof ItemUnitRow, value: string | number) => {
    const updated = [...gridRows];
    (updated[index] as any)[field] = value;
    setGridRows(updated);
  };

  // --- VIEW: LIST ---
  if (view === "list") {
    return (
      <div className="space-y-4">
        <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
          <h2 className="font-bold text-sm uppercase">Item Master</h2>
          <div className="flex gap-2">
            <button onClick={() => { setEditingId(null); setView("add"); }} className="bg-orange-500 p-1.5 rounded"><Plus size={18} /></button>
            <button className="bg-green-600 p-1.5 rounded"><FileSpreadsheet size={18} /></button>
            <button className="bg-red-600 p-1.5 rounded"><Printer size={18} /></button>
          </div>
        </div>
        
        {/* Search Bar Implementation */}
        <div className="bg-white p-4 border rounded shadow-sm grid grid-cols-5 gap-4">
          <input 
            className="border p-2 text-xs rounded" 
            placeholder="Search Item Name..." 
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <input 
            className="border p-2 text-xs rounded" 
            placeholder="HSN..." 
            value={searchHsn}
            onChange={(e) => setSearchHsn(e.target.value)}
          />
          <button 
            onClick={handleSearch}
            className="bg-orange-500 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2"
          >
            <Search size={14}/> SEARCH
          </button>
        </div>

        <div className="bg-white border rounded shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b font-bold text-slate-600 uppercase">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Item Code</th>
                <th className="p-3">Item Name</th>
                <th className="p-3">HSN Code</th>
                <th className="p-3">Unit Name</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center p-10 text-gray-400">Loading items...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-10 text-gray-400">No Data Found</td></tr>
              ) : (
                items.map((item: any) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{item.category?.name}</td>
                    <td className="p-3 font-bold">{item.code}</td>
                    <td className="p-3">{item.name}</td>
                    <td className="p-3">{item.hsnCode}</td>
                    <td className="p-3">{item.itemUnits?.[0]?.unit?.name}</td>
                    <td className="p-3 text-right flex justify-end gap-3 text-blue-600">
                      <button onClick={() => handleEdit(item)} className="hover:text-blue-800 flex items-center gap-1">
                        <Edit2 size={12} /> Edit
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 flex items-center gap-1">
                        <Trash2 size={12} /> Delete
                      </button>
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

  // --- VIEW: ENTRY ---
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex gap-2 mb-2">
        <button 
          onClick={() => { setView("list"); setEditingId(null); }} 
          className="bg-red-500 text-white px-4 py-1 rounded text-xs font-bold flex items-center gap-1"
        >
          <ArrowLeft size={14}/> Back
        </button>
      </div>

      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg font-bold text-sm uppercase tracking-wider shadow-md">
        {editingId ? "Edit Item" : "Item Master Entry"}
      </div>

      <div className="bg-white p-6 border rounded-b-lg shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Item Code</label>
            <input 
              className="w-full border p-2 rounded text-sm bg-slate-50 font-bold" 
              value={formData.code} 
              onChange={e => setFormData({...formData, code: e.target.value})}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Item Name</label>
            <input 
              className="w-full border p-2 rounded text-sm outline-none focus:border-indigo-500" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">Category</label>
            <select 
              className="w-full border p-2 rounded text-sm bg-white"
              value={formData.categoryId}
              onChange={e => setFormData({...formData, categoryId: e.target.value})}
            >
              <option value="">-- Select Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">HSN Code</label>
            <input className="w-full border p-2 rounded text-sm" value={formData.hsnCode} onChange={e => setFormData({...formData, hsnCode: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">GST Rate</label>
            <input type="number" className="w-full border p-2 rounded text-sm font-mono" value={formData.gstRate} onChange={e => setFormData({...formData, gstRate: parseFloat(e.target.value)})} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Op Bal (Optional)</label>
            <input className="w-full border p-2 rounded text-sm bg-slate-50" placeholder="0" value={formData.opBal} onChange={e => setFormData({...formData, opBal: parseFloat(e.target.value)})} />
          </div>
        </div>

        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="w-full text-[11px] border-collapse">
            <thead className="bg-[#b4b6e4] text-slate-800 uppercase font-bold">
              <tr>
                <th className="p-2 border border-slate-300 w-1/4">Item Unit</th>
                <th className="p-2 border border-slate-300">Qty/Pcs</th>
                <th className="p-2 border border-slate-300">Rent Rate</th>
                <th className="p-2 border border-slate-300">Labour Rate</th>
                <th className="p-2 border border-slate-300">Weight (in Kg)</th>
                <th className="p-2 border border-slate-300">Lot Value</th>
                <th className="p-2 border border-slate-300">Period</th>
                <th className="p-2 border border-slate-300 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {gridRows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="p-1 border border-slate-200">
                    <select 
                      className="w-full p-2 outline-none bg-transparent"
                      value={row.unitId}
                      onChange={e => updateGrid(index, "unitId", e.target.value)}
                    >
                      <option value="">Select Unit</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </td>
                  <td className="p-1 border border-slate-200"><input type="number" className="w-full p-2 text-center" value={row.qty} onChange={e => updateGrid(index, "qty", parseFloat(e.target.value))} /></td>
                  <td className="p-1 border border-slate-200"><input type="number" className="w-full p-2 text-center" value={row.rentRate} onChange={e => updateGrid(index, "rentRate", parseFloat(e.target.value))} /></td>
                  <td className="p-1 border border-slate-200"><input type="number" className="w-full p-2 text-center" value={row.labourRate} onChange={e => updateGrid(index, "labourRate", parseFloat(e.target.value))} /></td>
                  <td className="p-1 border border-slate-200"><input type="number" className="w-full p-2 text-center" value={row.weight} onChange={e => updateGrid(index, "weight", parseFloat(e.target.value))} /></td>
                  <td className="p-1 border border-slate-200"><input type="number" className="w-full p-2 text-center" value={row.lotValue} onChange={e => updateGrid(index, "lotValue", parseFloat(e.target.value))} /></td>
                  <td className="p-1 border border-slate-200"><input type="number" className="w-full p-2 text-center" value={row.period} onChange={e => updateGrid(index, "period", parseInt(e.target.value))} /></td>
                  <td className="p-1 border border-slate-200 text-center flex justify-center gap-2">
                    <button onClick={addRow} className="text-blue-500 font-bold text-lg">+</button>
                    <button onClick={() => removeRow(index)} className="text-red-500 font-bold text-lg">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center pt-4">
          <button 
            onClick={handleSave}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-12 py-2 rounded shadow-lg transition-all uppercase text-sm tracking-widest"
          >
            {editingId ? "Update" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}