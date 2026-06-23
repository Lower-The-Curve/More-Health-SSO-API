import React, { useState } from "react";
import { useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";
import { AppLayout } from "~/components/shared/AppLayout";
import { Kpi } from "~/components/shared/Kpi";
import { Sparkline } from "~/components/shared/Sparkline";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";


type DashboardData = {
  hero: {
    currentPeriod: string;
    previousPeriod: string;
    walletBalance: string;
    weeklyEarnings: string;
    ordersGenerated: number;
  };
  kpis: Array<{
    label: string;
    value: string;
    delta: string;
    trend: "up" | "down";
    sparklineData: number[];
    sparklineColor: string;
  }>;
  salesChart: Array<{ name: string; value: number }>;
  earningsChart: Array<{ name: string; value: number }>;
  trafficSources: Array<{ name: string; value: number; color: string }>;
  activityFeed: Array<{
    id: number;
    type: string;
    text: string;
    amount?: string;
    time: string;
    avatar: string;
  }>;
};

export function Dashboard({ data }: { data: DashboardData }) {
  const [timeRange, setTimeRange] = useState("7");
  const user = useRouteLoaderData<typeof rootLoader>("root");

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* HERO CARD */}
        <div className="bg-gradient-to-br from-primary via-primary to-[#064e3b] rounded-2xl p-8 text-primary-foreground shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-accent/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/4" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-display font-bold tracking-tight">Welcome back, {user?.firstName} <span className="font-sans font-normal text-primary-foreground/80">欢迎回来</span></h1>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-accent"></span>
                  Gold Partner / 金牌伙伴
                </div>
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-primary-foreground/90">
                  <span>{data.hero.currentPeriod}</span>
                  <span className="text-primary-foreground/60">vs. {data.hero.previousPeriod}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-8 bg-black/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <div className="flex flex-col gap-1">
                <span className="text-primary-foreground/70 text-sm font-medium">Wallet Balance</span>
                <span className="text-3xl font-bold display-num tabular-nums tracking-tight">{data.hero.walletBalance}</span>
              </div>
              <div className="w-px bg-white/20"></div>
              <div className="flex flex-col gap-1">
                <span className="text-primary-foreground/70 text-sm font-medium">Earnings This Week</span>
                <span className="text-3xl font-bold display-num tabular-nums tracking-tight">{data.hero.weeklyEarnings}</span>
              </div>
              <div className="w-px bg-white/20"></div>
              <div className="flex flex-col gap-1">
                <span className="text-primary-foreground/70 text-sm font-medium">Orders Generated</span>
                <span className="text-3xl font-bold display-num tabular-nums tracking-tight">{data.hero.ordersGenerated}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.kpis.map((kpi) => (
            <Kpi
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              delta={kpi.delta}
              trend={kpi.trend}
              sparkline={<Sparkline color={kpi.sparklineColor} data={kpi.sparklineData} />}
            />
          ))}
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm rounded-2xl border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Sales Trend</CardTitle>
              <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg border border-border/50">
                {['7', '30', '90'].map(d => (
                  <button
                    key={d}
                    onClick={() => setTimeRange(d)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeRange === d ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.salesChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dx={-10} tickFormatter={(val) => `¥${val}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                      itemStyle={{ color: '#111827', fontWeight: 600 }}
                      formatter={(val) => [`¥${val}`, 'Sales']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Earnings Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.earningsChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} interval={0} />
                    <Tooltip
                      cursor={{ fill: '#f3f4f6' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(val) => [`¥${val}`, 'Earnings']}
                      labelFormatter={(label) => `Week of ${label}`}
                    />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.trafficSources.map((item) => (
                <div key={item.name} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="font-bold tabular-nums">{item.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm rounded-2xl border-border/50">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <button className="text-sm font-medium text-primary hover:underline">View All</button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.activityFeed.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <Avatar className="w-10 h-10 border border-border bg-secondary flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {item.avatar}
                    </Avatar>
                    <div className="flex-1 flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium leading-tight">{item.text}</p>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                      {item.amount && (
                        <span className={`text-sm font-semibold tabular-nums ${item.amount.includes('+') ? 'text-primary' : 'text-foreground'}`}>
                          {item.amount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
