import "./_group.css";
import React, { useState } from "react";
import { MobileFrame, MobileTabBar } from "@/components/layout/MobileFrame";
import { ChevronLeft, Plus, Repeat, Pause } from "lucide-react";

const SUBS = [
  { customer: "Lei Wang", zh: "王磊", product: "SomaDerm Transdermal Gel", img: "/__mockup/images/somaderm.png", cycle: "Monthly", next: "May 12", amount: "¥1,224", status: "Active" },
  { customer: "Mei Lin", zh: "林梅", product: "Revitalize Eye Cream", img: "/__mockup/images/revitalize-eye-cream.png", cycle: "Monthly", next: "May 03", amount: "¥560", status: "Active" },
  { customer: "Yifan Zhao", zh: "赵一凡", product: "Rose & Cole Luxe Bundle", img: "/__mockup/images/rose-cole-luxe.png", cycle: "Quarterly", next: "Jun 18", amount: "¥3,384", status: "Active" },
  { customer: "Anika Patel", zh: "阿尼卡", product: "TRi-M*LT Daily Stack", img: "/__mockup/images/tri-mlt.png", cycle: "Monthly", next: "Apr 28", amount: "¥828", status: "Paused" },
];

const TABS = ["Active", "Paused", "All"];

export function MobileSubscriptions() {
  const [tab, setTab] = useState("Active");
  const visible = SUBS.filter((s) => tab === "All" || s.status === tab);

  return (
    <MobileFrame>
      <header className="px-5 py-2 flex items-center justify-between shrink-0">
        <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-display font-semibold">Subscriptions · 订阅</h1>
        <button className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Plus className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-28 scrollbar-hide">
        <div className="px-5 mt-2 grid grid-cols-3 gap-2">
          <Stat label="Active" value="142" />
          <Stat label="MRR" value="¥18.4k" />
          <Stat label="Churn" value="2.1%" />
        </div>

        <div className="px-5 mt-4 flex gap-2">
          {TABS.map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 h-8 rounded-full text-xs font-medium border ${
                  active ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border/60"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="px-5 mt-4 space-y-3">
          {visible.map((s) => (
            <div key={s.customer + s.product} className="bg-card rounded-2xl border border-border/50 shadow-sm p-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden border border-border/50 shrink-0">
                  <img src={s.img} alt={s.product} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{s.customer} <span className="text-muted-foreground font-normal">{s.zh}</span></p>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                        s.status === "Active" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{s.product}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                      <Repeat className="w-3 h-3" /> {s.cycle} · next {s.next}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{s.amount}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                <button className="flex-1 h-8 rounded-lg border border-border/60 text-xs font-medium">Manage</button>
                <button className="flex-1 h-8 rounded-lg border border-border/60 text-xs font-medium inline-flex items-center justify-center gap-1">
                  {s.status === "Active" ? <><Pause className="w-3 h-3" /> Pause</> : "Resume"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <MobileTabBar active="Wallet" />
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
