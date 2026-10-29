import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState } from "react";
import { Users, Search, Shield, UserCheck, ExternalLink, RefreshCw } from "lucide-react";
import { store, type Profile } from "~/lib/store";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);
  if (!session.isAdmin) {
    throw new Response("403 Forbidden", { status: 403 });
  }

  const users = Array.from(store.profiles.values()).map((p) => {
    const userTxs = Array.from(store.transactions.values()).filter((t) => t.user_id === p.user_id);
    const userWallets = Array.from(store.wallets.values()).filter((w) => w.user_id === p.user_id);
    return {
      ...p,
      txCount: userTxs.length,
      walletCount: userWallets.length,
    };
  });

  return json({ users });
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

  if (intent === "toggle_plan") {
    target.plan = target.plan === "starter" ? "pro" : "starter";
    target.updated_at = new Date().toISOString();
    return json({ success: true, newPlan: target.plan });
  }

  if (intent === "impersonate") {
    return json(
      { success: true, impersonateUserId: targetUserId },
      {
        headers: {
          "Set-Cookie": `tatadana_impersonate=${targetUserId}; Path=/; HttpOnly; SameSite=Lax`,
        },
      }
    );
  }

  return json({ error: "Invalid intent" }, { status: 400 });
}

export default function AdminUsersRoute() {
  const { users } = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState("");
  const fetcher = useFetcher();

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone_number && u.phone_number.includes(searchTerm)) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingUsers = users.filter((u) => u.verification_status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-rose-600" />
            Manajemen Pengguna & Verifikasi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Persetujuan pendaftaran user baru, pengelolaan paket, integrasi Telegram, dan fitur impersonasi.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, HP, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>
      </div>

      {/* PENDING ACCOUNTS VERIFICATION QUEUE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>⏳</span> Daftar Akun Menunggu Verifikasi
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                {pendingUsers.length} Menunggu
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Setujui pendaftaran agar user dapat masuk ke dashboard tanpa memasukkan kata sandi kembali.
            </p>
          </div>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            ✓ Tidak ada akun yang menunggu verifikasi saat ini. Seluruh pendaftaran telah diproses.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingUsers.map((pu) => (
              <div key={pu.user_id} className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-sm text-slate-900">{pu.full_name}</div>
                    <div className="text-xs text-slate-600 font-mono">{pu.email || "-"}</div>
                    <div className="text-[11px] text-slate-500">{pu.phone_number || "Tidak ada HP"}</div>
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

      {/* ALL USERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-800">Semua Pengguna Terdaftar ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Pengguna</th>
                <th className="py-3.5 px-5">Nomor HP / Telegram</th>
                <th className="py-3.5 px-5">Status Verifikasi</th>
                <th className="py-3.5 px-5">Paket Aktif</th>
                <th className="py-3.5 px-5">Transaksi</th>
                <th className="py-3.5 px-5 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((u) => {
                const isApproved = u.verification_status === "approved";
                const isPending = u.verification_status === "pending";
                const isRejected = u.verification_status === "rejected";
                return (
                <tr key={u.user_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                        {u.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{u.full_name}</div>
                        <div className="text-[11px] text-slate-400">{u.email || "No email"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="text-slate-800">{u.phone_number || "Belum verif"}</div>
                    <div className="text-[11px] text-slate-400">
                      TG: {u.telegram_user_id ? `🟢 ${u.telegram_user_id}` : "⚪ Belum sync"}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Disetujui
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span> Menunggu
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Ditolak
                      </span>
                    )}
                    {!isApproved && !isPending && !isRejected && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        -
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        u.plan === "pro"
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.plan}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="font-bold text-slate-700">{u.txCount} tx</span>
                    <span className="text-slate-400 text-[11px] ml-1.5">({u.walletCount} wallet)</span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isPending && (
                        <>
                          <fetcher.Form method="post">
                            <input type="hidden" name="userId" value={u.user_id} />
                            <input type="hidden" name="intent" value="approve" />
                            <button
                              type="submit"
                              className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                            >
                              ✓ Setujui
                            </button>
                          </fetcher.Form>
                          <fetcher.Form method="post">
                            <input type="hidden" name="userId" value={u.user_id} />
                            <input type="hidden" name="intent" value="reject" />
                            <button
                              type="submit"
                              className="px-2 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition"
                            >
                              ✕ Tolak
                            </button>
                          </fetcher.Form>
                        </>
                      )}
                      {isRejected && (
                        <fetcher.Form method="post">
                          <input type="hidden" name="userId" value={u.user_id} />
                          <input type="hidden" name="intent" value="approve" />
                          <button
                            type="submit"
                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                          >
                            Setujui Ulang
                          </button>
                        </fetcher.Form>
                      )}
                      <fetcher.Form method="post">
                        <input type="hidden" name="userId" value={u.user_id} />
                        <input type="hidden" name="intent" value="toggle_plan" />
                        <button
                          type="submit"
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          {u.plan === "starter" ? "Up to Pro" : "Down to Starter"}
                        </button>
                      </fetcher.Form>

                      <fetcher.Form method="post">
                        <input type="hidden" name="userId" value={u.user_id} />
                        <input type="hidden" name="intent" value="impersonate" />
                        <button
                          type="submit"
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors flex items-center gap-1"
                          title="Masuk sebagai user ini"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Impersonasi
                        </button>
                      </fetcher.Form>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
