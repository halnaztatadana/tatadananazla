import { useState } from "react";
import { useLoaderData, Form } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Bell,
  X,
  Sparkles,
} from "lucide-react";
import { store, formatRupiah, renderProgressBar } from "~/lib/store";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);
  const userId = session.user.user_id;
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  const userCategories = Array.from(store.categories.values()).filter(
    (c) => c.user_id === userId && c.type === "expense"
  );
  const userBudgets = Array.from(store.budgets.values()).filter(
    (b) => b.user_id === userId && b.period_month === curMonth && b.period_year === curYear
  );

  const budgetsWithDetails = userBudgets.map((b) => {
    const cat = store.categories.get(b.category_id);
    const pct = b.monthly_amount > 0 ? Math.round((b.spent_amount / b.monthly_amount) * 100) : 0;
    const textBar = renderProgressBar(pct, 10);
    let alertStatus: "NORMAL" | "WARNING_80" | "EXCEEDED_100" = "NORMAL";
    if (pct >= 100) alertStatus = "EXCEEDED_100";
    else if (pct >= 80) alertStatus = "WARNING_80";

    return {
      ...b,
      categoryName: cat?.name || "Kategori",
      categoryEmoji: cat?.emoji || "📦",
      categoryColor: cat?.color || "#F97316",
      percentage: pct,
      textBar,
      alertStatus,
      remainingAmount: Math.max(b.monthly_amount - b.spent_amount, 0),
    };
  });

  return json({
    user: session.user,
    categories: userCategories,
    budgets: budgetsWithDetails,
    monthName: now.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSessionContext(request);
  const userId = session.user.user_id;
  const formData = await request.formData();
  const now = new Date();

  const categoryId = formData.get("categoryId") as string;
  const amountStr = formData.get("monthlyAmount") as string;
  const monthlyAmount = parseInt(amountStr.replace(/\D/g, ""), 10) || 0;

  if (!categoryId || monthlyAmount <= 0) {
    return json({ error: "Kategori dan nominal wajib diisi" }, { status: 400 });
  }

  // Calculate existing spent in this category for this month
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const spentAmount = Array.from(store.transactions.values())
    .filter(
      (t) =>
        t.user_id === userId &&
        t.category_id === categoryId &&
        t.type === "expense" &&
        t.date_wib.startsWith(monthPrefix)
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const budgetId = `bud_${userId}_${categoryId}`;
  store.budgets.set(budgetId, {
    id: budgetId,
    user_id: userId,
    category_id: categoryId,
    monthly_amount: monthlyAmount,
    spent_amount: spentAmount,
    period_month: now.getMonth() + 1,
    period_year: now.getFullYear(),
  });

  return redirect("/dashboard/budgets");
}

export default function BudgetsPage() {
  const data = useLoaderData<typeof loader>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            Target & Batas Budget ({data.monthName})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau pengeluaran per kategori agar tidak melebihi alokasi dan terima peringatan bot Telegram.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-fintech-primary text-xs font-bold gap-2"
        >
          <Plus className="w-4 h-4" /> Pasang Budget Kategori
        </button>
      </div>

      {/* Info Alert Notification Simulation */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between text-xs text-orange-900">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-orange-600 shrink-0" />
          <span>
            <b>Automated Bot Alert:</b> TataDana otomatis mengirimkan pesan peringatan di Telegram saat pemakaian budget mencapai <b>80%</b> dan peringatan darurat saat mencapai <b>100%</b>.
          </span>
        </div>
      </div>

      {/* Budget Cards Grid */}
      {data.budgets.length === 0 ? (
        <div className="card-fintech p-12 text-center text-slate-400 text-xs">
          Belum ada budget yang disetel untuk bulan ini. Klik tombol di atas untuk memasang target.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.budgets.map((b) => (
            <div
              key={b.id}
              className={`card-fintech p-6 flex flex-col justify-between border-2 transition-all ${
                b.alertStatus === "EXCEEDED_100"
                  ? "border-rose-400 bg-rose-50/20"
                  : b.alertStatus === "WARNING_80"
                  ? "border-amber-400 bg-amber-50/20"
                  : "border-transparent"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{b.categoryEmoji}</span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{b.categoryName}</h3>
                      <span className="text-[10px] text-slate-400">Bulanan</span>
                    </div>
                  </div>
                  {b.alertStatus === "EXCEEDED_100" ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> MELEBIHI 100%
                    </span>
                  ) : b.alertStatus === "WARNING_80" ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> WASPADA 80%
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> AMAN
                    </span>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-500">Terpakai:</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {formatRupiah(b.spent_amount)}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        / {formatRupiah(b.monthly_amount)}
                      </span>
                    </span>
                  </div>

                  {/* Visual Tailwind Progress Bar */}
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        b.alertStatus === "EXCEEDED_100"
                          ? "bg-rose-500"
                          : b.alertStatus === "WARNING_80"
                          ? "bg-amber-500"
                          : "bg-orange-500"
                      }`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    />
                  </div>

                  {/* Telegram ASCII Visual Bar */}
                  <div className="text-[11px] font-mono text-slate-500 flex justify-between pt-1">
                    <span>Telegram Bar: [{b.textBar}]</span>
                    <span className="font-bold">{b.percentage}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Sisa Alokasi:</span>
                <span className="font-bold text-slate-800">
                  {formatRupiah(b.remainingAmount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Budget */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-6 font-display">
              Setel Budget Kategori
            </h3>

            <Form method="post" onSubmit={() => setIsModalOpen(false)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Kategori Pengeluaran
                </label>
                <select
                  name="categoryId"
                  required
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  {data.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batas Maksimal Bulanan (Rp)
                </label>
                <input
                  type="number"
                  name="monthlyAmount"
                  required
                  placeholder="Contoh: 2000000"
                  className="w-full px-4 py-2.5 text-base font-extrabold rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Simpan Budget
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
