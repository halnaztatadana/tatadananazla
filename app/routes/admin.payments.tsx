import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { CreditCard, Check, X, ExternalLink, Clock } from "lucide-react";
import { store, formatRupiah, type PaymentTransaction } from "~/lib/store";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);
  if (!session.isAdmin) throw new Response("403 Forbidden", { status: 403 });

  const payments = Array.from(store.paymentTransactions.values()).map((pay) => {
    const user = store.profiles.get(pay.user_id);
    return {
      ...pay,
      userName: user?.full_name || "Unknown User",
      userPhone: user?.phone_number || "-",
    };
  });

  return json({ payments });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSessionContext(request);
  if (!session.isAdmin) throw new Response("403 Forbidden", { status: 403 });

  const formData = await request.formData();
  const paymentId = String(formData.get("paymentId"));
  const decision = String(formData.get("decision")); // 'approve' | 'reject'

  const pay = store.paymentTransactions.get(paymentId);
  if (!pay) return json({ error: "Pembayaran tidak ditemukan" }, { status: 404 });

  if (decision === "approve") {
    pay.status = "approved";
    pay.approved_by = session.user.id;

    // Upgrade user to Pro plan
    const user = store.profiles.get(pay.user_id);
    if (user) {
      user.plan = "pro";
      user.updated_at = new Date().toISOString();
    }

    return json({ success: true, status: "approved" });
  }

  if (decision === "reject") {
    pay.status = "rejected";
    return json({ success: true, status: "rejected" });
  }

  return json({ error: "Invalid decision" }, { status: 400 });
}

export default function AdminPaymentsRoute() {
  const { payments } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <CreditCard className="w-6 h-6 text-rose-600" />
          Persetujuan Pembayaran Midtrans & Transfer Manual
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review bukti transfer manual atau status pembayaran gateway otomatis untuk upgrade paket TataDana Pro.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-5">Order ID & Pengguna</th>
              <th className="py-3.5 px-5">Metode & Nominal</th>
              <th className="py-3.5 px-5">Bukti Transfer</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5">Aksi Approval</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-4 px-5">
                  <div className="font-bold text-slate-900">{p.midtrans_order_id}</div>
                  <div className="text-[11px] text-slate-500">
                    {p.userName} ({p.userPhone})
                  </div>
                </td>
                <td className="py-4 px-5">
                  <div className="font-bold text-emerald-600">{formatRupiah(p.amount)}</div>
                  <div className="text-[11px] text-slate-400 capitalize">{p.payment_type.replace("_", " ")}</div>
                </td>
                <td className="py-4 px-5">
                  {p.proof_url ? (
                    <a
                      href={p.proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-1 text-[11px]"
                    >
                      Lihat Bukti <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Auto Gateway</span>
                  )}
                </td>
                <td className="py-4 px-5">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      p.status === "settlement" || p.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : p.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-4 px-5">
                  {p.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <fetcher.Form method="post">
                        <input type="hidden" name="paymentId" value={p.id} />
                        <input type="hidden" name="decision" value="approve" />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      </fetcher.Form>

                      <fetcher.Form method="post">
                        <input type="hidden" name="paymentId" value={p.id} />
                        <input type="hidden" name="decision" value="reject" />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </fetcher.Form>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Selesai diproses</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
