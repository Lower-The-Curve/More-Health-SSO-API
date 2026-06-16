import type { FapiaoData } from "./FapiaoDialog";
import type { PerformanceData } from "./PerformanceReportDialog";

export function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  // BOM so Excel detects UTF-8 (matters for Chinese labels).
  const blob = new Blob(["\uFEFF" + buildCsv(headers, rows)], {
    type: "text/csv;charset=utf-8",
  });
  downloadBlob(filename, blob);
}

export function fapiaoCsv(data: FapiaoData): { headers: string[]; rows: (string | number)[][] } {
  const headers = ["Field 字段", "Value 值"];
  const rows: (string | number)[][] = [
    ["Week 周次 / Week", data.weekLabel],
    ["Fapiao Code 发票代码", data.code],
    ["Fapiao Number 发票号码", data.number],
    ["Issue Date 开票日期", data.date],
    ["Check Code 校验码", data.checkCode],
    ["Taxable Amount 不含税金额 (CNY)", data.taxableAmount.toFixed(2)],
    ["Tax Rate 税率", (data.taxRate * 100).toFixed(2) + "%"],
    ["Tax Amount 税额 (CNY)", data.taxAmount.toFixed(2)],
    ["Net Amount 价税合计 (CNY)", data.net.toFixed(2)],
  ];
  return { headers, rows };
}

export function performanceCsv(data: PerformanceData): { headers: string[]; rows: (string | number)[][] } {
  const headers = ["Metric 指标", "Value 值"];
  const rows: (string | number)[][] = [
    ["Week 周次 (EN)", data.weekLabel],
    ["Week 周次 (中)", data.weekLabelZh],
    ["Net Paid 净到账 (CNY)", data.net.toFixed(2)],
    ["Gross 毛收入 (CNY)", data.gross.toFixed(2)],
    ["Store Views 店铺浏览量", data.storeViews],
    ["Unique Visitors 独立访客", data.uniqueVisitors],
    ["Avg Session 平均时长", data.avgSession],
    ["Reviews 评价数", data.reviews],
    ["Rating 评分", data.rating.toFixed(1)],
    ["Orders 订单数", data.orders],
    ["Conversion 转化率", (data.conversion * 100).toFixed(2) + "%"],
    ["WeChat Reach 微信触达", data.social.wechat],
    ["Xiaohongshu Reach 小红书触达", data.social.xhs],
    ["Douyin Reach 抖音触达", data.social.douyin],
    ["Revenue: Direct 直营收入", data.breakdown.direct.toFixed(2)],
    ["Revenue: Referred 推荐收入", data.breakdown.referred.toFixed(2)],
    ["Revenue: Bonus 奖金", data.breakdown.bonus.toFixed(2)],
    ["vs Last Week 环比", (data.vsLast * 100).toFixed(1) + "%"],
    ["", ""],
    ["Top Content (title / platform / views / orders / revenue)", ""],
    ...data.topContent.map<(string | number)[]>((c) => [
      `${c.title} | ${c.titleZh}`,
      `${c.platform} · views=${c.views} · orders=${c.orders} · revenue=${c.revenue.toFixed(2)}`,
    ]),
  ];
  return { headers, rows };
}

export function csvFileBytes(headers: string[], rows: (string | number)[][]): Uint8Array {
  const body = "\uFEFF" + buildCsv(headers, rows);
  return new TextEncoder().encode(body);
}

export function safeFilenamePart(s: string): string {
  return s.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}
