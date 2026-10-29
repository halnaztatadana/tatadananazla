import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Users, CreditCard, Cpu, Activity, ShieldAlert, ArrowUpRight, Clock, UserCheck, XCircle } from "lucide-react";
import { store, formatRupiah } from "~/lib/store";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);
  if (!session.isAdmin) throw new Response("403 Forbidden", { status: 403 });

  const users = Array.from(store.profiles.values());
  const pendingUsers = users.filter((u) => !u.is_admin && u.verification_status === "pending");
  const proUsers = users.filter((u) => u.plan === "pro");
  const totalTx = Array.from(store.transactions.values());
  const totalVolume = totalTx.reduce((sum, t) => sum + t.amount, 0);
  const aiLogs = Array.from(store.aiLogs.values());
  const pendingPayments = Array.from(store.paymentTransactions.values()).filter(
    (p) => p.status === "pending"
  );

  return json({
    totalUsers: users.length,
    pendingUsersCount: pendingUsers.length,
    pendingUsers,
    proUsers: proUsers.length,
    totalTransactions: totalTx.length,
    totalVolume,
    totalAiCalls: aiLogs.length,
    pendingPaymentsCount: pendingPayments.length,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSessionContext(request);
  if (!session.isAdmin) throw new Response("403 Forbidden", { status: 403 });

  const formData = await request.formData();
  const intent = formData.get("intent");
  const targetUserId = String(formData.get("userId"));

  const target = store.profiles.get(targetUserId);
  if (!target) return json({ error: "User tidak ditemukan" }, { status: 404 });

  if (intent === "approve") {
    target.verification_status = "approved";
    target.updated_at = new Date().toISOString();
    for (const s of store.sessions.values()) {
      if (s.user_id === target.user_id) s.verification_status = "approved";
    }
    const magicToken = store.createMagicToken(target.user_id);
    return json({ success: true, verificationStatus: "approved", magicToken });
  }

  if (intent === "reject") {
    target.verification_status = "rejected";
    target.updated_at = new Date().toISOString();
    for (const s of store.sessions.values()) {
      if (s.user_id === target.user_id) s.verification_status = "rejected";
    }
    return json({ success: true, verificationStatus: "rejected" });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
}

export default function AdminOverviewPage() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">
          Ringkasan Metrik Sistem TataDana
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitoring status server, verifikasi pendaftaran akun, performa AI multimodal, dan transaksi pembayaran.
        </p>
      </div>

      {/* Metric Cards (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pengguna</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-display">
            {data.totalUsers} User
          </p>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            {data.proUsers} Berlangganan Pro
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">Menunggu Verifikasi</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2 font-display">
            {data.pendingUsersCount} Akun
          </p>
          <Link
            to="/admin/users"
            className="text-[11px] text-amber-700 hover:underline font-bold mt-1 block"
          >
            Review Antrean →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Volume Transaksi</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2 font-display">
            {formatRupiah(data.totalVolume)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Dari {data.totalTransactions} transaksi
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Panggilan AI</span>
            <Cpu className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-display">
            {data.totalAiCalls} Call
          </p>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            99.8% Sukses (Latency ~420ms)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Approval Midtrans</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2 font-display">
            {data.pendingPaymentsCount} Bayar
          </p>
          <Link
            to="/admin/payments"
            className="text-[11px] text-rose-600 hover:underline font-bold mt-1 block"
          >
            Review Sekarang →
          </Link>
        </div>
      </div>

      {/* Antrean Verifikasi Akun Pengguna Baru Langsung di Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>📋</span> Antrean Verifikasi Akun Pengguna Baru
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                data.pendingUsersCount > 0 ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-slate-100 text-slate-600"
              }`}>
                {data.pendingUsersCount} Menunggu
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Setujui (approve) atau tolak (reject) pendaftaran pengguna sebelum mereka dapat mengakses dashboard user.
            </p>
          </div>
          <Link to="/admin/users" className="text-xs font-bold text-rose-600 hover:underline">
            Buka Manajemen Pengguna →
          </Link>
        </div>

        {data.pendingUsersCount === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            ✓ Antrean verifikasi bersih. Seluruh pendaftaran akun telah diproses.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.pendingUsers.map((pu: any) => (
              <div key={pu.user_id} className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-sm text-slate-900">{pu.full_name}</div>
                    <div className="text-xs text-slate-600 font-mono">{pu.email || "-"}</div>
                    <div className="text-[11px] text-slate-500">{pu.phone_number || "Tanpa nomor HP"}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Pending
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60">
                  <fetcher.Form method="post" className="flex-1">
                    <input type="hidden" name="userId" value={pu.user_id} />
                    <input type="hidden" name="intent" value="approve" />
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm"
                    >
                      ✓ Setujui
                    </button>
                  </fetcher.Form>
                  <fetcher.Form method="post" className="flex-1">
                    <input type="hidden" name="userId" value={pu.user_id} />
                    <input type="hidden" name="intent" value="reject" />
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition"
                    >
                      ✕ Tolak
                    </button>
                  </fetcher.Form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <h4 className="font-bold text-sm text-slate-900">Kelola Pengguna</h4>
            <p className="text-xs text-slate-500 mt-1">Verifikasi akun, ubah paket Starter/Pro, atau Impersonasi</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-400" />
        </Link>

        <Link
          to="/admin/providers"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <h4 className="font-bold text-sm text-slate-900">AI Failover Matrix</h4>
            <p className="text-xs text-slate-500 mt-1">Konfigurasi Gemini, OpenAI, & DeepSeek</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-400" />
        </Link>

        <Link
          to="/admin/logs"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <h4 className="font-bold text-sm text-slate-900">Audit & Telemetry</h4>
            <p className="text-xs text-slate-500 mt-1">Pantau token AI, latency, dan audit trail</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-400" />
        </Link>
      </div>
    </div>
  );
}
