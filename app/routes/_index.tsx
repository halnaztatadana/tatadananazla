import { useState } from "react";
import { Link } from "@remix-run/react";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Bot,
  Receipt,
  Mic,
  PieChart,
  ShieldCheck,
  Zap,
  ChevronDown,
  Play,
  Wallet,
  FileSpreadsheet,
  TrendingUp,
  MessageSquare,
  Send,
  Star,
} from "lucide-react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { getSessionContext } from "~/lib/supabase/server";
import { parseIndonesianTransaction, formatRupiah } from "~/lib/store";
import { json } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);
  return json({
    user: session.user || null,
    isAuthenticated: Boolean(session.isAuthenticated),
    isAdmin: Boolean(session.isAdmin),
  });
}

export default function LandingPage() {
  // Interactive Telegram Bot simulator state
  const [demoInput, setDemoInput] = useState("Kopi Kenangan 28rb gopay");
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "user" | "bot"; text: string; time: string }>
  >([
    {
      sender: "user",
      text: "Nasi padang 35rb tunai",
      time: "12:15 WIB",
    },
    {
      sender: "bot",
      text: `💸 **PENGELUARAN TERCATAT**\n• Nominal: **Rp 35.000**\n• Kategori: 🍔 Makanan & Minuman\n• Dompet: Tunai (Sisa: Rp 715.000)\n• Catatan: Nasi padang\n\n📊 **Status Budget:** [████░░░░░░] 42%`,
      time: "12:15 WIB",
    },
  ]);

  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleSendDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim()) return;

    const userText = demoInput.trim();
    const parsed = parseIndonesianTransaction(userText);
    const nowTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";

    let botResponse = "";
    if (parsed) {
      if (parsed.jenis === "expense") {
        botResponse = `💸 **PENGELUARAN TERCATAT**\n• Nominal: **${formatRupiah(parsed.nominal)}**\n• Kategori: ${parsed.kategori}\n• Dompet: ${parsed.walletName || "Tunai"} (Sisa: Rp 2.450.000)\n• Catatan: ${parsed.catatan}\n\n📊 **Status Budget:** [█████░░░░░] 54%`;
      } else if (parsed.jenis === "income") {
        botResponse = `💰 **PEMASUKAN TERCATAT**\n• Nominal: **${formatRupiah(parsed.nominal)}**\n• Kategori: ${parsed.kategori}\n• Dompet: ${parsed.walletName || "BCA"}\n• Catatan: ${parsed.catatan}\n\n✨ *Mantap! Jangan lupa sisihkan minimal 20% untuk tabungan.*`;
      } else {
        botResponse = `🔄 **TRANSFER BERHASIL**\n• Nominal: **${formatRupiah(parsed.nominal)}**\n• Catatan: ${parsed.catatan}`;
      }
    } else {
      botResponse = `🤖 Maaf, saya tidak dapat mendeteksi nominal transaksi.\nContoh: "kopi 25rb" atau "gajian 8jt bca"`;
    }

    setChatMessages((prev) => [
      ...prev,
      { sender: "user", text: userText, time: nowTime },
      { sender: "bot", text: botResponse, time: nowTime },
    ]);
    setDemoInput("");
  };

  const faqs = [
    {
      q: "Apakah data keuangan saya aman di TataDana?",
      a: "Ya, semua data dilindungi enkripsi tingkat perbankan (AES-256) dan Row Level Security (RLS) di Supabase. Kami tidak pernah meminta kredensial perbankan atau PIN Anda.",
    },
    {
      q: "Bagaimana cara menghubungkan akun Telegram?",
      a: "Cukup daftar ke web TataDana, buka menu Pengaturan > Telegram Bot, lalu klik tautan undangan atau ketik /start dengan kode unik Anda di bot @TataDanaBot.",
    },
    {
      q: "Apakah bot mendukung voice note bahasa Indonesia / daerah?",
      a: "Ya, AI multimodal kami ditenagai Whisper & Gemini yang sangat fasih mengenali bahasa Indonesia sehari-hari, singkatan gaul, hingga dialek lokal umum.",
    },
    {
      q: "Apa perbedaan paket Starter dan Pro?",
      a: "Paket Starter gratis (maks 50 transaksi/bulan) cocok untuk mencoba. Paket Pro (Rp 49.000/bln) memberikan transaksi unlimited, OCR scan struk otomatis, transkripsi voice note, dan export laporan PDF/Excel.",
    },
    {
      q: "Bagaimana cara export laporan ke PDF atau Excel?",
      a: "Di dashboard, buka menu 'Laporan', pilih periode tanggal yang diinginkan, lalu klik tombol 'Export PDF' atau 'Export Excel'. Dokumen langsung di-generate seketika.",
    },
    {
      q: "Metode pembayaran apa saja yang didukung?",
      a: "Kami bekerja sama dengan Midtrans mendukung QRIS (GoPay, OVO, ShopeePay, BCA, dsb.), Virtual Account bank besar, serta transfer manual terverifikasi.",
    },
    {
      q: "Bisakah saya menggunakan lebih dari satu rekening / dompet?",
      a: "Tentu! Anda bisa mengelola dompet Tunai, BCA, Mandiri, GoPay, OVO, ShopeePay, dan bebas memindahkan saldo (transfer internal) antar dompet.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* SECTION 1: Sticky Navbar Matching Screenshot */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-brand font-black text-xl">
              T
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900 font-display">
                Tata<span className="text-slate-900">Dana</span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <a href="#fitur" className="hover:text-orange-500 transition-colors">
              Fitur
            </a>
            <a href="#cara-kerja" className="hover:text-orange-500 transition-colors">
              Cara Kerja
            </a>
            <a href="#pricing" className="hover:text-orange-500 transition-colors">
              Harga
            </a>
            <a href="#faq" className="hover:text-orange-500 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-orange-600 transition-colors"
            >
              Masuk
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-95 rounded-xl shadow-sm transition-all"
            >
              Coba Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* SECTION 2 & 3: Hero Section Matching Screenshot 1:1 */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Pre-headline Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/60 text-orange-700 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
              <span>✨</span>
              <span>Catat keuangan langsung dari Telegram</span>
            </div>

            {/* Main Headline (Exact screenshot match) */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.15] font-display">
              Gaji habis sebelum akhir bulan?<br />
              <span className="text-orange-500">Sudah saatnya kamu tahu</span> ke mana uangmu pergi.
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk — sisanya kami yang urus.
            </p>

            {/* Hero CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 text-base font-extrabold text-white bg-orange-500 hover:bg-orange-600 active:scale-95 rounded-xl shadow-brand flex items-center justify-center gap-2 transition-all"
              >
                Mulai Gratis Sekarang
              </Link>
              <a
                href="#cara-kerja"
                className="w-full sm:w-auto px-8 py-4 text-base font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                Lihat cara kerjanya &rarr;
              </a>
            </div>

           
            <div className="mt-10 flex items-center justify-center gap-6 text-xs sm:text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tanpa Kartu Kredit
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Enkripsi Bank-Grade
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Setup 60 Detik
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Video Placeholder / Demo Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 text-xl font-bold"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Demo Interaktif TataDana
            </h3>
            <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex flex-col items-center justify-center text-white p-8 text-center relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-orange-500/90 flex items-center justify-center mb-4 shadow-lg animate-pulse">
                <Play className="w-8 h-8 fill-white ml-1" />
              </div>
              <p className="font-semibold text-lg">Simulasi Video Pencatatan AI Telegram</p>
              <p className="text-sm text-slate-300 mt-2">
                "Ketik 'makan siang 35rb', struk belanja Indomaret, hingga voice note audio otomatis tersimpan ke dashboard."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: Problem-Solution Section */}
      <section className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold tracking-widest text-orange-600 uppercase">
              Masalah & Solusi
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 font-display">
              Kenapa Aplikasi Finansial Biasa Sering Ditinggalkan?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Problem Box */}
            <div className="p-8 rounded-3xl bg-rose-50/50 border border-rose-200">
              <h3 className="text-lg font-bold text-rose-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-sm font-bold">
                  ✕
                </span>
                Cara Lama Yang Menyiksa
              </h3>
              <ul className="space-y-4 text-slate-600 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">•</span>
                  Harus login berkali-kali & buka aplikasi lambat hanya untuk mencatat kopi 20rb.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">•</span>
                  Lupa mencatat saat sedang di jalan atau buru-buru, berakhir bocor halus ratusan ribu.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">•</span>
                  Struk belanja kertas menumpuk di dompet dan akhirnya terbuang sia-sia tanpa rekap.
                </li>
              </ul>
            </div>

            {/* Solution Box */}
            <div className="p-8 rounded-3xl bg-emerald-50/50 border border-emerald-200">
              <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-sm font-bold">
                  ✓
                </span>
                Solusi Instan TataDana
              </h3>
              <ul className="space-y-4 text-slate-600 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">•</span>
                  Ketik 3 kata di Telegram yang selalu terbuka di HP kamu — selesai dalam 3 detik!
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">•</span>
                  Foto struk belanja, AI OCR otomatis mengurai setiap item & nominal ke laporan.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">•</span>
                  Laporan visual instan dengan alert saat budget bulanan kamu sudah 80% terpakai.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: Interactive Dashboard & Telegram Preview */}
      <section id="demo" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold tracking-widest text-orange-600 uppercase">
              Coba Langsung
            </h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
              Simulator Telegram Bot TataDana
            </p>
            <p className="mt-3 text-slate-600">
              Ketik transaksi kamu di bawah dan rasakan bagaimana AI kami memproses bahasa Indonesia secara instan.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
            {/* Telegram Chat Mockup */}
            <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-800 text-white flex flex-col h-[520px]">
              {/* Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">TataDana Bot</h4>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online • AI Natural Language
                  </p>
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2 text-sm">
                {chatMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      m.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 whitespace-pre-line ${
                        m.sender === "user"
                          ? "bg-orange-500 text-white rounded-tr-none"
                          : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none font-mono text-xs"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
                  </div>
                ))}
              </div>

              {/* Quick Suggestion Chips */}
              <div className="flex gap-2 overflow-x-auto py-2 border-t border-slate-800 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setDemoInput("Beli bensin 50rb")}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 whitespace-nowrap"
                >
                  "Beli bensin 50rb"
                </button>
                <button
                  type="button"
                  onClick={() => setDemoInput("Gajian 7.5jt BCA")}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 whitespace-nowrap"
                >
                  "Gajian 7.5jt BCA"
                </button>
                <button
                  type="button"
                  onClick={() => setDemoInput("transfer 200rb bca ke gopay")}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 whitespace-nowrap"
                >
                  "transfer 200rb"
                </button>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSendDemo} className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={demoInput}
                  onChange={(e) => setDemoInput(e.target.value)}
                  placeholder="Ketik misal: bakso 15rb..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-white transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Dashboard Snapshot Mockup */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Sinkronisasi Dashboard Realtime
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Setiap chat di Telegram langsung muncul di web dashboard Anda.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                    🟢 Realtime Connected
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-xs text-slate-500">Saldo Total</p>
                    <p className="text-lg font-extrabold text-slate-900 mt-1">Rp 20.450.000</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">3 Dompet Terhubung</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100">
                    <p className="text-xs text-orange-600">Pengeluaran Okt</p>
                    <p className="text-lg font-extrabold text-orange-600 mt-1">Rp 4.234.000</p>
                    <span className="text-[10px] text-slate-500">Budget: Rp 6.500.000</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 col-span-2 sm:col-span-1">
                    <p className="text-xs text-emerald-600">Pemasukan Okt</p>
                    <p className="text-lg font-extrabold text-emerald-600 mt-1">Rp 18.000.000</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">+12% dari bln lalu</span>
                  </div>
                </div>

                {/* Progress bars preview */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>🍔 Makanan & Minuman</span>
                      <span>Rp 1.850.000 / Rp 3.000.000 (61%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full w-[61%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>🛍️ Belanja Supermarket</span>
                      <span className="text-amber-600 font-bold">Rp 1.750.000 / Rp 2.000.000 (87.5% - Waspada)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-[87.5%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Ingin mengecek laporan lengkap dalam format PDF / Excel?
                </span>
                <Link
                  to="/register"
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  Coba Dashboard Sekarang →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: 3 Alternating Feature Cards */}
      <section id="fitur" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs font-bold tracking-widest text-orange-600 uppercase">
              Fitur Unggulan
            </h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
              Teknologi AI Finansial Tercanggih untuk Kamu
            </p>
          </div>

          <div className="space-y-20">
            {/* Feature 1: OCR Receipt */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-6">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Vision OCR Scan Struk Belanja Otomatis (Pro)
                </h3>
                <p className="mt-4 text-slate-600 leading-relaxed">
                  Cukup jepret struk belanja dari Indomaret, Alfamart, restoran, atau supermarket mana pun.
                  AI TataDana membedah nama toko, tanggal, hingga rincian masing-masing item belanja secara otomatis tanpa Anda perlu mengetik satu per satu.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-white border border-slate-200 text-xs font-medium rounded-lg text-slate-700">
                    Rincian Multi-item
                  </span>
                  <span className="px-3 py-1 bg-white border border-slate-200 text-xs font-medium rounded-lg text-slate-700">
                    Auto-kategorisasi item
                  </span>
                  <span className="px-3 py-1 bg-white border border-slate-200 text-xs font-medium rounded-lg text-slate-700">
                    Arsip Foto Cloud
                  </span>
                </div>
              </div>
              <div className="p-6 bg-white rounded-3xl shadow-lg border border-slate-200">
                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                  <p className="text-xs font-bold text-orange-800 uppercase tracking-wide">
                    Hasil Ekstraksi OCR
                  </p>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-orange-200/50">
                      <span>Susu UHT Diamond 1L</span>
                      <span className="font-bold">Rp 22.000</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-orange-200/50">
                      <span>Roti Gandum Sari Roti</span>
                      <span className="font-bold">Rp 18.000</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-orange-200/50">
                      <span>Telur Ayam Negeri 1kg</span>
                      <span className="font-bold">Rp 32.000</span>
                    </div>
                    <div className="flex justify-between pt-2 font-bold text-slate-900 text-sm">
                      <span>Total Transaksi</span>
                      <span className="text-orange-600">Rp 72.000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Voice Note Transcription */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
              <div className="order-1 lg:order-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-6">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Catat Cepat Pakai Voice Note (Audio hingga 60 Detik)
                </h3>
                <p className="mt-4 text-slate-600 leading-relaxed">
                  Sedang menyetir atau tangan sibuk? Cukup tahan tombol mikrofon di Telegram dan ucapkan:
                  <i> "Beli bensin pertamax 50 ribu pakai tunai"</i>. TataDana langsung mentranskripsi dan mencatatnya ke dompet yang tepat.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-white border border-slate-200 text-xs font-medium rounded-lg text-slate-700">
                    Transkrip Akurat
                  </span>
                  <span className="px-3 py-1 bg-white border border-slate-200 text-xs font-medium rounded-lg text-slate-700">
                    Deteksi Dompet Otomatis
                  </span>
                </div>
              </div>
              <div className="order-2 lg:order-1 p-6 bg-white rounded-3xl shadow-lg border border-slate-200">
                <div className="p-4 bg-slate-900 rounded-2xl text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                      <Mic className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Voice Note (0:04)</p>
                      <p className="text-[11px] text-slate-400">Audio Telegram diterima</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-slate-800 rounded-xl text-xs text-orange-300 font-mono">
                    🎙️ Transkrip: "Beli bensin pertamax 50 ribu"
                  </div>
                  <p className="text-xs text-emerald-400 mt-2 font-semibold">
                    ✓ Sukses dicatat ke kategori Transportasi
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3: Export PDF & Excel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-6">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Laporan On-Demand PDF & Excel (.xlsx) Siap Download
                </h3>
                <p className="mt-4 text-slate-600 leading-relaxed">
                  Perlu laporan untuk SPT Pajak, reimbursement kantor, atau evaluasi anggaran keluarga?
                  Download laporan lengkap dengan filter kategori, wallet, dan rentang tanggal dengan sekali klik.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-white border border-slate-200 text-xs font-medium rounded-lg text-slate-700">
                    Signed Ephemeral URL
                  </span>
                  <span className="px-3 py-1 bg-white border border-slate-200 text-xs font-medium rounded-lg text-slate-700">
                    Format Standar Akuntansi
                  </span>
                </div>
              </div>
              <div className="p-6 bg-white rounded-3xl shadow-lg border border-slate-200 flex items-center justify-center">
                <div className="space-y-4 w-full max-w-sm">
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-xs">
                        PDF
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Laporan_Okt_2026.pdf</p>
                        <p className="text-[10px] text-slate-500">Auto-Table Formatted</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-rose-600">Siap Cetak</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                        XLS
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Rekap_Transaksi.xlsx</p>
                        <p className="text-[10px] text-slate-500">Excel / Google Sheets</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600">Terbuka</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: Masonry Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold tracking-widest text-orange-600 uppercase">
              Kata Pengguna
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 font-display">
              Disukai oleh 10.000+ Pekerja Lepas & Profesional Muda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  "Sumpah ini penyelamat keuangan freelancer! Dulu struk supermarket numpuk gak pernah direkap. Sekarang tinggal foto langsung beres."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-200 text-orange-800 font-bold flex items-center justify-center text-sm">
                  BA
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Bagus Anugrah</h4>
                  <p className="text-[10px] text-slate-500">Full-stack Developer, Jakarta</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  "Yang paling saya suka respon botnya cepet banget di bawah 1 detik. Fitur voice note juga jalan mulus waktu nyetir motor."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center text-sm">
                  DP
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Dina Pratiwi</h4>
                  <p className="text-[10px] text-slate-500">Product Manager, Bandung</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  "Alert budget 80% ngebantu banget ngerem kebiasaan beli kopi kekinian. Bulan kemarin berhasil nabung 30% dari penghasilan!"
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-sm">
                  RS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Rizky Setiawan</h4>
                  <p className="text-[10px] text-slate-500">Graphic Designer, Surabaya</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: Pricing Section */}
      <section id="pricing" className="py-20 lg:py-28 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold tracking-widest text-orange-600 uppercase">
              Pilihan Paket
            </h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
              Investasi Kecil untuk Keuangan Teratur
            </p>
            <p className="mt-3 text-slate-600">
              Pilih paket yang paling sesuai dengan ritme keuangan harian Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Starter Plan */}
            <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  Paket Dasar
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-4">Starter</h3>
                <p className="text-xs text-slate-500 mt-1">Cocok untuk pemula yang ingin mencoba integrasi bot.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-slate-900">Rp 0</span>
                  <span className="text-slate-500 text-sm"> / bulan</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Maks 50 transaksi/bulan
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Pencatatan teks Telegram
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1 Dompet Tunai
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Laporan Dasar
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="mt-8 w-full py-3 text-center font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-sm"
              >
                Mulai Gratis
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white">
                Paling Populer ⭐
              </div>
              <div>
                <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full">
                  Paket Lengkap
                </span>
                <h3 className="text-2xl font-bold mt-4">TataDana Pro</h3>
                <p className="text-xs text-orange-100 mt-1">Untuk kontrol keuangan maksimal tanpa batas.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold">Rp 49.000</span>
                  <span className="text-orange-100 text-sm"> / bulan</span>
                </div>
                <ul className="space-y-3 text-sm text-orange-50">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white" /> Unlimited transaksi
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white" /> OCR Struk Belanja Otomatis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white" /> Voice Note Transkripsi
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white" /> Multi-dompet Unlimited
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white" /> Export PDF & Excel
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white" /> AI Advisor anomaly detection
                  </li>
                </ul>
              </div>
              <Link
                to="/register?plan=pro"
                className="mt-8 w-full py-3 text-center font-bold text-orange-600 bg-white hover:bg-orange-50 rounded-xl shadow-md transition-colors text-sm"
              >
                Upgrade ke Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10: FAQ Accordion */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold tracking-widest text-orange-600 uppercase">
              Tanya Jawab
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 font-display">
              Pertanyaan yang Sering Diajukan
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full text-left p-5 flex items-center justify-between font-semibold text-slate-800 hover:text-orange-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                      activeFaq === index ? "rotate-180 text-orange-500" : ""
                    }`}
                  />
                </button>
                {activeFaq === index && (
                  <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 11: Final CTA Gradient Orange & 4-Column Footer */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-orange-500 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
            Siap Kendalikan Keuangan Tanpa Beban?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-orange-100 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan pengguna lain yang telah menghemat waktu dan mencegah kebocoran anggaran dengan TataDana.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-white text-orange-600 font-bold rounded-xl shadow-2xl hover:bg-orange-50 transition-all active:scale-95 text-base"
            >
              Mulai Sekarang Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* 4-Column Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-white font-bold mb-4 font-display text-base">TataDana</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Platform SaaS manajemen keuangan pribadi Indonesia terintegrasi bot Telegram & AI multimodal.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">Produk</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#fitur" className="hover:text-white transition-colors">Telegram Bot</a></li>
                <li><a href="#fitur" className="hover:text-white transition-colors">Vision OCR Struk</a></li>
                <li><a href="#fitur" className="hover:text-white transition-colors">Voice Note Transkripsi</a></li>
                <li><a href="#fitur" className="hover:text-white transition-colors">Export Laporan</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">Bantuan</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Dokumentasi API</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Status Server</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2 text-xs">
                <li><span className="hover:text-white cursor-pointer">Kebijakan Privasi</span></li>
                <li><span className="hover:text-white cursor-pointer">Syarat & Ketentuan</span></li>
                <li><span className="hover:text-white cursor-pointer">Keamanan Data RLS</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
            <p>© 2026 TataDana Inc. Seluruh hak cipta dilindungi undang-undang.</p>
            <p className="mt-2 sm:mt-0">Dibuat dengan ❤️ di Indonesia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
