import "./_group.css";
import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight, TrendingUp, Award, Trophy, Medal } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const WEEKLY_EARNINGS = [
  { date: "Oct 24", gross: 3800, net: 3248.50, rank: "Gold" },
  { date: "Oct 17", gross: 3200, net: 2743.00, rank: "Gold" },
  { date: "Oct 10", gross: 2900, net: 2480.00, rank: "Silver" },
  { date: "Oct 03", gross: 2400, net: 2010.00, rank: "Silver" },
];

const CHART_DATA = [
  { name: 'W1', value: 2010 },
  { name: 'W2', value: 2480 },
  { name: 'W3', value: 2743 },
  { name: 'W4', value: 3248.50 },
];

export function Earnings() {
  return (
    <AppLayout activeId="earnings">
      <div className="space-y-6">
        
        {/* HUGE GRADIENT HERO */}
        <div className="bg-gradient-to-br from-[#064e3b] via-[#022c1b] to-black rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[320px]">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/4" />
          
          <div className="relative z-10 flex flex-col items-center text-center mt-4">
            <span className="text-emerald-100/70 font-medium tracking-wide mb-2 uppercase text-sm">This Week Net Paid 本周净收入</span>
            <h1 className="text-6xl md:text-7xl font-display font-bold tabular-nums tracking-tighter mb-4">¥3,248.50</h1>
            <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full text-sm font-semibold border border-emerald-500/30 backdrop-blur-sm">
              <TrendingUp className="w-4 h-4" />
              +18.4% vs last week
            </div>
          </div>

          <div className="relative z-10 flex justify-center mt-12">
            <Button className="bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl px-8 h-12 font-semibold shadow-lg text-base group">
              View in PayView <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* STATEMENTS LIST */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-display font-semibold mb-4 text-foreground">Weekly Statements</h2>
            <div className="space-y-4">
              {WEEKLY_EARNINGS.map((week, idx) => (
                <Card key={idx} className="shadow-sm border-border/50 rounded-2xl bg-card hover:shadow-md transition-shadow group cursor-pointer overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center p-5">
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground border border-border/50">
                        {idx === 0 ? <Medal className="w-6 h-6 text-amber-500" /> : <Award className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Week Ending {week.date}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                          <span className="bg-secondary px-2 py-0.5 rounded text-xs">{week.rank}</span>
                          <span>Gross: ¥{week.gross.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-border/50">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Net Paid</p>
                        <p className="font-bold text-xl tabular-nums text-foreground">¥{week.net.toFixed(2)}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Button variant="outline" className="w-full h-12 rounded-xl border-border/60 bg-card hover:bg-secondary">
              View Past Statements
            </Button>
          </div>

          {/* CHARTS & CALLOUTS */}
          <div className="space-y-6">
            <Card className="shadow-sm border-border/50 rounded-2xl bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Earnings Trajectory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CHART_DATA} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(val) => [`¥${val}`, 'Net']}
                        labelStyle={{ color: '#6b7280' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fill="url(#colorNet)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-amber-500/20 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-500">Best Month Ever</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-display font-bold tabular-nums text-foreground">¥14,280.00</p>
                  <p className="text-sm font-medium text-amber-600/80">+42% YoY Growth</p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">October is tracking to be your highest earning month since joining.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* MOTIVATIONAL BANNER */}
        <div className="bg-secondary border border-border/60 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-lg text-foreground">You earned more than 72% of active partners this month</h3>
            <p className="text-muted-foreground text-sm">你的收入超过本月 72% 的活跃伙伴</p>
          </div>
          <div className="w-full sm:w-64 h-3 bg-card rounded-full overflow-hidden border border-border/50">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 w-[72%] rounded-full relative">
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-[2px]"></div>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
