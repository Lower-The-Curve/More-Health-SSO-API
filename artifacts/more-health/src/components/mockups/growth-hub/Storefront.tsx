import "./_group.css";
import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { AppLayout } from "./_shared/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Kpi } from "./_shared/Kpi";
import { Copy, ExternalLink, QrCode, Download, MessageCircle, ShoppingCart } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useGetStorefront } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

function formatYen(cents: number): string {
  return `¥${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  end.setUTCDate(end.getUTCDate() - 1);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = start.toLocaleDateString("en-US", opts);
  const e = end.toLocaleDateString("en-US", opts);
  return `${s} – ${e}, ${end.getUTCFullYear()}`;
}

function formatRangeZh(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  end.setUTCDate(end.getUTCDate() - 1);
  return `${start.getUTCFullYear()}年${start.getUTCMonth() + 1}月${start.getUTCDate()}日 – ${end.getUTCMonth() + 1}月${end.getUTCDate()}日`;
}

function startOfWeekUtc(d: Date): Date {
  const out = new Date(d);
  const day = out.getUTCDay();
  const diff = (day + 6) % 7;
  out.setUTCDate(out.getUTCDate() - diff);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}
function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}

export function Storefront() {
  const { t } = useLang();
  const { toast } = useToast();

  const today = React.useMemo(() => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }, []);
  const defaultStart = React.useMemo(() => startOfWeekUtc(today), [today]);
  const defaultEnd = React.useMemo(() => addDays(defaultStart, 6), [defaultStart]);

  const [range, setRange] = React.useState<DateRange>({
    from: defaultStart,
    to: defaultEnd,
  });
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(range);

  const storefrontQuery = useGetStorefront(
    range.from && range.to
      ? { from: ymd(range.from), to: ymd(range.to) }
      : undefined,
  );
  const data = storefrontQuery.data;

  const applyPreset = (preset: "this-week" | "last-week" | "last-7" | "last-30" | "this-month") => {
    let from: Date;
    let to: Date;
    switch (preset) {
      case "this-week":
        from = startOfWeekUtc(today);
        to = addDays(from, 6);
        break;
      case "last-week":
        from = addDays(startOfWeekUtc(today), -7);
        to = addDays(from, 6);
        break;
      case "last-7":
        to = today;
        from = addDays(today, -6);
        break;
      case "last-30":
        to = today;
        from = addDays(today, -29);
        break;
      case "this-month": {
        from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
        to = today;
        break;
      }
    }
    const next = { from, to };
    setRange(next);
    setDraftRange(next);
    setPickerOpen(false);
  };

  const applyDraft = () => {
    if (draftRange?.from && draftRange?.to) {
      setRange({ from: draftRange.from, to: draftRange.to });
      setPickerOpen(false);
    }
  };
  const qrRef = React.useRef<HTMLDivElement>(null);
  const [qrOpen, setQrOpen] = React.useState(false);

  const fmtDelta = (pct: number | null | undefined) =>
    pct == null ? null : `${pct >= 0 ? "+" : ""}${pct}%`;
  const trendOf = (pct: number | null | undefined): "up" | "down" =>
    (pct ?? 0) >= 0 ? "up" : "down";

  const shopShareUrl = data?.shopShareUrl ?? "";
  const displayUrl = shopShareUrl
    ? shopShareUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : t("Set your storefront link in Settings", "请在设置中配置店铺链接");

  const rangeLabel = data
    ? t(formatRange(data.rangeStart, data.rangeEnd), formatRangeZh(data.rangeStart, data.rangeEnd))
    : "";
  const prevRangeLabel = data
    ? t(`vs. ${formatRange(data.prevRangeStart, data.prevRangeEnd)}`, `对比 ${formatRangeZh(data.prevRangeStart, data.prevRangeEnd)}`)
    : "";
  const rangeDays = data
    ? Math.max(
        1,
        Math.round(
          (new Date(data.rangeEnd).getTime() - new Date(data.rangeStart).getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      )
    : 7;
  const compareLabel = t(`vs. previous ${rangeDays} days`, `环比前 ${rangeDays} 天`);

  const shareCaption = t(
    "Check out my More Health shop — wellness picks I love. Use my link so I get credit:",
    "看看我的 More Health 店铺，全是我喜欢的健康产品。用我的链接下单可以为我记功：",
  );
  const shareBlob = shopShareUrl ? `${shareCaption} ${shopShareUrl}` : "";

  async function copyText(value: string): Promise<boolean> {
    if (!value) return false;
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }

  const onCopy = async () => {
    const ok = await copyText(shopShareUrl);
    toast({
      title: ok
        ? t("Link copied", "链接已复制")
        : t("Couldn't copy link", "复制失败"),
      description: ok
        ? t("Paste it anywhere to share your store.", "可以粘贴到任意位置分享。")
        : t("Please copy it manually from the address bar above.", "请手动复制上方链接。"),
    });
  };

  const onOpen = () => {
    if (shopShareUrl) window.open(shopShareUrl, "_blank", "noopener");
  };

  const onCopyCaption = async () => {
    const ok = await copyText(shareBlob);
    toast({
      title: ok
        ? t("Caption + link copied", "文案与链接已复制")
        : t("Couldn't copy", "复制失败"),
      description: ok
        ? t("Paste into your post.", "可以粘贴到你的帖子里。")
        : t("Please copy it manually.", "请手动复制。"),
    });
  };

  // WeChat / Xiaohongshu / Douyin do not expose a web share intent. We
  // copy the caption + link, open the platform site so they can paste,
  // and toast the user with what to do next.
  const onShareWeChat = async () => {
    if (!shopShareUrl) return;
    await copyText(shareBlob);
    setQrOpen(true);
    toast({
      title: t("Ready for WeChat", "微信分享已就绪"),
      description: t(
        "Scan the QR with WeChat, or paste the copied link into a chat.",
        "请用微信扫码，或将已复制的链接粘贴到聊天中。",
      ),
    });
  };

  const onShareXiaohongshu = async () => {
    if (!shopShareUrl) return;
    const ok = await copyText(shareBlob);
    window.open("https://www.xiaohongshu.com/", "_blank", "noopener");
    toast({
      title: t("Opening Xiaohongshu…", "正在打开小红书…"),
      description: ok
        ? t("Caption + link copied — paste into your new post.", "文案与链接已复制，可直接粘贴到新帖子。")
        : t("Please copy your link manually.", "请手动复制链接。"),
    });
  };

  const onShareDouyin = async () => {
    if (!shopShareUrl) return;
    const ok = await copyText(shareBlob);
    window.open("https://www.douyin.com/", "_blank", "noopener");
    toast({
      title: t("Opening Douyin…", "正在打开抖音…"),
      description: ok
        ? t("Caption + link copied — paste into your video description.", "文案与链接已复制，可粘贴到视频描述。")
        : t("Please copy your link manually.", "请手动复制链接。"),
    });
  };

  const onDownloadQr = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    let src = serializer.serializeToString(svg);
    if (!src.match(/^<svg[^>]+xmlns=/)) {
      src = src.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const img = new Image();
    const svgBlob = new Blob([src], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const size = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "more-health-storefront-qr.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }, "image/png");
    };
    img.src = url;
  };

  return (
    <AppLayout activeId="storefront">
      <div className="space-y-6 max-w-5xl mx-auto">

        <div className="flex items-end justify-between mb-2">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">{t("My Personal Website", "我的个人店铺")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("Your storefront link is your business card.", "你的店铺链接就是你的名片。")}
            </p>
          </div>
        </div>

        <Card className="shadow-md border-border/50 rounded-3xl overflow-hidden bg-card">
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
              <Badge className="w-fit mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-transparent shadow-none">
                {shopShareUrl
                  ? t("Live Storefront", "店铺已上线")
                  : t("Storefront Not Configured", "店铺未配置")}
              </Badge>
              <h2 className="text-3xl font-display font-bold mb-2 text-foreground break-all">{displayUrl}</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                {t("Share this link to earn commission on all purchases made through your store.", "分享此链接，凡通过你的店铺产生的订单，你都将获得佣金。")}
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  className="rounded-xl h-12 px-6 gap-2 text-base shadow-sm"
                  onClick={onCopy}
                  disabled={!shopShareUrl}
                >
                  <Copy className="w-4 h-4" /> {t("Copy Link", "复制链接")}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-12 px-6 gap-2 text-base shadow-sm bg-background border-border/80"
                  onClick={onOpen}
                  disabled={!shopShareUrl}
                >
                  <ExternalLink className="w-4 h-4" /> {t("Open Store", "打开店铺")}
                </Button>
              </div>
            </div>
            <div className="bg-secondary/50 border-l border-border/50 p-8 md:p-10 flex flex-col items-center justify-center min-w-[300px]">
              <div
                ref={qrRef}
                className="w-52 h-52 bg-white rounded-2xl p-4 shadow-sm border border-border flex items-center justify-center"
              >
                <QRCodeSVG
                  value={shopShareUrl || "https://morehealth.com"}
                  size={184}
                  bgColor="#ffffff"
                  fgColor="#0B271F"
                  level="H"
                  marginSize={0}
                  imageSettings={{
                    src: "/images/more-health-logo.png",
                    height: 44,
                    width: 44,
                    excavate: true,
                  }}
                />
              </div>
              <Button
                variant="ghost"
                className="mt-4 gap-2 text-muted-foreground hover:text-foreground"
                onClick={onDownloadQr}
                disabled={!shopShareUrl}
              >
                <Download className="w-4 h-4" /> {t("Download QR Code", "下载二维码")}
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-muted-foreground">
            {data ? (
              <>
                <span className="font-medium text-foreground">
                  {t(formatRange(data.rangeStart, data.rangeEnd), formatRangeZh(data.rangeStart, data.rangeEnd))}
                </span>
                {" · "}
                <span>
                  {t(`vs. ${formatRange(data.prevRangeStart, data.prevRangeEnd)}`, `对比 ${formatRangeZh(data.prevRangeStart, data.prevRangeEnd)}`)}
                </span>
              </>
            ) : (
              t("Loading…", "加载中…")
            )}
          </div>
          <Popover
            open={pickerOpen}
            onOpenChange={(o) => {
              setPickerOpen(o);
              if (o) setDraftRange(range);
            }}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-xl h-10 gap-2 bg-background">
                <CalendarIcon className="w-4 h-4" />
                {data
                  ? t(formatRange(data.rangeStart, data.rangeEnd), formatRangeZh(data.rangeStart, data.rangeEnd))
                  : t("Pick date range", "选择日期范围")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex">
                <div className="flex flex-col gap-1 p-3 border-r border-border/60 w-40">
                  <button
                    type="button"
                    className="text-left text-sm px-3 py-2 rounded-md hover:bg-secondary"
                    onClick={() => applyPreset("this-week")}
                  >
                    {t("This week", "本周")}
                  </button>
                  <button
                    type="button"
                    className="text-left text-sm px-3 py-2 rounded-md hover:bg-secondary"
                    onClick={() => applyPreset("last-week")}
                  >
                    {t("Last week", "上周")}
                  </button>
                  <button
                    type="button"
                    className="text-left text-sm px-3 py-2 rounded-md hover:bg-secondary"
                    onClick={() => applyPreset("last-7")}
                  >
                    {t("Last 7 days", "最近7天")}
                  </button>
                  <button
                    type="button"
                    className="text-left text-sm px-3 py-2 rounded-md hover:bg-secondary"
                    onClick={() => applyPreset("last-30")}
                  >
                    {t("Last 30 days", "最近30天")}
                  </button>
                  <button
                    type="button"
                    className="text-left text-sm px-3 py-2 rounded-md hover:bg-secondary"
                    onClick={() => applyPreset("this-month")}
                  >
                    {t("This month", "本月")}
                  </button>
                </div>
                <div className="p-3">
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    selected={draftRange}
                    onSelect={setDraftRange}
                    defaultMonth={range.from ?? today}
                    disabled={{ after: today }}
                  />
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setPickerOpen(false)}>
                      {t("Cancel", "取消")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={applyDraft}
                      disabled={!draftRange?.from || !draftRange?.to}
                    >
                      {t("Apply", "应用")}
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi
            label={t("Store Visits", "店铺访问")}
            value={(data?.storeVisits.value ?? 0).toLocaleString("en-US")}
            delta={fmtDelta(data?.storeVisits.deltaPct)}
            trend={trendOf(data?.storeVisits.deltaPct)}
            compare={data?.storeVisits.deltaPct == null ? null : compareLabel}
          />
          <Kpi
            label={t("Conversion Rate", "转化率")}
            value={`${(data?.conversionRate.value ?? 0).toFixed(1)}%`}
            delta={
              data?.conversionRate.deltaPct == null
                ? null
                : `${data.conversionRate.deltaPct >= 0 ? "+" : ""}${data.conversionRate.deltaPct}pp`
            }
            trend={trendOf(data?.conversionRate.deltaPct)}
            compare={data?.conversionRate.deltaPct == null ? null : compareLabel}
          />
          <Kpi
            label={t("Store Revenue", "店铺营收")}
            value={formatYen(data?.revenueCents.value ?? 0)}
            delta={fmtDelta(data?.revenueCents.deltaPct)}
            trend={trendOf(data?.revenueCents.deltaPct)}
            compare={data?.revenueCents.deltaPct == null ? null : compareLabel}
          />
          <Kpi
            label={t("Avg Order Value", "客单价")}
            value={formatYen(data?.avgOrderValueCents.value ?? 0)}
            delta={fmtDelta(data?.avgOrderValueCents.deltaPct)}
            trend={trendOf(data?.avgOrderValueCents.deltaPct)}
            compare={data?.avgOrderValueCents.deltaPct == null ? null : compareLabel}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm border-border/50 rounded-2xl bg-card">
            <div className="p-6 border-b border-border/50 flex justify-between items-center">
              <h3 className="font-semibold text-lg">{t("Most Ordered", "最常下单")}</h3>
              <Button variant="ghost" size="sm" className="text-primary">{t("View All", "查看全部")}</Button>
            </div>
            <div className="p-0">
              {(data?.mostOrdered ?? []).length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {t("No sales yet this week.", "本周暂无销售记录。")}
                </div>
              ) : (
                (data?.mostOrdered ?? []).map((product, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center border border-border/50 shadow-sm overflow-hidden">
                        <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{t(`${product.units} units sold`, `已售出 ${product.units} 件`)}</p>
                      </div>
                    </div>
                    <span className="font-semibold tabular-nums text-foreground">{formatYen(product.revenueCents)}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="shadow-sm border-border/50 rounded-2xl bg-card h-fit">
            <div className="p-6 border-b border-border/50">
              <h3 className="font-semibold text-lg">{t("Quick Share", "一键分享")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("Share directly to social platforms", "直接分享到社交平台")}</p>
            </div>
            <CardContent className="p-6 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 bg-emerald-50/50"
                onClick={onShareWeChat}
                disabled={!shopShareUrl}
              >
                <MessageCircle className="w-5 h-5" /> {t("WeChat", "微信")}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-red-50/50"
                onClick={onShareXiaohongshu}
                disabled={!shopShareUrl}
              >
                <ShoppingBag className="w-5 h-5" /> {t("Xiaohongshu", "小红书")}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 rounded-xl text-zinc-800 border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 bg-zinc-50"
                onClick={onShareDouyin}
                disabled={!shopShareUrl}
              >
                <ShoppingCart className="w-5 h-5" /> {t("Douyin", "抖音")}
              </Button>
              <div className="pt-4 mt-4 border-t border-border/50 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-xl h-10 gap-2"
                  onClick={onCopy}
                  disabled={!shopShareUrl}
                >
                  <Copy className="w-4 h-4" /> {t("Link", "链接")}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 rounded-xl h-10 gap-2"
                  onClick={() => setQrOpen(true)}
                  disabled={!shopShareUrl}
                >
                  <QrCode className="w-4 h-4" /> {t("QR", "二维码")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Scan to visit my store", "扫码访问我的店铺")}</DialogTitle>
            <DialogDescription className="break-all">{displayUrl}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="bg-white p-4 rounded-2xl border border-border">
              <QRCodeSVG
                value={shopShareUrl || "https://morehealth.com"}
                size={280}
                bgColor="#ffffff"
                fgColor="#0B271F"
                level="H"
                marginSize={0}
                imageSettings={{
                  src: "/images/more-health-logo.png",
                  height: 64,
                  width: 64,
                  excavate: true,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {t(
                "Open WeChat, Xiaohongshu, or any camera to scan.",
                "用微信、小红书或相机扫一扫即可访问。",
              )}
            </p>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1 gap-2" onClick={onCopy} disabled={!shopShareUrl}>
                <Copy className="w-4 h-4" /> {t("Copy Link", "复制链接")}
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={onCopyCaption} disabled={!shopShareUrl}>
                <Copy className="w-4 h-4" /> {t("Copy Caption", "复制文案")}
              </Button>
              <Button className="flex-1 gap-2" onClick={onDownloadQr} disabled={!shopShareUrl}>
                <Download className="w-4 h-4" /> {t("PNG", "PNG")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function ShoppingBag(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
}

function Badge({ className, children, ...props }: any) {
  return <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`} {...props}>{children}</span>
}
