import { useState } from "react";
import { useLoaderData, Link } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Receipt,
  ExternalLink,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { store, formatRupiah, type TransactionItem } from "~/lib/store";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);
  const userId = session.user.user_id;

  const url = new URL(request.url);
  const categoryFilter = url.searchParams.get("category") || "";
  const walletFilter = url.searchParams.get("wallet") || "";
  const typeFilter = url.searchParams.get("type") || "";
  const searchFilter = url.searchParams.get("search") || "";
  const sortCol = url.searchParams.get("sort") || "date";
  const sortDir = url.searchParams.get("dir") || "desc";

  const allWallets = Array.from(store.wallets.values()).filter((w) => w.user_id === userId);
  const allCategories = Array.from(store.categories.values()).filter((c) => c.user_id === userId);

  let txList = Array.from(store.transactions.values()).filter((t) => t.user_id === userId);

  if (categoryFilter) {
    txList = txList.filter((t) => t.category_id === categoryFilter);
  }
  if (walletFilter) {
    txList = txList.filter((t) => t.wallet_id === walletFilter);
  }
  if (typeFilter) {
    txList = txList.filter((t) => t.type === typeFilter);
  }
  if (searchFilter) {
    const q = searchFilter.toLowerCase();
    txList = txList.filter((t) => t.notes.toLowerCase().includes(q));
  }

  // Sort
  txList.sort((a, b) => {
    if (sortCol === "amount") {
      return sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
    }
    const dateA = new Date(a.date_wib).getTime();
    const dateB = new Date(b.date_wib).getTime();
    return sortDir === "asc" ? dateA - dateB : dateB - dateA;
  });

  // Calculate Net Cashflow
  const totalIncome = txList.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = txList.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netCashflow = totalIncome - totalExpense;

  // Export histories
  const exportHistories = Array.from(store.exportHistories.values())
    .filter((h) => h.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Attach transaction items
  const itemsMap: Record<string, TransactionItem[]> = {};
  txList.forEach((tx) => {
    if (tx.has_items) {
      itemsMap[tx.id] = Array.from(store.transactionItems.values()).filter(
        (i) => i.transaction_id === tx.id
      );
    }
  });

  return json({
    user: session.user,
    transactions: txList,
    itemsMap,
    wallets: allWallets,
    categories: allCategories,
    totalIncome,
    totalExpense,
    netCashflow,
    exportHistories,
    filters: {
      categoryFilter,
      walletFilter,
      typeFilter,
      searchFilter,
      sortCol,
      sortDir,
    },
  });
}

export default function ReportsPage() {
  const data = useLoaderData<typeof loader>();
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            Laporan Keuangan Komprehensif
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analisis arus kas, struk belanja multi-item, dan generator ekspor dokumen.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/api/export?format=pdf&period=2026-10`}
            download
            className="btn-fintech-secondary text-xs font-bold gap-2 text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </a>
          <a
            href={`/api/export?format=xlsx&period=2026-10`}
            download
            className="btn-fintech-primary text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel (.xlsx)
          </a>
        </div>
      </div>

      {/* Net Cashflow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card-fintech p-5 bg-gradient-to-br from-emerald-50/50 to-white">
          <span className="text-xs font-semibold text-emerald-700">Total Pemasukan</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-2 font-display">
            {formatRupiah(data.totalIncome)}
          </p>
        </div>
        <div className="card-fintech p-5 bg-gradient-to-br from-rose-50/50 to-white">
          <span className="text-xs font-semibold text-rose-700">Total Pengeluaran</span>
          <p className="text-xl font-extrabold text-rose-600 mt-2 font-display">
            {formatRupiah(data.totalExpense)}
          </p>
        </div>
        <div className="card-fintech p-5 bg-gradient-to-br from-orange-50/50 to-white">
          <span className="text-xs font-semibold text-orange-700">Net Arus Kas (Selisih)</span>
          <p
            className={`text-xl font-extrabold mt-2 font-display ${
              data.netCashflow >= 0 ? "text-slate-900" : "text-rose-600"
            }`}
          >
            {data.netCashflow >= 0 ? "+" : ""}
            {formatRupiah(data.netCashflow)}
          </p>
        </div>
      </div>

      {/* Multi-facet Filter Bar */}
      <div className="card-fintech p-4">
        <form method="get" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 mb-1 font-semibold">Cari Catatan</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                name="search"
                defaultValue={data.filters.searchFilter}
                placeholder="Misal: kopi, bensin..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-semibold">Jenis Transaksi</label>
            <select
              name="type"
              defaultValue={data.filters.typeFilter}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
            >
              <option value="">Semua Jenis</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-semibold">Kategori</label>
            <select
              name="category"
              defaultValue={data.filters.categoryFilter}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
            >
              <option value="">Semua Kategori</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-semibold">Dompet / Rekening</label>
            <select
              name="wallet"
              defaultValue={data.filters.walletFilter}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
            >
              <option value="">Semua Dompet</option>
              {data.wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="w-full py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" /> Terapkan Filter
            </button>
            <Link
              to="/dashboard/reports"
              className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      {/* Main Table with Expandable Struk Items */}
      <div className="card-fintech overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 font-bold">Waktu</th>
                <th className="py-3.5 px-4 font-bold">Jenis</th>
                <th className="py-3.5 px-4 font-bold">Kategori</th>
                <th className="py-3.5 px-4 font-bold">Dompet</th>
                <th className="py-3.5 px-4 font-bold">Catatan</th>
                <th className="py-3.5 px-4 font-bold text-right">Nominal</th>
                <th className="py-3.5 px-4 font-bold text-center">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada transaksi yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                data.transactions.map((tx) => {
                  const cat = data.categories.find((c) => c.id === tx.category_id);
                  const wal = data.wallets.find((w) => w.id === tx.wallet_id);
                  const items = data.itemsMap[tx.id] || [];
                  const isExpanded = expandedTxId === tx.id;

                  return (
                    <React.Fragment key={tx.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(tx.date_wib).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              tx.type === "income"
                                ? "bg-emerald-100 text-emerald-800"
                                : tx.type === "expense"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          <span className="mr-1.5">{cat?.emoji || "📝"}</span>
                          {cat?.name || "Umum"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {wal?.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {tx.notes}
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
                          {tx.type === "income" ? "+ " : tx.type === "expense" ? "- " : ""}
                          {formatRupiah(tx.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {tx.has_items ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(tx.id)}
                              className="px-2.5 py-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>{items.length} Item</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3 ml-0.5" />
                              ) : (
                                <ChevronDown className="w-3 h-3 ml-0.5" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Receipt Items Sub-Table */}
                      {isExpanded && tx.has_items && (
                        <tr className="bg-orange-50/40">
                          <td colSpan={7} className="p-4 pl-12 border-y border-orange-100">
                            <div className="bg-white rounded-2xl p-4 border border-orange-200 shadow-sm max-w-2xl">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                                <h4 className="text-xs font-bold text-orange-800 flex items-center gap-2">
                                  <Receipt className="w-4 h-4 text-orange-600" />
                                  Rincian Struk Belanja ({items.length} Item Terdeteksi OCR)
                                </h4>
                                {tx.receipt_url && (
                                  <a
                                    href={tx.receipt_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-orange-600 hover:underline flex items-center gap-1 font-semibold"
                                  >
                                    Lihat Foto Struk <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>

                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100">
                                    <th className="py-1.5 text-left font-semibold">Nama Item</th>
                                    <th className="py-1.5 text-right font-semibold">Harga</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {items.map((item) => (
                                    <tr key={item.id}>
                                      <td className="py-2 text-slate-800 font-medium">
                                        • {item.item_name}
                                      </td>
                                      <td className="py-2 text-right font-bold text-slate-900">
                                        {formatRupiah(item.amount)}
                                      </td>
                                    </tr>
                                  ))}
                                  <tr className="border-t border-slate-200 font-extrabold text-slate-900">
                                    <td className="pt-2">Subtotal Struk</td>
                                    <td className="pt-2 text-right text-orange-600">
                                      {formatRupiah(tx.amount)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export History Table */}
      <div className="card-fintech p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          Riwayat Berkas Export (Signed URL Ephemeral 30 Menit)
        </h3>
        {data.exportHistories.length === 0 ? (
          <p className="text-xs text-slate-400">Belum ada riwayat export.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Nama Berkas</th>
                  <th className="py-2.5 px-3">Format</th>
                  <th className="py-2.5 px-3">Periode</th>
                  <th className="py-2.5 px-3">Dibuat Pada</th>
                  <th className="py-2.5 px-3">Kadaluarsa</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.exportHistories.map((h) => (
                  <tr key={h.id}>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{h.file_name}</td>
                    <td className="py-2.5 px-3 uppercase font-bold text-slate-600">{h.file_type}</td>
                    <td className="py-2.5 px-3 text-slate-600">{h.period}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(h.created_at).toLocaleTimeString("id-ID")} WIB
                    </td>
                    <td className="py-2.5 px-3 text-amber-600 font-semibold">
                      {new Date(h.expires_at).toLocaleTimeString("id-ID")} WIB (30 mnt)
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <a
                        href={h.file_url}
                        className="text-orange-600 hover:text-orange-700 font-bold inline-flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Unduh
                      </a>
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

import React from "react";
