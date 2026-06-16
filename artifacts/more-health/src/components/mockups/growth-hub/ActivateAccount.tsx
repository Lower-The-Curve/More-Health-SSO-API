import "./_group.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  User,
  Package,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  Sparkles,
  Globe,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { BrandLogo } from "./_shared/BrandLogo";
import { useLang } from "@/lib/i18n";
import { startLogin } from "@/lib/auth";
import {
  lookupOrderForSignup,
  createAffiliate,
  type OrderLookupResult,
} from "@workspace/api-client-react";

// Shopify deep links often carry IDs as GIDs, e.g.
// "gid://shopify/Order/7024250257595". The backend stores and matches against
// the unwrapped numeric tail, so normalize any GID down to that tail before we
// use it for order lookup or persist it as the customer id.
function unwrapGid(v: string | null | undefined): string | null {
  if (v == null) return null;
  const s = v.trim();
  if (!s) return null;
  const m = /^gid:\/\/shopify\/[^/]+\/(.+)$/.exec(s);
  return m ? m[1]! : s;
}

function strengthScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length >= 12) s++;
  return Math.min(s, 4);
}

const STRENGTH_TONE = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-primary",
];

type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; order: OrderLookupResult }
  | { kind: "missing" }
  | { kind: "not_found" }
  | { kind: "claimed"; email: string }
  | { kind: "error"; message: string };

function formatShipping(sa: OrderLookupResult["shippingAddress"]): string {
  if (!sa) return "";
  const parts = [
    sa.line1,
    sa.line2,
    [sa.city, sa.region].filter(Boolean).join(", "),
    sa.postalCode,
    sa.country,
  ].filter((p): p is string => Boolean(p && p.trim().length > 0));
  return parts.join(" · ");
}

export function ActivateAccount() {
  const { lang, toggle, t } = useLang();
  const [, setLocation] = useLocation();

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [lookup, setLookup] = useState<LookupState>({ kind: "idle" });
  const [manualOrder, setManualOrder] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const lookupOnce = useRef(false);

  const score = useMemo(() => strengthScore(pw), [pw]);
  const matches = pw.length > 0 && pw === pw2;
  const ruleLen = pw.length >= 8;
  const ruleUp = /[A-Z]/.test(pw);
  const ruleNum = /[0-9]/.test(pw);

  const runLookup = async (orderName: string, email: string) => {
    setLookup({ kind: "loading" });
    try {
      const order = await lookupOrderForSignup({ orderName, email });
      setLookup({ kind: "ready", order });
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 409) {
        setLookup({ kind: "claimed", email });
      } else if (status === 404) {
        setLookup({ kind: "not_found" });
      } else {
        setLookup({
          kind: "error",
          message: (err as Error).message ?? "Lookup failed",
        });
      }
    }
  };

  // Auto-lookup from Shopify post-purchase deep link: ?order=#MH-10482&email=...
  useEffect(() => {
    if (lookupOnce.current) return;
    lookupOnce.current = true;
    const params = new URLSearchParams(window.location.search);
    // Accept any of: ?order=…, ?orderName=…, ?shopifyOrderId=…, ?orderId=…
    // Values may arrive as a Shopify GID (e.g. "gid://shopify/Order/698…"); we
    // unwrap to the numeric tail because the backend lookup matches against the
    // order_name column (e.g. "#1025") and the shopify_order_id column
    // (e.g. "6981618991291"), both of which store the unwrapped value.
    const order = unwrapGid(
      params.get("order") ??
        params.get("orderName") ??
        params.get("shopifyOrderId") ??
        params.get("orderId"),
    );
    const email = params.get("email");
    if (order && email) {
      setManualOrder(order);
      setManualEmail(email);
      void runLookup(order, email);
    } else {
      setLookup({ kind: "missing" });
    }
  }, []);

  const STRENGTH_LABEL = [
    t("Too weak", "太弱"),
    t("Weak", "较弱"),
    t("Fair", "中等"),
    t("Strong", "较强"),
    t("Excellent", "极强"),
  ];

  const order = lookup.kind === "ready" ? lookup.order : null;
  const firstName = order?.firstName ?? "";
  const lastName = order?.lastName ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const greetName = firstName || t("Partner", "合作伙伴");
  const orderEmail = order?.email ?? "";
  const orderName = order?.orderName ?? "";
  const shippingLine = formatShipping(order?.shippingAddress ?? null);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualOrder.trim() && manualEmail.trim()) {
      void runLookup(manualOrder.trim(), manualEmail.trim());
    }
  };

  const handleCreate = async () => {
    setCreateError(null);
    if (!orderEmail) {
      setCreateError(t("Missing order email.", "缺少订单邮箱。"));
      return;
    }
    setCreating(true);
    try {
      // Create the customer/affiliate (and the underlying login) in the Kwik
      // backend. The account and its credentials live entirely in Kwik, which
      // is also the OIDC identity provider — so once this succeeds the buyer
      // can immediately sign in through the shared login. The profile in our DB
      // is created/backfilled server-side at first sign-in from the matched
      // order (getOrCreateProfile -> backfillFromOrders).
      await createAffiliate({
        email: orderEmail,
        password: pw,
        givenName: firstName || null,
        familyName: lastName || null,
        phoneNumber: order?.phone ?? null,
        acceptsMarketing: true,
      });
      // Hand off to the OIDC login so the buyer authenticates with the password
      // they just chose; the BFF callback establishes the session and lands
      // them on the dashboard.
      startLogin("/dashboard");
    } catch (affErr) {
      const data = (affErr as { data?: { error?: string } }).data;
      setCreateError(
        data?.error ??
          t(
            "We couldn't create your account right now. Please try again.",
            "暂时无法创建您的账户，请重试。",
          ),
      );
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-background">
      <header className="h-16 border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <BrandLogo variant="dark" className="h-7" />
          <div className="flex items-center gap-5 text-sm">
            <span className="hidden md:inline text-muted-foreground">
              {t("Need help?", "需要帮助？")}{" "}
              <a href="#" className="text-foreground font-medium hover:underline">
                {t("Contact support", "联系客服")}
              </a>
            </span>
            <button
              onClick={toggle}
              className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4" />
              <span className={lang === "en" ? "text-foreground font-semibold" : ""}>EN</span>
              <span className="text-muted-foreground/60">/</span>
              <span className={lang === "zh" ? "text-foreground font-semibold" : ""}>中</span>
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent pointer-events-none" />
        <div className="absolute -top-32 -right-24 w-[480px] h-[480px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 py-12 relative">
          <div className="flex items-center gap-2 mb-5">
            <Badge className="bg-primary/10 text-primary border-0 rounded-full font-semibold tracking-wide px-3 py-1 text-[11px] uppercase">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {t("Order Confirmed", "订单已确认")}
            </Badge>
            {orderName && (
              <Badge variant="outline" className="rounded-full border-border/60 text-muted-foreground font-medium text-[11px]">
                {orderName}
              </Badge>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-semibold tracking-tight text-foreground leading-[1.05]">
            {lookup.kind === "ready"
              ? t(`Welcome to More Health, ${greetName}.`, `欢迎加入 More Health，${greetName}。`)
              : t("Welcome to More Health.", "欢迎加入 More Health。")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-3 font-medium">
            {t("Your enrollment is complete. Let's activate your account.", "你的注册已完成，让我们激活你的账户。")}
          </p>

          <div className="mt-8 flex items-center gap-3 text-sm">
            <Step n={1} label={t("Purchase", "购买")} done />
            <Connector done />
            <Step n={2} label={t("Activate", "激活")} active />
            <Connector />
            <Step n={3} label={t("Dashboard", "进入后台")} />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Verified information */}
            <Card className="rounded-2xl border-border/50 bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-5 flex items-center justify-between border-b border-border/50">
                <div>
                  <h2 className="font-display font-semibold text-base text-foreground">{t("Verified information", "已验证信息")}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("Imported from your order", "已从你的订单同步")}</p>
                </div>
              </div>

              {lookup.kind === "loading" && (
                <div className="p-10 flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("Looking up your order…", "正在查找你的订单…")}
                </div>
              )}

              {(lookup.kind === "missing" ||
                lookup.kind === "not_found" ||
                lookup.kind === "error") && (
                <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
                  <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-xs text-amber-900">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      {lookup.kind === "missing"
                        ? t(
                            "Enter your order number and the email you used at checkout to verify your information.",
                            "请输入订单号和结账时使用的邮箱以验证你的信息。",
                          )
                        : lookup.kind === "not_found"
                          ? t(
                              "We couldn't find that order. Double-check the order number and email.",
                              "未找到该订单。请核对订单号和邮箱。",
                            )
                          : t(
                              "Something went wrong looking up your order. Please try again.",
                              "查询订单时出错,请重试。",
                            )}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="order" className="text-xs">{t("Order number", "订单号")}</Label>
                      <Input
                        id="order"
                        placeholder="#MH-10482"
                        value={manualOrder}
                        onChange={(e) => setManualOrder(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="orderEmail" className="text-xs">{t("Email", "邮箱")}</Label>
                      <Input
                        id="orderEmail"
                        type="email"
                        placeholder="you@example.com"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full sm:w-auto">
                    {t("Verify order", "验证订单")}
                  </Button>
                </form>
              )}

              {lookup.kind === "claimed" && (
                <div className="p-6 space-y-3">
                  <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-secondary/40 p-3 text-xs text-foreground">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                    <span>
                      {t(
                        "This order is already linked to an account. Please sign in instead.",
                        "该订单已绑定账户,请直接登录。",
                      )}
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      setLocation(`/sign-in?email=${encodeURIComponent(lookup.email)}`)
                    }
                    className="w-full sm:w-auto"
                  >
                    {t("Go to sign in", "前往登录")}
                  </Button>
                </div>
              )}

              {lookup.kind === "ready" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
                    <Field
                      icon={<User className="w-4 h-4" />}
                      label={t("Full name", "姓名")}
                      value={fullName || "—"}
                    />
                    <Field
                      icon={<Mail className="w-4 h-4" />}
                      label={t("Email", "邮箱")}
                      value={orderEmail || "—"}
                      verifiedLabel={t("Verified", "已验证")}
                      verified
                    />
                    <Field
                      icon={<Phone className="w-4 h-4" />}
                      label={t("Phone", "手机号")}
                      value={order?.phone ?? "—"}
                      verifiedLabel={t("Verified", "已验证")}
                      verified={Boolean(order?.phone)}
                    />
                    <Field
                      icon={<MapPin className="w-4 h-4" />}
                      label={t("Shipping address", "收货地址")}
                      value={shippingLine || "—"}
                    />
                  </div>
                  <div className="px-6 py-4 bg-secondary/30 border-t border-border/50 flex items-center gap-3 text-xs">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">
                      {t("Securely transferred from your checkout. We'll never share your details.", "所有信息已从结账过程中加密同步，绝不外泄。")}
                    </span>
                  </div>
                </>
              )}
            </Card>

            {/* Create password — or verify email once submitted */}
            <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
              <div className="px-6 py-5 border-b border-border/50">
                <h2 className="font-display font-semibold text-base text-foreground">
                  {t("Create your password", "设置登录密码")}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("Last step before your dashboard", "进入后台前的最后一步")}
                </p>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="pw" className="text-sm font-medium">{t("Password", "密码")}</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="pw"
                      type={show ? "text" : "password"}
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      placeholder={t("Minimum 8 characters", "至少 8 个字符")}
                      className="h-12 pl-10 pr-11 bg-card border-border/60 focus:border-primary shadow-sm rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="pt-2 space-y-2">
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < score ? STRENGTH_TONE[score] : "bg-border/60"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{t("Strength", "强度")}</span>
                      <span className="font-semibold text-foreground">
                        {pw.length === 0 ? "—" : STRENGTH_LABEL[score]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pw2" className="text-sm font-medium">{t("Confirm password", "确认密码")}</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="pw2"
                      type={show ? "text" : "password"}
                      value={pw2}
                      onChange={(e) => setPw2(e.target.value)}
                      placeholder={t("Re-enter password", "再次输入密码")}
                      className={`h-12 pl-10 pr-11 bg-card shadow-sm rounded-xl ${
                        pw2.length === 0
                          ? "border-border/60 focus:border-primary"
                          : matches
                          ? "border-primary/60 focus:border-primary"
                          : "border-rose-400/60 focus:border-rose-500"
                      }`}
                    />
                    {pw2.length > 0 && matches && (
                      <CheckCircle2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-primary" />
                    )}
                  </div>
                  {pw2.length > 0 && !matches && (
                    <p className="text-[11px] text-rose-500">{t("Passwords do not match", "两次输入不一致")}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <Rule ok={ruleLen} label={t("8+ characters", "8 个以上字符")} />
                  <Rule ok={ruleUp} label={t("1 uppercase", "1 个大写字母")} recommended recommendedLabel={t("recommended", "推荐")} />
                  <Rule ok={ruleNum} label={t("1 number", "1 个数字")} recommended recommendedLabel={t("recommended", "推荐")} />
                </div>

                {createError && (
                  <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2.5">
                    {createError}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleCreate}
                  className="w-full h-12 text-base font-semibold rounded-xl mt-2 shadow-sm flex items-center justify-center gap-2"
                  disabled={
                    !matches || score < 2 || creating || lookup.kind !== "ready"
                  }
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("Create my account", "创建我的账户")}
                  {!creating && <ArrowRight className="w-4 h-4" />}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center pt-1">
                  {t("By continuing you agree to the", "继续即表示你同意")}{" "}
                  <a href="#" className="text-foreground hover:underline">{t("Partner Agreement", "合作伙伴协议")}</a>{" "}
                  {t("and", "及")}{" "}
                  <a href="#" className="text-foreground hover:underline">{t("Privacy Policy", "隐私政策")}</a>
                </p>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border-border/50 bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-display font-semibold text-sm text-foreground">{t("Your enrollment", "你的注册")}</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-secondary/60 border border-border/50 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t("Partner Starter Kit", "合作伙伴启动套装")}</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-xs">
                  <Row
                    label={t("Order", "订单")}
                    value={orderName || (lookup.kind === "loading" ? "…" : "—")}
                    mono
                  />
                  {orderEmail && <Row label={t("Email", "邮箱")} value={orderEmail} />}
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-display font-semibold text-foreground">{t("Secure activation", "安全激活")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("One-time link", "一次性链接")}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === "zh" ? (
                  <>本激活链接将在 <span className="font-semibold text-foreground">24 小时</span> 后失效，且仅可使用一次。我们采用银行级加密保护你的账户。</>
                ) : (
                  <>This activation link expires in <span className="font-semibold text-foreground">24 hours</span> and can only be used once. We use bank-grade encryption to protect your account.</>
                )}
              </p>
            </Card>

            <div className="text-center text-[11px] text-muted-foreground">
              {t("Already activated?", "已激活账户？")}{" "}
              <a href="/sign-in" className="text-foreground font-medium hover:underline">{t("Sign in", "登录")}</a>
              {" · "}
              <a href="/sign-in" className="text-foreground font-medium hover:underline">{t("Reset password", "重置密码")}</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({ n, label, active, done }: { n: number; label: string; active?: boolean; done?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
          done
            ? "bg-primary text-primary-foreground"
            : active
            ? "bg-foreground text-background ring-4 ring-foreground/10"
            : "bg-secondary text-muted-foreground border border-border/60"
        }`}
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : n}
      </div>
      <p className={`text-sm font-medium ${active || done ? "text-foreground" : "text-muted-foreground"}`}>{label}</p>
    </div>
  );
}

function Connector({ done }: { done?: boolean }) {
  return <div className={`hidden sm:block flex-none w-10 h-px ${done ? "bg-primary" : "bg-border"}`} />;
}

function Field({
  icon,
  label,
  value,
  verified,
  verifiedLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  verified?: boolean;
  verifiedLabel?: string;
}) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[11px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
        {verified && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">
            <CheckCircle2 className="w-3 h-3" /> {verifiedLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function Rule({
  ok,
  label,
  recommended,
  recommendedLabel,
}: {
  ok: boolean;
  label: string;
  recommended?: boolean;
  recommendedLabel?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] ${
        ok
          ? "border-primary/30 bg-primary/5 text-foreground"
          : "border-border/60 bg-secondary/30 text-muted-foreground"
      }`}
    >
      <CheckCircle2 className={`w-3.5 h-3.5 ${ok ? "text-primary" : "text-muted-foreground/50"}`} />
      <span className="font-medium">{label}</span>
      {recommended && !ok && <span className="ml-auto text-[10px] text-muted-foreground/70">{recommendedLabel}</span>}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-foreground font-medium ${mono ? "font-mono text-[11px]" : ""}`}>{value}</span>
    </div>
  );
}
