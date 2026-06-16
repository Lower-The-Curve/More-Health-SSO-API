import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation, Redirect } from "wouter";
import { useLogout } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  Package,
  Plug,
  Settings as SettingsIcon,
  Languages,
  Shield,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useCurrentUser } from "@/lib/useCurrentUser";

type NavId = "dashboard" | "users" | "orders" | "integrations" | "translations" | "settings";

interface NavItem {
  id: NavId;
  href: string;
  labelEn: string;
  labelZh: string;
  icon: typeof LayoutDashboard;
}

const NAV: NavItem[] = [
  { id: "dashboard", href: "/admin", labelEn: "Dashboard", labelZh: "概览", icon: LayoutDashboard },
  { id: "users", href: "/admin/users", labelEn: "Users", labelZh: "用户", icon: Users },
  { id: "orders", href: "/admin/orders", labelEn: "Orders", labelZh: "订单", icon: Package },
  { id: "integrations", href: "/admin/integrations", labelEn: "Integrations", labelZh: "集成", icon: Plug },
  { id: "translations", href: "/admin/translations", labelEn: "Translations", labelZh: "翻译", icon: Languages },
  { id: "settings", href: "/admin/settings", labelEn: "Settings", labelZh: "设置", icon: SettingsIcon },
];

export function AdminLayout({
  active,
  children,
}: {
  active: NavId;
  children: ReactNode;
}) {
  const { t, lang, setLang } = useLang();
  const { isAdmin, isLoaded, profile, fullName, initials } = useCurrentUser();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = useLogout();

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Gate: must be signed in AND admin. Otherwise bounce.
  if (!isLoaded) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-950 text-slate-400">
        {t("Loading…", "加载中…")}
      </div>
    );
  }
  if (!profile) return <Redirect to="/admin/sign-in" />;
  if (!isAdmin) return <Redirect to="/dashboard" />;

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-[100dvh] w-[248px] bg-slate-950 text-slate-200 flex flex-col transition-transform md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white leading-tight">
              {t("Staff Console", "员工控制台")}
            </div>
            <div className="text-[11px] text-slate-400 leading-tight">More Health</div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-slate-800/80 text-white"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{lang === "zh" ? item.labelZh : item.labelEn}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-3 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800/40 hover:text-white"
          >
            <span>{t("Influencer dashboard", "影响者后台")}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{fullName}</div>
              <div className="text-[10px] text-slate-500 truncate">{profile?.email ?? "—"}</div>
            </div>
            <button
              onClick={() => {
                void logout();
              }}
              className="text-slate-400 hover:text-white"
              title={t("Sign out", "退出登录")}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 md:ml-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-slate-600 hover:text-slate-900"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">
              {t("Admin", "管理")}
            </div>
            <div className="text-sm font-semibold truncate">
              {t(NAV.find((n) => n.id === active)?.labelEn ?? "", NAV.find((n) => n.id === active)?.labelZh ?? "")}
            </div>
          </div>
          <button
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
          >
            {lang === "en" ? "中" : "EN"}
          </button>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
