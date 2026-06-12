"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 text-red-600 mb-6">
          <ShieldAlert size={44} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          Access Denied
        </h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          You do not have the required permissions or credentials to access this page. Please contact your system administrator or log in with a different account.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-200"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/admin/login"
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
          >
            Sign In Again
          </Link>
        </div>
      </div>
    </div>
  );
}
