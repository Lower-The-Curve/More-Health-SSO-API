import "./_group.css";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Home, ShoppingBag, Store, Wallet, Menu, ChevronRight } from "lucide-react";
import { Sparkline } from "./_shared/Sparkline";

export function MobileDashboard() {
  return (
    <div className="bg-background min-h-[844px] w-full max-w-[390px] mx-auto relative overflow-hidden font-sans shadow-[0_0_40px_rgba(0,0,0,0.1)] border border-border/50 rounded-[40px] flex flex-col">
      {/* iOS Status Bar Placeholder */}
      <div className="h-12 w-full flex justify-between items-center px-6 pt-2">
        <span className="text-xs font-semibold">9:41</span>
        <div className="flex gap-1.5 items-center">
          <div className="w-4 h-3 bg-foreground rounded-sm"></div>
          <div className="w-3 h-3 bg-foreground rounded-full"></div>
          <div className="w-5 h-3 border border-foreground rounded-sm"></div>
        </div>
      </div>

      {/* Header */}
      <header className="px-5 py-2 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-border">
            <AvatarImage src="https://i.pravatar.cc/150?u=brady" />
            <AvatarFallback>BC</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Gold Partner</span>
            <span className="text-sm font-semibold leading-none">Hi, Brady</span>
          </div>
        </div>
        <button className="relative w-10 h-10 flex items-center justify-center bg-secondary rounded-full">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent rounded-full border-2 border-secondary" />
        </button>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        
        {/* Earnings Hero Card */}
        <div className="px-5 mt-4">
          <div className="bg-gradient-to-br from-[#064e3b] to-primary rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            
            <p className="text-primary-foreground/80 text-sm font-medium mb-1">Wallet Balance</p>
            <h2 className="text-4xl font-display font-bold tabular-nums tracking-tight mb-6">¥12,480</h2>
            
            <div className="flex justify-between items-end border-t border-white/20 pt-4">
              <div>
                <p className="text-primary-foreground/70 text-xs mb-0.5">This Week</p>
                <p className="text-xl font-bold tabular-nums">¥3,248.50</p>
              </div>
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-1 transition-colors">
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Horizontally Scrollable KPIs */}
        <div className="mt-6 pl-5 overflow-x-auto scrollbar-hide pb-4 flex gap-4">
          <div className="w-[140px] shrink-0 bg-card border border-border/50 rounded-[20px] p-4 shadow-sm flex flex-col justify-between h-[120px]">
            <span className="text-xs font-medium text-muted-foreground">Total Orders</span>
            <span className="text-2xl font-bold tabular-nums font-display">84</span>
            <div className="h-8 w-full mt-auto opacity-60">
              <Sparkline color="#10b981" data={[5, 10, 15, 12, 18, 25, 20]} />
            </div>
          </div>
          <div className="w-[140px] shrink-0 bg-card border border-border/50 rounded-[20px] p-4 shadow-sm flex flex-col justify-between h-[120px]">
            <span className="text-xs font-medium text-muted-foreground">Store Visits</span>
            <span className="text-2xl font-bold tabular-nums font-display">1.2k</span>
            <div className="h-8 w-full mt-auto opacity-60">
              <Sparkline color="#10b981" data={[2, 4, 3, 6, 5, 8, 10]} />
            </div>
          </div>
          <div className="w-[140px] shrink-0 bg-card border border-border/50 rounded-[20px] p-4 shadow-sm flex flex-col justify-between h-[120px]">
            <span className="text-xs font-medium text-muted-foreground">Active Subs</span>
            <span className="text-2xl font-bold tabular-nums font-display">142</span>
            <div className="h-8 w-full mt-auto opacity-60">
              <Sparkline color="#10b981" data={[10, 10, 11, 12, 12, 14, 15]} />
            </div>
          </div>
          <div className="w-5 shrink-0"></div>
        </div>

        {/* Quick Actions */}
        <div className="px-5 mt-2 flex gap-3">
          <button className="flex-1 bg-secondary border border-border/50 rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2">
            <span className="text-lg">🔗</span> Share Link
          </button>
          <button className="flex-1 bg-secondary border border-border/50 rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2">
            <span className="text-lg">🧑‍🤝‍🧑</span> Invite
          </button>
        </div>

        {/* Recent Activity */}
        <div className="px-5 mt-8 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Activity</h3>
            <span className="text-xs text-primary font-semibold">View All</span>
          </div>
          <div className="bg-card border border-border/50 rounded-[24px] p-5 space-y-5 shadow-sm">
            {[
              { id: 1, text: 'John bought SomaDerm', amount: '+¥244.80', time: '2h ago', icon: 'J', color: 'bg-blue-100 text-blue-700' },
              { id: 2, text: 'Lisa subscribed monthly', time: '5h ago', icon: 'L', color: 'bg-emerald-100 text-emerald-700' },
              { id: 3, text: 'Wallet payout sent', amount: '-¥3,200', time: 'Yesterday', icon: '💰', color: 'bg-amber-100 text-amber-700' },
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${item.color}`}>
                  {item.icon}
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-sm font-medium leading-tight line-clamp-1">{item.text}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{item.time}</span>
                </div>
                {item.amount && (
                  <span className={`text-sm font-semibold tabular-nums ${item.amount.includes('+') ? 'text-primary' : ''}`}>
                    {item.amount}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Bottom Nav */}
      <nav className="absolute bottom-0 left-0 w-full h-[84px] bg-background/90 backdrop-blur-xl border-t border-border/50 flex justify-around items-start pt-3 px-2 pb-6 z-50">
        {[
          { icon: Home, label: "Home", active: true },
          { icon: ShoppingBag, label: "Shop", active: false },
          { icon: Store, label: "Storefront", active: false },
          { icon: Wallet, label: "Wallet", active: false },
          { icon: Menu, label: "More", active: false },
        ].map((item) => (
          <button key={item.label} className="flex flex-col items-center gap-1 w-16">
            <item.icon className={`w-6 h-6 ${item.active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={item.active ? 2.5 : 2} />
            <span className={`text-[10px] font-medium ${item.active ? "text-primary" : "text-muted-foreground"}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* iOS Home Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-foreground rounded-full z-50"></div>
    </div>
  );
}
