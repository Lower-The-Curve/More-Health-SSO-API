import "./_group.css";
import React, { useState, useMemo } from "react";
import { AppLayout } from "./_shared/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ShoppingBag,
  Wallet,
  Repeat,
  Trophy,
  Megaphone,
  Settings as SettingsIcon,
  CheckCheck,
  Filter,
  Bell,
  Mail,
  Smartphone,
} from "lucide-react";
import { useLang } from "@/lib/i18n";

type Category = "order" | "payout" | "subscription" | "milestone" | "announcement";

type Notification = {
  id: string;
  category: Category;
  titleEn: string;
  titleZh: string;
  detailEn: string;
  detailZh: string;
  time: string;
  timeZh: string;
  unread: boolean;
  amount?: string;
  actor?: { initials: string; tone: string };
};

const NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    category: "order",
    titleEn: "New order from Lei Wang 王磊",
    titleZh: "来自王磊的新订单",
    detailEn: "SomaDerm Transdermal Gel · ORD-902-18X",
    detailZh: "SomaDerm 透皮凝胶 · ORD-902-18X",
    time: "Today, 2:14 PM",
    timeZh: "今天 14:14",
    unread: true,
    amount: "+¥244.80",
    actor: { initials: "LW", tone: "bg-blue-100 text-blue-700" },
  },
  {
    id: "n2",
    category: "payout",
    titleEn: "Wallet payout completed",
    titleZh: "钱包打款成功",
    detailEn: "Transferred to ICBC •••• 7814 · Reference PV-2026-04-17-9012",
    detailZh: "已转入工商银行 •••• 7814 · 流水号 PV-2026-04-17-9012",
    time: "Today, 11:48 AM",
    timeZh: "今天 11:48",
    unread: true,
    amount: "¥3,200.00",
  },
  {
    id: "n3",
    category: "subscription",
    titleEn: "Lisa renewed her monthly subscription",
    titleZh: "Lisa 续订月度订阅",
    detailEn: "Revitalize Eye Cream · 7th cycle · Auto-renew on May 5",
    detailZh: "焕颜眼霜 · 第 7 期 · 5月5日自动续订",
    time: "Today, 11:02 AM",
    timeZh: "今天 11:02",
    unread: true,
    amount: "+¥112.00",
    actor: { initials: "L", tone: "bg-emerald-100 text-emerald-700" },
  },
  {
    id: "n4",
    category: "milestone",
    titleEn: "You earned more than 72% of partners this month",
    titleZh: "你的收入超过本月 72% 的合作伙伴",
    detailEn: "Keep going — Platinum tier is 4 referrals away.",
    detailZh: "再接再厉 — 距离白金等级仅差 4 位推荐。",
    time: "Yesterday, 6:48 PM",
    timeZh: "昨天 18:48",
    unread: false,
  },
  {
    id: "n5",
    category: "order",
    titleEn: "Order shipped to Jing Chen 陈静",
    titleZh: "订单已发往陈静",
    detailEn: "Revitalize Eye Cream · SF Express SF1029384755",
    detailZh: "焕颜眼霜 · 顺丰速运 SF1029384755",
    time: "Yesterday, 3:22 PM",
    timeZh: "昨天 15:22",
    unread: false,
    actor: { initials: "JC", tone: "bg-amber-100 text-amber-700" },
  },
  {
    id: "n6",
    category: "announcement",
    titleEn: "Spring Wellness campaign assets are live",
    titleZh: "春季健康营销素材已上线",
    detailEn: "Download new Xiaohongshu and Douyin templates from the Storefront.",
    detailZh: "可在我的店铺下载小红书与抖音的全新模板。",
    time: "Apr 15, 2026",
    timeZh: "2026年4月15日",
    unread: false,
  },
  {
    id: "n7",
    category: "payout",
    titleEn: "Payout schedule updated",
    titleZh: "打款周期已更新",
    detailEn: "Weekly payouts will now arrive every Monday at 09:00 CST.",
    detailZh: "每周打款将于每周一上午 09:00 到账（北京时间）。",
    time: "Apr 14, 2026",
    timeZh: "2026年4月14日",
    unread: false,
  },
  {
    id: "n8",
    category: "milestone",
    titleEn: "Best month ever in progress",
    titleZh: "本月有望创下新高",
    detailEn: "April is tracking +42% vs. your previous best month.",
    detailZh: "4月较你之前最佳月份增长 +42%。",
    time: "Apr 13, 2026",
    timeZh: "2026年4月13日",
    unread: false,
  },
];

export function Notifications() {
  const { lang, t } = useLang();
  const [filter, setFilter] = useState<"all" | "unread" | Category>("all");
  const [items, setItems] = useState(NOTIFICATIONS);

  const CATEGORY_META: Record<
    Category,
    { label: string; Icon: React.ComponentType<{ className?: string }>; tint: string; ring: string }
  > = useMemo(() => ({
    order: { label: t("Orders", "订单"), Icon: ShoppingBag, tint: "bg-emerald-50 text-emerald-700", ring: "ring-emerald-200" },
    payout: { label: t("Payouts", "打款"), Icon: Wallet, tint: "bg-amber-50 text-amber-700", ring: "ring-amber-200" },
    subscription: { label: t("Subscriptions", "订阅"), Icon: Repeat, tint: "bg-violet-50 text-violet-700", ring: "ring-violet-200" },
    milestone: { label: t("Milestones", "里程碑"), Icon: Trophy, tint: "bg-rose-50 text-rose-700", ring: "ring-rose-200" },
    announcement: { label: t("Announcements", "公告"), Icon: Megaphone, tint: "bg-sky-50 text-sky-700", ring: "ring-sky-200" },
  }), [t]);

  const FILTERS: { id: "all" | "unread" | Category; label: string }[] = [
    { id: "all", label: t("All", "全部") },
    { id: "unread", label: t("Unread", "未读") },
    { id: "order", label: t("Orders", "订单") },
    { id: "payout", label: t("Payouts", "打款") },
    { id: "subscription", label: t("Subscriptions", "订阅") },
    { id: "milestone", label: t("Milestones", "里程碑") },
    { id: "announcement", label: t("Announcements", "公告") },
  ];

  type Channel = "push" | "email" | "sms";
  const PREFS: { id: string; label: string; channels: readonly Channel[] }[] = [
    { id: "orders", label: t("New orders", "新订单"), channels: ["push", "email"] },
    { id: "payouts", label: t("Payouts & wallet", "钱包与打款"), channels: ["push", "email", "sms"] },
    { id: "subs", label: t("Subscription renewals", "订阅续费"), channels: ["push", "email"] },
    { id: "milestones", label: t("Milestones & rank ups", "里程碑与升级"), channels: ["push"] },
    { id: "marketing", label: t("Marketing campaigns", "营销活动"), channels: ["email"] },
  ];

  const unreadCount = items.filter((n) => n.unread).length;
  const visible = items.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return n.unread;
    return n.category === filter;
  });

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  const toggleRead = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n)));

  return (
    <AppLayout activeId="notifications">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">{t("Notifications", "通知中心")}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {unreadCount > 0 ? (
                  <>
                    <span className="text-foreground font-medium">
                      {t(`${unreadCount} unread`, `${unreadCount} 条未读`)}
                    </span>
                    <span className="mx-1.5">·</span>
                    {t("Updated just now", "刚刚更新")}
                  </>
                ) : (
                  t("You're all caught up", "全部已读")
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="rounded-xl h-10 gap-2 bg-card border-border/60">
              <Filter className="w-4 h-4" /> {t("Filters", "筛选")}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl h-10 gap-2 bg-card border-border/60"
              onClick={markAllRead}
            >
              <CheckCheck className="w-4 h-4" /> {t("Mark all read", "全部标为已读")}
            </Button>
            <Button className="rounded-xl h-10 gap-2 shadow-sm">
              <SettingsIcon className="w-4 h-4" /> {t("Notification settings", "通知设置")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3 h-8 rounded-full text-xs font-medium transition-all border ${
                      active
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card text-muted-foreground border-border/60 hover:text-foreground"
                    }`}
                  >
                    {f.label}
                    {f.id === "unread" && unreadCount > 0 && (
                      <span className={`ml-1.5 ${active ? "opacity-80" : "text-primary"}`}>{unreadCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <Card className="shadow-sm border-border/50 rounded-2xl bg-card overflow-hidden">
              <div className="divide-y divide-border/50">
                {visible.length === 0 && (
                  <div className="p-10 text-center text-muted-foreground text-sm">
                    {t("Nothing here yet", "暂无通知")}
                  </div>
                )}
                {visible.map((n) => {
                  const meta = CATEGORY_META[n.category];
                  const Icon = meta.Icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => toggleRead(n.id)}
                      className={`w-full text-left p-5 flex items-start gap-4 hover:bg-secondary/30 transition-colors relative ${
                        n.unread ? "bg-primary/[0.03]" : ""
                      }`}
                    >
                      {n.unread && (
                        <span className="absolute left-2 top-7 w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ${meta.tint} ${meta.ring}`}
                      >
                        {n.actor ? (
                          <span className="text-sm font-semibold">{n.actor.initials}</span>
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className={`text-sm leading-snug ${
                                n.unread ? "font-semibold text-foreground" : "font-medium text-foreground/90"
                              }`}
                            >
                              {lang === "zh" ? n.titleZh : n.titleEn}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {lang === "zh" ? n.detailZh : n.detailEn}
                            </p>
                          </div>
                          {n.amount && (
                            <span
                              className={`text-sm font-semibold tabular-nums shrink-0 ${
                                n.amount.startsWith("+") ? "text-primary" : "text-foreground"
                              }`}
                            >
                              {n.amount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase tracking-wider font-semibold border-border/60 bg-card text-muted-foreground"
                          >
                            {meta.label}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {lang === "zh" ? n.timeZh : n.time}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="p-4 border-t border-border/50 flex items-center justify-between bg-secondary/20">
                <span className="text-xs text-muted-foreground">
                  {t(`Showing ${visible.length} of ${items.length}`, `显示 ${items.length} 条中的 ${visible.length} 条`)}
                </span>
                <Button variant="ghost" size="sm" className="text-primary text-xs h-8 hover:bg-primary/10">
                  {t("Load older", "加载更早")}
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm border-border/50 rounded-2xl bg-card p-6 space-y-5">
              <div>
                <h3 className="font-display font-semibold text-base text-foreground">{t("Delivery preferences", "通知接收方式")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("Choose how you'd like to be reached.", "选择你希望接收通知的渠道。")}</p>
              </div>
              <div className="space-y-4">
                {PREFS.map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{p.label}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        {p.channels.includes("push") && (
                          <span className="inline-flex items-center gap-1">
                            <Bell className="w-3 h-3" /> {t("Push", "推送")}
                          </span>
                        )}
                        {p.channels.includes("email") && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {t("Email", "邮件")}
                          </span>
                        )}
                        {p.channels.includes("sms") && (
                          <span className="inline-flex items-center gap-1">
                            <Smartphone className="w-3 h-3" /> {t("SMS", "短信")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full rounded-xl h-10 bg-card border-border/60">
                {t("Open full settings", "打开完整设置")}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
