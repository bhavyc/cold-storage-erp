"use client";

import React, { useEffect, useState } from "react";
import { Trophy, AlertTriangle, TrendingUp, UserCheck, Search } from "lucide-react";

// STRICT TYPES
interface PartyRating {
  id: string;
  code: string;
  name: string;
  totalInward: number;
  currentBal: number;
  outstanding: number;
  rating: string;
  color: "green" | "yellow" | "red";
}

export default function PartyRatingPage() {
  const [data, setData] = useState<PartyRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchRatings() {
      try {
        const res = await fetch("/api/dashboard/party-rating");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Rating fetch failed");
      } finally {
        setLoading(false);
      }
    }
    fetchRatings();
  }, []);

  // if (loading) return <div className="p-10 text-center text-blue-800 font-bold">Analysing Party Performance...</div>;

  // Filter Data for Leaderboards
  const filteredData = data.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const topParties = filteredData.filter(p => p.color === "green");
  const midParties = filteredData.filter(p => p.color === "yellow");
  const lowParties = filteredData.filter(p => p.color === "red");

  return (
    <div className="space-y-6">
      {/* Header with Search (Visual Softech Style) */}
      <div className="bg-[#4a4ea3] text-white p-4 rounded-t-lg flex justify-between items-center">
        <h2 className="font-bold flex items-center gap-2 uppercase tracking-wide">
          <UserCheck size={20} /> Party Wise Rating Analysis
        </h2>
        <div className="flex bg-white/20 rounded px-3 py-1 items-center gap-2">
          <Search size={14} />
          <input 
            type="text" 
            placeholder="Search Party Name..." 
            className="bg-transparent border-none text-xs outline-none placeholder:text-white/60"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Rating Leaderboards (Image 42 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GREEN: ABOVE 75% */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="bg-green-600 text-white p-3 font-bold text-xs flex justify-between items-center uppercase">
            <span>Above 75% Leaderboard</span>
            <Trophy size={16} />
          </div>
          <div className="p-2 h-[400px] overflow-y-auto space-y-2">
            {topParties.map(p => (
              <div key={p.id} className="p-3 bg-green-50 border border-green-100 rounded-md flex justify-between items-center transition-all hover:shadow-md">
                <div>
                  <p className="font-bold text-xs text-green-900">{p.name}</p>
                  <p className="text-[10px] text-green-600">Code: {p.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">{p.totalInward} Bags</p>
                  <p className="text-[9px] text-green-500 italic">Excellent Business</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* YELLOW: 25% TO 75% */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="bg-yellow-500 text-white p-3 font-bold text-xs flex justify-between items-center uppercase">
            <span>25% to 75% Leaderboard</span>
            <TrendingUp size={16} />
          </div>
          <div className="p-2 h-[400px] overflow-y-auto space-y-2">
            {midParties.map(p => (
              <div key={p.id} className="p-3 bg-yellow-50 border border-yellow-100 rounded-md flex justify-between items-center transition-all hover:shadow-md">
                <div>
                  <p className="font-bold text-xs text-yellow-900">{p.name}</p>
                  <p className="text-[10px] text-yellow-600">Code: {p.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">{p.totalInward} Bags</p>
                  <p className="text-[9px] text-yellow-500 italic">Stable Business</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RED: BELOW 25% */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="bg-red-500 text-white p-3 font-bold text-xs flex justify-between items-center uppercase">
            <span>Below 25% Leaderboard</span>
            <AlertTriangle size={16} />
          </div>
          <div className="p-2 h-[400px] overflow-y-auto space-y-2">
            {lowParties.map(p => (
              <div key={p.id} className="p-3 bg-red-50 border border-red-100 rounded-md flex justify-between items-center transition-all hover:shadow-md">
                <div>
                  <p className="font-bold text-xs text-red-900">{p.name}</p>
                  <p className="text-[10px] text-red-600">Code: {p.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">{p.totalInward} Bags</p>
                  <p className="text-[9px] text-red-500 italic">Attention Required</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Outstanding Alert (Image 43 Credit Check Logic) */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-500" />
          <div>
            <h4 className="font-bold text-red-800 text-sm">Credit Risk Monitor</h4>
            <p className="text-xs text-red-600">Parties with high outstanding balance are automatically marked in the Below 25% list to block further Gate Passes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}