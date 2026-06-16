import "./_group.css";
import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, ArrowRight } from "lucide-react";
import { BrandLogo } from "./_shared/BrandLogo";
import { useLang } from "@/lib/i18n";

export function Login() {
  const [, setLocation] = useLocation();
  const { lang, toggle, t } = useLang();
  const goDashboard = (e?: React.FormEvent) => { e?.preventDefault(); setLocation("/sign-in"); };
  return (
    <div className="min-h-screen flex font-sans bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[45%] relative overflow-hidden bg-primary text-primary-foreground flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#045c38] to-[#022c1b] opacity-90" />
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#22d3ee]/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <BrandLogo variant="light" className="h-9" />
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-display font-semibold leading-[1.05] mb-5 tracking-tight">
            {lang === "zh" ? (
              <>经营你的事业，<br />从此简单优雅。</>
            ) : (
              <>Your business,<br />beautifully run.</>
            )}
          </h1>
          <p className="text-lg text-primary-foreground/80 font-medium mb-12">
            {t("The Partner platform for More Health creators.", "More Health 创作者的合作伙伴平台。")}
          </p>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 mt-12">
            <p className="text-lg leading-relaxed mb-4">
              {t(
                "\"The tools here made running my wellness business seamless. I spend less time managing and more time growing my community.\"",
                "「这里的工具让我的健康事业运营得游刃有余。我花在管理上的时间更少，花在社群成长上的时间更多。」"
              )}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20" />
              <div>
                <p className="font-semibold text-sm">Lisa Wang</p>
                <p className="text-xs text-primary-foreground/70">{t("Platinum Partner", "白金合作伙伴")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col bg-background relative">
        <div className="absolute top-8 right-8 flex items-center gap-4">
          <button
            onClick={toggle}
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className={lang === "en" ? "text-foreground font-semibold" : ""}>EN</span>
            <span className="text-muted-foreground/60">/</span>
            <span className={lang === "zh" ? "text-foreground font-semibold" : ""}>中</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center p-8">
          <div className="w-full max-w-sm">
            <div className="mb-10">
              <h2 className="text-3xl font-display font-bold tracking-tight mb-2 text-foreground">
                {t("Welcome back", "欢迎回来")}
              </h2>
              <p className="text-muted-foreground">
                {t("Sign in to your Partner dashboard", "登录你的合作伙伴后台")}
              </p>
            </div>

            <form className="space-y-5" onSubmit={goDashboard}>
              <div className="space-y-2">
                <Label htmlFor="identifier">{t("Email or Phone Number", "邮箱或手机号")}</Label>
                <Input
                  id="identifier"
                  placeholder={t("name@example.com or +86...", "name@example.com 或 +86…")}
                  className="h-12 bg-card border-border/60 focus:border-primary shadow-sm rounded-xl px-4"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("Password", "密码")}</Label>
                  <a href="#" className="text-sm font-medium text-primary hover:underline">
                    {t("Forgot?", "忘记密码？")}
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 bg-card border-border/60 focus:border-primary shadow-sm rounded-xl px-4"
                />
              </div>

              <Button className="w-full h-12 text-base font-semibold rounded-xl mt-6 shadow-sm flex items-center justify-center gap-2">
                {t("Sign In", "登录")} <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">{t("Or", "或")}</span>
                </div>
              </div>

              <Button onClick={() => goDashboard()} variant="outline" className="w-full h-12 mt-6 rounded-xl font-medium shadow-sm bg-card hover:bg-secondary">
                {t("Login with SMS Code", "使用短信验证码登录")}
              </Button>
            </div>

            <p className="mt-10 text-center text-sm text-muted-foreground">
              {t("New to More Health?", "首次加入 More Health？")}{" "}
              <button type="button" onClick={() => setLocation("/sign-up")} className="font-semibold text-foreground hover:underline">
                {t("Become a Partner", "成为合作伙伴")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
