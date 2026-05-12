"use client";

import React, { useEffect, useState } from "react";
import { 
  Plus, Layers, Search, Edit, Trash2, Loader2, 
  AlertCircle, ChevronRight, Save, X, Database
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function GroupMasterPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    reportType: "Balance Sheet",
    groupType: "Main Group"
  });

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/groups");
      const data = await res.json();
      setGroups(data || []);
    } catch (err) {
      toast.error("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleOpenModal = (group: any = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        code: group.code,
        name: group.name,
        reportType: group.reportType,
        groupType: group.groupType
      });
    } else {
      setEditingGroup(null);
      setFormData({
        code: "",
        name: "",
        reportType: "Balance Sheet",
        groupType: "MAIN GROUP"
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadId = toast.loading(editingGroup ? "Updating group..." : "Creating group...");
    
    try {
      const url = editingGroup 
        ? `/api/accounting/groups/${editingGroup.id}` 
        : "/api/accounting/groups";
      
      const res = await fetch(url, {
        method: editingGroup ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(editingGroup ? "Group updated!" : "Group created!", { id: loadId });
        setIsModalOpen(false);
        fetchGroups();
      } else {
        const err = await res.json();
        toast.error(err.error || "Operation failed", { id: loadId });
      }
    } catch (err) {
      toast.error("Server Error", { id: loadId });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    
    const loadId = toast.loading("Deleting group...");
    try {
      const res = await fetch(`/api/accounting/groups/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Group deleted!", { id: loadId });
        fetchGroups();
      } else {
        const err = await res.json();
        toast.error(err.error || "Delete failed", { id: loadId });
      }
    } catch (err) {
      toast.error("Server Error", { id: loadId });
    }
  };

  const seedStandardGroups = async () => {
    const standardGroups = [
      { code: "G01", name: "SUNDRY DEBTORS (PARTIES)", reportType: "Balance Sheet", groupType: "ASSET" },
      { code: "G02", name: "SUNDRY CREDITORS", reportType: "Balance Sheet", groupType: "LIABILITY" },
      { code: "G03", name: "Direct Expenses", reportType: "Profit & Loss", groupType: "MAIN GROUP" },
      { code: "G04", name: "DIRECT INCOMES (RENT)", reportType: "Profit & Loss", groupType: "INCOME" },
      { code: "G05", name: "INDIRECT EXPENSES (OFFICE)", reportType: "Profit & Loss", groupType: "EXPENSE" },
      { code: "G06", name: "DIRECT EXPENSES (LABOUR)", reportType: "Profit & Loss", groupType: "EXPENSE" },
      { code: "G07", name: "CASH IN HAND", reportType: "Balance Sheet", groupType: "ASSET" },
      { code: "G08", name: "BANK ACCOUNTS", reportType: "Balance Sheet", groupType: "ASSET" },
    ];

    const loadId = toast.loading("Seeding standard groups...");
    try {
      for (const group of standardGroups) {
        await fetch("/api/accounting/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(group)
        });
      }
      toast.success("Standard groups seeded successfully!", { id: loadId });
      fetchGroups();
    } catch (err) {
      toast.error("Seeding failed", { id: loadId });
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 text-xs">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#1e293b] text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest">Account Group Master</h1>
            <p className="text-[10px] text-slate-400">Manage financial hierarchies and reporting structures</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={seedStandardGroups}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded font-bold transition-all border border-slate-600"
          >
            <Database size={14} /> QUICK SEED
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded font-bold shadow-md transition-all active:scale-95"
          >
            <Plus size={16} /> ADD NEW GROUP
          </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by group name or code..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-100 rounded-lg outline-none focus:border-indigo-500 transition-all font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between">
          <span className="font-black text-indigo-900 uppercase">Total Groups</span>
          <span className="text-xl font-black text-indigo-600">{groups.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black text-[10px]">
            <tr>
              <th className="p-4 w-32">Group Code</th>
              <th className="p-4">Group Name</th>
              <th className="p-4">Report Type</th>
              <th className="p-4">Group Type</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="p-20 text-center text-slate-400 animate-pulse">Loading groups...</td></tr>
            ) : filteredGroups.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">No groups found.</td></tr>
            ) : filteredGroups.map((group) => (
              <tr key={group.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-4 font-black text-indigo-600 tracking-tighter">{group.code}</td>
                <td className="p-4 font-bold text-slate-700">{group.name}</td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                    group.reportType === "Balance Sheet" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-orange-50 text-orange-600 border border-orange-100"
                  )}>
                    {group.reportType}
                  </span>
                </td>
                <td className="p-4 text-slate-500 italic uppercase text-[10px]">{group.groupType}</td>
                <td className="p-4">
                  <div className="flex justify-center gap-3">
                    <button 
                      onClick={() => handleOpenModal(group)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-all"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(group.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-[#1e293b] p-4 text-white flex justify-between items-center">
              <h2 className="font-black uppercase tracking-widest flex items-center gap-2">
                {editingGroup ? <Edit size={16}/> : <Plus size={16}/>}
                {editingGroup ? "Edit Group" : "Create New Group"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:text-red-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Group Code</label>
                <input 
                  type="text" 
                  required
                  className="w-full border-2 border-slate-100 p-2 rounded-md font-bold uppercase outline-none focus:border-indigo-500"
                  placeholder="e.g., G01"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Group Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full border-2 border-slate-100 p-2 rounded-md font-bold outline-none focus:border-indigo-500"
                  placeholder="e.g., Direct Income"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Report Type</label>
                  <select 
                    className="w-full border-2 border-slate-100 p-2 rounded-md font-bold outline-none focus:border-indigo-500"
                    value={formData.reportType}
                    onChange={(e) => setFormData({...formData, reportType: e.target.value})}
                  >
                    <option value="Balance Sheet">Balance Sheet</option>
                    <option value="Profit & Loss">Profit & Loss</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Group Type</label>
                  <select 
                    className="w-full border-2 border-slate-100 p-2 rounded-md font-bold outline-none focus:border-indigo-500"
                    value={formData.groupType}
                    onChange={(e) => setFormData({...formData, groupType: e.target.value})}
                  >
                    <option value="MAIN GROUP">MAIN GROUP</option>
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="INCOME">INCOME</option>
                    <option value="EXPENSE">EXPENSE</option>
                    <option value="SUB GROUP">SUB GROUP</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-black uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} /> {editingGroup ? "UPDATE GROUP" : "SAVE GROUP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center gap-2 text-slate-400">
        <AlertCircle size={14} />
        <p className="italic">Groups define how ledgers are categorized in Balance Sheet and Profit & Loss reports.</p>
      </div>
    </div>
  );
}
