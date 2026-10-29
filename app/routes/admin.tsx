import { Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  ShieldAlert,
  Users,
  Cpu,
  CreditCard,
  Activity,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);

  if (!session.isAuthenticated || !session.user) {
    return redirect("/login");
  }

  // Non-admin Guard: Redirect back to user's authorized area
  if (!session.isAdmin) {
    if (session.user.verification_status === "approved") {
      return redirect("/dashboard?error=access_denied");
    }
    return redirect("/verification-pending?error=access_denied");
  }

  const url = new URL(request.url);
  const accessDenied = url.searchParams.get("error") === "access_denied";

  return json({
    user: session.user,
    accessDenied,
  });
}

export default function AdminLayout() {
  const { user, accessDenied } = useLoaderData<typeof loader>();

  const adminNav = [
    { name: "Ringkasan Sistem", to: "/admin", end: true, icon: Activity },
    { name: "Kelola Pengguna", to: "/admin/users", icon: Users },
    { name: "AI Providers & Failover", to: "/admin/providers", icon: Cpu },
    { name: "Persetujuan Midtrans", to: "/admin/payments", icon: CreditCard },
    { name: "AI Logs & Audit Trail", to: "/admin/logs", icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Admin */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-600 text-white font-extrabold flex items-center justify-center text-xs">
                SA
              </div>
              <span className="font-bold text-white text-sm">Superadmin Panel</span>
            </div>
            <Lock className="w-4 h-4 text-rose-500" />
          </div>

          <nav className="p-4 space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-rose-600 text-white font-bold"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <Link
            to="/logout"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-900/40 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Keluar (Logout)
          </Link>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {accessDenied && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="font-extrabold text-xs text-amber-900">Akses Ditolak</div>
                <div className="text-[11px] text-amber-800">
                  Admin tidak diizinkan mengakses dashboard pengguna. Anda telah dialihkan kembali ke Dashboard Admin Anda.
                </div>
              </div>
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
