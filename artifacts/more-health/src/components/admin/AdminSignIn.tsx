import { Redirect } from "wouter";
import { Shield } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useAuth, startLogin } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AdminSignIn() {
  const { t } = useLang();
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  if (isSignedIn) {
    return <SignedInRouter />;
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col">
      <div className="flex-1 grid lg:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-900 via-slate-950 to-violet-950 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #6366f1 0, transparent 50%), radial-gradient(circle at 80% 70%, #8b5cf6 0, transparent 50%)",
            }}
          />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold">More Health</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">
                {t("Staff Console", "员工控制台")}
              </div>
            </div>
          </div>
          <div className="relative">
            <h1 className="text-4xl font-bold leading-tight mb-4">
              {t("Operations & administration", "运营与管理")}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-md">
              {t(
                "Manage users, monitor orders, configure integrations. Restricted to authorized staff.",
                "管理用户、查看订单、配置集成。仅限授权员工访问。",
              )}
            </p>
          </div>
          <div className="relative text-xs text-slate-500">
            {t("Looking for the influencer portal?", "寻找影响者门户？")}{" "}
            <a
              href={`${basePath}/sign-in`}
              className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
            >
              {t("Sign in here", "点此登录")}
            </a>
          </div>
        </div>

        {/* Auth panel */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-50 text-slate-900">
          <div className="lg:hidden mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base font-semibold">More Health</div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider">
                {t("Staff Console", "员工控制台")}
              </div>
            </div>
          </div>
          <div className="w-full max-w-sm mb-4 text-center">
            <h2 className="text-xl font-semibold mb-1">
              {t("Staff sign in", "员工登录")}
            </h2>
            <p className="text-sm text-slate-500">
              {t(
                "Use your authorized staff account.",
                "使用您的授权员工账户登录。",
              )}
            </p>
          </div>
          <div className="w-full max-w-sm">
            <Button className="w-full" onClick={() => startLogin("/admin")}>
              {t("Sign in", "登录")}
            </Button>
          </div>
          <p className="mt-6 text-xs text-slate-400 text-center max-w-sm">
            {t(
              "Access requires admin privileges. Contact an existing admin to be granted access.",
              "访问需要管理员权限。请联系现有管理员授予访问权限。",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function SignedInRouter() {
  const { isLoaded, profile, isAdmin } = useCurrentUser();
  if (!isLoaded || !profile) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
        Loading…
      </div>
    );
  }
  return <Redirect to={isAdmin ? "/admin" : "/dashboard"} />;
}
