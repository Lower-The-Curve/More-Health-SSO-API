import { useState } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Phone, Check, Loader2, MessageSquare } from "lucide-react";
import { BrandLogo } from "./_shared/BrandLogo";
import { useLang } from "@/lib/i18n";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useQueryClient } from "@tanstack/react-query";
import {
  smsSendCode,
  smsVerifyCode,
  getGetProfileQueryKey,
} from "@workspace/api-client-react";

export function VerifyPhone() {
  const { t } = useLang();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { profile, phone: initialPhone } = useCurrentUser();

  const [phone, setPhone] = useState(initialPhone ?? "");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (profile?.phoneVerified) {
    return (
      <CenteredShell>
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <div className="font-semibold">
              {t("Your phone is already verified.", "您的手机号已验证。")}
            </div>
            <Button onClick={() => setLocation("/dashboard")}>
              {t("Go to dashboard", "前往仪表板")}
            </Button>
          </CardContent>
        </Card>
      </CenteredShell>
    );
  }

  const sendCode = async () => {
    setError(null);
    setInfo(null);
    setSending(true);
    try {
      const res = await smsSendCode({ phone });
      setSent(true);
      setDevCode(res.devCode ?? null);
      setInfo(
        res.devMode
          ? t(
              "Demo mode: SMS isn't wired up yet, so we're showing you the code below.",
              "演示模式:尚未接入短信服务,验证码显示在下方。",
            )
          : t(`Code sent to ${phone}.`, `验证码已发送至 ${phone}。`),
      );
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(
        status === 429
          ? t("Please wait a moment before requesting another code.", "请稍候再请求验证码。")
          : t("Couldn't send code. Check the number and try again.", "发送失败,请核对号码后重试。"),
      );
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    setError(null);
    setVerifying(true);
    try {
      await smsVerifyCode({ code });
      await qc.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      setLocation("/dashboard");
    } catch (err) {
      const body = (err as { response?: { data?: { error?: string; attemptsRemaining?: number } } })
        .response?.data;
      const remaining = body?.attemptsRemaining;
      setError(
        body?.error ??
          t("Incorrect code. Please try again.", "验证码错误,请重试。"),
      );
      if (typeof remaining === "number" && remaining === 0) {
        setSent(false);
        setDevCode(null);
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <CenteredShell>
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl">
                {t("Verify your phone", "验证手机号")}
              </CardTitle>
              <CardDescription>
                {t(
                  "We'll send a 6-digit code to confirm this is your number.",
                  "我们会向您发送 6 位验证码以确认手机号。",
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("Phone number", "手机号")}</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setSent(false);
                setDevCode(null);
              }}
              placeholder="+1 555 123 4567"
            />
          </div>

          {!sent ? (
            <Button
              onClick={sendCode}
              className="w-full"
              disabled={sending || !phone.trim()}
            >
              {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <MessageSquare className="w-4 h-4 mr-2" />
              {t("Send code", "发送验证码")}
            </Button>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="code">
                  {t("Verification code", "验证码")}
                </Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="font-mono text-lg tracking-[0.4em] text-center"
                />
              </div>
              {devCode && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-amber-900">
                      {t("Demo code", "演示验证码")}
                    </div>
                    <div className="text-amber-700">
                      {t(
                        "Tap to autofill. Wire up Twilio to send real SMS.",
                        "点击自动填入。接入 Twilio 即可发送真实短信。",
                      )}
                    </div>
                  </div>
                  <Badge
                    onClick={() => setCode(devCode)}
                    className="cursor-pointer font-mono tabular-nums text-sm"
                  >
                    {devCode}
                  </Badge>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={sendCode}
                  disabled={sending}
                >
                  {t("Resend", "重新发送")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={verify}
                  disabled={verifying || code.length < 6}
                >
                  {verifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("Verify", "验证")}
                </Button>
              </div>
            </>
          )}

          {info && !error && (
            <div className="text-xs text-muted-foreground">{info}</div>
          )}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error}
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setLocation("/dashboard")}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              {t("Skip for now", "暂时跳过")}
            </button>
          </div>
        </CardContent>
      </Card>
    </CenteredShell>
  );
}

function CenteredShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-10">
      <BrandLogo className="h-8" />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
