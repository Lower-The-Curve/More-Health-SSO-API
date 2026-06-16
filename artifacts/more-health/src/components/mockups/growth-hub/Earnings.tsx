import "./_group.css";
import React, { useMemo, useState } from "react";
import { AppLayout } from "./_shared/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, TrendingUp, Award, Trophy, Medal, FileText, BarChart3, Search, X, Download, Archive } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from "recharts";
import { useLang } from "@/lib/i18n";
import { useDisplayFlags } from "@/lib/displayFlags";
import { FapiaoDialog, type FapiaoData } from "./_shared/FapiaoDialog";
import { PerformanceReportDialog, type PerformanceData } from "./_shared/PerformanceReportDialog";
import {
  buildCsv,
  csvFileBytes,
  downloadBlob,
  downloadCsv,
  fapiaoCsv,
  performanceCsv,
  safeFilenamePart,
} from "./_shared/csvExport";
import JSZip from "jszip";

type PaymentStatus = "Paid" | "Processing" | "Pending";

type WeeklyEarning = {
  date: string;
  dateZh: string;
  weekRange: string;
  weekRangeZh: string;
  gross: number;
  net: number;
  rank: "Gold" | "Silver" | "Bronze";
  status: PaymentStatus;
  fapiao: FapiaoData;
  metrics: PerformanceData;
};

const WEEKLY_EARNINGS: WeeklyEarning[] = [
  {
    date: "Apr 17, 2026",
    dateZh: "2026年4月17日",
    weekRange: "Apr 11 – Apr 17, 2026",
    weekRangeZh: "2026年4月11日 – 4月17日",
    gross: 3456.91,
    net: 3248.50,
    rank: "Gold",
    status: "Processing",
    fapiao: {
      code: "144032500110",
      number: "00498372",
      date: "2026-04-18",
      checkCode: "9 4823 7912 8345 0917",
      taxableAmount: 3064.62,
      taxAmount: 183.88,
      taxRate: 0.06,
      net: 3248.50,
      weekLabel: "2026年4月11日 – 4月17日",
    },
    metrics: {
      weekLabel: "Apr 11 – Apr 17, 2026",
      weekLabelZh: "2026年4月11日 – 4月17日",
      net: 3248.50,
      gross: 3456.91,
      storeViews: 4280,
      uniqueVisitors: 2812,
      avgSession: "2:48",
      reviews: 38,
      rating: 4.8,
      orders: 18,
      conversion: 0.042,
      social: { wechat: 124000, xhs: 86400, douyin: 192000 },
      topContent: [
        { title: "How SomaDerm transformed my morning ritual", titleZh: "SomaDerm 如何改变我的早晨仪式", platform: "wechat", views: 48200, orders: 9, revenue: 1284.40 },
        { title: "30-day Revitalize Eye Cream review", titleZh: "焕颜眼霜 30 天测评", platform: "xhs", views: 32100, orders: 5, revenue: 826.00 },
        { title: "Quick wellness routine before work", titleZh: "上班前的快速健康仪式", platform: "douyin", views: 78400, orders: 4, revenue: 1138.10 },
      ],
      breakdown: { direct: 1846.30, referred: 1280.61, bonus: 330.00 },
      vsLast: 0.184,
    },
  },
  {
    date: "Apr 10, 2026",
    dateZh: "2026年4月10日",
    weekRange: "Apr 4 – Apr 10, 2026",
    weekRangeZh: "2026年4月4日 – 4月10日",
    gross: 2918.09,
    net: 2743.00,
    rank: "Gold",
    status: "Paid",
    fapiao: {
      code: "144032500110",
      number: "00498141",
      date: "2026-04-11",
      checkCode: "8 1730 4612 9982 4413",
      taxableAmount: 2587.74,
      taxAmount: 155.26,
      taxRate: 0.06,
      net: 2743.00,
      weekLabel: "2026年4月4日 – 4月10日",
    },
    metrics: {
      weekLabel: "Apr 4 – Apr 10, 2026",
      weekLabelZh: "2026年4月4日 – 4月10日",
      net: 2743.00,
      gross: 2918.09,
      storeViews: 3680,
      uniqueVisitors: 2410,
      avgSession: "2:32",
      reviews: 31,
      rating: 4.7,
      orders: 15,
      conversion: 0.041,
      social: { wechat: 98000, xhs: 71200, douyin: 154800 },
      topContent: [
        { title: "Why I switched to TRi-M*LT", titleZh: "为什么我换成了 TRi-M*LT", platform: "douyin", views: 62100, orders: 6, revenue: 992.40 },
        { title: "Self-care Sunday haul", titleZh: "周日护理好物分享", platform: "xhs", views: 41800, orders: 4, revenue: 738.20 },
        { title: "Office wellness essentials", titleZh: "办公室必备健康好物", platform: "wechat", views: 36400, orders: 5, revenue: 1012.40 },
      ],
      breakdown: { direct: 1532.10, referred: 1146.99, bonus: 239.00 },
      vsLast: 0.106,
    },
  },
  {
    date: "Apr 03, 2026",
    dateZh: "2026年4月3日",
    weekRange: "Mar 28 – Apr 3, 2026",
    weekRangeZh: "2026年3月28日 – 4月3日",
    gross: 2638.30,
    net: 2480.00,
    rank: "Silver",
    status: "Paid",
    fapiao: {
      code: "144032500110",
      number: "00497908",
      date: "2026-04-04",
      checkCode: "7 0291 6634 5128 8801",
      taxableAmount: 2339.62,
      taxAmount: 140.38,
      taxRate: 0.06,
      net: 2480.00,
      weekLabel: "2026年3月28日 – 4月3日",
    },
    metrics: {
      weekLabel: "Mar 28 – Apr 3, 2026",
      weekLabelZh: "2026年3月28日 – 4月3日",
      net: 2480.00,
      gross: 2638.30,
      storeViews: 3320,
      uniqueVisitors: 2188,
      avgSession: "2:18",
      reviews: 24,
      rating: 4.7,
      orders: 13,
      conversion: 0.039,
      social: { wechat: 84200, xhs: 64100, douyin: 138900 },
      topContent: [
        { title: "Spring wellness reset routine", titleZh: "春季健康重启计划", platform: "xhs", views: 38900, orders: 5, revenue: 942.00 },
        { title: "Rose & Cole unboxing", titleZh: "Rose & Cole 开箱体验", platform: "wechat", views: 28100, orders: 3, revenue: 768.00 },
        { title: "Quick before/after", titleZh: "30 秒前后对比", platform: "douyin", views: 54200, orders: 5, revenue: 770.00 },
      ],
      breakdown: { direct: 1420.00, referred: 990.30, bonus: 228.00 },
      vsLast: 0.234,
    },
  },
  {
    date: "Mar 27, 2026",
    dateZh: "2026年3月27日",
    weekRange: "Mar 21 – Mar 27, 2026",
    weekRangeZh: "2026年3月21日 – 3月27日",
    gross: 2138.30,
    net: 2010.00,
    rank: "Silver",
    status: "Pending",
    fapiao: {
      code: "144032500110",
      number: "00497682",
      date: "2026-03-28",
      checkCode: "6 5104 8217 3360 0094",
      taxableAmount: 1896.23,
      taxAmount: 113.77,
      taxRate: 0.06,
      net: 2010.00,
      weekLabel: "2026年3月21日 – 3月27日",
    },
    metrics: {
      weekLabel: "Mar 21 – Mar 27, 2026",
      weekLabelZh: "2026年3月21日 – 3月27日",
      net: 2010.00,
      gross: 2138.30,
      storeViews: 2914,
      uniqueVisitors: 1942,
      avgSession: "2:11",
      reviews: 19,
      rating: 4.6,
      orders: 11,
      conversion: 0.038,
      social: { wechat: 71800, xhs: 52900, douyin: 118600 },
      topContent: [
        { title: "Morning wellness Q&A", titleZh: "早晨健康答疑", platform: "wechat", views: 24600, orders: 4, revenue: 642.00 },
        { title: "Eye cream before/after", titleZh: "眼霜前后对比", platform: "xhs", views: 31200, orders: 4, revenue: 658.00 },
        { title: "Day in my life", titleZh: "我的一天", platform: "douyin", views: 48100, orders: 3, revenue: 710.00 },
      ],
      breakdown: { direct: 1162.00, referred: 802.30, bonus: 174.00 },
      vsLast: -0.04,
    },
  },
];

const CHART_DATA = [
  { name: 'Mar 21', nameZh: '3月21日', value: 2010 },
  { name: 'Mar 28', nameZh: '3月28日', value: 2480 },
  { name: 'Apr 4', nameZh: '4月4日', value: 2743 },
  { name: 'Apr 11', nameZh: '4月11日', value: 3248.50 },
];

type SortKey = "date_desc" | "date_asc" | "net_desc" | "net_asc";

const STATUS_STYLES: Record<PaymentStatus, string> = {
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  Processing: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  Pending: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
};

export function Earnings() {
  const { lang, t } = useLang();
  const { hideInfluencerStatus } = useDisplayFlags();
  const [fapiaoOpen, setFapiaoOpen] = useState<WeeklyEarning | null>(null);
  const [reportOpen, setReportOpen] = useState<WeeklyEarning | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("date_desc");

  const rankLabel = (r: string) => r === "Gold" ? t("Gold", "金牌") : r === "Silver" ? t("Silver", "银牌") : r;
  const statusLabel = (s: PaymentStatus) =>
    s === "Paid" ? t("Paid", "已支付") : s === "Processing" ? t("Processing", "处理中") : t("Pending", "待处理");

  const weeklyStatementCsv = (weeks: WeeklyEarning[]) => {
    const headers = [
      "Week Ending 周结束日",
      "Week Range 周区间",
      ...(hideInfluencerStatus ? [] : ["Rank 等级"]),
      "Status 状态",
      "Gross 毛收入 (CNY)",
      "Net 净到账 (CNY)",
      "Fapiao Number 发票号码",
      "Fapiao Date 开票日期",
    ];
    const rows: (string | number)[][] = weeks.map((w) => [
      w.date,
      w.weekRange,
      ...(hideInfluencerStatus ? [] : [w.rank]),
      w.status,
      w.gross.toFixed(2),
      w.net.toFixed(2),
      w.fapiao.number,
      w.fapiao.date,
    ]);
    return { headers, rows };
  };

  const exportWeeklyStatements = (weeks: WeeklyEarning[]) => {
    const { headers, rows } = weeklyStatementCsv(weeks);
    downloadCsv(`weekly-statements-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const downloadBulkZip = async (weeks: WeeklyEarning[]) => {
    if (bulkBusy) return;
    setBulkBusy(true);
    try {
      const zip = new JSZip();
      const stmt = weeklyStatementCsv(weeks);
      zip.file(
        "weekly-statements.csv",
        "\uFEFF" + buildCsv(stmt.headers, stmt.rows),
      );
      const fapiaoFolder = zip.folder("fapiao");
      const perfFolder = zip.folder("performance-reports");
      for (const w of weeks) {
        const f = fapiaoCsv(w.fapiao);
        fapiaoFolder?.file(
          `fapiao-${safeFilenamePart(w.fapiao.number)}.csv`,
          csvFileBytes(f.headers, f.rows),
        );
        const p = performanceCsv(w.metrics);
        perfFolder?.file(
          `performance-${safeFilenamePart(w.weekRange)}.csv`,
          csvFileBytes(p.headers, p.rows),
        );
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(`earnings-${new Date().toISOString().slice(0, 10)}.zip`, blob);
    } finally {
      setBulkBusy(false);
    }
  };

  const visibleWeeks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = WEEKLY_EARNINGS.filter((w) => {
      if (statusFilter !== "all" && w.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        w.date, w.dateZh, w.weekRange, w.weekRangeZh,
        w.rank, w.status, statusLabel(w.status), rankLabel(w.rank),
        w.net.toFixed(2), w.gross.toFixed(2),
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
    const weekIndex = (w: WeeklyEarning) => WEEKLY_EARNINGS.indexOf(w);
    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "date_asc": return weekIndex(b) - weekIndex(a);
        case "net_desc": return b.net - a.net;
        case "net_asc": return a.net - b.net;
        case "date_desc":
        default: return weekIndex(a) - weekIndex(b);
      }
    });
    return sorted;
  }, [search, statusFilter, sortKey, lang]);

  const [bulkBusy, setBulkBusy] = useState(false);

  return (
    <AppLayout activeId="earnings">
      <div className="space-y-6">

        <div className="bg-gradient-to-br from-[#064e3b] via-[#022c1b] to-black rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[320px]">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/4" />

          <div className="relative z-10 flex flex-col items-center text-center mt-4">
            <span className="text-emerald-100/70 font-medium tracking-wide mb-2 uppercase text-sm">
              {t("This Week Net Paid", "本周净收入")}
            </span>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold tabular-nums tracking-tighter mb-4 break-all">¥3,248.50</h1>
            <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full text-sm font-semibold border border-emerald-500/30 backdrop-blur-sm">
              <TrendingUp className="w-4 h-4" />
              {t("+18.4% vs last week", "环比上周 +18.4%")}
            </div>
          </div>

          <div className="relative z-10 flex justify-center mt-12">
            <Button
              onClick={() => setReportOpen(WEEKLY_EARNINGS[0])}
              className="bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl px-8 h-12 font-semibold shadow-lg text-base group"
            >
              {t("View in PayView", "在 PayView 查看")} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <div className="flex flex-col">
                <h2 className="text-xl font-display font-semibold text-foreground">{t("Weekly Statements", "每周对账单")}</h2>
                <span className="text-xs text-muted-foreground">
                  {visibleWeeks.length === WEEKLY_EARNINGS.length
                    ? t(`${WEEKLY_EARNINGS.length} statements`, `共 ${WEEKLY_EARNINGS.length} 份对账单`)
                    : t(`${visibleWeeks.length} of ${WEEKLY_EARNINGS.length} statements`, `${visibleWeeks.length} / ${WEEKLY_EARNINGS.length} 份对账单`)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl gap-1.5"
                  disabled={visibleWeeks.length === 0}
                  onClick={() => exportWeeklyStatements(visibleWeeks)}
                >
                  <Download className="w-4 h-4" />
                  {t("Export CSV", "导出 CSV")}
                </Button>
                <Button
                  size="sm"
                  className="h-9 rounded-xl gap-1.5"
                  disabled={visibleWeeks.length === 0 || bulkBusy}
                  onClick={() => downloadBulkZip(visibleWeeks)}
                >
                  <Archive className="w-4 h-4" />
                  {bulkBusy
                    ? t("Preparing…", "正在准备…")
                    : t("Download all (ZIP)", "全部下载 (ZIP)")}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={hideInfluencerStatus ? t("Search by week or amount", "按周或金额搜索") : t("Search by week, rank or amount", "按周、等级或金额搜索")}
                  className="pl-9 pr-9 h-10 rounded-xl bg-card border-border/60"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label={t("Clear search", "清除搜索")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PaymentStatus | "all")}>
                <SelectTrigger className="h-10 sm:w-[160px] rounded-xl bg-card border-border/60">
                  <SelectValue placeholder={t("Status", "状态")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All statuses", "全部状态")}</SelectItem>
                  <SelectItem value="Paid">{t("Paid", "已支付")}</SelectItem>
                  <SelectItem value="Processing">{t("Processing", "处理中")}</SelectItem>
                  <SelectItem value="Pending">{t("Pending", "待处理")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="h-10 sm:w-[200px] rounded-xl bg-card border-border/60">
                  <SelectValue placeholder={t("Sort", "排序")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">{t("Newest first", "最新优先")}</SelectItem>
                  <SelectItem value="date_asc">{t("Oldest first", "最早优先")}</SelectItem>
                  <SelectItem value="net_desc">{t("Net: high to low", "净额：从高到低")}</SelectItem>
                  <SelectItem value="net_asc">{t("Net: low to high", "净额：从低到高")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {visibleWeeks.length === 0 && (
                <Card className="shadow-sm border-dashed border-border/60 rounded-2xl bg-card">
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    {t("No statements match your filters.", "没有符合筛选条件的对账单。")}
                  </div>
                </Card>
              )}
              {visibleWeeks.map((week) => {
                const idx = WEEKLY_EARNINGS.indexOf(week);
                return (
                <Card key={idx} className="shadow-sm border-border/50 rounded-2xl bg-card hover:shadow-md transition-shadow overflow-hidden">
                  <div className="flex flex-col p-5 gap-5">
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground border border-border/50 shrink-0">
                          {idx === 0 ? <Medal className="w-6 h-6 text-amber-500" /> : <Award className="w-6 h-6" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-base sm:text-lg">
                            {t(`Week of ${week.date}`, `${week.dateZh} 当周`)}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {!hideInfluencerStatus ? (
                              <span className="bg-secondary px-2 py-0.5 rounded">{rankLabel(week.rank)}</span>
                            ) : null}
                            <span className={`px-2 py-0.5 rounded border ${STATUS_STYLES[week.status]} font-medium`}>
                              {statusLabel(week.status)}
                            </span>
                            <span>{t(`Gross: ¥${week.gross.toFixed(2)}`, `毛收入：¥${week.gross.toFixed(2)}`)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-4 sm:pt-0 border-border/50">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{t("Net Paid", "净到账")}</p>
                          <p className="font-bold text-xl tabular-nums text-foreground">¥{week.net.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => setFapiaoOpen(week)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-sm font-semibold transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>{t("Fapiao 发票", "查看发票 Fapiao")}</span>
                      </button>
                      <button
                        onClick={() => setReportOpen(week)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 text-sm font-semibold transition-colors"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>{t("Performance Report", "绩效报告")}</span>
                      </button>
                    </div>
                  </div>
                </Card>
              );
              })}
            </div>
            <Button variant="outline" className="w-full h-12 rounded-xl border-border/60 bg-card hover:bg-secondary">
              {t("View Past Statements", "查看历史对账单")}
            </Button>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm border-border/50 rounded-2xl bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">{t("Earnings History", "收入历史")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CHART_DATA} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey={lang === "zh" ? "nameZh" : "name"}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `¥${(v / 1000).toFixed(1)}k`}
                        width={48}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(16,185,129,0.08)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(val: number) => [`¥${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, t("Week total", "本周总计")]}
                        labelFormatter={(label) => t(`Week of ${label}`, `${label} 当周`)}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
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
                  <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-500">{t("Best Month Ever", "史上最佳月份")}</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-display font-bold tabular-nums text-foreground">¥14,280.00</p>
                  <p className="text-sm font-medium text-amber-600/80">{t("+42% YoY Growth", "同比增长 +42%")}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  {t("April is tracking to be your highest earning month since joining.", "4月有望成为你入驻以来收入最高的月份。")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="bg-secondary border border-border/60 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-lg text-foreground">
              {t("You earned more than 72% of active partners this month", "你的收入超过本月 72% 的活跃伙伴")}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t("Keep going — Platinum tier is just a few referrals away.", "再接再厉 — 距离白金等级仅差几位推荐。")}
            </p>
          </div>
          <div className="w-full sm:w-64 h-3 bg-card rounded-full overflow-hidden border border-border/50">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 w-[72%] rounded-full relative">
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-[2px]"></div>
            </div>
          </div>
        </div>
      </div>

      {fapiaoOpen && (
        <FapiaoDialog open={true} onOpenChange={(o) => !o && setFapiaoOpen(null)} data={fapiaoOpen.fapiao} />
      )}
      {reportOpen && (
        <PerformanceReportDialog open={true} onOpenChange={(o) => !o && setReportOpen(null)} data={reportOpen.metrics} />
      )}
    </AppLayout>
  );
}
