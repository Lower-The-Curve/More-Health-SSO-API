import "./_group.css";
import React, { useState } from "react";
import { MobileFrame, MobileTabBar } from "./_shared/MobileFrame";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, CheckCheck, Settings as SettingsIcon, ShoppingBag, Wallet, Repeat, Trophy, Megaphone } from "lucide-react";

type Cat = "order" | "payout" | "subscription" | "milestone" | "announcement";

const META: Record<Cat, { Icon: typeof ShoppingBag; label: string; tint: string }> = {
  order: { Icon: ShoppingBag, label: "Orders", tint: "bg-blue-100 text-blue-700" },
  payout: { Icon: Wallet, label: "Payouts", tint: "bg-emerald-100 text-emerald-700" },
  subscription: { Icon: Repeat, label: "Subs", tint: "bg-purple-100 text-purple-700" },
  milestone: { Icon: Trophy, label: "Milestones", tint: "bg-amber-100 text-amber-700" },
  announcement: { Icon: Megaphone, label: "News", tint: "bg-rose-100 text-rose-700" },
};

const ITEMS: { id: string; cat: Cat; title: string; zh: string; detail: string; time: string; unread: boolean; amount?: string }[] = [
  { id: "n1", cat: "order", title: "New order from Lei Wang", zh: "新订单", detail: "SomaDerm · ORD-902-18X", time: "2:14 PM", unread: true, amount: "+¥244.80" },
  { id: "n2", cat: "payout", title: "Wallet payout completed", zh: "提现成功", detail: "UnionPay ••6612 · ¥3,200.00", time: "11:42 AM", unread: true },
  { id: "n3", cat: "subscription", title: "Mei Lin renewed monthly", zh: "续订成功", detail: "Revitalize Eye Cream", time: "9:08 AM", unread: true, amount: "+¥112.00" },
  { id: "n4", cat: "milestone", title: "You hit Gold Partner", zh: "晋级金牌", detail: "Tier bonus unlocked: ¥500", time: "Yesterday", unread: false },
  { id: "n5", cat: "announcement", title: "April commission update", zh: "佣金调整", detail: "Read the full announcement", time: "Apr 14", unread: false },
  { id: "n6", cat: "order", title: "Order shipped to Yifan Zhao", zh: "订单已发货", detail: "Rose & Cole Luxe Bundle", time: "Apr 14", unread: false },
];

const FILTERS = ["All", "Unread", "Orders", "Payouts", "Subs"];

export function MobileNotifications() {
  const [filter, setFilter] = useState("All");
  const [reads, setReads] = useState<Record<string, boolean>>({});
  const items = ITEMS.map((i) => ({ ...i, unread: i.unread && !reads[i.id] }));
  const visible = items.filter((i) => {
    if (filter === "All") return true;
    if (filter === "Unread") return i.unread;
    if (filter === "Orders") return i.cat === "order";
    if (filter === "Payouts") return i.cat === "payout";
    if (filter === "Subs") return i.cat === "subscription";
    return true;
  });
  const unread = items.filter((i) => i.unread).length;

  return (
    <MobileFrame>
      <header className="px-5 py-2 flex items-center justify-between shrink-0">
        <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-display font-semibold">Notifications</h1>
          {unread > 0 && (
            <Badge className="bg-primary/15 text-primary border-0 text-[10px] font-semibold rounded-full px-1.5 py-0">
              {unread}
            </Badge>
          )}
        </div>
        <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <SettingsIcon className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-28 scrollbar-hide">
        <div className="px-5 mt-2 flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mr-5 pr-5">
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`shrink-0 h-8 px-3 rounded-full text-xs font-medium border ${
                    active ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border/60"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 mt-3">
          <button
            onClick={() => setReads(Object.fromEntries(ITEMS.map((i) => [i.id, true])))}
            className="text-xs text-primary font-semibold inline-flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all as read
          </button>
        </div>

        <div className="px-5 mt-3 space-y-2">
          {visible.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-10">Nothing here · 暂无通知</div>
          )}
          {visible.map((n) => {
            const m = META[n.cat];
            const Icon = m.Icon;
            return (
              <button
                key={n.id}
                onClick={() => setReads((r) => ({ ...r, [n.id]: true }))}
                className={`w-full text-left bg-card border rounded-2xl p-3.5 flex items-start gap-3 relative ${
                  n.unread ? "border-primary/30 bg-primary/[0.03]" : "border-border/50"
                }`}
              >
                {n.unread && <span className="absolute left-2 top-4 w-1.5 h-1.5 rounded-full bg-primary" />}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${m.tint}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${n.unread ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                    {n.amount && (
                      <span className={`text-xs font-semibold tabular-nums shrink-0 ${n.amount.startsWith("+") ? "text-primary" : ""}`}>
                        {n.amount}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{n.detail}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{m.label}</span>
                    <span className="text-[10px] text-muted-foreground/60">· {n.time} · {n.zh}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      <MobileTabBar active="More" />
    </MobileFrame>
  );
}
