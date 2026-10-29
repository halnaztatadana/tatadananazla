import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  PieChart as PieIcon,
  CheckCircle2,
  Circle,
  Plus,
  Send,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { store, formatRupiah, renderProgressBar } from "~/lib/store";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);
  const userId = session.user.user_id;

  // Wallets
  const wallets = Array.from(store.wallets.values()).filter((w) => w.user_id === userId);
  const totalSaldo = wallets.reduce((acc, w) => acc + w.balance, 0);

  // Transactions
  const allUserTx = Array.from(store.transactions.values()).filter((t) => t.user_id === userId);
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const currentMonthTx = allUserTx.filter((t) => t.date_wib.startsWith(currentMonthPrefix));

  const totalPemasukanBulanIni = currentMonthTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPengeluaranBulanIni = currentMonthTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Budgets
  const budgets = Array.from(store.budgets.values()).filter(
    (b) => b.user_id === userId && b.period_month === now.getMonth() + 1 && b.period_year === now.getFullYear()
  );
  const totalBudgetMonthly = budgets.reduce((sum, b) => sum + b.monthly_amount, 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.spent_amount, 0);
  const sisaBudget = Math.max(totalBudgetMonthly - totalBudgetSpent, 0);

  // Category breakdown for pie chart
  const categoryMap = new Map<string, { name: string; emoji: string; color: string; amount: number }>();
  currentMonthTx
    .filter((t) => t.type === "expense")
    .forEach((tx) => {
      const cat = store.categories.get(tx.category_id);
      const name = cat ? cat.name : "Lain-lain";
      const emoji = cat ? cat.emoji : "📦";
      const color = cat ? cat.color : "#F97316";

      const existing = categoryMap.get(name) || { name, emoji, color, amount: 0 };
      existing.amount += tx.amount;
      categoryMap.set(name, existing);
    });
  const categoryExpenses = Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);

  // 10 Recent transactions
  const recentTransactions = [...allUserTx]
    .sort((a, b) => new Date(b.date_wib).getTime() - new Date(a.date_wib).getTime())
    .slice(0, 10)
    .map((tx) => {
      const cat = store.categories.get(tx.category_id);
      const wal = store.wallets.get(tx.wallet_id);
      return {
        ...tx,
        categoryName: cat?.name || "Umum",
        categoryEmoji: cat?.emoji || "📝",
        walletName: wal?.name || "Dompet",
      };
    });

  // Dynamic 6-Month trend calculation
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const last6Months: Array<{ prefix: string; label: string; income: number; expense: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const mName = monthNames[d.getMonth()];
    last6Months.push({ prefix: mStr, label: mName, income: 0, expense: 0 });
  }

  allUserTx.forEach((t) => {
    const pfx = t.date_wib.slice(0, 7);
    const mObj = last6Months.find((m) => m.prefix === pfx);
    if (mObj) {
      if (t.type === "income") mObj.income += t.amount;
      else if (t.type === "expense") mObj.expense += t.amount;
    }
  });

  const maxVal = Math.max(1, ...last6Months.map((m) => Math.max(m.income, m.expense)));
  const hasTxData = allUserTx.length > 0;
  const netSavingRate = totalPemasukanBulanIni > 0
    ? Math.round(((totalPemasukanBulanIni - totalPengeluaranBulanIni) / totalPemasukanBulanIni) * 100)
    : 0;

  // Onboarding steps
  const hasConnectedTelegram = !!session.user.telegram_user_id;
  const hasCustomWallet = wallets.length > 1;
  const hasBudgetSet = budgets.length > 0;

  return json({
    user: session.user,
    totalSaldo,
    totalPemasukanBulanIni,
    totalPengeluaranBulanIni,
    totalBudgetMonthly,
    totalBudgetSpent,
    sisaBudget,
    categoryExpenses,
    recentTransactions,
    wallets,
    last6Months,
    maxVal,
    hasTxData,
    netSavingRate,
    onboarding: {
      hasConnectedTelegram,
      hasCustomWallet,
      hasBudgetSet,
      isCompleted: hasConnectedTelegram && hasCustomWallet && hasBudgetSet,
    },
  });
}

export default function DashboardHome() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            Halo, {data.user.full_name} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Berikut ringkasan kondisi keuangan pribadi Anda untuk bulan ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/transactions"
            className="btn-fintech-primary text-xs font-bold gap-2"
          >
            <Plus className="w-4 h-4" /> Catat Transaksi
          </Link>
        </div>
      </div>

      {/* Onboarding Checklist if not complete */}
      {!data.onboarding.isCompleted && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Langkah Awal Mengaktifkan TataDana
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <Link
              to="/dashboard/settings"
              className="p-3 bg-white rounded-2xl border border-orange-100 flex items-center justify-between hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2.5">
                {data.onboarding.hasConnectedTelegram ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className={data.onboarding.hasConnectedTelegram ? "line-through text-slate-400" : "font-semibold text-slate-700"}>
                  1. Hubungkan Bot Telegram
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              to="/dashboard/wallets"
              className="p-3 bg-white rounded-2xl border border-orange-100 flex items-center justify-between hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2.5">
                {data.onboarding.hasCustomWallet ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className={data.onboarding.hasCustomWallet ? "line-through text-slate-400" : "font-semibold text-slate-700"}>
                  2. Tambah Rekening / E-Wallet
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              to="/dashboard/budgets"
              className="p-3 bg-white rounded-2xl border border-orange-100 flex items-center justify-between hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2.5">
                {data.onboarding.hasBudgetSet ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className={data.onboarding.hasBudgetSet ? "line-through text-slate-400" : "font-semibold text-slate-700"}>
                  3. Set Batas Budget Bulanan
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      )}

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Saldo Total */}
        <div className="card-fintech p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Saldo Total</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3 font-display">
            {formatRupiah(data.totalSaldo)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Dari {data.wallets.length} dompet aktif
          </span>
        </div>

        {/* Card 2: Pemasukan */}
        <div className="card-fintech p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Pemasukan Bulan Ini</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-3 font-display">
            {formatRupiah(data.totalPemasukanBulanIni)}
          </p>
          <span className="text-[11px] text-emerald-700/80 mt-1 block">
            Gaji & sumber income lain
          </span>
        </div>

        {/* Card 3: Pengeluaran */}
        <div className="card-fintech p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">Pengeluaran Bulan Ini</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-3 font-display">
            {formatRupiah(data.totalPengeluaranBulanIni)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Tercatat otomatis via bot & web
          </span>
        </div>

        {/* Card 4: Sisa Budget */}
        <div className="card-fintech p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-600">Sisa Budget Tersedia</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-orange-600 mt-3 font-display">
            {formatRupiah(data.sisaBudget)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Dari total budget {formatRupiah(data.totalBudgetMonthly)}
          </span>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Category Breakdown (Donut/Progress list) */}
        <div className="lg:col-span-5 card-fintech p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 text-sm">
              Distribusi Pengeluaran Kategori
            </h3>
            <Link to="/dashboard/reports" className="text-xs text-orange-600 font-semibold hover:underline">
              Lihat Detail
            </Link>
          </div>

          {data.categoryExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              Belum ada data pengeluaran di bulan ini.
            </p>
          ) : (
            <div className="space-y-4">
              {data.categoryExpenses.map((cat, idx) => {
                const pct =
                  data.totalPengeluaranBulanIni > 0
                    ? Math.round((cat.amount / data.totalPengeluaranBulanIni) * 100)
                    : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <span className="text-slate-800">{cat.name}</span>
                      </span>
                      <span className="text-slate-600">
                        {formatRupiah(cat.amount)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: cat.color || "#F97316",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6-Month Comparison & Trend */}
        <div className="lg:col-span-7 card-fintech p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Tren Keuangan 6 Bulan Terakhir
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbandingan Pemasukan (Hijau) vs Pengeluaran (Orange)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pemasukan
                </span>
                <span className="flex items-center gap-1.5 text-orange-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Pengeluaran
                </span>
              </div>
            </div>

            {/* Dynamic Bar Chart or Zero-State */}
            {!data.hasTxData ? (
              <div className="h-44 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center my-2">
                <div className="text-2xl mb-1.5">📊</div>
                <div className="font-bold text-xs text-slate-800">Belum Ada Transaksi Tercatat</div>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
                  Grafik tren bulanan Anda bersih (Rp0). Grafik akan otomatis terisi secara dinamis saat Anda mencatat transaksi pertama.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-3 items-end h-44 pt-6 pb-2 border-b border-slate-100">
                {data.last6Months.map((bar, i) => {
                  const inPct = Math.min(100, Math.round((bar.income / data.maxVal) * 100));
                  const exPct = Math.min(100, Math.round((bar.expense / data.maxVal) * 100));
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="flex gap-1 items-end w-full justify-center h-full">
                        <div
                          className="w-3.5 bg-emerald-400 rounded-t-md transition-all hover:bg-emerald-500"
                          style={{ height: `${Math.max(4, inPct)}%` }}
                          title={`Pemasukan: ${formatRupiah(bar.income)}`}
                        />
                        <div
                          className="w-3.5 bg-orange-400 rounded-t-md transition-all hover:bg-orange-500"
                          style={{ height: `${Math.max(4, exPct)}%` }}
                          title={`Pengeluaran: ${formatRupiah(bar.expense)}`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{bar.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              Net Saving Rate Bulan Ini:{" "}
              <b className={`font-bold ${data.netSavingRate >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {data.netSavingRate >= 0 ? `+${data.netSavingRate}%` : `${data.netSavingRate}%`}
              </b>
            </span>
            <span className="text-slate-400">Diperbarui realtime</span>
          </div>
        </div>
      </div>

      {/* RECENT 10 TRANSACTIONS TABLE */}
      <div className="card-fintech p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900 text-sm">
            10 Transaksi Terakhir
          </h3>
          <Link
            to="/dashboard/transactions"
            className="text-xs font-bold text-orange-600 hover:text-orange-700"
          >
            Lihat Semua Transaksi →
          </Link>
        </div>

        {data.recentTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Belum ada transaksi tercatat. Mulai ketik di Telegram atau klik "Catat Transaksi".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-bold">Waktu</th>
                  <th className="py-3 px-4 font-bold">Kategori</th>
                  <th className="py-3 px-4 font-bold">Catatan</th>
                  <th className="py-3 px-4 font-bold">Dompet</th>
                  <th className="py-3 px-4 font-bold text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(tx.date_wib).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      <span className="mr-1.5">{tx.categoryEmoji}</span>
                      {tx.categoryName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {tx.notes}
                      {tx.has_items && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">
                          🧾 Struk
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {tx.walletName}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-extrabold whitespace-nowrap ${
                        tx.type === "income"
                          ? "text-emerald-600"
                          : tx.type === "expense"
                          ? "text-rose-600"
                          : "text-blue-600"
                      }`}
                    >
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                      {formatRupiah(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
