import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, AlertTriangle, ExternalLink, Pencil, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/lib/i18n";
import { AdminLayout } from "./AdminLayout";
import {
  useAdminGetUserDetail,
  useAdminTransferAccount,
  useAdminListUsers,
  useAdminUpdateUser,
  getAdminGetUserDetailQueryKey,
  getAdminListUsersQueryKey,
} from "@workspace/api-client-react";

function money(cents: number, currency = "USD"): string {
  const sym = currency === "USD" ? "$" : currency === "CNY" ? "¥" : "";
  return `${sym}${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function dt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminUserDetail() {
  const [, params] = useRoute("/admin/users/:clerkUserId");
  const [, setLocation] = useLocation();
  const { t } = useLang();
  const clerkUserId = params?.clerkUserId ?? "";
  const q = useAdminGetUserDetail(clerkUserId, {
    query: {
      enabled: !!clerkUserId,
      queryKey: getAdminGetUserDetailQueryKey(clerkUserId),
    },
  });
  const [xferOpen, setXferOpen] = useState(false);

  return (
    <AdminLayout active="users">
      <div className="space-y-6">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {t("Back to users", "返回用户列表")}
          </Button>
        </Link>

        {q.isLoading && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
        {q.isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-sm text-slate-500">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            {t("User not found.", "用户未找到。")}
          </div>
        )}

        {q.data && (
          <>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {[q.data.profile.firstName, q.data.profile.lastName]
                    .filter(Boolean)
                    .join(" ") || q.data.profile.email || "—"}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                  <span className="font-mono">{q.data.profile.influencerId}</span>
                  <span>·</span>
                  <Badge variant="outline">{q.data.profile.rank}</Badge>
                  {q.data.profile.isAdmin && (
                    <Badge variant="secondary">{t("Admin", "管理员")}</Badge>
                  )}
                  {q.data.profile.accountStatus === "pending" && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                      {t("Pending activation", "待激活")}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">
                    {t("Total spend", "消费总额")}
                  </div>
                  <div className="text-xl font-semibold tabular-nums">
                    {money(q.data.totalSpendCents)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">
                    {t("Commission", "佣金")}
                  </div>
                  <div className="text-xl font-semibold tabular-nums text-emerald-600">
                    {money(q.data.totalCommissionCents)}
                  </div>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("Profile", "个人资料")}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                  <Field label={t("Email", "邮箱")} value={q.data.profile.email} />
                  <Field label={t("Phone", "电话")} value={q.data.profile.phone} />
                  <Field
                    label={t("Wallet balance", "钱包余额")}
                    value={money(q.data.profile.walletBalanceCents, "CNY")}
                  />
                  <Field
                    label={t("Joined", "注册时间")}
                    value={dt(q.data.profile.createdAt)}
                  />
                  <Field
                    label={t("Sponsor", "推荐人")}
                    value={
                      q.data.profile.sponsorName
                        ? q.data.profile.sponsorIdRaw
                          ? `${q.data.profile.sponsorName} (${q.data.profile.sponsorIdRaw})`
                          : q.data.profile.sponsorName
                        : q.data.profile.sponsorIdRaw
                    }
                  />
                  <Field
                    label={t("Clerk user ID", "Clerk 用户 ID")}
                    value={q.data.profile.clerkUserId}
                    mono
                  />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("External IDs", "外部 ID")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <Field
                    label={t("ByDesign User ID", "ByDesign 用户 ID")}
                    value={q.data.profile.byDesignUserId}
                    mono
                  />
                  <Field
                    label={t("NetFi Wallet ID", "NetFi 钱包 ID")}
                    value={q.data.profile.netfiWalletId}
                    mono
                  />
                  <SponsorIdField
                    clerkUserId={clerkUserId}
                    value={q.data.profile.kwikApexId}
                  />
                  <div>
                    <dt className="text-xs text-slate-500 mb-0.5">
                      {t("Shopify Customer ID", "Shopify 客户 ID")}
                    </dt>
                    <dd className="font-mono text-xs break-all flex items-center gap-2">
                      {q.data.profile.shopifyCustomerId || "—"}
                      {q.data.profile.shopifyAdminCustomerUrl && (
                        <a
                          href={q.data.profile.shopifyAdminCustomerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                          title={t("Open in Shopify Admin", "在 Shopify 后台打开")}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("Account actions", "账户操作")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <CopySignInLinkButton
                  accountStatus={q.data.profile.accountStatus}
                  email={q.data.profile.email}
                  recentOrder={
                    q.data.orders[0]?.orderName ??
                    q.data.orders[0]?.shopifyOrderId ??
                    null
                  }
                />
                {/* Email & password are managed by the shared sign-in provider
                    and cannot be changed from here, so those actions are hidden. */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setXferOpen(true)}
                  className="text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  {t("Transfer to another account", "转移到其他账户")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t(
                    `Orders (${q.data.orders.length})`,
                    `订单 (${q.data.orders.length})`,
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {q.data.orders.length === 0 ? (
                  <p className="px-6 py-12 text-center text-sm text-slate-400">
                    {t(
                      "No orders mapped to this user yet.",
                      "暂无与此用户关联的订单。",
                    )}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Order", "订单")}</TableHead>
                        <TableHead>{t("Product", "商品")}</TableHead>
                        <TableHead className="text-right">{t("Amount", "金额")}</TableHead>
                        <TableHead className="text-right">{t("Commission", "佣金")}</TableHead>
                        <TableHead>{t("Status", "状态")}</TableHead>
                        <TableHead>{t("Date", "日期")}</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {q.data.orders.map((o) => (
                        <TableRow
                          key={o.id}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => setLocation(`/admin/orders/${o.id}`)}
                        >
                          <TableCell className="font-mono text-xs text-indigo-600">
                            {o.orderName ?? o.shopifyOrderId ?? `#${o.id}`}
                          </TableCell>
                          <TableCell className="text-sm">{o.productName}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {money(o.amountCents, o.currency)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">
                            {money(o.commissionCents, o.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {o.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {dt(o.occurredAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            {o.shopifyAdminOrderUrl && (
                              <a
                                href={o.shopifyAdminOrderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={t("View in Shopify", "在 Shopify 中查看")}
                                className="inline-flex items-center text-slate-400 hover:text-indigo-600"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <TransferAccountDialog
              open={xferOpen}
              onClose={() => setXferOpen(false)}
              sourceClerkUserId={clerkUserId}
              sourceLabel={
                [q.data.profile.firstName, q.data.profile.lastName]
                  .filter(Boolean)
                  .join(" ") || q.data.profile.email || clerkUserId
              }
              onDone={(sourceDeleted) => {
                if (sourceDeleted) setLocation("/admin/users");
              }}
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function CopySignInLinkButton({
  accountStatus,
  email,
  recentOrder,
}: {
  accountStatus: string;
  email: string | null | undefined;
  recentOrder: string | null;
}) {
  const { t } = useLang();
  const { toast } = useToast();
  const pending = accountStatus === "pending";

  const buildLink = () => {
    const base = `${window.location.origin}${import.meta.env.BASE_URL}`;
    const qs = new URLSearchParams();
    if (email) qs.set("email", email);
    if (pending) {
      // Pending users have no password — send them to the order-prefill
      // signup so they can claim their account.
      if (recentOrder) qs.set("order", recentOrder);
      const query = qs.toString();
      return `${base}sign-up${query ? `?${query}` : ""}`;
    }
    const query = qs.toString();
    return `${base}sign-in${query ? `?${query}` : ""}`;
  };

  const copy = async () => {
    const link = buildLink();
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: pending
          ? t("Activation link copied", "激活链接已复制")
          : t("Sign-in link copied", "登录链接已复制"),
        description: link,
      });
    } catch {
      // Clipboard may be unavailable (e.g. insecure context) — surface the
      // link so the admin can copy it manually.
      toast({
        title: t("Copy this link", "请复制此链接"),
        description: link,
      });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={copy}>
      {pending
        ? t("Copy activation link", "复制激活链接")
        : t("Copy sign-in link", "复制登录链接")}
    </Button>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-slate-500 mb-0.5">{label}</dt>
      <dd className={mono ? "font-mono text-xs break-all" : ""}>
        {value || "—"}
      </dd>
    </div>
  );
}

function SponsorIdField({
  clerkUserId,
  value,
}: {
  clerkUserId: string;
  value: string | null | undefined;
}) {
  const { t } = useLang();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const mut = useAdminUpdateUser();

  const startEdit = () => {
    setDraft(value ?? "");
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const save = async () => {
    const next = draft.trim();
    try {
      await mut.mutateAsync({
        clerkUserId,
        data: { kwikApexId: next === "" ? null : next },
      });
      await qc.invalidateQueries({
        queryKey: getAdminGetUserDetailQueryKey(clerkUserId),
      });
      await qc.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
      setEditing(false);
      toast({ title: t("Sponsor ID updated", "Sponsor ID 已更新") });
    } catch (e) {
      toast({
        title: t("Update failed", "更新失败"),
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <dt className="text-xs text-slate-500 mb-0.5">
        {t("Sponsor ID (Kwik APEX)", "Sponsor ID(Kwik APEX)")}
      </dt>
      <dd className="font-mono text-xs break-all flex items-center gap-2">
        {editing ? (
          <>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-7 text-xs font-mono"
              placeholder="APX-…"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={save}
              disabled={mut.isPending}
              title={t("Save", "保存")}
            >
              {mut.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={cancel}
              disabled={mut.isPending}
              title={t("Cancel", "取消")}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </>
        ) : (
          <>
            <span>{value || "—"}</span>
            <button
              type="button"
              onClick={startEdit}
              className="text-slate-400 hover:text-slate-700"
              title={t("Edit", "编辑")}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </dd>
    </div>
  );
}

function TransferAccountDialog({
  open,
  onClose,
  sourceClerkUserId,
  sourceLabel,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  sourceClerkUserId: string;
  sourceLabel: string;
  onDone: (sourceDeleted: boolean) => void;
}) {
  const { t } = useLang();
  const { toast } = useToast();
  const qc = useQueryClient();
  const users = useAdminListUsers({
    query: { enabled: open, queryKey: getAdminListUsersQueryKey() },
  });
  const mutation = useAdminTransferAccount();
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<string | null>(null);
  const [mergeWallet, setMergeWallet] = useState(true);
  const [deleteSource, setDeleteSource] = useState(false);
  const [confirm, setConfirm] = useState("");

  const candidates = (users.data ?? [])
    .filter((u) => u.clerkUserId !== sourceClerkUserId)
    .filter((u) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return [u.email, u.firstName, u.lastName, u.influencerId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    })
    .slice(0, 20);

  const targetUser = (users.data ?? []).find((u) => u.clerkUserId === target);
  const targetLabel = targetUser
    ? [targetUser.firstName, targetUser.lastName].filter(Boolean).join(" ") ||
      targetUser.email ||
      targetUser.clerkUserId
    : "";

  const canSubmit =
    !!target &&
    !mutation.isPending &&
    (!deleteSource || confirm.trim().toUpperCase() === "DELETE");

  const handleTransfer = async () => {
    if (!target) return;
    try {
      const result = await mutation.mutateAsync({
        data: {
          sourceClerkUserId,
          targetClerkUserId: target,
          mergeWallet,
          deleteSource,
        },
      });
      await qc.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
      await qc.invalidateQueries({
        queryKey: getAdminGetUserDetailQueryKey(sourceClerkUserId),
      });
      await qc.invalidateQueries({
        queryKey: getAdminGetUserDetailQueryKey(target),
      });
      const sourceFullyDeleted = result.sourceDbDeleted && result.sourceClerkDeleted;
      const partialNote = result.sourceDbDeleted && !result.sourceClerkDeleted
        ? t(
            ` (Warning: Clerk user could not be deleted: ${result.sourceClerkDeleteError ?? "unknown error"})`,
            `（警告：无法删除 Clerk 用户：${result.sourceClerkDeleteError ?? "未知错误"}）`,
          )
        : "";
      toast({
        title: t("Account transferred", "账户已转移"),
        description:
          t(
            `${result.ordersMoved} orders moved, ${money(result.walletMovedCents, "CNY")} wallet merged${sourceFullyDeleted ? ", source deleted" : ""}.`,
            `已转移 ${result.ordersMoved} 个订单，合并钱包 ${money(result.walletMovedCents, "CNY")}${sourceFullyDeleted ? "，原账户已删除" : ""}。`,
          ) + partialNote,
        variant: result.sourceDbDeleted && !result.sourceClerkDeleted ? "destructive" : undefined,
      });
      onDone(result.sourceDbDeleted);
      onClose();
    } catch (e) {
      toast({
        title: t("Transfer failed", "转移失败"),
        description: String((e as Error).message ?? e),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Transfer account", "转移账户")}</DialogTitle>
          <DialogDescription>
            {t(
              `Move all orders (and optionally the wallet balance) from "${sourceLabel}" to another account.`,
              `将“${sourceLabel}”的所有订单（以及可选的钱包余额）转移到其他账户。`,
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t("Search target account", "搜索目标账户")}</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Name, email, or ID", "姓名、邮箱或 ID")}
            />
          </div>
          <div className="rounded-md border border-border max-h-56 overflow-y-auto">
            {candidates.length === 0 ? (
              <div className="text-xs text-muted-foreground p-3">
                {t("No matching users.", "未找到匹配用户。")}
              </div>
            ) : (
              candidates.map((u) => {
                const label =
                  [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                  u.email ||
                  u.clerkUserId;
                return (
                  <button
                    key={u.clerkUserId}
                    type="button"
                    onClick={() => setTarget(u.clerkUserId)}
                    className={`w-full text-left px-3 py-2 text-sm border-b border-border last:border-b-0 hover:bg-slate-50 ${
                      target === u.clerkUserId ? "bg-indigo-50" : ""
                    }`}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {u.influencerId} · {u.email ?? "—"}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {target && (
            <div className="text-sm rounded-md bg-slate-50 border border-border p-3">
              <div className="text-xs text-muted-foreground mb-1">
                {t("Target", "目标")}
              </div>
              <div className="font-medium">{targetLabel}</div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mergeWallet}
              onChange={(e) => setMergeWallet(e.target.checked)}
            />
            {t("Merge wallet balance into target", "将钱包余额合并到目标账户")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={deleteSource}
              onChange={(e) => setDeleteSource(e.target.checked)}
            />
            {t(
              "Delete source account afterwards (Clerk + DB)",
              "完成后删除原账户（Clerk + 数据库）",
            )}
          </label>

          {deleteSource && (
            <div className="space-y-1 rounded-md border border-red-200 bg-red-50 p-3">
              <Label className="text-red-800">
                {t(
                  'Type "DELETE" to confirm source removal',
                  '输入 "DELETE" 以确认删除原账户',
                )}
              </Label>
              <Input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="bg-white"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            {t("Cancel", "取消")}
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!canSubmit}
            className={deleteSource ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("Transfer", "转移")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
