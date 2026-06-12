"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Lock, User, Loader2, Key, ShieldAlert, X } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetForm, setResetForm] = useState({
    username: "",
    pin: "",
    newPassword: "",
  });
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetForm.username || !resetForm.pin || !resetForm.newPassword) {
      return toast.error("All fields are required!");
    }
    if (resetForm.pin.length !== 4) {
      return toast.error("Recovery PIN must be 4 digits!");
    }

    setIsResetting(true);
    const toastId = toast.loading("Resetting password...");
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resetForm),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Password successfully reset! You can now log in.", { id: toastId });
        setIsResetModalOpen(false);
        setResetForm({ username: "", pin: "", newPassword: "" });
      } else {
        toast.error(data.error || "Reset failed", { id: toastId });
      }
    } catch (err) {
      toast.error("Network Error!", { id: toastId });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Welcome back!");
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0f172a] overflow-hidden z-[9999]">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="relative w-full max-w-md p-8">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-600/30">
              <Lock className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-blue-200/60 font-medium">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-blue-100 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-blue-400 group-focus-within:text-blue-300 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="admin_user"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-blue-100 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-blue-400 group-focus-within:text-blue-300 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none group overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In to ERP"
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer"></div>
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/10 text-center space-y-4">
            <p className="text-blue-200/60 text-sm">
              Don't have an account?{" "}
              <button 
                onClick={() => router.push("/admin/register")}
                className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4"
              >
                Register Admin
              </button>
            </p>
            <p className="text-blue-200/60 text-sm">
              <button 
                onClick={() => setIsResetModalOpen(true)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
              >
                Forgot Password?
              </button>
            </p>
            <p className="text-blue-200/40 text-xs">
              Cold Storage ERP v2.0 &bull; Secure Access Only
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/80 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#1e293b] border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-2 rounded-full"
            >
              <X size={16} />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 mb-3 shadow-lg shadow-indigo-600/30">
                <Key className="text-white w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Password Recovery</h2>
              <p className="text-indigo-200/60 text-xs font-medium">Reset password using Recovery PIN</p>
            </div>

            {/* Note block (Option C) */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex gap-3">
              <ShieldAlert className="text-amber-500 shrink-0 w-5 h-5 animate-pulse" />
              <p className="text-[10px] text-amber-200/80 leading-relaxed font-bold text-left">
                NOTE: Only Admin passwords can be reset via the Recovery PIN. Staff accounts (Managers, Operators, Gatekeepers) must contact the Admin.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-semibold text-slate-400 ml-1">Username *</label>
                <input
                  type="text"
                  required
                  value={resetForm.username}
                  onChange={(e) => setResetForm({ ...resetForm, username: e.target.value })}
                  className="block w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs"
                  placeholder="admin"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-semibold text-slate-400 ml-1">4-Digit Recovery PIN *</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  pattern="[0-9]{4}"
                  value={resetForm.pin}
                  onChange={(e) => setResetForm({ ...resetForm, pin: e.target.value.replace(/\D/g, "") })}
                  className="block w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-center font-black tracking-widest text-xs"
                  placeholder="8888"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-semibold text-slate-400 ml-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                  className="block w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 text-xs"
              >
                {isResetting ? "Updating Password..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
