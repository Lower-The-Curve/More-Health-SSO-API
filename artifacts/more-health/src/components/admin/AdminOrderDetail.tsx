import { useState } from "react";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLang } from "@/lib/i18n";
import { AdminLayout } from "./AdminLayout";
import {
  useAdminGetOrder,
  getAdminGetOrderQueryKey,
} from "@workspace/api-client-react";

function money(cents: number, currency = "USD"): string {
  const sym = currency === "USD" ? "$" : currency === "CNY" ? "¥" : "";
  return `${sym}${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface Metafield {
  namespace: string | null;
  key: string;
  value: string;
  type?: string | null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function stringifyValue(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// Pull metafields out of a Shopify payload. Supports:
// - Native webhook (with "Include metafield namespaces" set):
//     { metafields: [{ namespace, key, value, type }, ...] }
// - Shopify Flow custom body shapes:
//     { order_metafields: { qualifying_volume: "20.0", ... } }
//     { metafields: { apex: { qualifying_volume: "20.0" } } }
function extractMetafields(raw: unknown): Metafield[] {
  if (!isRecord(raw)) return [];
  const out: Metafield[] = [];

  const pushFromArray = (arr: unknown[]) => {
    for (const m of arr) {
      if (!isRecord(m)) continue;
      const key = typeof m.key === "string" ? m.key : null;
      if (!key) continue;
      out.push({
        namespace: typeof m.namespace === "string" ? m.namespace : null,
        key,
        value: stringifyValue(m.value),
        type: typeof m.type === "string" ? m.type : null,
      });
    }
  };

  const pushFromObject = (
    obj: Record<string, unknown>,
    namespace: string | null,
  ) => {
    for (const [key, value] of Object.entries(obj)) {
      if (isRecord(value) && namespace === null) {
        // Nested {namespace: {key: value}} shape
        pushFromObject(value, key);
      } else {
        out.push({ namespace, key, value: stringifyValue(value) });
      }
    }
  };

  for (const field of ["metafields", "order_metafields"] as const) {
    const v = raw[field];
    if (Array.isArray(v)) pushFromArray(v);
    else if (isRecord(v)) pushFromObject(v, null);
  }

  return out;
}

function dt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminOrderDetail() {
  const [, params] = useRoute("/admin/orders/:id");
  const { t } = useLang();
  const id = Number(params?.id);
  const q = useAdminGetOrder(id, {
    query: {
      enabled: Number.isInteger(id) && id > 0,
      queryKey: getAdminGetOrderQueryKey(id),
    },
  });
  const [rawOpen, setRawOpen] = useState(false);

  return (
    <AdminLayout active="orders">
      <div className="space-y-6">
        <Link href="/admin/orders">
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {t("Back to orders", "返回订单列表")}
          </Button>
        </Link>

        {q.isLoading && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
        {q.isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-sm text-slate-500">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            {t("Order not found.", "订单未找到。")}
          </div>
        )}

        {q.data && (
          <>
            {(() => {
              const raw = q.data.rawPayload;
              const warning =
                isRecord(raw) && typeof raw._parseWarning === "string"
                  ? raw._parseWarning
                  : null;
              if (!warning) return null;
              return (
                <div className="flex items-start gap-2 p-3 rounded-md border border-amber-300 bg-amber-50 text-amber-800 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">
                      {t(
                        "Partial payload — some fields may be missing",
                        "数据不完整 — 部分字段可能缺失",
                      )}
                    </div>
                    <div className="text-xs mt-0.5 text-amber-700">{warning}</div>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold tracking-tight font-mono">
                  {q.data.orderName ?? q.data.shopifyOrderId ?? `#${q.data.id}`}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 flex-wrap">
                  <Badge variant={q.data.source === "shopify" ? "default" : "secondary"}>
                    {q.data.source}
                  </Badge>
                  <Badge variant="outline">{q.data.status}</Badge>
                  <span>{dt(q.data.occurredAt)}</span>
                  {q.data.shopifyAdminOrderUrl && (
                    <a
                      href={q.data.shopifyAdminOrderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t("View in Shopify", "在 Shopify 中查看")}
                    </a>
                  )}
                </div>
                {q.data.tags && q.data.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    {q.data.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 uppercase tracking-wider">
                  {t("Order total", "订单总额")}
                </div>
                <div className="text-2xl font-bold tabular-nums">
                  {money(q.data.amountCents, q.data.currency)}
                </div>
                {q.data.commissionCents > 0 && (
                  <div className="text-sm text-emerald-600 tabular-nums mt-0.5">
                    +{money(q.data.commissionCents, q.data.currency)} {t("commission", "佣金")}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("Customer", "客户")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <Row label={t("Name", "姓名")} value={q.data.customerName} />
                  <Row label={t("Email", "邮箱")} value={q.data.customerEmail} />
                  <Row label={t("Phone", "电话")} value={q.data.customerPhone} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("Mapped to", "归属用户")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  {q.data.clerkUserId ? (
                    <>
                      <div className="flex items-start gap-2">
                        <Link href={`/admin/users/${q.data.clerkUserId}`}>
                          <a className="inline-flex items-center gap-1.5 text-indigo-600 hover:underline">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{q.data.mappedUserName ?? "—"}</span>
                              <span className="font-mono text-xs text-slate-500">
                                {q.data.mappedInfluencerId}
                              </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Link>
                        {q.data.mappedAccountStatus === "pending" && (
                          <Badge
                            variant="outline"
                            className="text-amber-700 border-amber-300 bg-amber-50 text-[10px]"
                          >
                            {t("Pending activation", "待激活")}
                          </Badge>
                        )}
                      </div>
                      {q.data.mappedAccountStatus === "pending" && (
                        <p className="text-xs text-slate-500">
                          {t(
                            "Auto-created from this order. Will merge into the buyer's account when they activate.",
                            "由本订单自动创建，买家激活后将合并到其账户。",
                          )}
                        </p>
                      )}
                      {q.data.mappedSponsor && (
                        <div className="pt-2 border-t border-slate-100">
                          <div className="text-xs text-slate-500 mb-1">
                            {t("Sponsor", "推荐人")}
                          </div>
                          <Link href={`/admin/users/${q.data.mappedSponsor.clerkUserId}`}>
                            <a className="inline-flex items-center gap-1.5 text-indigo-600 hover:underline">
                              <div className="flex flex-col items-start">
                                <span className="font-medium">
                                  {q.data.mappedSponsor.name ?? "—"}
                                </span>
                                <span className="font-mono text-xs text-slate-500">
                                  {q.data.mappedSponsor.influencerId}
                                </span>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-300 bg-amber-50"
                      >
                        {t("Unmapped", "未匹配")}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-2">
                        {t(
                          "No user matches this customer email.",
                          "无用户匹配此客户邮箱。",
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("Shipping", "配送")}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {q.data.shippingAddress ? (
                    <div className="space-y-0.5 leading-relaxed">
                      <div>
                        {[
                          q.data.shippingAddress.firstName,
                          q.data.shippingAddress.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") || "—"}
                      </div>
                      {q.data.shippingAddress.line1 && (
                        <div>{q.data.shippingAddress.line1}</div>
                      )}
                      {q.data.shippingAddress.line2 && (
                        <div>{q.data.shippingAddress.line2}</div>
                      )}
                      <div>
                        {[
                          q.data.shippingAddress.city,
                          q.data.shippingAddress.region,
                          q.data.shippingAddress.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      <div>{q.data.shippingAddress.country}</div>
                      {q.data.shippingAddress.phone && (
                        <div className="text-slate-500 text-xs mt-1">
                          {q.data.shippingAddress.phone}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400">{t("No shipping address.", "无配送地址。")}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t(
                    `Line items (${q.data.lineItems?.length ?? 0})`,
                    `商品明细 (${q.data.lineItems?.length ?? 0})`,
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!q.data.lineItems || q.data.lineItems.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-slate-400">
                    {t("No line items.", "无商品明细。")}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Product", "商品")}</TableHead>
                        <TableHead>{t("SKU", "SKU")}</TableHead>
                        <TableHead className="text-right">{t("Qty", "数量")}</TableHead>
                        <TableHead className="text-right">{t("Price", "单价")}</TableHead>
                        <TableHead className="text-right">{t("Line total", "小计")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {q.data.lineItems.map((li, i) => (
                        <TableRow key={`${li.productId ?? li.title}-${i}`}>
                          <TableCell>
                            <div className="font-medium text-sm">{li.title}</div>
                            {li.variantTitle && (
                              <div className="text-xs text-slate-500">
                                {li.variantTitle}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">
                            {li.sku ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {li.quantity}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {money(li.priceCents, q.data!.currency)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {money(li.priceCents * li.quantity, q.data!.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {q.data.discountCodes && q.data.discountCodes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("Discount codes", "折扣码")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {q.data.discountCodes.map((d, i) => (
                      <div
                        key={`${d.code}-${i}`}
                        className="flex items-center justify-between gap-2 text-sm py-2 border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                            {d.code}
                          </code>
                          {d.type && (
                            <span className="text-xs text-slate-500">{d.type}</span>
                          )}
                        </div>
                        <span className="text-emerald-600 tabular-nums font-medium">
                          −{money(d.amountCents, q.data!.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {q.data.note && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("Customer note", "客户备注")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-slate-700">
                    {q.data.note}
                  </p>
                </CardContent>
              </Card>
            )}

            {q.data.noteAttributes && q.data.noteAttributes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("Custom properties", "自定义属性")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {q.data.noteAttributes.map((a, i) => (
                      <div key={`${a.name}-${i}`}>
                        <dt className="text-xs text-slate-500 mb-0.5">{a.name}</dt>
                        <dd className="break-words">{a.value || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}

            {(() => {
              const mfs = extractMetafields(q.data.rawPayload);
              if (mfs.length === 0) return null;
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t(
                        `Metafields (${mfs.length})`,
                        `元字段 (${mfs.length})`,
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      {mfs.map((m, i) => (
                        <div key={`${m.namespace ?? ""}.${m.key}-${i}`}>
                          <dt className="text-xs text-slate-500 mb-0.5 flex items-baseline gap-1.5">
                            <span>{humanizeKey(m.key)}</span>
                            {m.namespace && (
                              <code className="font-mono text-[10px] text-slate-400">
                                {m.namespace}.{m.key}
                              </code>
                            )}
                          </dt>
                          <dd className="break-words font-medium text-slate-800">
                            {m.value || "—"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              );
            })()}

            <Card>
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => setRawOpen((v) => !v)}
              >
                <CardTitle className="text-base flex items-center gap-2">
                  {rawOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  {t("Raw Shopify payload", "Shopify 原始数据")}
                  <span className="text-xs text-slate-400 font-normal ml-auto">
                    {t("Debug", "调试")}
                  </span>
                </CardTitle>
              </CardHeader>
              {rawOpen && (
                <CardContent>
                  {q.data.rawPayload ? (
                    <pre className="text-[11px] leading-relaxed bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto max-h-[500px]">
                      {JSON.stringify(q.data.rawPayload, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-slate-400">
                      {t(
                        "No raw payload (order was not from Shopify).",
                        "无原始数据（订单来源非 Shopify）。",
                      )}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-right break-all">{value || "—"}</span>
    </div>
  );
}
