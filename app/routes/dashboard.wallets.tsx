import { useState } from "react";
import { useLoaderData, Form } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Wallet,
  Plus,
  CheckCircle2,
  Building,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  Star,
} from "lucide-react";
import { store, formatRupiah, type WalletType } from "~/lib/store";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);
  const userId = session.user.user_id;

  const userWallets = Array.from(store.wallets.values()).filter((w) => w.user_id === userId);

  return json({
    user: session.user,
    wallets: userWallets,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSessionContext(request);
  const userId = session.user.user_id;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "setDefault") {
    const targetWalletId = formData.get("walletId") as string;
    // Set all other wallets is_telegram_default = false
    Array.from(store.wallets.values())
      .filter((w) => w.user_id === userId)
      .forEach((w) => {
        w.is_telegram_default = w.id === targetWalletId;
      });
    return redirect("/dashboard/wallets");
  }

  if (intent === "addWallet") {
    const name = formData.get("name") as string;
    const type = (formData.get("type") as WalletType) || "bank";
    const balanceStr = formData.get("balance") as string;
    const balance = parseInt(balanceStr.replace(/\D/g, ""), 10) || 0;
    const isDefault = formData.get("isDefault") === "on";

    const newId = `wal_${userId}_${Date.now()}`;

    if (isDefault) {
      Array.from(store.wallets.values())
        .filter((w) => w.user_id === userId)
        .forEach((w) => {
          w.is_telegram_default = false;
        });
    }

    store.wallets.set(newId, {
      id: newId,
      user_id: userId,
      name,
      type: type as any,
      balance,
      is_telegram_default: isDefault,
      created_at: new Date().toISOString(),
    });

    return redirect("/dashboard/wallets");
  }

  return json({});
}

export default function WalletsPage() {
  const data = useLoaderData<typeof loader>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getWalletIcon = (type: string) => {
    switch (type) {
      case "bank":
        return <Building className="w-5 h-5 text-blue-600" />;
      case "ewallet":
        return <Smartphone className="w-5 h-5 text-emerald-600" />;
      case "cash":
        return <Banknote className="w-5 h-5 text-amber-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            Dompet & Rekening Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola multi-wallet dan tentukan dompet default untuk pencatatan instan di Telegram.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-fintech-primary text-xs font-bold gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Dompet Baru
        </button>
      </div>

      {/* Grid of Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.wallets.map((w) => (
          <div
            key={w.id}
            className={`card-fintech p-6 flex flex-col justify-between border-2 transition-all ${
              w.is_telegram_default ? "border-orange-500 bg-orange-50/10 shadow-md" : "border-transparent"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                    {getWalletIcon(w.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{w.name}</h3>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {w.type}
                    </span>
                  </div>
                </div>

                {w.is_telegram_default && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-700 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-orange-500 text-orange-500" /> Default Telegram
                  </span>
                )}
              </div>

              <div className="mt-8">
                <span className="text-xs text-slate-500">Saldo Saat Ini:</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1 font-display">
                  {formatRupiah(w.balance)}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              {!w.is_telegram_default ? (
                <Form method="post" className="w-full">
                  <input type="hidden" name="intent" value="setDefault" />
                  <input type="hidden" name="walletId" value={w.id} />
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Jadikan Default Telegram
                  </button>
                </Form>
              ) : (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Digunakan otomatis di chat bot
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Wallet */}
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
              Tambah Dompet / Rekening
            </h3>

            <Form method="post" onSubmit={() => setIsModalOpen(false)} className="space-y-4">
              <input type="hidden" name="intent" value="addWallet" />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Dompet / Bank
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Misal: BCA, Mandiri, GoPay, OVO, Tunai"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Dompet
                </label>
                <select
                  name="type"
                  required
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="bank">Rekening Bank (BCA, Mandiri, BRI, BNI)</option>
                  <option value="ewallet">E-Wallet (GoPay, OVO, DANA, ShopeePay)</option>
                  <option value="cash">Uang Tunai / Cash</option>
                  <option value="investment">Investasi / Tabungan Khusus</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="number"
                  name="balance"
                  required
                  placeholder="0"
                  className="w-full px-4 py-2.5 text-base font-extrabold rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="isDefault" className="text-xs text-slate-700 font-medium">
                  Jadikan dompet utama Telegram saat mencatat tanpa nama dompet
                </label>
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
                  Simpan Dompet
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
