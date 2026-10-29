import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ShieldAlert, Activity, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { store, type AiLog, type AuditLog } from "~/lib/store";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);
  if (!session.isAdmin) throw new Response("403 Forbidden", { status: 403 });

  const aiLogs = Array.from(store.aiLogs.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const auditLogs = Array.from(store.auditLogs.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return json({ aiLogs, auditLogs });
}

export default function AdminLogsRoute() {
  const { aiLogs, auditLogs } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-rose-600" />
          AI Telemetry Logs & Audit Trail
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pantau performa pemanggilan model AI (latensi, konsumsi token, status) serta jejak audit privasi transaksi pengguna.
        </p>
      </div>

      {/* AI Telemetry Logs */}
      <div className="space-y-3">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-500" />
          Riwayat Pemanggilan AI Engine
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Waktu WIB</th>
                <th className="py-3 px-5">Provider</th>
                <th className="py-3 px-5">Tipe Input</th>
                <th className="py-3 px-5">Token Usage</th>
                <th className="py-3 px-5">Latensi</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {aiLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-5 text-slate-500">
                    {new Date(log.created_at).toLocaleTimeString("id-ID")}
                  </td>
                  <td className="py-3 px-5 font-bold text-slate-800">{log.provider}</td>
                  <td className="py-3 px-5">
                    <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                      {log.input_type}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-slate-600">
                    {log.prompt_tokens} in / {log.completion_tokens} out
                  </td>
                  <td className="py-3 px-5 font-bold text-slate-700">{log.latency_ms} ms</td>
                  <td className="py-3 px-5">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-extrabold ${
                        log.status === "success" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {log.status === "success" ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="space-y-3">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-rose-500" />
          Audit Trail Akses Data Pengguna (Data Protection)
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {auditLogs.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Waktu</th>
                  <th className="py-3 px-5">Admin ID</th>
                  <th className="py-3 px-5">Target User</th>
                  <th className="py-3 px-5">Tindakan</th>
                  <th className="py-3 px-5">Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 px-5 text-slate-500">{new Date(a.created_at).toLocaleString("id-ID")}</td>
                    <td className="py-3 px-5 font-bold">{a.admin_id}</td>
                    <td className="py-3 px-5 font-bold text-rose-600">{a.target_user_id}</td>
                    <td className="py-3 px-5">{a.action}</td>
                    <td className="py-3 px-5 text-slate-500">{a.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada pencatatan akses transaksi sensitif. Seluruh privasi data user terlindungi aman.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
