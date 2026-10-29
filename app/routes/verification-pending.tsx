import { useEffect, useState } from "react";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);

  if (!session.isAuthenticated || !session.user) {
    return redirect("/login");
  }

  // Admin should be in admin dashboard
  if (session.isAdmin) {
    return redirect("/admin");
  }

  return json({
    user: session.user,
    initialStatus: session.user.verification_status || "pending",
  });
}

export default function VerificationPendingPage() {
  const { user, initialStatus } = useLoaderData<typeof loader>();
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">(
    initialStatus as "pending" | "approved" | "rejected"
  );
  const [autoRedirectSec, setAutoRedirectSec] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // If already approved on initial render, start redirect timer
    if (status === "approved" && autoRedirectSec === null) {
      setAutoRedirectSec(2);
    }

    if (status === "approved") return;

    // Real-time polling to auto-detect admin approval without password re-entry
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/verification-status");
        if (res.ok) {
          const data = await res.json();
          if (data.status === "approved") {
            setStatus("approved");
            setAutoRedirectSec(2);
            clearInterval(interval);
          } else if (data.status === "rejected") {
            setStatus("rejected");
            clearInterval(interval);
          }
        }
      } catch (err) {
        // Polling network fallback
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (autoRedirectSec === null) return;
    if (autoRedirectSec <= 0) {
      navigate("/dashboard");
      return;
    }

    const timer = setTimeout(() => {
      setAutoRedirectSec((s) => (s !== null ? s - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoRedirectSec, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
            TD
          </div>
          <span className="font-extrabold text-lg text-slate-900 font-display">
            Tata<span className="text-orange-500">Dana</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900">{user.full_name}</div>
            <div className="text-[11px] text-slate-500">{user.email}</div>
          </div>
          <Link
            to="/logout"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 flex items-center">
        <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div
            className={`p-8 text-center text-white ${
              status === "approved"
                ? "bg-gradient-to-br from-emerald-600 to-teal-600"
                : status === "rejected"
                ? "bg-gradient-to-br from-rose-600 to-red-600"
                : "bg-gradient-to-br from-amber-500 to-orange-500"
            }`}
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl mb-4 shadow-inner">
              {status === "approved" ? (
                <CheckCircle2 className="w-9 h-9 text-white" />
              ) : status === "rejected" ? (
                <XCircle className="w-9 h-9 text-white" />
              ) : (
                <Clock className="w-9 h-9 text-white animate-pulse" />
              )}
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-black/20 text-white font-extrabold text-[11px] uppercase tracking-wider mb-2">
              {status === "approved"
                ? "Akun Terverifikasi"
                : status === "rejected"
                ? "Pendaftaran Ditolak"
                : "Menunggu Persetujuan Admin"}
            </span>

            <h1 className="text-2xl font-black tracking-tight">
              {status === "approved"
                ? "Selamat! Akun Anda Telah Disetujui"
                : status === "rejected"
                ? "Pendaftaran Akun Ditolak"
                : "Akun Anda Sedang Diverifikasi"}
            </h1>
          </div>

          {/* Details Body */}
          <div className="p-8 space-y-6">
            <p className="text-xs text-slate-600 leading-relaxed text-center">
              {status === "approved"
                ? "Admin telah menyetujui akun Anda. Anda dapat langsung melanjutkan ke Dashboard User tanpa perlu memasukkan kata sandi kembali."
                : status === "rejected"
                ? "Mohon maaf, permohonan pendaftaran akun Anda ditolak oleh Administrator. Silakan hubungi dukungan jika Anda membutuhkan klarifikasi lebih lanjut."
                : "Pendaftaran Anda telah tersimpan. Untuk menjaga keamanan dan akurasi data keuangan, setiap akun pengguna baru harus disetujui terlebih dahulu oleh Admin."}
            </p>

            {/* Account Info Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Nama Pengguna</span>
                <span className="font-extrabold text-slate-900">{user.full_name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Email Akun</span>
                <span className="font-mono font-semibold text-slate-800">{user.email || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Status Akun</span>
                <span
                  className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-full ${
                    status === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : status === "rejected"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {status}
                </span>
              </div>
            </div>

            {/* Status Notifications & Actions */}
            {status === "pending" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-900 text-xs flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-orange-600 shrink-0 animate-spin" />
                  <div className="text-[11px] leading-relaxed">
                    <strong>Pendeteksian Otomatis Aktif</strong>: Halaman ini akan secara otomatis memperbarui status ketika disetujui oleh admin tanpa perlu refresh.
                  </div>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    Menghubungkan ke layanan verifikasi...
                  </div>
                </div>
              </div>
            )}

            {status === "approved" && (
              <div className="space-y-3">
                <Link
                  to="/dashboard"
                  className="w-full py-3.5 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/30 transition flex items-center justify-center gap-2"
                >
                  Masuk ke Dashboard User Sekarang
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {autoRedirectSec !== null && (
                  <p className="text-[11px] text-slate-500 text-center font-medium">
                    Mengarahkan otomatis dalam {autoRedirectSec} detik...
                  </p>
                )}
              </div>
            )}

            {status === "rejected" && (
              <div className="space-y-3">
                <Link
                  to="/logout"
                  className="w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition block text-center"
                >
                  Keluar dari Sesi
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        TataDana Finansial &copy; 2026 • Asisten Finansial Pribadi Indonesia
      </footer>
    </div>
  );
}
