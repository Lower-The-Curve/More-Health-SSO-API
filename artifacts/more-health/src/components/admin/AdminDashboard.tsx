import { useMemo } from "react";
import { Link } from "wouter";
import {
  Users,
  Package,
  Plug,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLang } from "@/lib/i18n";
import { AdminLayout } from "./AdminLayout";
import {
  useAdminListUsers,
  useAdminListOrders,
  useAdminGetIntegrations,
} from "@workspace/api-client-react";

export function AdminDashboard() {
  const { t } = useLang();
  const usersQuery = useAdminListUsers();
  const ordersQuery = useAdminListOrders();
  const integrationsQuery = useAdminGetIntegrations();

  const stats = useMemo(() => {
    const users = usersQuery.data ?? [];
    const orders = ordersQuery.data ?? [];
    const totalUsers = users.length;
    const adminUsers = users.filter((u) => u.isAdmin).length;
    const totalOrders = orders.length;
    const mappedOrders = orders.filter((o) => o.clerkUserId).length;
    const unmappedOrders = totalOrders - mappedOrders;
    const grossCents = orders.reduce(
      (acc, o) => acc + (o.amountCents ?? 0),
      0,
    );
    return {
      totalUsers,
      adminUsers,
      totalOrders,
      mappedOrders,
      unmappedOrders,
      grossCents,
    };
  }, [usersQuery.data, ordersQuery.data]);

  const loading = usersQuery.isLoading || ordersQuery.isLoading;
  const shopifyConnected =
    (integrationsQuery.data?.stats?.shopifyOrders ?? 0) > 0;

  return (
    <AdminLayout active="dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("Dashboard", "概览")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t(
              "Operational snapshot across users, orders, and integrations.",
              "用户、订单与集成的运营快照。",
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={Users}
            label={t("Total users", "用户总数")}
            value={stats.totalUsers}
            sub={t(`${stats.adminUsers} admin`, `${stats.adminUsers} 名管理员`)}
            loading={loading}
          />
          <KpiCard
            icon={Package}
            label={t("Total orders", "订单总数")}
            value={stats.totalOrders}
            sub={
              stats.unmappedOrders > 0
                ? t(
                    `${stats.unmappedOrders} unmapped`,
                    `${stats.unmappedOrders} 未关联`,
                  )
                : t("All mapped", "全部已关联")
            }
            subTone={stats.unmappedOrders > 0 ? "warn" : "ok"}
            loading={loading}
          />
          <KpiCard
            icon={TrendingUp}
            label={t("Gross sales", "销售总额")}
            value={`$${(stats.grossCents / 100).toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`}
            sub={t("All orders", "全部订单")}
            loading={loading}
          />
          <KpiCard
            icon={ShieldCheck}
            label={t("Mapped orders", "已关联订单")}
            value={stats.mappedOrders}
            sub={
              stats.totalOrders > 0
                ? `${Math.round((stats.mappedOrders / stats.totalOrders) * 100)}% ${t("of total", "占比")}`
                : "—"
            }
            subTone={
              stats.totalOrders > 0 && stats.mappedOrders === stats.totalOrders
                ? "ok"
                : undefined
            }
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                {t("Users", "用户")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-500">
                {t(
                  "Review accounts, edit profiles, grant admin access.",
                  "查看账户、编辑资料、授予管理员权限。",
                )}
              </p>
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                {t("Manage users", "管理用户")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                {t("Orders", "订单")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-500">
                {stats.unmappedOrders > 0
                  ? t(
                      `${stats.unmappedOrders} order(s) not mapped to an influencer.`,
                      `${stats.unmappedOrders} 个订单未关联影响者。`,
                    )
                  : t("All orders mapped to influencers.", "所有订单均已关联影响者。")}
              </p>
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                {t("View orders", "查看订单")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plug className="w-4 h-4 text-indigo-600" />
                {t("Integrations", "集成")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Shopify:</span>
                {shopifyConnected ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t("Connected", "已连接")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                    <XCircle className="w-3.5 h-3.5" />
                    {t("Not configured", "未配置")}
                  </span>
                )}
              </div>
              <Link
                href="/admin/integrations"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                {t("Configure", "配置")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {stats.unmappedOrders > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-900">
                {t(
                  `${stats.unmappedOrders} order${stats.unmappedOrders === 1 ? "" : "s"} need attention`,
                  `${stats.unmappedOrders} 个订单需要处理`,
                )}
              </p>
              <p className="text-amber-700 mt-0.5">
                {t(
                  "Orders without an influencer mapping won't credit anyone.",
                  "未关联影响者的订单不会产生佣金。",
                )}{" "}
                <Link
                  href="/admin/orders"
                  className="underline font-medium hover:text-amber-900"
                >
                  {t("Review", "查看")}
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  subTone,
  loading,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  sub?: string;
  subTone?: "ok" | "warn";
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            {label}
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        </div>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
        ) : (
          <div className="text-2xl font-bold tabular-nums">{value}</div>
        )}
        {sub && (
          <div
            className={`text-xs mt-1 ${
              subTone === "warn"
                ? "text-amber-600"
                : subTone === "ok"
                  ? "text-emerald-600"
                  : "text-slate-500"
            }`}
          >
            {sub}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
