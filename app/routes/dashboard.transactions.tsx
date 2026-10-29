import { useState } from "react";
import { useLoaderData, Form } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Plus,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Filter,
  Calendar,
  X,
} from "lucide-react";
import { store, formatRupiah } from "~/lib/store";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);
  const userId = session.user.user_id;

  const userWallets = Array.from(store.wallets.values()).filter((w) => w.user_id === userId);
  const userCategories = Array.from(store.categories.values()).filter((c) => c.user_id === userId);
  const userTx = Array.from(store.transactions.values())
    .filter((t) => t.user_id === userId)
    .sort((a, b) => new Date(b.date_wib).getTime() - new Date(a.date_wib).getTime());

  return json({
    user: session.user,
    wallets: userWallets,
    categories: userCategories,
    transactions: userTx,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSessionContext(request);
  const userId = session.user.user_id;
  const formData = await request.formData();

  const type = formData.get("type") as "expense" | "income" | "transfer";
  const amountStr = formData.get("amount") as string;
  const amount = parseInt(amountStr.replace(/\D/g, ""), 10) || 0;
  const walletId = formData.get("walletId") as string;
  const toWalletId = (formData.get("toWalletId") as string) || null;
  const categoryId = formData.get("categoryId") as string;
  const notes = (formData.get("notes") as string) || "Transaksi Web";
  const dateStr = (formData.get("date") as string) || new Date().toISOString();

  if (amount <= 0 || !walletId) {
    return json({ error: "Nominal dan dompet wajib diisi" }, { status: 400 });
  }

  try {
    store.createTransaction({
      user_id: userId,
      wallet_id: walletId,
      to_wallet_id: type === "transfer" ? toWalletId : null,
      category_id: categoryId || store.categories.values().next().value.id,
      type,
      amount,
      date_wib: new Date(dateStr).toISOString(),
      notes,
      source: "web",
      has_items: false,
    });
  } catch (err: any) {
    return json({ error: err.message }, { status: 400 });
  }

  return redirect("/dashboard/transactions");
}

export default function TransactionsPage() {
  const data = useLoaderData<typeof loader>();
  const [filterType, setFilterType] = useState<"all" | "expense" | "income" | "transfer">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTxType, setModalTxType] = useState<"expense" | "income" | "transfer">("expense");

  const filteredTx = data.transactions.filter((tx) => {
    if (filterType === "all") return true;
    return tx.type === filterType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            Transaksi Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola pemasukan, pengeluaran harian, dan transfer antar rekening.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-fintech-primary text-xs font-bold gap-2"
        >
          <Plus className="w-4 h-4" /> Catat Transaksi Baru
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: "all", label: "Semua Transaksi" },
          { id: "expense", label: "💸 Pengeluaran" },
          { id: "income", label: "💰 Pemasukan" },
          { id: "transfer", label: "🔄 Transfer Antar Wallet" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id as any)}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              filterType === tab.id
                ? "bg-orange-500 text-white shadow-sm font-bold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="card-fintech p-6">
        {filteredTx.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            Belum ada transaksi untuk kategori ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTx.map((tx) => {
              const cat = data.categories.find((c) => c.id === tx.category_id);
              const wal = data.wallets.find((w) => w.id === tx.wallet_id);
              const toWal = tx.to_wallet_id ? data.wallets.find((w) => w.id === tx.to_wallet_id) : null;

              return (
                <div
                  key={tx.id}
                  className="py-4 flex items-center justify-between hover:bg-slate-50/60 px-3 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                        tx.type === "income"
                          ? "bg-emerald-50 text-emerald-600"
                          : tx.type === "expense"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {cat?.emoji || (tx.type === "transfer" ? "🔄" : "📝")}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {tx.notes}
                        {tx.has_items && (
                          <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">
                            🧾 Multi-item Struk
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>{new Date(tx.date_wib).toLocaleDateString("id-ID")}</span>
                        <span>•</span>
                        <span>
                          {tx.type === "transfer" && toWal
                            ? `${wal?.name} → ${toWal.name}`
                            : wal?.name}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{tx.source.replace("_", " ")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-extrabold ${
                        tx.type === "income"
                          ? "text-emerald-600"
                          : tx.type === "expense"
                          ? "text-rose-600"
                          : "text-blue-600"
                      }`}
                    >
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                      {formatRupiah(tx.amount)}
                    </p>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {tx.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Catat Transaksi Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-6 font-display">
              Catat Transaksi Baru
            </h3>

            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalTxType("expense")}
                className={`py-2 rounded-xl transition-all ${
                  modalTxType === "expense"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setModalTxType("income")}
                className={`py-2 rounded-xl transition-all ${
                  modalTxType === "income"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setModalTxType("transfer")}
                className={`py-2 rounded-xl transition-all ${
                  modalTxType === "transfer"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Transfer
              </button>
            </div>

            <Form method="post" onSubmit={() => setIsModalOpen(false)} className="space-y-4">
              <input type="hidden" name="type" value={modalTxType} />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  placeholder="Contoh: 50000"
                  className="w-full px-4 py-2.5 text-base font-extrabold rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {modalTxType === "transfer" ? "Dompet Asal" : "Dompet / Rekening"}
                </label>
                <select
                  name="walletId"
                  required
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  {data.wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {modalTxType === "transfer" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dompet Tujuan
                  </label>
                  <select
                    name="toWalletId"
                    required
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    {data.wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatRupiah(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalTxType !== "transfer" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    name="categoryId"
                    required
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    {data.categories
                      .filter((c) =>
                        modalTxType === "income" ? c.type === "income" : c.type === "expense"
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.emoji} {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  name="notes"
                  required
                  placeholder="Misal: Makan Siang Nasi Padang"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white"
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
                  Simpan Transaksi
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
