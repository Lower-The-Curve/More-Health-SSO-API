import "./_group.css";
import React, { useMemo, useState } from "react";
import { AppLayout } from "./_shared/AppLayout";
import { Kpi } from "./_shared/Kpi";
import { Sparkline } from "./_shared/Sparkline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ShieldCheck, Info, Globe, UserPlus, ShoppingBag, Copy, Check, QrCode, MessageCircle, Inbox, AlertTriangle, Loader2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { Redirect } from "wouter";
import { useLang } from "@/lib/i18n";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useDisplayFlags } from "@/lib/displayFlags";
import { useGetDashboard, useGetShareLinks } from "@workspace/api-client-react";

function formatYen(cents: number): string {
  return `¥${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatRange(startISO: string, endISO: string, lang: "en" | "zh"): string {
  const s = new Date(startISO);
  const e = new Date(new Date(endISO).getTime() - 1);
  const monthEn = (d: Date) => d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  if (lang === "zh") {
    return `${s.getUTCMonth() + 1}月${s.getUTCDate()}日 – ${e.getUTCMonth() + 1}月${e.getUTCDate()}日`;
  }
  return `${monthEn(s)} ${s.getUTCDate()} – ${monthEn(e)} ${e.getUTCDate()}`;
}

export function Dashboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { lang, t } = useLang();
  const { firstName, fullName, rank, influencerId } = useCurrentUser();
  const { hideVolume, hideInfluencerStatus } = useDisplayFlags();
  const dashboardQuery = useGetDashboard();
  const shareLinksQuery = useGetShareLinks();
  const data = dashboardQuery.data;
  const shareLinksData = shareLinksQuery.data;
  const dashboardStatus = (dashboardQuery.error as { status?: number } | null)?.status;

  if (dashboardStatus === 401 || dashboardStatus === 403) {
    return <Redirect to="/sign-in" />;
  }

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
  };

  const greetingName = firstName ?? fullName.split(" ")[0] ?? t("there", "你好");
  const rangeLabel = data ? formatRange(data.rangeStart, data.rangeEnd, lang) : "—";

  const SALES_DATA = useMemo(
    () => (data?.salesByDay ?? []).map((d) => ({ name: d.label, value: d.value })),
    [data],
  );
  const idForLink = influencerId || "PENDING";
  const enrollUrl = shareLinksData?.enrollShareUrl ?? null;
  const shopUrl = shareLinksData?.shopShareUrl ?? null;
  const siteUrl =
    shareLinksData?.siteShareUrl ??
    `https://morehealth.cn/m/${idForLink.toLowerCase()}`;
  const SHARE_LINKS = useMemo(
    () => {
      const links: Array<{
        key: "site" | "enroll" | "shop";
        icon: typeof Globe;
        badgeEn: string;
        badgeZh: string;
        titleEn: string;
        titleZh: string;
        descEn: string;
        descZh: string;
        url: string;
        accent: string;
        badgeBg: string;
        badgeText: string;
      }> = [
        {
          key: "site",
          icon: Globe,
          badgeEn: "SITE",
          badgeZh: "站点",
          titleEn: "Replicated Site Link",
          titleZh: "个人站点链接",
          descEn:
            "Your personal MoreHealth homepage. Visitors can shop, create an account, or join as an influencer.",
          descZh: "您的专属 MoreHealth 主页。访客可购物、注册账户或加入成为影响者。",
          url: siteUrl,
          accent: "bg-emerald-600 hover:bg-emerald-700",
          badgeBg: "bg-emerald-50 border-emerald-200",
          badgeText: "text-emerald-700",
        },
      ];
      if (enrollUrl) {
        links.push({
          key: "enroll",
          icon: UserPlus,
          badgeEn: "ENROLLMENT",
          badgeZh: "注册",
          titleEn: "Influencer Enrollment Link",
          titleZh: "影响者注册链接",
          descEn:
            "Sends someone directly to influencer registration. You are auto-assigned as their sponsor.",
          descZh: "将访客直接引导至影响者注册页。系统自动将您设为推荐人。",
          url: enrollUrl,
          accent: "bg-sky-600 hover:bg-sky-700",
          badgeBg: "bg-sky-50 border-sky-200",
          badgeText: "text-sky-700",
        });
      }
      if (shopUrl) {
        links.push({
          key: "shop",
          icon: ShoppingBag,
          badgeEn: "CUSTOMER",
          badgeZh: "顾客",
          titleEn: "Customer Share Link",
          titleZh: "顾客分享链接",
          descEn:
            "Shop link with customer pricing. No account needed — one is created automatically after purchase.",
          descZh: "顾客价购物链接。无需先注册账号 — 下单后将自动创建账号。",
          url: shopUrl,
          accent: "bg-amber-600 hover:bg-amber-700",
          badgeBg: "bg-amber-50 border-amber-200",
          badgeText: "text-amber-700",
        });
      }
      return links;
    },
    [siteUrl, enrollUrl, shopUrl],
  );

  const isEmptyWeek =
    !!data &&
    data.ordersThisWeek === 0 &&
    data.weeklyEarningsCents === 0 &&
    data.activity.length === 0;

  if (dashboardQuery.isLoading) {
    return (
      <AppLayout activeId="dashboard">
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm">{t("Loading your dashboard…", "正在加载仪表盘…")}</p>
        </div>
      </AppLayout>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <AppLayout activeId="dashboard">
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {t("Couldn't load your dashboard", "无法加载仪表盘")}
          </p>
          <button
            type="button"
            onClick={() => dashboardQuery.refetch()}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("Try again", "重试")}
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeId="dashboard">
      <div className="space-y-6">
        {/* HERO CARD */}
        <div className="bg-gradient-to-br from-primary via-primary to-[#064e3b] rounded-2xl p-6 sm:p-8 text-primary-foreground shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-accent/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/4" />

          <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start gap-6 xl:gap-8">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
                  {t(`Welcome, ${greetingName}`, `欢迎，${greetingName}`)}
                </h1>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 bg-emerald-400/20 text-emerald-100 border border-emerald-300/40 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-emerald-400/30 transition-colors cursor-help"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t("Active Contract", "合约生效")}</span>
                        <Info className="w-3 h-3 opacity-70" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[260px] text-center leading-snug">
                      {t(
                        "Your influencer agreement is active. You're eligible to earn commissions and receive payouts on qualifying activity.",
                        "你的影响者合约已生效，符合获得佣金和打款的资格。",
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!hideInfluencerStatus ? (
                  <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-accent"></span>
                    {rank}
                  </div>
                ) : null}
                {influencerId ? (
                  <div className="inline-flex items-center gap-2 bg-black/10 border border-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium tracking-wider">
                    ID {influencerId}
                  </div>
                ) : null}
                <span className="text-xs text-primary-foreground/70 ml-1">{rangeLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* EMPTY STATE BANNER */}
        {isEmptyWeek ? (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {t("You're all set. No activity yet this week.", "一切就绪。本周还没有动态。")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  "Share your links below to start generating orders and earnings.",
                  "分享下方链接，开始产生订单和收入。",
                )}
              </p>
            </div>
          </div>
        ) : null}

        {/* KPI ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(() => {
            const fmtDelta = (pct: number | null | undefined) =>
              pct == null ? null : `${pct >= 0 ? "+" : ""}${pct}%`;
            const trendOf = (pct: number | null | undefined): "up" | "down" =>
              (pct ?? 0) >= 0 ? "up" : "down";
            const totalOrdersPct = data?.kpis.totalOrders.deltaPct;
            const referredPct = data?.kpis.referredOrders.deltaPct;
            const volumePct = data?.kpis.volumeCents.deltaPct;
            return (
              <>
                <Kpi
                  label={t("Total Orders", "订单总数")}
                  value={String(data?.kpis.totalOrders.value ?? 0)}
                  delta={fmtDelta(totalOrdersPct)}
                  trend={trendOf(totalOrdersPct)}
                  compare={totalOrdersPct == null ? null : t("vs. previous 7 days", "环比上周")}
                  sparkline={<Sparkline color="#10b981" data={SALES_DATA.map((d) => d.value)} />}
                />
                <Kpi
                  label={t("Referred Orders", "推荐订单")}
                  value={String(data?.kpis.referredOrders.value ?? 0)}
                  delta={fmtDelta(referredPct)}
                  trend={trendOf(referredPct)}
                  compare={referredPct == null ? null : t("vs. previous 7 days", "环比上周")}
                  sparkline={<Sparkline color="#0ea5e9" data={SALES_DATA.map((d) => d.value)} />}
                />
                {!hideVolume ? (
                  <Kpi
                    label={t("Volume Generated", "产生业绩")}
                    value={formatYen(data?.kpis.volumeCents.value ?? 0)}
                    delta={fmtDelta(volumePct)}
                    trend={trendOf(volumePct)}
                    compare={volumePct == null ? null : t("vs. previous 7 days", "环比上周")}
                    sparkline={<Sparkline color="#f59e0b" data={SALES_DATA.map((d) => d.value)} />}
                  />
                ) : null}
              </>
            );
          })()}
        </div>

        {/* SHARE YOUR LINKS */}
        <Card className="shadow-sm rounded-2xl border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">{t("Share Your Links", "分享您的链接")}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  "Copy a link, show a QR code, or send directly via WeChat.",
                  "复制链接、展示二维码,或直接通过微信发送。",
                )}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SHARE_LINKS.map((link) => {
                const Icon = link.icon;
                const copied = copiedKey === link.key;
                return (
                  <div key={link.key} className="rounded-xl border border-border/50 bg-secondary/20 p-4 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${link.badgeBg}`}>
                        <Icon className={`w-4 h-4 ${link.badgeText}`} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${link.badgeBg} ${link.badgeText}`}>
                        {lang === "zh" ? link.badgeZh : link.badgeEn}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {lang === "zh" ? link.titleZh : link.titleEn}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed flex-1">
                      {lang === "zh" ? link.descZh : link.descEn}
                    </p>

                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border/50">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${link.badgeText.replace("text-", "bg-")}`} />
                      <span className="text-xs text-muted-foreground truncate font-mono">{link.url}</span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(link.key, link.url)}
                        className={`flex-1 inline-flex items-center justify-center gap-2 text-sm font-medium text-white rounded-lg py-2 transition-colors ${link.accent}`}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? t("Copied", "已复制") : t("Copy Link", "复制链接")}
                      </button>

                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-border/60 bg-background hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            aria-label={t("Show QR code", "显示二维码")}
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-3">
                          <p className="text-xs font-semibold text-foreground mb-2">{t("Scan QR code", "扫描二维码")}</p>
                          <div className="rounded-lg border border-border/60 bg-white p-2 flex items-center justify-center">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(link.url)}`}
                              alt="QR code"
                              className="w-full h-auto"
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-2 break-all font-mono">{link.url}</p>
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-border/60 bg-background hover:bg-[#07C160]/10 hover:border-[#07C160]/40 transition-colors text-muted-foreground hover:text-[#07C160]"
                            aria-label={t("Share on WeChat", "微信分享")}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-[#07C160] flex items-center justify-center">
                              <MessageCircle className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">{t("Share on WeChat", "微信分享")}</p>
                              <p className="text-[10px] text-muted-foreground">{t("Open WeChat and scan to share", "打开微信扫码分享")}</p>
                            </div>
                          </div>
                          <div className="rounded-lg border border-border/60 bg-white p-2 flex items-center justify-center">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(link.url)}`}
                              alt="WeChat share QR"
                              className="w-full h-auto"
                            />
                          </div>
                          <button
                            onClick={() => handleCopy(link.key, link.url)}
                            className="mt-2 w-full text-xs font-medium text-[#07C160] hover:underline inline-flex items-center justify-center gap-1.5"
                          >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? t("Link copied", "链接已复制") : t("Copy link to send in WeChat", "复制链接发送至微信")}
                          </button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* CHARTS */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="shadow-sm rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">{t("Sales Generated", "本周销售业绩")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[380px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SALES_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dx={-10} tickFormatter={(val) => `¥${val}`} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      labelStyle={{ color: "#6b7280", marginBottom: "4px" }}
                      itemStyle={{ color: "#111827", fontWeight: 600 }}
                      formatter={(val) => [`¥${val}`, t("Sales", "销售业绩")]}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {!hideVolume ? (
          <Card className="shadow-sm rounded-2xl border-border/50">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-semibold">{t("Volume", "团队业绩")}</CardTitle>
              <span className="text-xs text-muted-foreground">{rangeLabel}</span>
            </CardHeader>
            <CardContent>
              <div className="text-center pb-5 border-b border-border/50">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t("Total Volume", "总业绩")}</p>
                <p className="text-4xl font-display font-bold tabular-nums tracking-tight mt-1">{formatYen(data?.volume.totalCents ?? 0)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-5">
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{t("Market 1 Volume", "市场一业绩")}</span>
                  <p className="text-2xl font-display font-bold tabular-nums text-foreground mt-1">{formatYen(data?.volume.market1Cents ?? 0)}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{t("Market 2 Volume", "市场二业绩")}</span>
                  <p className="text-2xl font-display font-bold tabular-nums text-foreground mt-1">{formatYen(data?.volume.market2Cents ?? 0)}</p>
                </div>
              </div>

            </CardContent>
          </Card>
          ) : null}

          <Card className="shadow-sm rounded-2xl border-border/50">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-semibold">{t("Recent Activity", "最近动态")}</CardTitle>
            </CardHeader>
            <CardContent>
              {data && data.activity.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {t("No activity yet.", "还没有动态。")}
                </div>
              ) : (
                <div className="space-y-6">
                  {(data?.activity ?? []).map((item) => {
                    const when = new Date(item.occurredAt).toLocaleString(lang === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
                    return (
                      <div key={item.id} className="flex items-start gap-4">
                        <Avatar className="w-10 h-10 border border-border bg-secondary flex items-center justify-center text-sm font-semibold text-muted-foreground">
                          {(item.description?.[0] ?? "•").toUpperCase()}
                        </Avatar>
                        <div className="flex-1 flex justify-between items-start gap-2">
                          <div className="flex flex-col gap-1 min-w-0">
                            <p className="text-sm font-medium leading-tight">{item.description}</p>
                            <span className="text-xs text-muted-foreground">{when}</span>
                          </div>
                          {item.amountCents != null ? (
                            <span className="text-sm font-semibold tabular-nums shrink-0 text-primary">
                              {formatYen(item.amountCents)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
