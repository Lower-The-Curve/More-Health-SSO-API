import "./_group.css";
import React from "react";
import { MobileFrame, MobileTabBar } from "./_shared/MobileFrame";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  ChevronLeft,
  ChevronRight,
  User,
  CreditCard,
  ShieldCheck,
  Bell,
  Globe,
  HelpCircle,
  LogOut,
  FileText,
  Banknote,
} from "lucide-react";

export function MobileSettings() {
  return (
    <MobileFrame>
      <header className="px-5 py-2 flex items-center justify-between shrink-0">
        <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-display font-semibold">Settings · 设置</h1>
        <span className="w-9 h-9" />
      </header>

      <main className="flex-1 overflow-y-auto pb-28 scrollbar-hide">
        {/* Profile card */}
        <div className="px-5 mt-2">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 rounded-2xl p-4 flex items-center gap-3">
            <Avatar className="w-14 h-14 border border-border">
              <AvatarImage src="https://i.pravatar.cc/150?u=brady" />
              <AvatarFallback>BC</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-base font-display font-semibold">Brady Cooper</p>
              <p className="text-[11px] text-muted-foreground">Gold Partner · ID 880214</p>
              <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mt-1">brady@morehealth.com</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Account */}
        <Section label="Account · 账户">
          <Row icon={<User className="w-4 h-4" />} label="Personal info" sub="Name, email, phone" />
          <Row icon={<Banknote className="w-4 h-4" />} label="Payouts" sub="Bank account · UnionPay ••6612" />
          <Row icon={<CreditCard className="w-4 h-4" />} label="Tax & invoicing" sub="China · CNY" />
        </Section>

        {/* Preferences */}
        <Section label="Preferences · 偏好">
          <Row icon={<Bell className="w-4 h-4" />} label="Notifications" right={<Switch defaultChecked />} />
          <Row icon={<Globe className="w-4 h-4" />} label="Language" sub="English · 简体中文" />
          <Row
            icon={<ShieldCheck className="w-4 h-4" />}
            label="Two-factor auth"
            sub="SMS · Authenticator"
            right={<Switch defaultChecked />}
          />
        </Section>

        {/* Support */}
        <Section label="Support · 支持">
          <Row icon={<HelpCircle className="w-4 h-4" />} label="Help center" sub="Guides, FAQ, live chat" />
          <Row icon={<FileText className="w-4 h-4" />} label="Partner agreement" />
        </Section>

        {/* Logout */}
        <div className="px-5 mt-6">
          <button className="w-full h-12 rounded-xl border border-border/60 bg-card text-sm font-semibold text-rose-600 inline-flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
          <p className="text-center text-[10px] text-muted-foreground mt-3">More Health · v2.4.1</p>
        </div>
      </main>

      <MobileTabBar active="More" />
    </MobileFrame>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 mt-6">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">{label}</p>
      <div className="bg-card border border-border/50 rounded-2xl divide-y divide-border/50 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  sub,
  right,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground/80 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
      </div>
      {right ?? <ChevronRight className="w-4 h-4 text-muted-foreground" />}
    </div>
  );
}
