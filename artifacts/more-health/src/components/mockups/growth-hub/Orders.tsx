import "./_group.css";
import React, { useMemo, useState } from "react";
import { AppLayout } from "./_shared/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Filter, Download, Inbox } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useDisplayFlags } from "@/lib/displayFlags";
import {
  useListOrders,
  useListReferredOrders,
  useGetOrder,
} from "@workspace/api-client-react";

function formatYen(cents: number): string {
  return `¥${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Volume (CV / QV) is an MLM points value, not a currency amount, so render
// it as a plain decimal without the ¥ prefix.
function formatVolume(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_OPTIONS = ["paid", "shipped", "delivered", "refunded"] as const;
type SortKey =
  | "date_desc"
  | "date_asc"
  | "amount_desc"
  | "amount_asc"
  | "cv_desc"
  | "cv_asc"
  | "customer_asc";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const body = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  // BOM so Excel detects UTF-8 (matters for the Chinese column labels).
  const blob = new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function todayStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function Orders() {
  const { t } = useLang();
  const { hideVolume } = useDisplayFlags();
  const ordersQuery = useListOrders();
  const referredQuery = useListReferredOrders();
  const orders = ordersQuery.data ?? [];
  const referred = referredQuery.data ?? [];
  const [search, setSearch] = useState("");
  const [referredSearch, setReferredSearch] = useState("");
  const [openOrderId, setOpenOrderId] = useState<number | null>(null);

  // Customer-orders filters / sort
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date_desc");

  // Referred-orders filters / sort
  const [refStatusFilter, setRefStatusFilter] = useState<Set<string>>(new Set());
  const [refDateFrom, setRefDateFrom] = useState("");
  const [refDateTo, setRefDateTo] = useState("");
  const [refSortKey, setRefSortKey] = useState<SortKey>("date_desc");

  const statusLabel = (s: string) =>
    s === "delivered" ? t("Delivered", "已送达") :
    s === "shipped" ? t("Shipped", "已发货") :
    s === "paid" ? t("Paid", "已付款") :
    s === "refunded" ? t("Refunded", "已退款") :
    s;

  const statusVariant = (s: string): "default" | "secondary" | "outline" => {
    if (s === "delivered") return "default";
    if (s === "refunded") return "outline";
    return "secondary";
  };

  function applyFilters<T extends {
    customerName: string;
    productName: string;
    id: number;
    status: string;
    occurredAt: string;
    amountCents: number;
    cvCents?: number | null;
    qvCents?: number | null;
    orderName?: string | null;
  }>(
    rows: T[],
    q: string,
    statuses: Set<string>,
    fromStr: string,
    toStr: string,
    sort: SortKey,
  ): T[] {
    const fromMs = fromStr ? new Date(fromStr + "T00:00:00").getTime() : null;
    // include the entire "to" day
    const toMs = toStr ? new Date(toStr + "T23:59:59.999").getTime() : null;
    const term = q.trim().toLowerCase();
    const out = rows.filter((o) => {
      if (statuses.size > 0 && !statuses.has(o.status)) return false;
      const ts = new Date(o.occurredAt).getTime();
      if (fromMs != null && ts < fromMs) return false;
      if (toMs != null && ts > toMs) return false;
      if (term) {
        const hay = [
          o.customerName,
          o.productName,
          String(o.id),
          o.orderName ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    const sorted = [...out];
    sorted.sort((a, b) => {
      switch (sort) {
        case "date_asc":
          return new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
        case "amount_desc":
          return b.amountCents - a.amountCents;
        case "amount_asc":
          return a.amountCents - b.amountCents;
        case "cv_desc":
          return (b.cvCents ?? 0) - (a.cvCents ?? 0);
        case "cv_asc":
          return (a.cvCents ?? 0) - (b.cvCents ?? 0);
        case "customer_asc":
          return a.customerName.localeCompare(b.customerName);
        case "date_desc":
        default:
          return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
      }
    });
    return sorted;
  }

  const filtered = useMemo(
    () => applyFilters(orders, search, statusFilter, dateFrom, dateTo, sortKey),
    [orders, search, statusFilter, dateFrom, dateTo, sortKey],
  );

  const filteredReferred = useMemo(
    () =>
      applyFilters(
        referred,
        referredSearch,
        refStatusFilter,
        refDateFrom,
        refDateTo,
        refSortKey,
      ),
    [referred, referredSearch, refStatusFilter, refDateFrom, refDateTo, refSortKey],
  );

  const customerFilterCount =
    statusFilter.size + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  const referredFilterCount =
    refStatusFilter.size + (refDateFrom ? 1 : 0) + (refDateTo ? 1 : 0);

  // Detailed CSV: one row per line item. Order-level totals (amount, CV, QV)
  // appear only on the FIRST line of each order so column sums still match
  // the on-screen totals.
  const detailedHeaders = [
    t("Order ID", "订单编号"),
    t("Order Name", "订单名"),
    t("Date", "日期"),
    t("Customer", "客户"),
    t("Status", "状态"),
    t("Line #", "行号"),
    t("Product", "商品"),
    t("Variant", "规格"),
    t("SKU", "SKU"),
    t("Quantity", "数量"),
    t("Unit Price (CNY)", "单价 (CNY)"),
    t("Line Total (CNY)", "行金额 (CNY)"),
    t("Order Amount (CNY)", "订单金额 (CNY)"),
    ...(hideVolume
      ? []
      : [t("CV (CNY)", "CV (CNY)"), t("QV (CNY)", "QV (CNY)")]),
  ];

  function detailedRowsFor<T extends {
    id: number;
    orderName?: string | null;
    customerName: string;
    productName: string;
    status: string;
    occurredAt: string;
    amountCents: number;
    cvCents?: number | null;
    qvCents?: number | null;
    lineItems?: Array<{
      title: string;
      variantTitle?: string | null;
      sku?: string | null;
      quantity: number;
      priceCents: number;
    }>;
  }>(o: T): string[][] {
    const items = o.lineItems ?? [];
    if (items.length === 0) {
      return [[
        String(o.id),
        o.orderName ?? "",
        new Date(o.occurredAt).toISOString(),
        o.customerName,
        statusLabel(o.status),
        "1",
        o.productName,
        "",
        "",
        "1",
        (o.amountCents / 100).toFixed(2),
        (o.amountCents / 100).toFixed(2),
        (o.amountCents / 100).toFixed(2),
        ...(hideVolume
          ? []
          : [
              o.cvCents == null ? "" : (o.cvCents / 100).toFixed(2),
              o.qvCents == null ? "" : (o.qvCents / 100).toFixed(2),
            ]),
      ]];
    }
    return items.map((li, i) => [
      String(o.id),
      o.orderName ?? "",
      new Date(o.occurredAt).toISOString(),
      o.customerName,
      statusLabel(o.status),
      String(i + 1),
      li.title,
      li.variantTitle ?? "",
      li.sku ?? "",
      String(li.quantity),
      (li.priceCents / 100).toFixed(2),
      ((li.priceCents * li.quantity) / 100).toFixed(2),
      i === 0 ? (o.amountCents / 100).toFixed(2) : "",
      ...(hideVolume
        ? []
        : [
            i === 0 ? (o.cvCents == null ? "" : (o.cvCents / 100).toFixed(2)) : "",
            i === 0 ? (o.qvCents == null ? "" : (o.qvCents / 100).toFixed(2)) : "",
          ]),
    ]);
  }

  function exportCustomerCsv(): void {
    downloadCsv(
      `orders-${todayStamp()}.csv`,
      detailedHeaders,
      filtered.flatMap((o) => detailedRowsFor(o)),
    );
  }

  function exportReferredCsv(): void {
    downloadCsv(
      `referred-orders-${todayStamp()}.csv`,
      detailedHeaders,
      filteredReferred.flatMap((o) => detailedRowsFor(o)),
    );
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthOrders = orders.filter((o) => new Date(o.occurredAt) >= monthStart);
  const monthCount = monthOrders.length;
  // Legacy orders may have null CV/QV. Policy: CV = QV = order amount when
  // not explicitly set, so volume always reflects the underlying sale.
  const monthCv = monthOrders.reduce((s, o) => s + (o.cvCents ?? o.amountCents), 0);
  const monthQv = monthOrders.reduce((s, o) => s + (o.qvCents ?? o.amountCents), 0);
  const avgValue =
    monthOrders.length > 0
      ? Math.round(monthOrders.reduce((s, o) => s + o.amountCents, 0) / monthOrders.length)
      : 0;
  const referredMonthCount = referred.filter(
    (o) => new Date(o.occurredAt) >= monthStart,
  ).length;

  return (
    <AppLayout activeId="orders">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">{t("Orders", "订单")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("Manage and track your customer and personal orders.", "管理并追踪你的客户订单与个人订单。")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm border-border/50 rounded-2xl bg-card">
            <div className="p-5 flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">{t("Orders this month", "本月订单")}</span>
              <span className="text-3xl font-bold display-num tabular-nums tracking-tight">{monthCount}</span>
            </div>
          </Card>
          {!hideVolume ? (
          <Card className="shadow-sm border-border/50 rounded-2xl bg-card">
            <div className="p-5 flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">{t("Volume this month (CV + QV)", "本月业绩 (CV + QV)")}</span>
              <span className="text-3xl font-bold display-num tabular-nums tracking-tight">{formatVolume(monthCv + monthQv)}</span>
              <span className="text-xs text-muted-foreground tabular-nums mt-1">
                {t("CV", "CV")} {formatVolume(monthCv)} · {t("QV", "QV")} {formatVolume(monthQv)}
              </span>
            </div>
          </Card>
          ) : null}
          <Card className="shadow-sm border-border/50 rounded-2xl bg-card">
            <div className="p-5 flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">{t("Avg order value", "平均订单金额")}</span>
              <span className="text-3xl font-bold display-num tabular-nums tracking-tight">{formatYen(avgValue)}</span>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="bg-secondary/50 border border-border/50 p-1 rounded-xl w-auto justify-start">
            <TabsTrigger value="customer" className="rounded-lg text-sm px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">{t("All Orders", "全部订单")}</TabsTrigger>
            <TabsTrigger value="referred" className="rounded-lg text-sm px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              {t("Referred Orders", "推荐订单")}
              {referred.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                  {referred.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="mt-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("Search by customer, product, or ID", "按客户、商品或编号搜索")}
                  className="pl-9 h-10 bg-card border-border/60 rounded-xl shadow-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <SelectTrigger className="h-10 w-[180px] bg-card border-border/60 rounded-xl shadow-sm">
                    <SelectValue placeholder={t("Sort", "排序")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc">{t("Newest first", "最新优先")}</SelectItem>
                    <SelectItem value="date_asc">{t("Oldest first", "最早优先")}</SelectItem>
                    <SelectItem value="amount_desc">{t("Amount: high → low", "金额：高 → 低")}</SelectItem>
                    <SelectItem value="amount_asc">{t("Amount: low → high", "金额：低 → 高")}</SelectItem>
                    {!hideVolume ? (
                      <>
                        <SelectItem value="cv_desc">{t("CV: high → low", "CV：高 → 低")}</SelectItem>
                        <SelectItem value="cv_asc">{t("CV: low → high", "CV：低 → 高")}</SelectItem>
                      </>
                    ) : null}
                    <SelectItem value="customer_asc">{t("Customer A → Z", "客户 A → Z")}</SelectItem>
                  </SelectContent>
                </Select>
                <FilterPopover
                  t={t}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  dateFrom={dateFrom}
                  setDateFrom={setDateFrom}
                  dateTo={dateTo}
                  setDateTo={setDateTo}
                  count={customerFilterCount}
                  statusLabel={statusLabel}
                />
                <Button
                  variant="outline"
                  onClick={exportCustomerCsv}
                  disabled={filtered.length === 0}
                  className="gap-2 bg-card hover:bg-secondary rounded-xl h-10"
                >
                  <Download className="w-4 h-4" /> {t("Export CSV", "导出 CSV")}
                </Button>
              </div>
            </div>

            <Card className="shadow-sm border-border/50 rounded-2xl bg-card overflow-hidden">
              {ordersQuery.isLoading ? (
                <div className="p-12 text-center text-sm text-muted-foreground">{t("Loading…", "加载中…")}</div>
              ) : filtered.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {orders.length === 0
                      ? t("No orders yet", "暂无订单")
                      : t("No orders match your search", "没有符合条件的订单")}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    {orders.length === 0
                      ? t(
                          "When customers purchase using your share links, their orders will appear here.",
                          "当客户通过你的分享链接下单后，订单将显示在此处。",
                        )
                      : t("Try a different search term.", "请尝试其他搜索词。")}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/40 border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="text-left font-semibold px-4 py-3">{t("Order", "订单")}</th>
                        <th className="text-left font-semibold px-4 py-3">{t("Customer", "客户")}</th>
                        <th className="text-left font-semibold px-4 py-3">{t("Product", "商品")}</th>
                        <th className="text-left font-semibold px-4 py-3">{t("Date", "日期")}</th>
                        <th className="text-right font-semibold px-4 py-3">{t("Amount", "金额")}</th>
                        {!hideVolume ? (
                          <>
                            <th className="text-right font-semibold px-4 py-3">{t("CV", "CV")}</th>
                            <th className="text-right font-semibold px-4 py-3">{t("QV", "QV")}</th>
                          </>
                        ) : null}
                        <th className="text-left font-semibold px-4 py-3">{t("Status", "状态")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((o) => (
                        <tr
                          key={o.id}
                          onClick={() => setOpenOrderId(o.id)}
                          className="border-b border-border/40 last:border-b-0 hover:bg-secondary/30 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.orderName ?? `#${o.id}`}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-7 h-7 bg-primary/10">
                                <AvatarFallback className="text-[10px] text-primary font-semibold">
                                  {o.customerName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{o.customerName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{o.productName}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(o.occurredAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatYen(o.amountCents)}</td>
                          {!hideVolume ? (
                            <>
                              <td className="px-4 py-3 text-right tabular-nums text-primary">{formatVolume(o.cvCents ?? o.amountCents)}</td>
                              <td className="px-4 py-3 text-right tabular-nums">{formatVolume(o.qvCents ?? o.amountCents)}</td>
                            </>
                          ) : null}
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant(o.status)}>{statusLabel(o.status)}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="referred" className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm border-border/50 rounded-2xl bg-card">
                <div className="p-5 flex flex-col gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("Referred this month", "本月推荐")}
                  </span>
                  <span className="text-3xl font-bold display-num tabular-nums tracking-tight">
                    {referredMonthCount}
                  </span>
                </div>
              </Card>
              <Card className="shadow-sm border-border/50 rounded-2xl bg-card">
                <div className="p-5 flex flex-col gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("Total referred orders", "推荐订单总数")}
                  </span>
                  <span className="text-3xl font-bold display-num tabular-nums tracking-tight">
                    {referred.length}
                  </span>
                </div>
              </Card>
              {!hideVolume ? (
              <Card className="shadow-sm border-border/50 rounded-2xl bg-card">
                <div className="p-5 flex flex-col gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("Referred volume", "推荐销售额")}
                  </span>
                  <span className="text-3xl font-bold display-num tabular-nums tracking-tight">
                    {formatYen(referred.reduce((s, o) => s + o.amountCents, 0))}
                  </span>
                </div>
              </Card>
              ) : null}
            </div>

            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={referredSearch}
                  onChange={(e) => setReferredSearch(e.target.value)}
                  placeholder={t("Search referred orders", "搜索推荐订单")}
                  className="pl-9 h-10 bg-card border-border/60 rounded-xl shadow-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={refSortKey} onValueChange={(v) => setRefSortKey(v as SortKey)}>
                  <SelectTrigger className="h-10 w-[180px] bg-card border-border/60 rounded-xl shadow-sm">
                    <SelectValue placeholder={t("Sort", "排序")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc">{t("Newest first", "最新优先")}</SelectItem>
                    <SelectItem value="date_asc">{t("Oldest first", "最早优先")}</SelectItem>
                    <SelectItem value="amount_desc">{t("Amount: high → low", "金额：高 → 低")}</SelectItem>
                    <SelectItem value="amount_asc">{t("Amount: low → high", "金额：低 → 高")}</SelectItem>
                    {!hideVolume ? (
                      <>
                        <SelectItem value="cv_desc">{t("CV: high → low", "CV：高 → 低")}</SelectItem>
                        <SelectItem value="cv_asc">{t("CV: low → high", "CV：低 → 高")}</SelectItem>
                      </>
                    ) : null}
                    <SelectItem value="customer_asc">{t("Customer A → Z", "客户 A → Z")}</SelectItem>
                  </SelectContent>
                </Select>
                <FilterPopover
                  t={t}
                  statusFilter={refStatusFilter}
                  setStatusFilter={setRefStatusFilter}
                  dateFrom={refDateFrom}
                  setDateFrom={setRefDateFrom}
                  dateTo={refDateTo}
                  setDateTo={setRefDateTo}
                  count={referredFilterCount}
                  statusLabel={statusLabel}
                />
                <Button
                  variant="outline"
                  onClick={exportReferredCsv}
                  disabled={filteredReferred.length === 0}
                  className="gap-2 bg-card hover:bg-secondary rounded-xl h-10"
                >
                  <Download className="w-4 h-4" /> {t("Export CSV", "导出 CSV")}
                </Button>
              </div>
            </div>

            <Card className="shadow-sm border-border/50 rounded-2xl bg-card overflow-hidden">
              {referredQuery.isLoading ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  {t("Loading…", "加载中…")}
                </div>
              ) : filteredReferred.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {referred.length === 0
                      ? t("No referred orders yet", "暂无推荐订单")
                      : t("No orders match your search", "没有符合条件的订单")}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    {referred.length === 0
                      ? t(
                          "When someone buys after visiting your share link, that order shows up here with your sponsor ID attached.",
                          "当有人通过你的分享链接购买并带有你的推荐 ID 时,订单将显示在此处。",
                        )
                      : t("Try a different search term.", "请尝试其他搜索词。")}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/40 border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="text-left font-semibold px-4 py-3">{t("Order", "订单")}</th>
                        <th className="text-left font-semibold px-4 py-3">{t("Customer", "客户")}</th>
                        <th className="text-left font-semibold px-4 py-3">{t("Product", "商品")}</th>
                        <th className="text-left font-semibold px-4 py-3">{t("Date", "日期")}</th>
                        <th className="text-right font-semibold px-4 py-3">{t("Amount", "金额")}</th>
                        {!hideVolume ? (
                          <>
                            <th className="text-right font-semibold px-4 py-3">{t("CV", "CV")}</th>
                            <th className="text-right font-semibold px-4 py-3">{t("QV", "QV")}</th>
                          </>
                        ) : null}
                        <th className="text-left font-semibold px-4 py-3">{t("Status", "状态")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReferred.map((o) => (
                        <tr key={o.id} className="border-b border-border/40 last:border-b-0 hover:bg-secondary/20">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {o.orderName ?? `#${o.id}`}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-7 h-7 bg-primary/10">
                                <AvatarFallback className="text-[10px] text-primary font-semibold">
                                  {o.customerName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{o.customerName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{o.productName}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(o.occurredAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">
                            {formatYen(o.amountCents)}
                          </td>
                          {!hideVolume ? (
                            <>
                              <td className="px-4 py-3 text-right tabular-nums text-primary">{formatVolume(o.cvCents ?? o.amountCents)}</td>
                              <td className="px-4 py-3 text-right tabular-nums">{formatVolume(o.qvCents ?? o.amountCents)}</td>
                            </>
                          ) : null}
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant(o.status)}>{statusLabel(o.status)}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <OrderDetailDialog
        orderId={openOrderId}
        onOpenChange={(open) => {
          if (!open) setOpenOrderId(null);
        }}
      />
    </AppLayout>
  );
}

function FilterPopover({
  t,
  statusFilter,
  setStatusFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  count,
  statusLabel,
}: {
  t: (en: string, zh: string) => string;
  statusFilter: Set<string>;
  setStatusFilter: (s: Set<string>) => void;
  dateFrom: string;
  setDateFrom: (s: string) => void;
  dateTo: string;
  setDateTo: (s: string) => void;
  count: number;
  statusLabel: (s: string) => string;
}) {
  const toggleStatus = (s: string) => {
    const next = new Set(statusFilter);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setStatusFilter(next);
  };
  const clearAll = () => {
    setStatusFilter(new Set());
    setDateFrom("");
    setDateTo("");
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-card hover:bg-secondary rounded-xl h-10"
        >
          <Filter className="w-4 h-4" /> {t("Filter", "筛选")}
          {count > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("Status", "状态")}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((s) => {
              const id = `status-${s}-${Math.random().toString(36).slice(2, 6)}`;
              return (
                <label
                  key={s}
                  className="flex items-center gap-2 text-sm cursor-pointer select-none"
                >
                  <Checkbox
                    checked={statusFilter.has(s)}
                    onCheckedChange={() => toggleStatus(s)}
                    id={id}
                  />
                  <span>{statusLabel(s)}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("Date range", "日期范围")}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("From", "起")}</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("To", "止")}</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={count === 0}
          >
            {t("Clear all", "清除全部")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function OrderDetailDialog({
  orderId,
  onOpenChange,
}: {
  orderId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLang();
  const query = useGetOrder(orderId ?? 0);
  const order = query.data;

  const statusLabel = (s: string) =>
    s === "delivered" ? t("Delivered", "已送达") :
    s === "shipped" ? t("Shipped", "已发货") :
    s === "paid" ? t("Paid", "已付款") :
    s === "refunded" ? t("Refunded", "已退款") :
    s;

  const subtotal = order
    ? order.lineItems.reduce((s, li) => s + li.priceCents * li.quantity, 0)
    : 0;

  return (
    <Dialog open={orderId != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {order?.orderName ?? (orderId != null ? `#${orderId}` : "")}
            {order && <Badge variant="secondary">{statusLabel(order.status)}</Badge>}
          </DialogTitle>
          <DialogDescription>
            {order
              ? new Date(order.occurredAt).toLocaleString()
              : t("Loading…", "加载中…")}
          </DialogDescription>
        </DialogHeader>

        {query.isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("Loading…", "加载中…")}
          </div>
        ) : query.isError || !order ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("Could not load order.", "无法加载订单。")}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {t("Customer", "客户")}
                </div>
                <div className="font-medium">{order.customerName}</div>
                {order.customerEmail && (
                  <div className="text-muted-foreground">{order.customerEmail}</div>
                )}
                {order.customerPhone && (
                  <div className="text-muted-foreground">{order.customerPhone}</div>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {t("Shipping address", "收货地址")}
                </div>
                {order.shippingAddress ? (
                  <div className="text-muted-foreground leading-relaxed">
                    {[order.shippingAddress.firstName, order.shippingAddress.lastName]
                      .filter(Boolean)
                      .join(" ") || null}
                    {order.shippingAddress.line1 && <div>{order.shippingAddress.line1}</div>}
                    {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
                    <div>
                      {[
                        order.shippingAddress.city,
                        order.shippingAddress.region,
                        order.shippingAddress.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    {order.shippingAddress.country && <div>{order.shippingAddress.country}</div>}
                  </div>
                ) : (
                  <div className="text-muted-foreground">—</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {t("Items", "商品")}
              </div>
              <div className="border border-border/50 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left font-semibold px-4 py-2">{t("Product", "商品")}</th>
                      <th className="text-right font-semibold px-4 py-2">{t("Qty", "数量")}</th>
                      <th className="text-right font-semibold px-4 py-2">{t("Price", "单价")}</th>
                      <th className="text-right font-semibold px-4 py-2">{t("Total", "小计")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.lineItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">
                          {order.productName}
                        </td>
                      </tr>
                    ) : (
                      order.lineItems.map((li, i) => (
                        <tr key={i} className="border-t border-border/40">
                          <td className="px-4 py-3">
                            <div className="font-medium">{li.title}</div>
                            {li.variantTitle && (
                              <div className="text-xs text-muted-foreground">{li.variantTitle}</div>
                            )}
                            {li.sku && (
                              <div className="text-xs font-mono text-muted-foreground">SKU: {li.sku}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{li.quantity}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{formatYen(li.priceCents)}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold">
                            {formatYen(li.priceCents * li.quantity)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-1 items-end text-sm">
              {order.lineItems.length > 0 && (
                <div className="flex justify-between gap-8 w-full max-w-xs">
                  <span className="text-muted-foreground">{t("Subtotal", "小计")}</span>
                  <span className="tabular-nums">{formatYen(subtotal)}</span>
                </div>
              )}
              {order.discountCodes.map((d, i) => (
                <div key={i} className="flex justify-between gap-8 w-full max-w-xs">
                  <span className="text-muted-foreground">
                    {t("Discount", "折扣")} ({d.code})
                  </span>
                  <span className="tabular-nums text-primary">−{formatYen(d.amountCents)}</span>
                </div>
              ))}
              <div className="flex justify-between gap-8 w-full max-w-xs pt-2 border-t border-border/50 mt-1">
                <span className="font-semibold">{t("Total", "总计")}</span>
                <span className="tabular-nums font-bold text-base">
                  {formatYen(order.amountCents)}
                </span>
              </div>
            </div>

            {order.note && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {t("Note", "备注")}
                </div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">{order.note}</div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
