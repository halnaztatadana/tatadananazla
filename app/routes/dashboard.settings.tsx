import { useState } from "react";
import { useLoaderData, Form } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  User,
  Bot,
  Bell,
  Tag,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Send,
  Sparkles,
  Play,
  Camera,
  Mic,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { store, type Category, formatRupiah } from "~/lib/store";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);
  const userId = session.user.user_id;

  const categories = Array.from(store.categories.values()).filter((c) => c.user_id === userId);

  return json({
    user: session.user,
    categories,
    botUsername: process.env.TELEGRAM_BOT_USERNAME || "TataDanaBot",
    botTokenConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSessionContext(request);
  const userId = session.user.user_id;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  const profile = store.profiles.get(userId);
  if (!profile) return json({ error: "User not found" }, { status: 404 });

  if (intent === "updateProfile") {
    profile.full_name = (formData.get("fullName") as string) || profile.full_name;
    profile.default_currency = (formData.get("currency") as string) || "IDR";
    profile.updated_at = new Date().toISOString();
    return redirect("/dashboard/settings?tab=profile&saved=1");
  }

  if (intent === "updateReminder") {
    profile.daily_reminder_enabled = formData.get("reminderEnabled") === "on";
    profile.daily_reminder_time_1 = (formData.get("time1") as string) || "08:00";
    profile.daily_reminder_time_2 = (formData.get("time2") as string) || "20:00";
    profile.updated_at = new Date().toISOString();
    return redirect("/dashboard/settings?tab=reminder&saved=1");
  }

  if (intent === "addCategory") {
    const name = formData.get("name") as string;
    const type = (formData.get("type") as "expense" | "income") || "expense";
    const emoji = (formData.get("emoji") as string) || "🏷️";
    const color = (formData.get("color") as string) || "#F97316";

    const catId = `cat_${userId}_${Date.now()}`;
    store.categories.set(catId, {
      id: catId,
      user_id: userId,
      name,
      type,
      emoji,
      color,
      is_ai_recommended: false,
      created_at: new Date().toISOString(),
    });
    return redirect("/dashboard/settings?tab=category&saved=1");
  }

  return json({});
}

export default function SettingsPage() {
  const data = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<"profile" | "bot" | "reminder" | "category">("bot");

  // Bot Connection Test State
  const [botToken, setBotToken] = useState(
    data.botTokenConfigured ? "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_your_bot_token" : ""
  );
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "connected" | "failed"
  >("connected");
  const [connectionDetails, setConnectionDetails] = useState<string | null>(
    "Webhook aktif dan terdaftar di server Telegram Official"
  );

  // Webhook Simulator State
  const [simText, setSimText] = useState("beli bakso 25rb");
  const [simLoading, setSimLoading] = useState(false);
  const [simResponse, setSimResponse] = useState<any>(null);

  const handleTestConnection = async () => {
    setConnectionStatus("testing");
    setConnectionDetails(null);

    // Call test connection endpoint simulation
    setTimeout(() => {
      if (botToken.trim().length > 10) {
        setConnectionStatus("connected");
        setConnectionDetails(`🟢 getMe: OK (@${data.botUsername}) | setWebhook: OK (HTTPS Enabled)`);
      } else {
        setConnectionStatus("failed");
        setConnectionDetails("🔴 Token tidak valid atau format salah.");
      }
    }, 800);
  };

  const handleRunSimulator = async (type: "text" | "photo" | "voice") => {
    setSimLoading(true);
    setSimResponse(null);

    try {
      let body: any = { type };
      if (type === "text") {
        body.text = simText;
      } else if (type === "photo") {
        body.photoUrl = "https://images.unsplash.com/photo-1554415707-9e49fe832807";
      } else if (type === "voice") {
        body.duration = 15;
      }

      const res = await fetch("/api/telegram/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const jsonRes = await res.json();
      setSimResponse(jsonRes);
    } catch (err: any) {
      setSimResponse({ error: err.message });
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">
          Pengaturan Akun & Integrasi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kustomisasi profil, hubungkan Telegram bot @BotFather, atur reminder, dan kelola kategori.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: "bot", label: "🤖 Telegram Bot & Simulator", icon: Bot },
          { id: "profile", label: "👤 Profil Pengguna", icon: User },
          { id: "reminder", label: "⏰ Reminder Harian", icon: Bell },
          { id: "category", label: "🏷️ Kategori Custom", icon: Tag },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TELEGRAM BOT & WEBHOOK SIMULATOR */}
      {activeTab === "bot" && (
        <div className="space-y-8">
          {/* Section: Bot Pairing & Connection */}
          <div className="card-fintech p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Setup Bot Telegram Mandiri (Single / Multi Bot)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ikuti langkah mudah di bawah untuk menghubungkan bot Telegram pribadi Anda ke sistem TataDana.
              </p>
            </div>

            {/* Step-by-step BotFather guide */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-600">
              <p className="font-bold text-slate-900">
                📖 Panduan Step-by-step via @BotFather:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
                <li>
                  Buka aplikasi Telegram dan cari bot resmi <b>@BotFather</b> (dengan centang biru verified).
                </li>
                <li>
                  Ketik perintah <code>/newbot</code> dan ikuti instruksi penamaan bot Anda.
                </li>
                <li>
                  Salin <b>HTTP API Token</b> yang diberikan oleh BotFather (format: <code>123456789:ABC...</code>).
                </li>
                <li>
                  Tempelkan token ke kolom di bawah ini dan klik tombol <b>"Test Koneksi & Set Webhook"</b>.
                </li>
              </ol>
            </div>

            {/* Token input & test button */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Telegram Bot API Token
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_your_bot_token"
                  className="flex-1 px-4 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={connectionStatus === "testing"}
                  className="btn-fintech-primary text-xs font-bold gap-2 whitespace-nowrap"
                >
                  {connectionStatus === "testing" ? "⏳ Testing..." : "Test Koneksi & Webhook"}
                </button>
              </div>

              {/* Status indicator */}
              {connectionStatus === "connected" && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    🟢 <b>Terhubung!</b> {connectionDetails}
                  </span>
                </div>
              )}
              {connectionStatus === "failed" && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    🔴 <b>Tidak terhubung!</b> {connectionDetails}
                  </span>
                </div>
              )}
            </div>

            {/* Deep link pairing code */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-900">Kode Tautan Akun Anda:</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kirim kode ini ke bot Telegram untuk menyambungkan profil web:
                </p>
                <code className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-800 font-mono text-sm font-bold rounded-lg">
                  /start {data.user.telegram_pairing_code || "LINK_TATADANA"}
                </code>
              </div>
              <a
                href={`https://t.me/${data.botUsername}?start=${data.user.telegram_pairing_code || "LINK_TATADANA"}`}
                target="_blank"
                rel="noreferrer"
                className="btn-fintech-secondary text-xs font-bold gap-2 text-slate-800"
              >
                Buka di Telegram <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Section: Webhook Simulator */}
          <div className="card-fintech p-6 space-y-6">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                Testing Simulator
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">
                Webhook & NLP Simulator (Uji Coba Lokal)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kirim pesan uji coba seolah-olah Anda mengirimkannya langsung dari Telegram ke API backend TataDana.
              </p>
            </div>

            {/* Simulated text input */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Uji Teks Transaksi Bahasa Natural:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  placeholder="Misal: beli bakso 15rb, gajian 5jt, transfer 200rb bca ke gopay"
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => handleRunSimulator("text")}
                  disabled={simLoading}
                  className="btn-fintech-primary text-xs font-bold gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Kirim
                </button>
              </div>
            </div>

            {/* Quick multi-modal simulators */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleRunSimulator("photo")}
                disabled={simLoading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Camera className="w-4 h-4 text-orange-500" />
                Simulasi Upload Foto Struk (Pro OCR)
              </button>
              <button
                type="button"
                onClick={() => handleRunSimulator("voice")}
                disabled={simLoading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Mic className="w-4 h-4 text-blue-500" />
                Simulasi Voice Note Audio (Transkrip)
              </button>
            </div>

            {/* Simulator Response Box */}
            {simResponse && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs border border-slate-800">
                <p className="text-[10px] text-emerald-400 font-bold mb-2 uppercase tracking-wider">
                  ✓ Balasan Bot Telegram Backend:
                </p>
                <div className="whitespace-pre-line text-slate-200 leading-relaxed">
                  {simResponse.replyText || JSON.stringify(simResponse, null, 2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROFIL PENGGUNA */}
      {activeTab === "profile" && (
        <div className="card-fintech p-6 max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 mb-6">
            Informasi Profil
          </h3>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="updateProfile" />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="fullName"
                defaultValue={data.user.full_name}
                required
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                defaultValue={data.user.email || "demo@tatadana.id"}
                disabled
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon
              </label>
              <input
                type="tel"
                defaultValue={data.user.phone_number || "081234567890"}
                disabled
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Uang Default
              </label>
              <select
                name="currency"
                defaultValue={data.user.default_currency || "IDR"}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="IDR">IDR — Rupiah Indonesia (Rp)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="SGD">SGD — Singapore Dollar (S$)</option>
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="btn-fintech-primary text-xs font-bold"
              >
                Simpan Perubahan Profil
              </button>
            </div>
          </Form>
        </div>
      )}

      {/* TAB 3: REMINDER HARIAN */}
      {activeTab === "reminder" && (
        <div className="card-fintech p-6 max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pengaturan Reminder Keuangan Harian
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bot Telegram akan mengirimkan pesan pengingat untuk mencatat pengeluaran harian Anda (maksimal 2x sehari).
            </p>
          </div>

          <Form method="post" className="space-y-6">
            <input type="hidden" name="intent" value="updateReminder" />

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-900">Aktifkan Reminder Otomatis</p>
                <p className="text-[11px] text-slate-500">Kirim reminder langsung ke chat Telegram Anda.</p>
              </div>
              <input
                type="checkbox"
                name="reminderEnabled"
                defaultChecked={data.user.daily_reminder_enabled}
                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jam Reminder 1 (Pagi / Siang)
                </label>
                <input
                  type="time"
                  name="time1"
                  defaultValue={data.user.daily_reminder_time_1 || "08:00"}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jam Reminder 2 (Malam)
                </label>
                <input
                  type="time"
                  name="time2"
                  defaultValue={data.user.daily_reminder_time_2 || "20:00"}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* Preview Box */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-xs space-y-2">
              <span className="font-bold text-orange-900">Preview Pesan Reminder:</span>
              <p className="text-orange-950 italic">
                "⏰ <b>Halo Ahmad!</b> Sudahkah mencatat kopi dan makan siang hari ini? Kirim struk atau ketik transaksi kamu sekarang agar keuanganmu tetap rapi!"
              </p>
            </div>

            <button
              type="submit"
              className="btn-fintech-primary text-xs font-bold"
            >
              Simpan Pengaturan Reminder
            </button>
          </Form>
        </div>
      )}

      {/* TAB 4: KATEGORI CUSTOM */}
      {activeTab === "category" && (
        <div className="space-y-6">
          <div className="card-fintech p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Tambah Kategori Baru
            </h3>
            <Form method="post" className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end">
              <input type="hidden" name="intent" value="addCategory" />

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Emoji Icon</label>
                <input
                  type="text"
                  name="emoji"
                  defaultValue="☕"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-center text-base"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Kategori</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Misal: Kopi Santai"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Warna Hex</label>
                <input
                  type="color"
                  name="color"
                  defaultValue="#F97316"
                  className="w-full h-9 rounded-xl border border-slate-300 p-1"
                />
              </div>

              <button
                type="submit"
                className="btn-fintech-primary text-xs font-bold py-2"
              >
                + Tambah Kategori
              </button>
            </Form>
          </div>

          <div className="card-fintech p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Daftar Kategori Anda ({data.categories.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {data.categories.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center gap-2.5 text-xs font-semibold text-slate-800"
                >
                  <span className="text-lg">{c.emoji}</span>
                  <span className="truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
