import "./_group.css";
import React, { useState } from "react";
import { MobileFrame } from "./_shared/MobileFrame";
import { BrandLogo } from "./_shared/BrandLogo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ShieldCheck, ArrowRight, Lock, Eye, EyeOff } from "lucide-react";

export function MobileActivate() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const ruleLen = pw.length >= 8;
  const ruleUp = /[A-Z]/.test(pw);
  const ruleNum = /[0-9]/.test(pw);
  const score = [ruleLen, ruleUp, ruleNum].filter(Boolean).length;
  const matches = pw.length > 0 && pw === pw2;

  return (
    <MobileFrame>
      <main className="flex-1 overflow-y-auto px-5 pt-2 pb-28 scrollbar-hide">
        <div className="flex items-center justify-between">
          <BrandLogo variant="dark" className="h-7" />
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> ORDER CONFIRMED
          </span>
        </div>

        <div className="mt-6">
          <h1 className="text-2xl font-display font-bold tracking-tight leading-tight">
            Welcome to More Health, Brad.
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            欢迎加入 · Activate your account to enter the dashboard.
          </p>
        </div>

        {/* Stepper */}
        <div className="mt-5 flex items-center gap-2">
          <Dot done /> <Bar done /> <Dot active n={2} /> <Bar /> <Dot n={3} />
        </div>
        <div className="flex justify-between text-[10px] mt-1.5 text-muted-foreground">
          <span>Purchase</span><span className="text-foreground font-semibold">Activate</span><span>Dashboard</span>
        </div>

        {/* Verified info */}
        <div className="mt-6 rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <p className="text-sm font-display font-semibold">Verified information</p>
            <button className="text-xs font-medium text-primary">Edit</button>
          </div>
          <div className="divide-y divide-border/50 text-sm">
            <FieldRow label="Name" value="Brad Cooper" />
            <FieldRow label="Email" value="brad.cooper@gmail.com" verified />
            <FieldRow label="Phone" value="+86 138 0011 8826" verified />
            <FieldRow label="Address" value="1188 Nanjing W. Rd, Shanghai" />
          </div>
        </div>

        {/* Password */}
        <div className="mt-6 rounded-2xl border border-border/50 bg-card p-4 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-display font-semibold">Create your password</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">设置登录密码</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mpw" className="text-xs">Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="mpw"
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Min 8 characters"
                className="h-11 pl-9 pr-10 bg-card border-border/60 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex gap-1 pt-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    i < score ? "bg-primary" : "bg-border/60"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mpw2" className="text-xs">Confirm password</Label>
            <Input
              id="mpw2"
              type={show ? "text" : "password"}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="Re-enter"
              className={`h-11 bg-card rounded-xl ${
                pw2.length === 0
                  ? "border-border/60"
                  : matches
                  ? "border-primary/60"
                  : "border-rose-400/60"
              }`}
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <Pill ok={ruleLen} text="8+ chars" />
            <Pill ok={ruleUp} text="1 upper" />
            <Pill ok={ruleNum} text="1 number" />
          </div>

          <Button
            className="w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            disabled={!matches || score < 2}
          >
            Create my account <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-4 flex items-start gap-2.5 px-1">
          <ShieldCheck className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Activation link expires in 24 hours · One-time use · Bank-grade encryption
          </p>
        </div>
      </main>
    </MobileFrame>
  );
}

function Dot({ n, active, done }: { n?: number; active?: boolean; done?: boolean }) {
  return (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${
        done
          ? "bg-primary text-primary-foreground"
          : active
          ? "bg-foreground text-background ring-4 ring-foreground/10"
          : "bg-secondary text-muted-foreground border border-border/60"
      }`}
    >
      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : n}
    </div>
  );
}
function Bar({ done }: { done?: boolean }) {
  return <div className={`flex-1 h-px ${done ? "bg-primary" : "bg-border"}`} />;
}
function FieldRow({ label, value, verified }: { label: string; value: string; verified?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
      {verified && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
          <CheckCircle2 className="w-3 h-3" /> Verified
        </span>
      )}
    </div>
  );
}
function Pill({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[10px] ${
        ok ? "border-primary/30 bg-primary/5 text-foreground" : "border-border/60 bg-secondary/30 text-muted-foreground"
      }`}
    >
      <CheckCircle2 className={`w-3 h-3 ${ok ? "text-primary" : "text-muted-foreground/50"}`} />
      <span className="font-medium">{text}</span>
    </div>
  );
}
