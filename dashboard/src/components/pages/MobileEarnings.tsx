import "./_group.css";
import React, { useState } from "react";
import { MobileFrame, MobileTabBar } from "@/components/layout/MobileFrame";
import { Sparkline } from "@/components/layout/Sparkline";
import { ChevronLeft, ArrowDownToLine, ArrowUpRight, Calendar, Wallet } from "lucide-react";

const STATEMENTS = [
  { week: "Apr 11 – 17", amount: "¥3,248.50", orders: 18, status: "Pending" },
  { week: "Apr 4 – 10", amount: "¥2,914.20", orders: 16, status: "Paid" },
  { week: "Mar 28 – Apr 3", amount: "¥2,560.00", orders: 14, status: "Paid" },
  { week: "Mar 21 – 27", amount: "¥3,012.40", orders: 17, status: "Paid" },
];

const RANGES = ["7D", "30D", "90D", "YTD"];

export function MobileEarnings() {
  const [range, setRange] = useState("7D");
  return (
    <MobileFrame>
      <header className="px-5 py-2 flex items-center justify-between shrink-0">
        <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-display font-semibold">Earnings · 收益</h1>
        <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <Calendar className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-28 scrollbar-hide">
        {/* Wallet hero */}
        <div className="px-5 mt-2">
          <div className="bg-gradient-to-br from-[#064e3b] to-primary rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <p className="text-primary-foreground/80 text-xs font-medium mb-1 inline-flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Wallet balance
            </p>
            <h2 className="text-4xl font-display font-bold tabular-nums tracking-tight">¥12,480.00</h2>
            <p className="text-primary-foreground/70 text-xs mt-1">Available to withdraw · 可提现</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button className="bg-white text-primary rounded-full h-10 text-xs font-semibold flex items-center justify-center gap-1.5">
                <ArrowDownToLine className="w-3.5 h-3.5" /> Withdraw
              </button>
              <button className="bg-white/15 backdrop-blur text-white rounded-full h-10 text-xs font-semibold flex items-center justify-center gap-1.5">
                Statements <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Range chips */}
        <div className="px-5 mt-5 flex gap-2">
          {RANGES.map((r) => {
            const active = r === range;
            return (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`flex-1 h-8 rounded-full text-xs font-semibold border ${
                  active ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border/60"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* Chart */}
        <div className="px-5 mt-4">
          <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">This week</p>
                <p className="text-2xl font-display font-bold tabular-nums mt-0.5">¥3,248.50</p>
              </div>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">+11.5%</span>
            </div>
            <div className="h-24 mt-3">
              <Sparkline color="#2F947C" data={[420, 380, 510, 470, 590, 540, 640]} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Apr 11</span><span>13</span><span>15</span><span>Apr 17</span>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="px-5 mt-4 grid grid-cols-2 gap-3">
          <Mini label="Commissions" value="¥3,029" sub="20% of sales" />
          <Mini label="Subscriptions" value="¥219" sub="Recurring" />
          <Mini label="Bonuses" value="¥0" sub="Tier rewards" />
          <Mini label="Refunds" value="-¥165" sub="1 order" tone="negative" />
        </div>

        {/* Statements */}
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-display font-semibold">Weekly statements</h3>
            <span className="text-xs text-primary font-semibold">View all</span>
          </div>
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm divide-y divide-border/50">
            {STATEMENTS.map((s) => (
              <button key={s.week} className="w-full p-4 flex items-center justify-between text-left">
                <div>
                  <p className="text-sm font-semibold">{s.week}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.orders} orders · {s.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{s.amount}</p>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                      s.status === "Paid" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <MobileTabBar active="Wallet" />
    </MobileFrame>
  );
}

function Mini({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "negative" }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-3.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className={`text-lg font-display font-bold tabular-nums mt-1 ${tone === "negative" ? "text-rose-600" : ""}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
