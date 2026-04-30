"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Edit3, Save, ArrowLeft, RefreshCw, X, ChevronsUpDown, Info, SaveAll, CheckCircle2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

// --- SEARCHABLE SELECT ---
const SearchableSelect = ({ options, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<any>(null);

  const filtered = (options ?? []).filter((opt: any) =>
    opt.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const selectedOption = (options ?? []).find((opt: any) => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-slate-300 hover:border-indigo-400 p-1.5 rounded-md bg-white flex justify-between items-center cursor-pointer text-xs font-semibold transition-colors shadow-sm"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronsUpDown size={12} />
      </div>
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border shadow-2xl rounded-md">
          <input
            autoFocus
            className="w-full p-2.5 border-b outline-none font-medium text-indigo-700 bg-indigo-50/50 text-xs rounded-t-md"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-32 overflow-y-auto">
            {filtered.map((opt: any) => (
              <div
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className="p-2.5 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer font-medium text-xs border-b border-slate-100 last:border-0 transition-colors"
              >
                {opt.name}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-2 text-[10px] text-slate-400 text-center">
                No results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE ---
export default function UpdateMRDetailsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [masters, setMasters] = useState<any>({
    items: [],
    units: [],
    chambers: [],
  });
  const [loading, setLoading] = useState(true);
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [editState, setEditState] = useState<Record<string, any>>({});
  const [savingAll, setSavingAll] = useState(false);

  // LOAD ALL DATA
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, itemsRes, unitsRes, chambersRes] = await Promise.all([
        fetch("/api/inward/update-mr?all=true"),
        fetch("/api/masters/items"),
        fetch("/api/masters/units"),
        fetch("/api/masters/chambers"),
      ]);

      // Parse all responses safely
      const [recData, itemsData, unitsData, chambersData] = await Promise.all([
        recRes.json(),
        itemsRes.json(),
        unitsRes.json(),
        chambersRes.json(),
      ]);

      // Guard: API might return { error: "..." } or wrap in { data: [...] }
      const rows = Array.isArray(recData)
        ? recData
        : Array.isArray(recData?.data)
        ? recData.data
        : [];

      setRecords(rows);
      setMasters({
        items:    Array.isArray(itemsData)    ? itemsData    : itemsData?.data    ?? [],
        units:    Array.isArray(unitsData)    ? unitsData    : unitsData?.data    ?? [],
        chambers: Array.isArray(chambersData) ? chambersData : chambersData?.data ?? [],
      });

      // Build edit state from rows
      const initialEditState: Record<string, any> = {};
      rows.forEach((r: any) => {
        initialEditState[r.id] = { ...r };
      });
      setEditState(initialEditState);
    } catch (err) {
      console.error("loadData error:", err);
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle editing for a row
  const toggleEditing = (id: string) => {
    setEditingRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const cancelEditing = (id: string) => {
    // Reset editState for this row back to original
    const original = records.find((r) => r.id === id);
    if (original) {
      setEditState((prev) => ({ ...prev, [id]: { ...original } }));
    }
    setEditingRows((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Detect dirty (modified) rows
  const dirtyRowIds = useMemo(() => {
    return records
      .filter((row) => {
        const es = editState[row.id];
        if (!es) return false;
        return JSON.stringify(es) !== JSON.stringify(row);
      })
      .map((row) => row.id);
  }, [records, editState]);

  // SAVE A SINGLE ROW
  const handleSingleUpdate = async (id: string) => {
    const loadId = toast.loading("Saving changes...");
    try {
      const res = await fetch("/api/inward/update-mr", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editState[id] }),
      });

      if (res.ok) {
        toast.success("Entry Updated!", { id: loadId });
        setEditingRows((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error ?? "Update failed!", { id: loadId });
      }
    } catch (err) {
      toast.error("Network error!", { id: loadId });
    }
  };

  // SAVE ALL DIRTY ROWS
  const handleSaveAll = async () => {
    if (dirtyRowIds.length === 0) {
      toast("No changes to save.", { icon: "ℹ️" });
      return;
    }
    setSavingAll(true);
    const loadId = toast.loading(`Saving ${dirtyRowIds.length} record(s)...`);
    let successCount = 0;
    let failCount = 0;

    await Promise.all(
      dirtyRowIds.map(async (id) => {
        try {
          const res = await fetch("/api/inward/update-mr", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...editState[id] }),
          });
          if (res.ok) successCount++;
          else failCount++;
        } catch {
          failCount++;
        }
      })
    );

    if (failCount === 0) {
      toast.success(`All ${successCount} record(s) saved!`, { id: loadId });
    } else {
      toast.error(`${successCount} saved, ${failCount} failed.`, { id: loadId });
    }

    setEditingRows(new Set());
    setSavingAll(false);
    loadData();
  };

  const onInputChange = (id: string, field: string, value: any) => {
    setEditState((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const onLotChange = (id: string, field: string, value: any) => {
    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        lot: { ...prev[id]?.lot, [field]: value },
      },
    }));
  };

  return (
    <div className="space-y-6 text-sm animate-in fade-in duration-500 max-w-[100vw] overflow-hidden p-4">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg border border-indigo-800/50">
        <h2 className="font-bold uppercase flex items-center gap-3 tracking-widest text-sm">
          <RefreshCw size={18} className="text-indigo-300" /> Master Inward Correction
        </h2>
        <button
          onClick={() => router.push("/inward/mr-entry")}
          className="bg-white/10 hover:bg-white/20 px-5 py-2 rounded-lg font-bold uppercase flex items-center gap-2 transition-all text-xs tracking-wider"
        >
          <ArrowLeft size={14} /> Back to Entry
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-x-auto min-h-[600px] custom-scrollbar">
        <table className="w-full border-collapse text-left min-w-[2800px]">
          <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] tracking-wider sticky top-0 z-50 shadow-sm border-b border-slate-200">
            <tr>
              <th className="p-4 border-r border-indigo-200 bg-indigo-100 sticky left-0 z-50 text-indigo-900 w-28 text-center">LOT NO.</th>
              <th className="p-4 border-r border-slate-300 w-24 text-center">MR NO.</th>
              <th className="p-4 border-r border-slate-300 w-28 text-center">MR DATE</th>
              <th className="p-4 border-r border-slate-300 w-52">MERCHANT NAME</th>
              <th className="p-4 border-r border-slate-300 w-64 bg-yellow-50 text-indigo-900">ITEM</th>
              <th className="p-4 border-r border-slate-300 w-48 bg-yellow-50 text-indigo-900">PACKING</th>
              <th className="p-4 border-r border-slate-300 w-24 text-center bg-red-50 text-red-700">QTY</th>
              <th className="p-4 border-r border-slate-300 w-32">VARIETY</th>
              <th className="p-4 border-r border-slate-300 w-48 bg-green-50 text-green-900">CHAMBER</th>
              <th className="p-4 border-r border-slate-300 w-16 text-center">FLR</th>
              <th className="p-4 border-r border-slate-300 w-16 text-center">PLR</th>
              <th className="p-4 border-r border-slate-300 w-24 text-center">UNIT WGT</th>
              <th className="p-4 border-r border-slate-300 w-32 font-mono">MARKA</th>
              <th className="p-4 border-r border-slate-300 w-32">BILLING TYPE</th>
              <th className="p-4 border-r border-slate-300 w-32 font-mono">TRUCK NO.</th>
              <th className="p-4 border-r border-slate-300 w-48 text-center">DELIVERY PERSON</th>
              <th className="p-4 border-r border-slate-300">REMARKS</th>
              <th className="p-4 text-center w-28 bg-indigo-50 sticky right-0 z-50">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={18}
                  className="p-24 text-center font-black text-indigo-700 animate-pulse text-lg uppercase tracking-[10px]"
                >
                  Retrieving Records...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={18} className="p-24 text-center text-slate-400 font-bold">
                  No records found.
                </td>
              </tr>
            ) : (
              records.map((row) => {
                const es = editState[row.id] ?? row;
                const isEditing = editingRows.has(row.id);
                const isDirty = dirtyRowIds.includes(row.id);

                return (
                  <tr
                    key={row.id}
                    className={`border-b transition-all text-xs ${
                      isEditing
                        ? isDirty
                          ? "bg-amber-50/80 shadow-[inset_0_0_0_1px_#fcd34d]"
                          : "bg-indigo-50/80 shadow-[inset_0_0_0_1px_#c7d2fe]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {/* LOT NO (sticky) */}
                    <td className="p-3 border-r border-slate-200 bg-slate-50/80 text-indigo-900 text-center font-bold sticky left-0 z-40 backdrop-blur-sm">
                      {row.lot?.lotNo}
                    </td>

                    {/* MR NO */}
                    <td className="p-3 border-r border-slate-200 text-center text-slate-500 font-mono text-[11px]">
                      {row.lot?.mrNo}
                    </td>

                    {/* MR DATE */}
                    <td className="p-1 border-r border-slate-200">
                      {isEditing ? (
                        <input
                          type="date"
                          className="w-full border border-indigo-200 p-1.5 rounded-md font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-[11px]"
                          value={es.mrDate?.split("T")[0] ?? ""}
                          onChange={(e) => onInputChange(row.id, "mrDate", e.target.value)}
                        />
                      ) : (
                        <span className="font-mono text-gray-500">
                          {formatDate(row.mrDate)}
                        </span>
                      )}
                    </td>

                    {/* PARTY */}
                    <td className="p-3 border-r border-slate-200 uppercase truncate max-w-[200px] text-slate-500">
                      {row.lot?.party?.tradeName}
                    </td>

                    {/* ITEM */}
                    <td className="p-1 border-r border-slate-200 bg-yellow-50/30">
                      {isEditing ? (
                        <SearchableSelect
                          options={masters.items}
                          value={es.lot?.itemId}
                          onChange={(val: any) => onLotChange(row.id, "itemId", val)}
                          placeholder="Select item"
                        />
                      ) : (
                        <span className="uppercase text-indigo-900">
                          {row.lot?.item?.name}
                        </span>
                      )}
                    </td>

                    {/* UNIT */}
                    <td className="p-1 border-r border-slate-200 bg-yellow-50/30">
                      {isEditing ? (
                        <SearchableSelect
                          options={masters.units}
                          value={es.lot?.unitId}
                          onChange={(val: any) => onLotChange(row.id, "unitId", val)}
                          placeholder="Select unit"
                        />
                      ) : (
                        <span className="uppercase text-slate-500">
                          {row.lot?.unit?.name}
                        </span>
                      )}
                    </td>

                    {/* QTY */}
                    <td className="p-1 border-r border-slate-200 bg-red-50/30">
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-full border border-red-200 bg-red-50 p-1.5 rounded-md text-center font-bold text-red-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                          value={es.lot?.receivedQty ?? ""}
                          onChange={(e) =>
                            onLotChange(row.id, "receivedQty", parseInt(e.target.value) || 0)
                          }
                        />
                      ) : (
                        <span className="text-red-700 text-sm font-black">
                          {row.lot?.receivedQty}
                        </span>
                      )}
                    </td>

                    {/* VARIETY */}
                    <td className="p-1 border-r border-slate-200">
                      {isEditing ? (
                        <input
                          className="w-full border border-slate-300 p-1.5 rounded-md font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all uppercase text-[11px]"
                          value={es.lot?.variety ?? ""}
                          onChange={(e) =>
                            onLotChange(row.id, "variety", e.target.value.toUpperCase())
                          }
                        />
                      ) : (
                        <span className="italic text-gray-400">
                          {row.lot?.variety || "-"}
                        </span>
                      )}
                    </td>

                    {/* CHAMBER */}
                    <td className="p-1 border-r border-slate-200 bg-green-50/30">
                      {isEditing ? (
                        <SearchableSelect
                          options={masters.chambers}
                          value={es.lot?.chamberId}
                          onChange={(val: any) => onLotChange(row.id, "chamberId", val)}
                          placeholder="Select chamber"
                        />
                      ) : (
                        <span className="uppercase text-green-700">
                          {row.lot?.chamber?.name || "---"}
                        </span>
                      )}
                    </td>

                    {/* FLOOR */}
                    <td className="p-1 border-r border-slate-200">
                      {isEditing ? (
                        <input
                          type="text"
                          className="w-full border border-slate-300 p-1.5 rounded-md text-center font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                          value={es.lot?.floor ?? ""}
                          onChange={(e) => onLotChange(row.id, "floor", e.target.value)}
                        />
                      ) : (
                        <span>{row.lot?.floor ?? "-"}</span>
                      )}
                    </td>

                    {/* POLE */}
                    <td className="p-1 border-r border-slate-200">
                      {isEditing ? (
                        <input
                          type="text"
                          className="w-full border border-slate-300 p-1.5 rounded-md text-center font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                          value={es.lot?.pole ?? ""}
                          onChange={(e) => onLotChange(row.id, "pole", e.target.value)}
                        />
                      ) : (
                        <span>{row.lot?.pole ?? "-"}</span>
                      )}
                    </td>

                    {/* UNIT WEIGHT */}
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        disabled={!isEditing}
                        className="w-full p-1.5 text-center bg-transparent font-medium outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-md transition-all disabled:opacity-70"
                        value={es.lot?.perUnitWgt ?? ""}
                        onChange={(e) => onLotChange(row.id, "perUnitWgt", e.target.value)}
                      />
                    </td>

                    {/* MARKA */}
                    <td className="p-1 border-r border-slate-200">
                      {isEditing ? (
                        <input
                          className="w-full border border-slate-300 p-1.5 rounded-md font-medium uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-[11px]"
                          value={es.lot?.marka ?? ""}
                          onChange={(e) =>
                            onLotChange(row.id, "marka", e.target.value.toUpperCase())
                          }
                        />
                      ) : (
                        <span className="font-mono">{row.lot?.marka ?? "-"}</span>
                      )}
                    </td>

                    {/* BILLING TYPE */}
                    <td className="p-1 border-r border-slate-200">
                      <select
                        disabled={!isEditing}
                        className="w-full p-1.5 bg-transparent font-medium border border-transparent focus:border-slate-300 focus:bg-white rounded-md outline-none transition-all disabled:opacity-70 text-[11px]"
                        value={es.billingType ?? ""}
                        onChange={(e) => onInputChange(row.id, "billingType", e.target.value)}
                      >
                        <option value="Nill Lot Bill">Nill Lot Bill</option>
                        <option value="Monthly Bill">Monthly Bill</option>
                        <option value="Weekly Bill">Weekly Bill</option>
                        <option value="Fixed Rate">Fixed Rate</option>
                      </select>
                    </td>

                    {/* TRUCK NO */}
                    <td className="p-1 border-r border-slate-200">
                      <input
                        disabled={!isEditing}
                        className="w-full p-1.5 font-mono uppercase bg-transparent font-medium border border-transparent focus:border-slate-300 focus:bg-white rounded-md outline-none transition-all disabled:opacity-70 text-[11px]"
                        value={es.truckNo ?? ""}
                        onChange={(e) => onInputChange(row.id, "truckNo", e.target.value)}
                      />
                    </td>

                    {/* DELIVERY PERSON */}
                    <td className="p-1 border-r border-slate-200 text-center">
                      <input
                        disabled={!isEditing}
                        className="w-full p-1.5 uppercase bg-transparent font-medium border border-transparent focus:border-slate-300 focus:bg-white rounded-md outline-none transition-all disabled:opacity-70 text-[11px]"
                        value={es.deliveryPerson ?? ""}
                        onChange={(e) =>
                          onInputChange(row.id, "deliveryPerson", e.target.value)
                        }
                      />
                    </td>

                    {/* REMARKS */}
                    <td className="p-1 border-r border-slate-200">
                      <input
                        disabled={!isEditing}
                        className="w-full p-1.5 italic bg-transparent border border-transparent focus:border-slate-300 focus:bg-white rounded-md outline-none transition-all disabled:opacity-70 text-[11px]"
                        value={es.remarks ?? ""}
                        onChange={(e) => onInputChange(row.id, "remarks", e.target.value)}
                      />
                    </td>

                    {/* ACTION (sticky) */}
                    <td className="p-2 text-center bg-indigo-50/50 sticky right-0 z-40">
                      {isEditing ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleSingleUpdate(row.id)}
                            title="Save this row"
                            className="bg-green-600 text-white p-2 rounded-lg shadow active:scale-90"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            onClick={() => cancelEditing(row.id)}
                            title="Cancel editing"
                            className="bg-red-500 text-white p-2 rounded-lg shadow active:scale-90"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleEditing(row.id)}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-2 rounded-lg transition-all border border-indigo-100 shadow-sm"
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* SAVE ALL CHANGES BAR */}
      {dirtyRowIds.length > 0 && (
        <div className="sticky bottom-2 z-50 mx-2 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-3 rounded-xl shadow-2xl flex justify-between items-center border border-orange-300">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <SaveAll size={18} className="text-white" />
              </div>
              <div>
                <p className="font-black text-white text-xs uppercase tracking-wide">
                  {dirtyRowIds.length} Unsaved Change{dirtyRowIds.length > 1 ? "s" : ""}
                </p>
                <p className="text-white/70 text-[9px] font-medium">
                  Click Save All to apply all modifications at once
                </p>
              </div>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={savingAll}
              className="bg-white text-orange-600 font-black uppercase text-xs px-6 py-2.5 rounded-lg shadow-lg hover:bg-orange-50 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 size={16} />
              {savingAll ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="p-3 bg-[#1e293b] text-white rounded-lg flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-2 font-medium uppercase tracking-widest text-[10px]">
          <Info size={16} className="text-indigo-300" />
          Full inventory attributes are editable here. Click the edit icon on multiple rows, then Save All.
        </div>
        <p className="font-bold text-slate-400 text-[9px] uppercase tracking-[4px]">
          Cold Storage Enterprise Master Log
        </p>
      </div>
    </div>
  );
}
