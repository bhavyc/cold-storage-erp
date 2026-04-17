"use client";

import React, { useEffect, useState } from "react";
import { Search, FileText, CheckCircle, Trash2 } from "lucide-react";

export default function PIBookPage() {
  const [piList, setPiList] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/billing/pi/summary").then(res => res.json()).then(setPiList);
  }, []);

  return (
    <div className="space-y-4 text-xs">
      <div className="bg-[#4a4ea3] text-white p-3 rounded-t-lg font-bold flex justify-between uppercase tracking-wider shadow">
        <span>PI Book | Proforma Invoice Summary</span>
      </div>

      <div className="bg-white border rounded shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f1f5f9] border-b font-bold text-slate-600 uppercase text-[9px]">
            <tr>
              <th className="p-3 border-r">Date</th><th className="p-3 border-r">PI No</th>
              <th className="p-3 border-r">Party Name</th><th className="p-3 border-r text-center">Qty</th>
              <th className="p-3 border-r text-right">Estimate Amt</th>
              <th className="p-3 text-center">Status</th><th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
             {/* List Logic here */}
             <tr><td colSpan={7} className="p-20 text-center text-gray-400 italic">No Proforma Invoices found.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}