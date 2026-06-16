import "./_group.css";
import React from "react";
import { MobileFrame } from "./_shared/MobileFrame";
import { BrandLogo } from "./_shared/BrandLogo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Globe, ArrowRight, Fingerprint } from "lucide-react";

export function MobileLogin() {
  return (
    <MobileFrame>
      <main className="flex-1 overflow-y-auto px-6 pt-2 pb-32 scrollbar-hide">
        <div className="flex items-center justify-between">
          <BrandLogo variant="dark" className="h-7" />
          <button className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> EN / 中
          </button>
        </div>

        <div className="mt-12">
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground leading-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Sign in to your Partner dashboard · 登录合作伙伴后台
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <Label htmlFor="m-id" className="text-xs font-medium">Email or phone</Label>
            <Input
              id="m-id"
              placeholder="name@example.com or +86…"
              className="h-12 bg-card border-border/60 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="m-pw" className="text-xs font-medium">Password</Label>
              <a href="#" className="text-xs font-medium text-primary">Forgot?</a>
            </div>
            <Input
              id="m-pw"
              type="password"
              placeholder="••••••••"
              className="h-12 bg-card border-border/60 rounded-xl"
            />
          </div>

          <Button className="w-full h-12 rounded-xl text-sm font-semibold mt-2 flex items-center justify-center gap-2">
            Sign In <ArrowRight className="w-4 h-4" />
          </Button>

          <button
            type="button"
            className="w-full h-12 rounded-xl border border-border/60 bg-card flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <Fingerprint className="w-4 h-4" /> Sign in with Face ID
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-background text-[11px] text-muted-foreground">Or</span>
          </div>
        </div>

        <button className="w-full h-12 rounded-xl border border-border/60 bg-card text-sm font-semibold">
          Login with SMS code · 短信登录
        </button>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          New to More Health?{" "}
          <a href="#" className="font-semibold text-foreground">Become a Partner</a>
        </p>
      </main>
    </MobileFrame>
  );
}
