import { Link, NavLink, Outlet, useLoaderData, Form } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  LayoutDashboard,
  Receipt,
  FileSpreadsheet,
  PieChart,
  Wallet,
  Settings,
  LogOut,
  ShieldAlert,
  Bot,
  User,
  ExternalLink,
} from "lucide-react";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);
  if (!session.isAuthenticated || !session.user) {
    return redirect("/login");
  }

  // Admin cannot access user dashboard
  if (session.isAdmin && !session.isImpersonating) {
    return redirect("/admin?error=access_denied");
  }

  // Pending user cannot access user dashboard
  if (session.user.verification_status !== "approved") {
    return redirect("/verification-pending");
  }

  const url = new URL(request.url);
  const accessDenied = url.searchParams.get("error") === "access_denied";

  return json({
    user: session.user,
    isAdmin: session.isAdmin,
    isImpersonating: session.isImpersonating,
    accessDenied,
  });
}

export default function DashboardLayout() {
  const { user, isAdmin, isImpersonating, accessDenied } = useLoaderData<typeof loader>();

  const navItems = [
    { name: "Beranda", to: "/dashboard", icon: LayoutDashboard, end: true },
    { name: "Transaksi", to: "/dashboard/transactions", icon: Receipt },
    { name: "Laporan", to: "/dashboard/reports", icon: FileSpreadsheet },
    { name: "Budget", to: "/dashboard/budgets", icon: PieChart },
    { name: "Dompet / Wallet", to: "/dashboard/wallets", icon: Wallet },
    { name: "Pengaturan", to: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-900 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-900" />
            <span>
              Mode Impersonasi Aktif: Anda sedang melihat dashboard sebagai <u>{user.full_name}</u> ({user.user_id})
            </span>
          </div>
          <Form method="post" action="/admin/impersonate">
            <input type="hidden" name="action" value="stop" />
            <button
              type="submit"
              className="bg-slate-900 text-white px-3 py-1 rounded-md text-[11px] font-semibold hover:bg-slate-800 transition-colors"
            >
              Kembali ke Panel Admin
            </button>
          </Form>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 ${
          isImpersonating ? "mt-8" : ""
        }`}
      >
        <div>
          {/* Logo & Brand */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                TD
              </div>
              <span className="font-extrabold text-lg text-slate-900 font-display">
                Tata<span className="text-orange-500">Dana</span>
              </span>
            </Link>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                user.plan === "pro"
                  ? "bg-orange-100 text-orange-700 border border-orange-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {user.plan}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}

            {/* Admin Link if superadmin */}
            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-slate-100">
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Superadmin Panel
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs shrink-0">
                {user.full_name?.slice(0, 2).toUpperCase() || "TD"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user.full_name}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user.email || user.phone_number || "Pengguna"}
                </p>
              </div>
            </div>
            <Link
              to="/logout"
              title="Keluar"
              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto ${isImpersonating ? "mt-8" : ""}`}>
        {accessDenied && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="font-extrabold text-xs text-amber-900">Akses Ditolak</div>
                <div className="text-[11px] text-amber-700">
                  Anda tidak memiliki izin untuk mengakses halaman Admin. Anda telah dialihkan kembali ke Dashboard User Anda.
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
