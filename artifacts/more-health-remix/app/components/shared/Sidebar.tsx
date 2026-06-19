import React from "react";
import { Link, useLocation } from "react-router";
import { BrandLogo } from "~/components/shared/BrandLogo";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  LayoutDashboard,
  ShoppingBag,
  UserPlus,
  Store,
  Wallet,
  Repeat,
  LineChart,
  BarChart3,
  ShoppingBasket,
  Users,
  Bell,
  Settings,
  LifeBuoy
} from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", zh: "仪表盘", id: "dashboard", path: "/" },
  { icon: ShoppingBag,     label: "Shop Products",  zh: "商城",    id: "shop",           path: "/shop" },
  { icon: UserPlus,        label: "Enroll Partner", zh: "邀请伙伴", id: "enroll",         path: "/enroll" },
  { icon: Store,           label: "My Storefront",  zh: "我的店铺", id: "storefront",     path: "/storefront" },
  { icon: Wallet,          label: "Wallet",         zh: "钱包",    id: "wallet",         path: "/wallet" },
  { icon: Repeat,          label: "Subscriptions",  zh: "订阅",    id: "subscriptions",  path: "/subscriptions" },
  { icon: LineChart,       label: "Earnings",       zh: "收入",    id: "earnings",       path: "/earnings" },
  { icon: BarChart3,       label: "Analytics",      zh: "数据分析", id: "analytics",      path: "/analytics" },
  { icon: ShoppingBasket,  label: "Orders",         zh: "订单",    id: "orders",         path: "/orders" },
  { icon: Users,           label: "Team Builder",   zh: "团队队列", id: "team",           path: "/team" },
  { icon: Bell,            label: "Notifications",  zh: "通知",    id: "notifications",  path: "/notifications", badge: 3 },
  { icon: Settings,        label: "Settings",       zh: "设置",    id: "settings",       path: "/settings" },
  { icon: LifeBuoy,        label: "Support",        zh: "支持",    id: "support",        path: "/support" },
];

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <div className="w-[248px] h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <BrandLogo />
      </div>

      <div className="px-4 mb-6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
          <Avatar className="w-10 h-10 border border-background">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">BC</AvatarFallback>
            <AvatarImage src="https://i.pravatar.cc/150?u=brady" />
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Brady Chen</span>
            <span className="text-xs text-muted-foreground">Gold Partner</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1 scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-70"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                  isActive ? "bg-white/20 text-primary-foreground" : "bg-primary/10 text-primary"
                }`}>
                  {item.badge}
                </span>
              ) : (
                <span className={`text-[10px] ${isActive ? "text-primary-foreground/70" : "opacity-0"}`}>
                  {item.zh}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 mt-auto border-t border-border">
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 rounded-xl shadow-sm flex flex-col gap-1 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <span className="text-xs opacity-80 font-medium">Wallet Balance</span>
          <span className="text-xl font-bold display-num tabular-nums tracking-tight">¥12,480.00</span>
        </div>
      </div>
    </div>
  );
}
