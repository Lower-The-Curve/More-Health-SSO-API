import "./_group.css";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "./_shared/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLang } from "@/lib/i18n";
import { useSearchDownline } from "@workspace/api-client-react";
import type { DownlineMember } from "@workspace/api-client-react";
import {
  Search,
  UserPlus,
  Mail,
  Hash,
  ChevronRight,
  Users,
  Loader2,
} from "lucide-react";

function memberName(m: DownlineMember, fallback: string): string {
  const name = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
  return name || m.email || m.kwikApexId || fallback;
}

function memberInitials(m: DownlineMember): string {
  const a = m.firstName?.[0] ?? "";
  const b = m.lastName?.[0] ?? "";
  const initials = `${a}${b}`.trim();
  if (initials) return initials.toUpperCase();
  const src = m.email || m.kwikApexId || "?";
  return src.slice(0, 2).toUpperCase();
}

export function EnrollOnBehalf() {
  const { t } = useLang();
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<DownlineMember | null>(null);

  // Debounce the search term so we don't fire a request on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(id);
  }, [input]);

  const query = useSearchDownline({ q: q || undefined });
  const members = useMemo(() => query.data ?? [], [query.data]);

  // Full (unfiltered) downline, used to offer a few one-tap "quick select"
  // members so the user can pick someone without remembering their name.
  const fullListQuery = useSearchDownline({ q: undefined });
  const quickPicks = useMemo(
    () => (fullListQuery.data ?? []).slice(0, 4),
    [fullListQuery.data],
  );

  const selectMember = (m: DownlineMember) => {
    setInput("");
    setQ("");
    setSelected(m);
  };

  // Keep the selected member in sync with the freshest result row (so the
  // pre-built URL reflects the latest settings) and clear it if it falls out
  // of the result set.
  useEffect(() => {
    if (!selected) return;
    const match = members.find((m) => m.clerkUserId === selected.clerkUserId);
    if (match && match !== selected) setSelected(match);
  }, [members, selected]);

  const openUrl = (url: string | null | undefined) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <AppLayout activeId="enroll-behalf">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("Enroll on Behalf Of", "代客注册")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "Search your team and pick the person you're enrolling for, then continue to enrollment on their behalf.",
              "搜索您的团队，选择要代为注册的成员，然后继续为其完成注册。",
            )}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t(
              "Search by name, email, or member ID…",
              "按姓名、邮箱或会员编号搜索…",
            )}
            className="pl-9"
            autoFocus
          />
        </div>

        {!q && quickPicks.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("Quick select", "快速选择")}
            </p>
            <div className="flex flex-wrap gap-2">
              {quickPicks.map((m) => {
                const isSelected = selected?.clerkUserId === m.clerkUserId;
                return (
                  <button
                    key={m.clerkUserId}
                    type="button"
                    onClick={() => selectMember(m)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-secondary/60"
                    }`}
                  >
                    <Avatar className="w-6 h-6 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                        {memberInitials(m)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[10rem] truncate">
                      {memberName(m, t("Customer", "客户"))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {query.isError ? (
          <Card className="p-6 text-sm text-destructive">
            {t(
              "Could not load your team right now. Please try again.",
              "暂时无法加载您的团队，请稍后再试。",
            )}
          </Card>
        ) : query.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-1 py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("Loading…", "加载中…")}
          </div>
        ) : members.length === 0 ? (
          <Card className="p-10 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">
                {q
                  ? t("No customers found", "未找到客户")
                  : t("No one in your team yet", "您的团队暂无成员")}
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                {q
                  ? t(
                      "Try a different name, email, or member ID.",
                      "请尝试其他姓名、邮箱或会员编号。",
                    )
                  : t(
                      "People you enroll will appear here so you can enroll on their behalf.",
                      "您注册的成员将显示在这里，方便您代其注册。",
                    )}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const isSelected = selected?.clerkUserId === m.clerkUserId;
              return (
                <Card
                  key={m.clerkUserId}
                  className={`overflow-hidden transition-colors ${
                    isSelected ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelected((cur) =>
                        cur?.clerkUserId === m.clerkUserId ? null : m,
                      )
                    }
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <Avatar className="w-10 h-10 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {memberInitials(m)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {memberName(m, t("Customer", "客户"))}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                        {m.email ? (
                          <span className="inline-flex items-center gap-1 min-w-0">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{m.email}</span>
                          </span>
                        ) : null}
                        {m.kwikApexId ? (
                          <span className="inline-flex items-center gap-1">
                            <Hash className="w-3 h-3 shrink-0" />
                            {m.kwikApexId}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        isSelected ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {isSelected ? (
                    <div className="border-t border-border bg-secondary/30 p-4 space-y-3">
                      <Button
                        className="w-full gap-2"
                        disabled={!m.enrollOnBehalfUrl}
                        onClick={() => openUrl(m.enrollOnBehalfUrl)}
                      >
                        <UserPlus className="w-4 h-4" />
                        {t("Continue to enrollment", "继续注册")}
                      </Button>
                      {!m.enrollOnBehalfUrl ? (
                        <p className="text-xs text-muted-foreground">
                          {!m.email || !m.kwikApexId
                            ? t(
                                "This customer is missing an email or member ID, so an enrollment can't be attributed to them yet.",
                                "该客户缺少邮箱或会员编号，暂时无法为其归属注册。",
                              )
                            : t(
                                "The enrollment link isn't available yet — an admin needs to set the enrollment URL in Settings.",
                                "注册链接尚不可用——管理员需要在设置中配置注册链接。",
                              )}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
