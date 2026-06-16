import "./_group.css";
import React, { useState } from "react";
import { MobileFrame, MobileTabBar } from "./_shared/MobileFrame";
import { Search, Filter, ChevronLeft } from "lucide-react";

const ORDERS = [
  { id: "ORD-902-18X", buyer: "Lei Wang", zh: "王磊", product: "SomaDerm Transdermal Gel", img: "/__mockup/images/somaderm.png", price: "¥1,224", commission: "+¥244.80", status: "Paid", time: "Today · 14:08" },
  { id: "ORD-902-17M", buyer: "Mei Lin", zh: "林梅", product: "Revitalize Eye Cream", img: "/__mockup/images/revitalize-eye-cream.png", price: "¥560", commission: "+¥112.00", status: "Shipped", time: "Today · 11:42" },
  { id: "ORD-902-16K", buyer: "Yifan Zhao", zh: "赵一凡", product: "Rose & Cole Luxe Bundle", img: "/__mockup/images/rose-cole-luxe.png", price: "¥3,384", commission: "+¥676.80", status: "Paid", time: "Yesterday" },
  { id: "ORD-902-15J", buyer: "Anika Patel", zh: "阿尼卡", product: "TRi-M*LT Daily Stack", img: "/__mockup/images/tri-mlt.png", price: "¥828", commission: "+¥165.60", status: "Refunded", time: "2 days ago" },
  { id: "ORD-902-14H", buyer: "Junjie Sun", zh: "孙俊杰", product: "SomaDerm Transdermal Gel", img: "/__mockup/images/somaderm.png", price: "¥1,224", commission: "+¥244.80", status: "Paid", time: "3 days ago" },
];

const TABS = ["All", "Paid", "Shipped", "Refunded"];

export function MobileOrders() {
  const [tab, setTab] = useState("All");
  const visible = ORDERS.filter((o) => tab === "All" || o.status === tab);

  return (
    <MobileFrame>
      <header className="px-5 py-2 flex items-center justify-between shrink-0">
        <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-display font-semibold">Orders · 订单</h1>
        <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <Filter className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-28 scrollbar-hide">
        <div className="px-5 mt-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search by order, customer, product"
              className="w-full h-11 pl-10 pr-3 rounded-xl bg-secondary border border-border/50 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="px-5 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 h-8 px-3 rounded-full text-xs font-medium border ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-muted-foreground border-border/60"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="px-5 mt-4 grid grid-cols-3 gap-2">
          <Stat label="Today" value="¥1,016" />
          <Stat label="Week" value="¥4,829" />
          <Stat label="Orders" value="84" />
        </div>

        <div className="px-5 mt-5 space-y-3">
          {visible.map((o) => (
            <div key={o.id} className="bg-card rounded-2xl border border-border/50 shadow-sm p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden shrink-0 border border-border/50">
                <img src={o.img} alt={o.product} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{o.buyer} <span className="text-muted-foreground font-normal">{o.zh}</span></p>
                  <StatusPill status={o.status} />
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{o.product}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground">{o.id} · {o.time}</span>
                  <span className="text-sm font-semibold tabular-nums text-primary">{o.commission}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <MobileTabBar active="Orders" />
    </MobileFrame>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-base font-display font-bold tabular-nums mt-0.5">{value}</p>
    </div>
  );
}
function StatusPill({ status }: { status: string }) {
  const tones: Record<string, string> = {
    Paid: "bg-primary/10 text-primary",
    Shipped: "bg-blue-100 text-blue-700",
    Refunded: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 ${tones[status] || "bg-secondary text-muted-foreground"}`}>
      {status}
    </span>
  );
}
