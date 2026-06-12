"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit, Save, ArrowLeft, Users, Shield, Loader2, Key, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";

export default function UserManagementPage() {
  const [view, setView] = useState<"list" | "add">("list");
  const [userList, setUserList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const initialForm = {
    name: "",
    username: "",
    password: "",
    role: "OPERATOR",
    status: true,
  };
  const [formData, setFormData] = useState(initialForm);
  const [managerLevel, setManagerLevel] = useState<string>("3");

  // 1. FETCH DATA
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUserList(data || []);
    } catch (err) {
      toast.error("Users load karne mein problem aayi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 2. SAVE OR UPDATE
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username) {
      return toast.error("Full Name aur Username zaroori hain!");
    }
    if (!editingId && !formData.password) {
      return toast.error("Naye user ke liye password mandatory hai!");
    }

    setIsSaving(true);
    const toastId = toast.loading(editingId ? "User details update ho rahi hain..." : "Naya user create ho raha hai...");

    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/admin/users/${editingId}` : "/api/admin/users";

    try {
      // Don't send empty password string when editing (means no password update)
      const payload: any = { ...formData };
      if (editingId && !payload.password) {
        delete payload.password;
      }
      if (payload.role === "MANAGER") {
        payload.name = `[M${managerLevel}] ${payload.name}`;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(editingId ? "User details updated!" : "Staff user successfully registered!", { id: toastId });
        setView("list");
        setEditingId(null);
        setFormData(initialForm);
        setManagerLevel("3");
        fetchUsers();
      } else {
        toast.error(result.error || "Operation failed", { id: toastId });
      }
    } catch (err) {
      toast.error("Network Error!", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // 3. EDIT TRIGGER
  const handleEdit = (user: any) => {
    setEditingId(user.id);
    let cleanName = user.name;
    let level = "3";
    if (user.name.startsWith("[M1] ")) {
      cleanName = user.name.substring(5);
      level = "1";
    } else if (user.name.startsWith("[M2] ")) {
      cleanName = user.name.substring(5);
      level = "2";
    } else if (user.name.startsWith("[M3] ")) {
      cleanName = user.name.substring(5);
      level = "3";
    }
    setFormData({
      name: cleanName,
      username: user.username,
      password: "", // keep empty unless updating password
      role: user.role,
      status: user.status,
    });
    setManagerLevel(level);
    setView("add");
  };

  // 4. TOGGLE STATUS
  const handleToggleStatus = async (user: any) => {
    const updatedStatus = !user.status;
    const toastId = toast.loading(`${user.name} ka status update ho raha hai...`);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: updatedStatus }),
      });

      if (res.ok) {
        toast.success("User status changed successfully", { id: toastId });
        fetchUsers();
      } else {
        toast.error("Failed to change user status", { id: toastId });
      }
    } catch (err) {
      toast.error("Network Error!", { id: toastId });
    }
  };

  // 5. DELETE LOGIC
  const handleDelete = async (user: any) => {
    if (!confirm(`Kya aap user "${user.name}" (${user.username}) ko permanently delete karna chahte hain?`)) return;

    const toastId = toast.loading("User delete ho raha hai...");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("User deleted successfully!", { id: toastId });
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Delete failed", { id: toastId });
      }
    } catch (err) {
      toast.error("Connection error!", { id: toastId });
    }
  };

  if (view === "list") {
    return (
      <div className="space-y-4 text-xs animate-in fade-in duration-500">
        {/* Header Ribbon */}
        <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg flex justify-between items-center shadow-lg border-b-4 border-indigo-400">
          <h2 className="font-bold uppercase tracking-widest flex items-center gap-2 italic">
            <Users size={18} /> Administrative | Staff User Registry
          </h2>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData(initialForm);
              setView("add");
            }}
            className="bg-orange-500 hover:bg-orange-600 px-6 py-1.5 rounded font-black shadow-md transition-all active:scale-95 text-[10px] uppercase"
          >
            + Create Staff Account
          </button>
        </div>

        {/* User Table */}
        <div className="bg-white border rounded-b-lg shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b font-black text-slate-600 uppercase text-[9px]">
              <tr>
                <th className="p-4 border-r w-16 text-center">SR.</th>
                <th className="p-4 border-r">Full Name</th>
                <th className="p-4 border-r">Username</th>
                <th className="p-4 border-r text-center w-36">Designation / Role</th>
                <th className="p-4 border-r text-center w-28">Status</th>
                <th className="p-4 border-r text-center w-40">Created At</th>
                <th className="p-4 text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center font-bold text-indigo-700 animate-pulse uppercase tracking-widest">
                    Loading User Database...
                  </td>
                </tr>
              ) : userList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-gray-400 italic">
                    No staff users found. Create one to begin.
                  </td>
                </tr>
              ) : (
                userList.map((user, idx) => (
                  <tr key={user.id} className="border-b hover:bg-indigo-50/30 transition-colors font-bold group">
                    <td className="p-4 border-r text-center text-gray-400 font-mono">{idx + 1}</td>
                    <td className="p-4 border-r font-black text-indigo-800 uppercase">
                      {user.name.startsWith("[M1] ") || user.name.startsWith("[M2] ") || user.name.startsWith("[M3] ")
                        ? user.name.substring(5)
                        : user.name}
                    </td>
                    <td className="p-4 border-r text-slate-700 font-mono">{user.username}</td>
                    <td className="p-4 border-r text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        user.role === "ADMIN" ? "bg-purple-100 text-purple-700 border border-purple-300" :
                        user.role === "MANAGER" ? "bg-blue-100 text-blue-700 border border-blue-300" :
                        user.role === "OPERATOR" ? "bg-amber-100 text-amber-700 border border-amber-300" :
                        "bg-teal-100 text-teal-700 border border-teal-300"
                      }`}>
                        <Shield size={10} /> 
                        {user.role === "MANAGER"
                          ? `MANAGER (L${user.name.startsWith("[M1] ") ? "1" : user.name.startsWith("[M2] ") ? "2" : "3"})`
                          : user.role}
                      </span>
                    </td>
                    <td className="p-4 border-r text-center">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all hover:scale-105 active:scale-95 ${
                          user.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                        title="Toggle Active/Inactive Status"
                      >
                        {user.status ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                        {user.status ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="p-4 border-r text-center text-gray-400 font-mono">
                      {new Date(user.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:scale-125 transition-transform"
                          title="Edit User details"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-500 hover:scale-125 transition-transform"
                          title="Delete User account"
                        >
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

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in slide-in-from-bottom-4 text-xs pb-10">
      <button
        onClick={() => setView("list")}
        className="bg-red-500 text-white px-5 py-2 rounded-full font-black flex items-center gap-2 shadow-lg uppercase transition-all active:scale-95 text-[10px]"
      >
        <ArrowLeft size={16} /> Back to Registry
      </button>

      <div className="bg-[#4a4ea3] text-white p-4 rounded-t-2xl font-black uppercase text-center shadow-xl tracking-widest italic border-b-4 border-indigo-500">
        {editingId ? "Update Staff User Details" : "Create New Staff User Account"}
      </div>

      <form onSubmit={handleSave} className="bg-white p-10 border rounded-b-2xl shadow-2xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="font-black text-gray-500 uppercase block tracking-widest text-[9px]">Full Name *</label>
            <input
              required
              className="w-full border-2 border-slate-100 p-3 rounded-lg font-black text-indigo-700 outline-none focus:border-indigo-400 uppercase shadow-sm"
              placeholder="e.g. Ramesh Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label className="font-black text-gray-500 uppercase block tracking-widest text-[9px]">Username *</label>
            <input
              required
              disabled={!!editingId}
              className="w-full border-2 border-slate-100 p-3 rounded-lg font-black text-slate-700 outline-none focus:border-indigo-400 font-mono shadow-sm disabled:bg-slate-50 disabled:text-gray-400"
              placeholder="e.g. ramesh_operator"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, "") })}
            />
          </div>

          {/* User Role */}
          <div className="space-y-1">
            <label className="font-black text-gray-500 uppercase block tracking-widest text-[9px]">Access Role *</label>
            <select
              required
              className="w-full border-2 border-slate-100 p-3 rounded-lg bg-white font-bold outline-none focus:border-indigo-400 shadow-sm"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="OPERATOR">OPERATOR</option>
              <option value="GATEKEEPER">GATEKEEPER</option>
            </select>
          </div>

          {/* Manager Level (only when role is MANAGER) */}
          {formData.role === "MANAGER" && (
            <div className="space-y-1 animate-in slide-in-from-left-4 duration-300">
              <label className="font-black text-indigo-700 uppercase block tracking-widest text-[9px]">Manager Level *</label>
              <select
                required
                className="w-full border-2 border-indigo-100 p-3 rounded-lg bg-white font-bold outline-none focus:border-indigo-400 shadow-sm"
                value={managerLevel}
                onChange={(e) => setManagerLevel(e.target.value)}
              >
                <option value="1">Level 1 (Junior - Entry & View Only)</option>
                <option value="2">Level 2 (Mid-level - Entry & Edit)</option>
                <option value="3">Level 3 (Senior - Full Access except User Registry)</option>
              </select>
            </div>
          )}

          {/* Status */}
          <div className="space-y-1">
            <label className="font-black text-gray-500 uppercase block tracking-widest text-[9px]">Account Status</label>
            <select
              className="w-full border-2 border-slate-100 p-3 rounded-lg bg-white font-bold outline-none focus:border-indigo-400 shadow-sm"
              value={formData.status ? "Active" : "Inactive"}
              onChange={(e) => setFormData({ ...formData, status: e.target.value === "Active" })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Password (Optional when editing) */}
          <div className="md:col-span-2 space-y-1">
            <label className="font-black text-indigo-700 uppercase block tracking-widest text-[9px] flex items-center gap-1">
              <Key size={10} /> {editingId ? "Reset Password (Optional)" : "Password *"}
            </label>
            <input
              type="password"
              required={!editingId}
              className="w-full border-2 border-indigo-50 p-3 rounded-lg font-black outline-none focus:border-indigo-400 shadow-sm"
              placeholder={editingId ? "Naya password dalein agar change karna hai..." : "Min 6 characters recommended"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            {editingId && (
              <p className="text-[8px] text-gray-400 italic">
                Agar password badalna nahi chahte toh is field ko khali chhod dein.
              </p>
            )}
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {editingId ? "Update Staff Account" : "Register Staff Account"}
          </button>
        </div>
      </form>
    </div>
  );
}
