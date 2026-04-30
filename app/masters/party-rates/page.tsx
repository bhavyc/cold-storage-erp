"use client";

import React, { useEffect, useState } from "react";
import { Search, Plus, FileSpreadsheet, Printer, Edit, Trash2, Tag } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PartyRateListPage() {
  const router = useRouter();

  const [data, setData] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterParty, setFilterParty] = useState("All");
  const [filterItem, setFilterItem] = useState("All");
  const [filterUnit, setFilterUnit] = useState("All");

  // ✅ Fetch initial data safely
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, iRes, uRes, rRes] = await Promise.all([
          fetch("/api/masters/party"),
          fetch("/api/masters/items"),
          fetch("/api/masters/units"),
          fetch("/api/masters/party-rates"),
        ]);

        const pJson = await pRes.json();
        const iJson = await iRes.json();
        const uJson = await uRes.json();
        const rJson = await rRes.json();

        setParties(Array.isArray(pJson) ? pJson : pJson?.data || []);
        setItems(Array.isArray(iJson) ? iJson : iJson?.data || []);
        setUnits(Array.isArray(uJson) ? uJson : uJson?.data || []);
        setData(Array.isArray(rJson) ? rJson : rJson?.data || []);
      } catch (error) {
        console.error("Fetch error:", error);
        setParties([]);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Search handler (safe)
  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/masters/party-rates?partyId=${filterParty}&itemId=${filterItem}&unitId=${filterUnit}`
      );
      const result = await res.json();

      setData(Array.isArray(result) ? result : result?.data || []);
    } catch (error) {
      console.error("Search error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-xs animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="bg-[#5d5fb1] text-white p-3 rounded-t-lg flex justify-between items-center shadow-lg">
        <h2 className="font-bold uppercase flex items-center gap-2 tracking-widest">
          <Tag size={16} /> Party Item Rate Master
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/masters/party-rates/add")}
            className="bg-orange-500 hover:bg-orange-600 px-4 py-1 rounded font-bold shadow"
          >
            + Add Rates
          </button>
          <button className="bg-green-600 p-1.5 rounded">
            <FileSpreadsheet size={16} />
          </button>
          <button className="bg-red-500 p-1.5 rounded">
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 border rounded shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="font-bold text-gray-400 uppercase mb-1 block">
            Party Name
          </label>
          <select
            className="w-full border p-1.5 rounded bg-white font-bold text-indigo-700"
            value={filterParty}
            onChange={(e) => setFilterParty(e.target.value)}
          >
            <option value="All">All Parties</option>
            {Array.isArray(parties) &&
              parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.tradeName}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="font-bold text-gray-400 uppercase mb-1 block">
            Item Name
          </label>
          <select 
            className="w-full border p-1.5 rounded bg-white font-bold text-slate-700"
            value={filterItem}
            onChange={(e) => setFilterItem(e.target.value)}
          >
            <option value="All">All Items</option>
            {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
          </select>
        </div>

        <div>
          <label className="font-bold text-gray-400 uppercase mb-1 block">
            Unit Name
          </label>
          <select 
            className="w-full border p-1.5 rounded bg-white font-bold text-slate-700"
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
          >
            <option value="All">All Units</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <button
          onClick={handleSearch}
          className="bg-red-600 text-white py-1.5 rounded font-black uppercase shadow"
        >
          Search
        </button>
      </div>

      {/* DATA GRID */}
      <div className="bg-white border rounded shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f1f5f9] text-slate-700 uppercase font-black border-b text-[9px]">
            <tr>
              <th className="p-3 border-r">PARTY</th>
              <th className="p-3 border-r">ITEM</th>
              <th className="p-3 border-r">UNIT</th>
              <th className="p-3 border-r text-center">RENT</th>
              <th className="p-3 border-r text-center">CA RENT</th>
              <th className="p-3 border-r text-center">LABOUR</th>
              <th className="p-3 border-r text-center">CA LABOUR</th>
              <th className="p-3 border-r text-center">FREIGHT</th>
              <th className="p-3 border-r text-center">PERIOD</th>
              <th className="p-3 text-center">ACTION</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="p-10 text-center animate-pulse">
                  Syncing Rates...
                </td>
              </tr>
            ) : Array.isArray(data) && data.length > 0 ? (
              data.map((r, idx) => (
                <tr
                  key={idx}
                  className="border-b hover:bg-slate-50 transition-colors font-medium"
                >
                  <td className="p-3 border-r uppercase">
                    {r?.party?.tradeName || "-"}
                  </td>
                  <td className="p-3 border-r uppercase font-bold text-indigo-700">
                    {r?.item?.name || "-"}
                  </td>
                  <td className="p-3 border-r font-mono">
                    {r?.unit?.name || "-"}
                  </td>
                  <td className="p-3 border-r text-center font-black">
                    {Number(r?.csRent || 0)}
                  </td>
                  <td className="p-3 border-r text-center">
                    {Number(r?.caRent || 0)}
                  </td>
                  <td className="p-3 border-r text-center font-black text-green-600">
                    {Number(r?.csLab || 0)}
                  </td>
                  <td className="p-3 border-r text-center">
                    {Number(r?.caLab || 0)}
                  </td>
                  <td className="p-3 border-r text-center">
                    {Number(r?.freight || 0)}
                  </td>
                  <td className="p-3 border-r text-center bg-yellow-50">
                    {r?.period || "-"}
                  </td>
                  <td className="p-3 text-center text-blue-600 flex gap-2 justify-center">
                    <Edit size={14} className="cursor-pointer" />
                    <Trash2 size={14} className="text-red-400 cursor-pointer" />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="p-10 text-center text-gray-400">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
