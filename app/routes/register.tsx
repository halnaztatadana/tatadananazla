import { useState, useEffect } from "react";
import { Link, useSearchParams } from "@remix-run/react";
import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { store } from "~/lib/store";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const phone = formData.get("phone") as string;
  const plan = (formData.get("plan") as "starter" | "pro") || "starter";

  const newProfile = store.createUser({
    userId: `usr_${Date.now()}`,
    email,
    fullName: fullName || "Pengguna Baru",
    phoneNumber: phone,
    plan,
    role: "user",
    isAdmin: false,
    verificationStatus: "pending",
    password,
  });

  const session = store.createSession(newProfile.user_id);
  const sessionToken = session ? session.token : newProfile.user_id;

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `tatadana_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
  );
  headers.append(
    "Set-Cookie",
    `tatadana_session_user=${newProfile.user_id}; Path=/; SameSite=Lax; Max-Age=2592000`
  );

  return redirect("/verification-pending", { headers });
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get("plan") === "pro" ? "pro" : "starter";
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro">(initialPlan);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [mockOtpHint, setMockOtpHint] = useState<string | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, countdown]);

  const handleSendOtp = () => {
    if (!phone || phone.length < 9) return;
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setMockOtpHint(randomOtp);
    setOtpSent(true);
    setCountdown(60);
    setIsTimerActive(true);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* 40% BRANDING SECTION */}
      <div className="w-full lg:w-[40%] bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 p-8 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-orange-600 font-extrabold flex items-center justify-center text-xl shadow-md">
              TD
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-display">
              TataDana
            </span>
          </Link>

          <div className="mt-12 lg:mt-20">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold text-white mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Daftar Dalam 30 Detik
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight font-display leading-tight">
              Mulai perjalan finansial cerdasmu hari ini.
            </h2>
            <p className="mt-4 text-orange-100 text-sm leading-relaxed">
              Langsung dapatkan akses bot Telegram @TataDanaBot tanpa ribet instalasi aplikasi tambahan.
            </p>
          </div>
        </div>

        {/* Plan Summary Badge */}
        <div className="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
          <p className="text-xs uppercase tracking-wider font-semibold text-orange-200">
            Paket Pilihan:
          </p>
          <p className="text-lg font-bold text-white mt-1">
            {selectedPlan === "pro" ? "TataDana Pro (Rp 49.000/bln)" : "TataDana Starter (Gratis)"}
          </p>
          <p className="text-xs text-orange-100 mt-1">
            {selectedPlan === "pro"
              ? "Unlimited transaksi + OCR Scan Struk + Voice Note"
              : "Hingga 50 transaksi / bulan"}
          </p>
        </div>
      </div>

      {/* 60% INTERACTIVE FORM SECTION */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900 font-display">
              Buat Akun TataDana
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sudah punya akun?{" "}
              <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-500">
                Masuk di sini
              </Link>
            </p>
          </div>

          <form method="post" className="space-y-4">
            <input type="hidden" name="plan" value={selectedPlan} />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ahmad Fauzan"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fauzan@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor WhatsApp / HP (Verifikasi SMS OTP)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  name="phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={!phone || phone.length < 9}
                className="w-full py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-800 disabled:opacity-50 font-semibold rounded-xl text-xs transition-colors"
              >
                Kirim Kode OTP SMS Gateway
              </button>
            ) : (
              <div>
                {mockOtpHint && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-2">
                    💬 <b>Simulasi SMS:</b> Kode OTP aktivasi Anda adalah <b>{mockOtpHint}</b>
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Masukkan 6 Digit OTP"
                    className="flex-1 px-4 py-2 text-center tracking-widest font-mono font-bold rounded-xl border border-slate-300 text-sm focus:border-orange-500"
                  />
                  <button
                    type="button"
                    disabled={isTimerActive}
                    onClick={handleSendOtp}
                    className="px-3 py-2 text-xs text-orange-600 font-semibold disabled:text-slate-400 whitespace-nowrap"
                  >
                    {isTimerActive ? `(${countdown}s)` : "Kirim Ulang"}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm mt-6"
            >
              Daftar & Hubungkan Bot
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
