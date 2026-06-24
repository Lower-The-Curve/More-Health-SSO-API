import "./_group.css";
import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ShoppingBag,
  Wallet,
  Repeat,
  TrendingUp,
  Trophy,
  Megaphone,
  Settings as SettingsIcon,
  CheckCheck,
  Filter,
  Bell,
  Mail,
  Smartphone,
} from "lucide-react";

type Notification = {
  id: string;
  category: "order" | "payout" | "subscription" | "milestone" | "announcement";
  title: string;
  zh: string;
  detail: string;
  time: string;
  unread: boolean;
  amount?: string;
  actor?: { initials: string; tone: string };
};

const NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    category: "order",
    title: "New order from Lei Wang 王磊",
    zh: "新订单",
    detail: "SomaDerm Transdermal Gel · ORD-902-18X",
    time: "Today, 2:14 PM",
    unread: true,
    amount: "+¥244.80",
    actor: { initials: "LW", tone: "bg-blue-100 text-blue-700" },
  },
  {
    id: "n2",
    category: "payout",
    title: "Wallet payout completed",
    zh: "钱包打款成功",
    detail: "Transferred to ICBC •••• 7814 · Reference PV-2026-04-17-9012",
    time: "Today, 11:48 AM",
    unread: true,
    amount: "¥3,200.00",
  },
  {
    id: "n3",
    category: "subscription",
    title: "Lisa renewed her monthly subscription",
    zh: "Lisa 续订月度订阅",
    detail: "Revitalize Eye Cream · 7th cycle · Auto-renew on May 5",
    time: "Today, 11:02 AM",
    unread: true,
    amount: "+¥112.00",
    actor: { initials: "L", tone: "bg-emerald-100 text-emerald-700" },
  },
  {
    id: "n4",
    category: "milestone",
    title: "You earned more than 72% of partners this month",
    zh: "你的收入超过本月 72% 的活跃伙伴",
    detail: "Keep going — Platinum tier is 4 referrals away.",
    time: "Yesterday, 6:48 PM",
    unread: false,
  },
  {
    id: "n5",
    category: "order",
    title: "Order shipped to Jing Chen 陈静",
    zh: "订单已发出",
    detail: "Revitalize Eye Cream · SF Express SF1029384755",
    time: "Yesterday, 3:22 PM",
    unread: false,
    actor: { initials: "JC", tone: "bg-amber-100 text-amber-700" },
  },
  {
    id: "n6",
    category: "announcement",
    title: "Spring Wellness campaign assets are live",
    zh: "春季健康营销素材已上线",
    detail: "Download new Xiaohongshu and Douyin templates from the Storefront.",
    time: "Apr 15, 2026",
    unread: false,
  },
  {
    id: "n7",
    category: "payout",
    title: "Payout schedule updated",
    zh: "打款周期已更新",
    detail: "Weekly payouts will now arrive every Monday at 09:00 CST.",
    time: "Apr 14, 2026",
    unread: false,
  },
  {
    id: "n8",
    category: "milestone",
    title: "Best month ever in progress",
    zh: "本月有望创下新高",
    detail: "April is tracking +42% vs. your previous best month.",
    time: "Apr 13, 2026",
    unread: false,
  },
];

const CATEGORY_META: Record<
  Notification["category"],
  { label: string; zh: string; Icon: React.ComponentType<{ className?: string }>; tint: string; ring: string }
> = {
  order: { label: "Orders", zh: "订单", Icon: ShoppingBag, tint: "bg-emerald-50 text-emerald-700", ring: "ring-emerald-200" },
  payout: { label: "Payouts", zh: "打款", Icon: Wallet, tint: "bg-amber-50 text-amber-700", ring: "ring-amber-200" },
  subscription: { label: "Subscriptions", zh: "订阅", Icon: Repeat, tint: "bg-violet-50 text-violet-700", ring: "ring-violet-200" },
  milestone: { label: "Milestones", zh: "里程碑", Icon: Trophy, tint: "bg-rose-50 text-rose-700", ring: "ring-rose-200" },
  announcement: { label: "Announcements", zh: "公告", Icon: Megaphone, tint: "bg-sky-50 text-sky-700", ring: "ring-sky-200" },
};

const FILTERS: { id: "all" | "unread" | Notification["category"]; label: string; zh?: string }[] = [
  { id: "all", label: "All", zh: "全部" },
  { id: "unread", label: "Unread", zh: "未读" },
  { id: "order", label: "Orders", zh: "订单" },
  { id: "payout", label: "Payouts", zh: "打款" },
  { id: "subscription", label: "Subscriptions", zh: "订阅" },
  { id: "milestone", label: "Milestones", zh: "里程碑" },
  { id: "announcement", label: "Announcements", zh: "公告" },
];

type PrefChannel = "push" | "email" | "sms";
const PREFS: { id: string; label: string; zh: string; channels: PrefChannel[] }[] = [
  { id: "orders", label: "New orders", zh: "新订单", channels: ["push", "email"] },
  { id: "payouts", label: "Payouts & wallet", zh: "钱包打款", channels: ["push", "email", "sms"] },
  { id: "subs", label: "Subscription renewals", zh: "订阅续费", channels: ["push", "email"] },
  { id: "milestones", label: "Milestones & rank ups", zh: "里程碑与升级", channels: ["push"] },
  { id: "marketing", label: "Marketing campaigns", zh: "营销活动", channels: ["email"] },
];

export function Notifications() {
  const [filter, setFilter] = useState<typeof FILTERS[number]["id"]>("all");
  const [items, setItems] = useState(NOTIFICATIONS);

  const unreadCount = items.filter((n) => n.unread).length;
  const visible = items.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return n.unread;
    return n.category === filter;
  });

  const counts = {
    order: items.filter((n) => n.category === "order").length,
    payout: items.filter((n) => n.category === "payout").length,
    subscription: items.filter((n) => n.category === "subscription").length,
    milestone: items.filter((n) => n.category === "milestone").length,
    announcement: items.filter((n) => n.category === "announcement").length,
  };

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  const toggleRead = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n)));

  return (
    <AppLayout activeId="notifications">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold tracking-tight">Notifications</h1>
                <span className="text-muted-foreground text-sm">通知中心</span>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {unreadCount > 0 ? (
                  <>
                    <span className="text-foreground font-medium">{unreadCount} unread</span>
                    <span className="mx-1.5">·</span>
                    Updated just now
                  </>
                ) : (
                  "You're all caught up · 全部已读"
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="rounded-xl h-10 gap-2 bg-card border-border/60">
              <Filter className="w-4 h-4" /> Filters
            </Button>
            <Button
              variant="outline"
              className="rounded-xl h-10 gap-2 bg-card border-border/60"
              onClick={markAllRead}
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </Button>
            <Button className="rounded-xl h-10 gap-2 shadow-sm">
              <SettingsIcon className="w-4 h-4" /> Notification settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FEED */}
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
                    Nothing here yet · 暂无通知
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
                              {n.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.detail}</p>
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
                          <span className="text-[11px] text-muted-foreground">{n.time}</span>
                          <span className="text-[11px] text-muted-foreground/60">· {n.zh}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="p-4 border-t border-border/50 flex items-center justify-between bg-secondary/20">
                <span className="text-xs text-muted-foreground">
                  Showing {visible.length} of {items.length} · 显示 {visible.length} / {items.length}
                </span>
                <Button variant="ghost" size="sm" className="text-primary text-xs h-8 hover:bg-primary/10">
                  Load older
                </Button>
              </div>
            </Card>
          </div>

          {/* PREFERENCES */}
          <div className="space-y-6">
            <Card className="shadow-sm border-border/50 rounded-2xl bg-card p-6 space-y-5">
              <div>
                <h3 className="font-display font-semibold text-base text-foreground">Delivery preferences</h3>
                <p className="text-xs text-muted-foreground mt-0.5">通知接收方式</p>
              </div>
              <div className="space-y-4">
                {PREFS.map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{p.label}</p>
                      <p className="text-[11px] text-muted-foreground">{p.zh}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        {p.channels.includes("push") && (
                          <span className="inline-flex items-center gap-1">
                            <Bell className="w-3 h-3" /> Push
                          </span>
                        )}
                        {p.channels.includes("email") && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Email
                          </span>
                        )}
                        {p.channels.includes("sms") && (
                          <span className="inline-flex items-center gap-1">
                            <Smartphone className="w-3 h-3" /> SMS
                          </span>
                        )}
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full rounded-xl h-10 bg-card border-border/60">
                Open full settings
              </Button>
            </Card>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
