import "./_group.css";
import React, { useMemo, useState } from "react";
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
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";

const ORDER = {
  customerId: "SHP-CUST-44219",
  orderId: "#MH-10482",
  sku: "ENROLL-STARTER-KIT",
  sponsor: "Lisa Wang · ID 880214",
  timestamp: "Apr 17, 2026 · 14:08 CST",
  firstName: "Brad",
  lastName: "Cooper",
  email: "brad.cooper@gmail.com",
  phone: "+86 138 0011 8826",
  address1: "1188 Nanjing West Road, Apt 2204",
  address2: "Jing'an District",
  city: "Shanghai",
  state: "Shanghai",
  postal: "200040",
  country: "China",
};

function strengthScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length >= 12) s++;
  return Math.min(s, 4);
}

const STRENGTH_LABEL = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];
const STRENGTH_TONE = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-primary",
];

export function ActivateAccount() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const score = useMemo(() => strengthScore(pw), [pw]);
  const matches = pw.length > 0 && pw === pw2;
  const ruleLen = pw.length >= 8;
  const ruleUp = /[A-Z]/.test(pw);
  const ruleNum = /[0-9]/.test(pw);

  return (
    <div className="min-h-screen font-sans bg-background">
      {/* Top bar */}
      <header className="h-16 border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <BrandLogo variant="dark" className="h-7" />
          <div className="flex items-center gap-5 text-sm">
            <span className="hidden md:inline text-muted-foreground">
              Need help? <a href="#" className="text-foreground font-medium hover:underline">Contact support</a>
            </span>
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <Globe className="w-4 h-4" /> EN / 中
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent pointer-events-none" />
        <div className="absolute -top-32 -right-24 w-[480px] h-[480px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 py-12 relative">
          <div className="flex items-center gap-2 mb-5">
            <Badge className="bg-primary/10 text-primary border-0 rounded-full font-semibold tracking-wide px-3 py-1 text-[11px] uppercase">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Order Confirmed
            </Badge>
            <Badge variant="outline" className="rounded-full border-border/60 text-muted-foreground font-medium text-[11px]">
              {ORDER.orderId}
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-semibold tracking-tight text-foreground leading-[1.05]">
            Welcome to More Health, {ORDER.firstName}.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-3 font-medium">
            欢迎加入 More Health · Your enrollment is complete. Let's activate your account.
          </p>

          {/* Stepper */}
          <div className="mt-8 flex items-center gap-3 text-sm">
            <Step n={1} label="Purchase" zh="购买" done />
            <Connector done />
            <Step n={2} label="Activate" zh="激活" active />
            <Connector />
            <Step n={3} label="Dashboard" zh="进入后台" />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Verified info + password */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verified info */}
            <Card className="rounded-2xl border-border/50 bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-5 flex items-center justify-between border-b border-border/50">
                <div>
                  <h2 className="font-display font-semibold text-base text-foreground">Verified information</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">已验证信息 · Imported from your order</p>
                </div>
                <button className="text-xs font-medium text-primary hover:underline">Edit</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
                <Field
                  icon={<User className="w-4 h-4" />}
                  label="Full name"
                  zh="姓名"
                  value={`${ORDER.firstName} ${ORDER.lastName}`}
                />
                <Field
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  zh="邮箱"
                  value={ORDER.email}
                  verified
                />
                <Field
                  icon={<Phone className="w-4 h-4" />}
                  label="Phone"
                  zh="手机号"
                  value={ORDER.phone}
                  verified
                />
                <Field
                  icon={<MapPin className="w-4 h-4" />}
                  label="Shipping address"
                  zh="收货地址"
                  value={`${ORDER.address1}, ${ORDER.city} ${ORDER.postal}`}
                />
              </div>

              <div className="px-6 py-4 bg-secondary/30 border-t border-border/50 flex items-center gap-3 text-xs">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">
                  Securely transferred from your checkout. We'll never share your details ·{" "}
                  <span className="text-foreground/80">所有信息已加密同步</span>
                </span>
              </div>
            </Card>

            {/* Password */}
            <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
              <div className="px-6 py-5 border-b border-border/50">
                <h2 className="font-display font-semibold text-base text-foreground">Create your password</h2>
                <p className="text-xs text-muted-foreground mt-0.5">设置登录密码 · Last step before your dashboard</p>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="pw" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="pw"
                      type={show ? "text" : "password"}
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      placeholder="Minimum 8 characters"
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

                  {/* Strength */}
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
                      <span className="text-muted-foreground">
                        Strength · 强度
                      </span>
                      <span className="font-semibold text-foreground">
                        {pw.length === 0 ? "—" : STRENGTH_LABEL[score]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pw2" className="text-sm font-medium">Confirm password</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="pw2"
                      type={show ? "text" : "password"}
                      value={pw2}
                      onChange={(e) => setPw2(e.target.value)}
                      placeholder="Re-enter password"
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
                    <p className="text-[11px] text-rose-500">Passwords do not match · 两次输入不一致</p>
                  )}
                </div>

                {/* Rules */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <Rule ok={ruleLen} label="8+ characters" />
                  <Rule ok={ruleUp} label="1 uppercase" recommended />
                  <Rule ok={ruleNum} label="1 number" recommended />
                </div>

                {/* CTA */}
                <Button
                  className="w-full h-12 text-base font-semibold rounded-xl mt-2 shadow-sm flex items-center justify-center gap-2"
                  disabled={!matches || score < 2}
                >
                  Create my account <ArrowRight className="w-4 h-4" />
                </Button>

                <p className="text-[11px] text-muted-foreground text-center pt-1">
                  By continuing you agree to the{" "}
                  <a href="#" className="text-foreground hover:underline">Partner Agreement</a> and{" "}
                  <a href="#" className="text-foreground hover:underline">Privacy Policy</a>
                </p>
              </div>
            </Card>
          </div>

          {/* RIGHT: Order summary + sponsor */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-border/50 bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-display font-semibold text-sm text-foreground">Your enrollment</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-secondary/60 border border-border/50 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Partner Starter Kit</p>
                    <p className="text-xs text-muted-foreground">合作伙伴启动套装</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-xs">
                  <Row label="Order" value={ORDER.orderId} mono />
                  <Row label="SKU" value={ORDER.sku} mono />
                  <Row label="Placed" value={ORDER.timestamp} />
                  <Row label="Sponsor" value={ORDER.sponsor} />
                </div>
                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total paid</span>
                  <span className="text-lg font-display font-bold tabular-nums">¥1,888.00</span>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-display font-semibold text-foreground">Secure activation</p>
                  <p className="text-[11px] text-muted-foreground">安全激活 · One-time link</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This activation link expires in <span className="font-semibold text-foreground">24 hours</span> and can
                only be used once. We use bank-grade encryption to protect your account.
              </p>
            </Card>

            <div className="text-center text-[11px] text-muted-foreground">
              Already activated?{" "}
              <a href="#" className="text-foreground font-medium hover:underline">Sign in</a>
              {" · "}
              <a href="#" className="text-foreground font-medium hover:underline">Reset password</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({
  n,
  label,
  zh,
  active,
  done,
}: {
  n: number;
  label: string;
  zh: string;
  active?: boolean;
  done?: boolean;
}) {
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
      <div className="leading-tight">
        <p className={`text-sm font-medium ${active || done ? "text-foreground" : "text-muted-foreground"}`}>
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground">{zh}</p>
      </div>
    </div>
  );
}

function Connector({ done }: { done?: boolean }) {
  return <div className={`hidden sm:block flex-none w-10 h-px ${done ? "bg-primary" : "bg-border"}`} />;
}

function Field({
  icon,
  label,
  zh,
  value,
  verified,
}: {
  icon: React.ReactNode;
  label: string;
  zh: string;
  value: string;
  verified?: boolean;
}) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[11px] uppercase tracking-wider font-semibold">{label}</span>
        <span className="text-[10px] text-muted-foreground/70">· {zh}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
        {verified && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">
            <CheckCircle2 className="w-3 h-3" /> Verified
          </span>
        )}
      </div>
    </div>
  );
}

function Rule({ ok, label, recommended }: { ok: boolean; label: string; recommended?: boolean }) {
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
      {recommended && !ok && <span className="ml-auto text-[10px] text-muted-foreground/70">recommended</span>}
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
