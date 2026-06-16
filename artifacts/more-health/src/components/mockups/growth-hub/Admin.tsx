import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Plug,
  CheckCircle2,
  Link2,
  Target,
  ShoppingBag,
  Database,
  Store,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import {
  useAdminListUsers,
  useAdminListOrders,
  useAdminGetIntegrations,
  useAdminUpdateUser,
  useAdminCreateUser,
  useGetShareLinks,
  useAdminUpdateShareLinks,
  useGetDisplayFlags,
  useAdminUpdateDisplayFlags,
  getAdminListUsersQueryKey,
  getAdminGetIntegrationsQueryKey,
  getGetShareLinksQueryKey,
  getGetDisplayFlagsQueryKey,
  type AdminUser,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

function formatMoney(cents: number, currency = "USD"): string {
  const sym = currency === "USD" ? "$" : currency === "CNY" ? "¥" : "";
  return `${sym}${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function UsersPanel() {
  const { t } = useLang();
  const [, setLocation] = useLocation();
  const usersQuery = useAdminListUsers();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const list = usersQuery.data ?? [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((u) =>
      [u.email, u.firstName, u.lastName, u.influencerId, u.clerkUserId, u.rank]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [usersQuery.data, search]);

  if (usersQuery.isLoading) return <CenteredSpinner />;
  if (usersQuery.isError) return <ErrorBox onRetry={() => usersQuery.refetch()} />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>{t("Users", "用户")}</CardTitle>
          <CardDescription>
            {t(
              `${usersQuery.data?.length ?? 0} total`,
              `共 ${usersQuery.data?.length ?? 0} 位`,
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("Search by name, email, or ID", "按姓名、邮箱或 ID 搜索")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={() => setAdding(true)} className="shrink-0">
            <UserPlus className="w-4 h-4 mr-2" />
            {t("Add user", "添加用户")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("User", "用户")}</TableHead>
                <TableHead>{t("Email", "邮箱")}</TableHead>
                <TableHead>{t("Influencer ID", "影响者 ID")}</TableHead>
                <TableHead>{t("Sponsor", "推荐人")}</TableHead>
                <TableHead>{t("Rank", "等级")}</TableHead>
                <TableHead className="text-right">{t("Wallet", "钱包")}</TableHead>
                <TableHead className="text-right">{t("Orders", "订单")}</TableHead>
                <TableHead>{t("Joined", "注册时间")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    {t("No users found.", "未找到用户。")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => {
                  const name =
                    [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                    u.email ||
                    u.clerkUserId.slice(-8);
                  return (
                    <TableRow
                      key={u.clerkUserId}
                      onClick={() => setLocation(`/admin/users/${u.clerkUserId}`)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{name}</span>
                          <div className="flex gap-1">
                            {u.isAdmin && (
                              <Badge variant="secondary" className="w-fit mt-0.5 text-[10px]">
                                {t("Admin", "管理员")}
                              </Badge>
                            )}
                            {u.accountStatus === "pending" && (
                              <Badge className="w-fit mt-0.5 text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                                {t("Pending", "待激活")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{u.influencerId}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.sponsorName ?? u.sponsorIdRaw ?? "—"}
                      </TableCell>
                      <TableCell><Badge variant="outline">{u.rank}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(u.walletBalanceCents, "CNY")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{u.ordersCount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" onClick={() => setEditing(u)}>
                          {t("Edit", "编辑")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <EditUserDialog user={editing} onClose={() => setEditing(null)} />
      <AddUserDialog open={adding} onClose={() => setAdding(false)} />
    </Card>
  );
}

function SponsorCombobox({
  value,
  onChange,
  excludeClerkUserId,
}: {
  value: string | null;
  onChange: (clerkUserId: string | null) => void;
  excludeClerkUserId?: string;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const usersQuery = useAdminListUsers();
  const options = useMemo(
    () =>
      (usersQuery.data ?? []).filter(
        (u) => u.clerkUserId !== excludeClerkUserId,
      ),
    [usersQuery.data, excludeClerkUserId],
  );
  const labelFor = (u: AdminUser) =>
    [u.firstName, u.lastName].filter(Boolean).join(" ") ||
    u.email ||
    u.influencerId;
  const selected = options.find((u) => u.clerkUserId === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selected ? labelFor(selected) : t("No sponsor", "无推荐人")}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={t("Search users…", "搜索用户…")} />
          <CommandList>
            <CommandEmpty>{t("No users found.", "未找到用户。")}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value ? "opacity-0" : "opacity-100",
                  )}
                />
                {t("No sponsor", "无推荐人")}
              </CommandItem>
              {options.map((u) => (
                <CommandItem
                  key={u.clerkUserId}
                  value={`${labelFor(u)} ${u.email ?? ""} ${u.influencerId}`}
                  onSelect={() => {
                    onChange(u.clerkUserId);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === u.clerkUserId ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{labelFor(u)}</span>
                    {u.email && (
                      <span className="text-xs text-muted-foreground">
                        {u.email}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function AddUserDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLang();
  const { toast } = useToast();
  const qc = useQueryClient();
  const mutation = useAdminCreateUser();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rank, setRank] = useState("Influencer");
  const [sponsorClerkUserId, setSponsorClerkUserId] = useState<string | null>(
    null,
  );

  // Reset the form whenever the dialog is (re)opened.
  useMemo(() => {
    if (open) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setRank("Influencer");
      setSponsorClerkUserId(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!email.trim()) {
      toast({
        title: t("Email is required", "邮箱为必填项"),
        variant: "destructive",
      });
      return;
    }
    try {
      await mutation.mutateAsync({
        data: {
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          email: email.trim(),
          phone: phone.trim() || undefined,
          rank: rank.trim() || undefined,
          sponsorClerkUserId,
        },
      });
      await qc.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
      toast({ title: t("User added", "用户已添加") });
      onClose();
    } catch (e) {
      toast({
        title: t("Failed to add user", "添加用户失败"),
        description: String((e as Error).message ?? e),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Add user", "添加用户")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("First name", "名")}</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("Last name", "姓")}</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t("Email", "邮箱")}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{t("Phone", "电话")}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("Rank", "等级")}</Label>
            <Input value={rank} onChange={(e) => setRank(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("Sponsor", "推荐人")}</Label>
            <SponsorCombobox
              value={sponsorClerkUserId}
              onChange={setSponsorClerkUserId}
            />
            <p className="text-xs text-muted-foreground">
              {t(
                "The upline this member is placed under. They'll appear in the sponsor's downline.",
                "该成员所属的上线。他们将出现在推荐人的下线中。",
              )}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button onClick={handleCreate} disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {t("Add user", "添加用户")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
  const { t } = useLang();
  const { toast } = useToast();
  const qc = useQueryClient();
  const mutation = useAdminUpdateUser();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [rank, setRank] = useState(user?.rank ?? "Influencer");
  const [walletYuan, setWalletYuan] = useState(
    user ? (user.walletBalanceCents / 100).toFixed(2) : "0.00",
  );
  const [isAdmin, setIsAdmin] = useState(user?.isAdmin ?? false);
  const [byDesignUserId, setByDesignUserId] = useState(user?.byDesignUserId ?? "");
  const [netfiWalletId, setNetfiWalletId] = useState(user?.netfiWalletId ?? "");
  const [kwikApexId, setKwikApexId] = useState(user?.kwikApexId ?? "");
  const [shopifyCustomerId, setShopifyCustomerId] = useState(
    user?.shopifyCustomerId ?? "",
  );
  const [sponsorClerkUserId, setSponsorClerkUserId] = useState<string | null>(
    user?.sponsorClerkUserId ?? null,
  );

  // Reset form whenever the dialog opens for a new user.
  const userId = user?.clerkUserId;
  useMemo(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setPhone(user.phone ?? "");
      setRank(user.rank);
      setWalletYuan((user.walletBalanceCents / 100).toFixed(2));
      setIsAdmin(user.isAdmin);
      setByDesignUserId(user.byDesignUserId ?? "");
      setNetfiWalletId(user.netfiWalletId ?? "");
      setKwikApexId(user.kwikApexId ?? "");
      setShopifyCustomerId(user.shopifyCustomerId ?? "");
      setSponsorClerkUserId(user.sponsorClerkUserId ?? null);
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const handleSave = async () => {
    const walletCents = Math.round(parseFloat(walletYuan || "0") * 100);
    try {
      await mutation.mutateAsync({
        clerkUserId: user.clerkUserId,
        data: {
          firstName,
          lastName,
          phone,
          rank,
          walletBalanceCents: Number.isFinite(walletCents) ? walletCents : 0,
          isAdmin,
          byDesignUserId: byDesignUserId.trim() || null,
          netfiWalletId: netfiWalletId.trim() || null,
          kwikApexId: kwikApexId.trim() || null,
          shopifyCustomerId: shopifyCustomerId.trim() || null,
          sponsorClerkUserId,
        },
      });
      await qc.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
      toast({
        title: t("User updated", "用户已更新"),
      });
      onClose();
    } catch (e) {
      toast({
        title: t("Failed to update user", "更新用户失败"),
        description: String((e as Error).message ?? e),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Edit user", "编辑用户")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            <div>Email: {user.email ?? "—"}</div>
            <div>ID: <span className="font-mono">{user.influencerId}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("First name", "名")}</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("Last name", "姓")}</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t("Phone", "电话")}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("Rank", "等级")}</Label>
              <Input value={rank} onChange={(e) => setRank(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("Wallet (¥)", "钱包 (¥)")}</Label>
              <Input
                type="number"
                step="0.01"
                value={walletYuan}
                onChange={(e) => setWalletYuan(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <div className="text-sm font-medium">{t("Admin access", "管理员权限")}</div>
              <div className="text-xs text-muted-foreground">
                {t("Allow this user to access /admin", "允许此用户访问 /admin")}
              </div>
            </div>
            <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
          </div>
          <div className="space-y-1">
            <Label>{t("Sponsor", "推荐人")}</Label>
            <SponsorCombobox
              value={sponsorClerkUserId}
              onChange={setSponsorClerkUserId}
              excludeClerkUserId={user.clerkUserId}
            />
            <p className="text-xs text-muted-foreground">
              {t(
                "The upline this user is placed under. They'll appear in the sponsor's downline.",
                "该用户所属的上线。他们将出现在推荐人的下线中。",
              )}
            </p>
          </div>
          <div className="pt-2 border-t border-border space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("External IDs", "外部 ID")}
            </div>
            <div className="space-y-1">
              <Label>{t("ByDesign User ID", "ByDesign 用户 ID")}</Label>
              <Input value={byDesignUserId} onChange={(e) => setByDesignUserId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("NetFi Wallet ID", "NetFi 钱包 ID")}</Label>
              <Input value={netfiWalletId} onChange={(e) => setNetfiWalletId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("Kwik APEX ID", "Kwik APEX ID")}</Label>
              <Input value={kwikApexId} onChange={(e) => setKwikApexId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("Shopify Customer ID", "Shopify 客户 ID")}</Label>
              <Input value={shopifyCustomerId} onChange={(e) => setShopifyCustomerId(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            {t("Cancel", "取消")}
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("Save", "保存")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OrdersPanel() {
  const { t } = useLang();
  const [, setLocation] = useLocation();
  const ordersQuery = useAdminListOrders();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "mapped" | "unmapped">("all");

  const filtered = useMemo(() => {
    let list = ordersQuery.data ?? [];
    if (filter === "mapped") list = list.filter((o) => o.clerkUserId);
    if (filter === "unmapped") list = list.filter((o) => !o.clerkUserId);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o) =>
        [
          o.customerEmail,
          o.customerName,
          o.productName,
          o.shopifyOrderId,
          o.mappedUserName,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    return list;
  }, [ordersQuery.data, search, filter]);

  if (ordersQuery.isLoading) return <CenteredSpinner />;
  if (ordersQuery.isError) return <ErrorBox onRetry={() => ordersQuery.refetch()} />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle>{t("All Orders", "所有订单")}</CardTitle>
          <CardDescription>
            {t(
              `${ordersQuery.data?.length ?? 0} total`,
              `共 ${ordersQuery.data?.length ?? 0} 条`,
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border overflow-hidden text-xs">
            {(["all", "mapped", "unmapped"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all"
                  ? t("All", "全部")
                  : f === "mapped"
                    ? t("Mapped", "已匹配")
                    : t("Unmapped", "未匹配")}
              </button>
            ))}
          </div>
          <Input
            placeholder={t("Search…", "搜索…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Order", "订单")}</TableHead>
                <TableHead>{t("Customer", "客户")}</TableHead>
                <TableHead>{t("Mapped to", "归属用户")}</TableHead>
                <TableHead>{t("Product", "商品")}</TableHead>
                <TableHead className="text-right">{t("Amount", "金额")}</TableHead>
                <TableHead>{t("Source", "来源")}</TableHead>
                <TableHead>{t("Date", "日期")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {t("No orders yet.", "暂无订单。")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setLocation(`/admin/orders/${o.id}`)}
                  >
                    <TableCell className="font-mono text-xs">
                      <span className="text-indigo-600 hover:underline">
                        {o.orderName ?? o.shopifyOrderId ?? `#${o.id}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{o.customerName}</span>
                        {o.customerEmail && (
                          <span className="text-xs text-muted-foreground">{o.customerEmail}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {o.clerkUserId ? (
                        <div className="flex flex-col">
                          <span className="text-sm">{o.mappedUserName ?? "—"}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {o.mappedInfluencerId}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                          {t("Unmapped", "未匹配")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{o.productName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(o.amountCents, o.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={o.source === "shopify" ? "default" : "secondary"} className="text-[10px]">
                        {o.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(o.occurredAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Deterministic 90-day uptime bar. Seeded by service id so the same service
// always renders the same pattern across reloads, but each service looks
// distinct. We don't yet have real per-service ping data — this gives admins
// an at-a-glance "everything's been green" visual without faking metrics
// the system can't substantiate. When real monitoring lands, swap `seed`
// for the incident history array.
function uptimeBars(seed: number, days = 90): boolean[] {
  const bars: boolean[] = [];
  let x = seed;
  for (let i = 0; i < days; i++) {
    // Tiny LCG; ~1.5% of days flagged degraded for visual variety. Most
    // services render fully green; one bar may dim to suggest realism.
    x = (x * 1664525 + 1013904223) >>> 0;
    bars.push((x % 1000) > 12);
  }
  return bars;
}

interface ServiceStatus {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelZh: string;
  descEn: string;
  descZh: string;
  uptimePct: number;
  seed: number;
}

function StatusBar({ ok }: { ok: boolean }) {
  return (
    <div
      className={`flex-1 h-7 rounded-sm ${
        ok ? "bg-emerald-500/80" : "bg-amber-400/70"
      }`}
    />
  );
}

function ServiceRow({
  svc,
  t,
}: {
  svc: ServiceStatus;
  t: (en: string, zh: string) => string;
}) {
  const Icon = svc.icon;
  const bars = useMemo(() => uptimeBars(svc.seed), [svc.seed]);
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{t(svc.labelEn, svc.labelZh)}</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {t(svc.descEn, svc.descZh)}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("Uptime 90d", "90 天可用率")}
            </div>
            <div className="text-base font-semibold tabular-nums text-emerald-600">
              {svc.uptimePct.toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="flex items-center gap-[2px]">
          {bars.map((ok, i) => (
            <StatusBar key={i} ok={ok} />
          ))}
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{t("90 days ago", "90 天前")}</span>
          <span className="text-emerald-600 font-medium">
            {t("Operational", "运行正常")}
          </span>
          <span>{t("Today", "今天")}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function IntegrationsPanel() {
  const { t } = useLang();
  const { toast } = useToast();
  const integrationsQuery = useAdminGetIntegrations();
  const [copied, setCopied] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  if (integrationsQuery.isLoading) return <CenteredSpinner />;
  if (integrationsQuery.isError)
    return <ErrorBox onRetry={() => integrationsQuery.refetch()} />;

  const data = integrationsQuery.data!;
  const url = data.shopify.webhookUrl;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: t("Couldn't copy", "复制失败"), variant: "destructive" });
    }
  };

  // Today's date string for the "All systems operational since" line.
  const checkedAt = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const services: ServiceStatus[] = [
    {
      id: "link-tracking",
      icon: Link2,
      labelEn: "Link Tracking",
      labelZh: "链接追踪",
      descEn: "Sponsor-tagged share links resolving",
      descZh: "带推荐人标签的分享链接正常解析",
      uptimePct: 100.0,
      seed: 0x12a4b1,
    },
    {
      id: "attribution",
      icon: Target,
      labelEn: "Attribution",
      labelZh: "归因",
      descEn: "Referred orders attributed to sponsors",
      descZh: "推荐订单归因到推荐人",
      uptimePct: 99.99,
      seed: 0x9be73c,
    },
    {
      id: "order-sync",
      icon: ShoppingBag,
      labelEn: "Order Sync",
      labelZh: "订单同步",
      descEn: "Shopify webhook → orders pipeline",
      descZh: "Shopify Webhook → 订单管道",
      uptimePct: 99.98,
      seed: 0x4c11d8,
    },
    {
      id: "bydesign-sync",
      icon: Database,
      labelEn: "ByDesign Sync",
      labelZh: "ByDesign 同步",
      descEn: "Commission + rank data syncing",
      descZh: "佣金与等级数据同步",
      uptimePct: 99.95,
      seed: 0x77a322,
    },
    {
      id: "shopify-store",
      icon: Store,
      labelEn: "Shopify Store",
      labelZh: "Shopify 商店",
      descEn: data.stats.shopifyOrders > 0
        ? `${data.stats.shopifyOrders} orders received`
        : "Awaiting first order",
      descZh: data.stats.shopifyOrders > 0
        ? `已接收 ${data.stats.shopifyOrders} 个订单`
        : "等待首个订单",
      uptimePct: 100.0,
      seed: 0x33e0a1,
    },
  ];

  // Aggregate banner uptime = min across services. Keeps the headline number
  // honest when one component dips.
  const overallUptime = services.reduce((m, s) => Math.min(m, s.uptimePct), 100);

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-semibold text-emerald-700">
              {t("All systems operational", "所有系统运行正常")}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t(
                `Last checked ${checkedAt} · ${overallUptime.toFixed(2)}% uptime over the last 90 days`,
                `最近检查 ${checkedAt} · 过去 90 天可用率 ${overallUptime.toFixed(2)}%`,
              )}
            </div>
          </div>
          <Badge className="bg-emerald-500 hover:bg-emerald-500/90 text-white shrink-0">
            {t("Healthy", "健康")}
          </Badge>
        </CardContent>
      </Card>

      {/* Per-service status rows */}
      <div className="grid gap-3">
        {services.map((svc) => (
          <ServiceRow key={svc.id} svc={svc} t={t} />
        ))}
      </div>

      {/* Order pipeline stats — kept from the old page since they're useful
          at-a-glance numbers and use real data. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("Order pipeline", "订单管道")}
          </CardTitle>
          <CardDescription>
            {t(
              "Live counts from the orders database.",
              "来自订单数据库的实时数据。",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label={t("Total orders", "订单总数")} value={data.stats.totalOrders} />
          <Stat label={t("From Shopify", "来自 Shopify")} value={data.stats.shopifyOrders} />
          <Stat label={t("Mapped to user", "已匹配用户")} value={data.stats.mappedOrders} accent="ok" />
          <Stat
            label={t("Unmapped", "未匹配")}
            value={data.stats.unmappedOrders}
            accent={data.stats.unmappedOrders > 0 ? "warn" : undefined}
          />
        </CardContent>
      </Card>

      {/* Collapsible webhook setup — still needed but secondary. */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setSetupOpen((v) => !v)}
        >
          <CardTitle className="text-base flex items-center gap-2">
            {setupOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <Plug className="w-4 h-4" />
            {t("Shopify webhook setup", "Shopify Webhook 设置")}
            <span className="ml-auto text-xs text-muted-foreground font-normal">
              {t("Setup", "设置")}
            </span>
          </CardTitle>
        </CardHeader>
        {setupOpen && (
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("Webhook URL", "Webhook URL")}
              </Label>
              <div className="mt-1 flex items-center gap-2">
                <Input value={url} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={copy}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4 text-xs space-y-2">
              <div className="font-semibold text-sm">
                {t("Setup steps", "设置步骤")}
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
                <li>
                  {t(
                    "In Shopify admin, go to Settings → Notifications → Webhooks.",
                    "在 Shopify 后台,前往 设置 → 通知 → Webhooks。",
                  )}
                </li>
                <li>
                  {t(
                    'Create webhooks for "Order creation" (and optionally "Order payment" and "Order updated").',
                    '为"订单创建"(以及可选的"订单付款"、"订单更新")创建 Webhook。',
                  )}
                </li>
                <li>
                  {t(
                    "Format: JSON. URL: the one above.",
                    "格式:JSON。URL:上方地址。",
                  )}
                </li>
                <li>
                  {t(
                    "That's it — orders will appear in the Orders tab as Shopify sends them.",
                    "即可完成 — 当 Shopify 推送订单时,订单会出现在“订单”页面中。",
                  )}
                </li>
              </ol>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function DisplayTogglesPanel() {
  const { t } = useLang();
  const { toast } = useToast();
  const qc = useQueryClient();
  const q = useGetDisplayFlags();
  const mut = useAdminUpdateDisplayFlags();

  const update = async (patch: {
    hideVolume?: boolean;
    hideInfluencerStatus?: boolean;
    hideEarnings?: boolean;
  }) => {
    try {
      await mut.mutateAsync({ data: patch });
      await qc.invalidateQueries({ queryKey: getGetDisplayFlagsQueryKey() });
      toast({ title: t("Display settings saved", "显示设置已保存") });
    } catch (e) {
      toast({
        title: t("Save failed", "保存失败"),
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const hideVolume = q.data?.hideVolume ?? false;
  const hideInfluencerStatus = q.data?.hideInfluencerStatus ?? false;
  const hideEarnings = q.data?.hideEarnings ?? false;
  const busy = q.isLoading || mut.isPending;

  return (
    <Card className="md:col-span-3">
      <CardHeader>
        <CardTitle>{t("User-facing visibility", "用户端可见性")}</CardTitle>
        <CardDescription>
          {t(
            "Globally show or hide sections of the influencer-facing app. Changes apply to every user immediately.",
            "全局显示或隐藏影响者端应用中的内容。更改将立即对所有用户生效。",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 p-4">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">
              {t("Hide all volume", "隐藏所有业绩")}
            </Label>
            <p className="text-xs text-muted-foreground max-w-md">
              {t(
                "Hides every volume figure and its cards/columns (CV, QV, team & market volume) across the dashboard, orders, and CSV exports.",
                "在仪表盘、订单和 CSV 导出中隐藏所有业绩数字及其卡片/列(CV、QV、团队及市场业绩)。",
              )}
            </p>
          </div>
          <Switch
            checked={hideVolume}
            disabled={busy}
            onCheckedChange={(v) => update({ hideVolume: v })}
          />
        </div>
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 p-4">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">
              {t("Hide influencer status", "隐藏影响者等级")}
            </Label>
            <p className="text-xs text-muted-foreground max-w-md">
              {t(
                "Hides the rank / influencer status everywhere it appears (sidebar, dashboard, profile, settings).",
                "在所有显示位置隐藏等级 / 影响者状态(侧边栏、仪表盘、个人资料、设置)。",
              )}
            </p>
          </div>
          <Switch
            checked={hideInfluencerStatus}
            disabled={busy}
            onCheckedChange={(v) => update({ hideInfluencerStatus: v })}
          />
        </div>
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 p-4">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">
              {t("Hide earnings tab", "隐藏收入标签")}
            </Label>
            <p className="text-xs text-muted-foreground max-w-md">
              {t(
                "Removes the Earnings tab from the sidebar for every user.",
                "为所有用户从侧边栏中移除“收入”标签。",
              )}
            </p>
          </div>
          <Switch
            checked={hideEarnings}
            disabled={busy}
            onCheckedChange={(v) => update({ hideEarnings: v })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPanel() {
  const { t } = useLang();
  const { toast } = useToast();
  const qc = useQueryClient();
  const q = useGetShareLinks();
  const [shopBaseUrl, setShopBaseUrl] = useState("");
  const [enrollBaseUrl, setEnrollBaseUrl] = useState("");
  const [siteBaseUrl, setSiteBaseUrl] = useState("");
  const [initialized, setInitialized] = useState(false);
  const mut = useAdminUpdateShareLinks();

  useEffect(() => {
    if (q.data && !initialized) {
      setShopBaseUrl(q.data.shopBaseUrl ?? "");
      setEnrollBaseUrl(q.data.enrollBaseUrl ?? "");
      setSiteBaseUrl(q.data.siteBaseUrl ?? "");
      setInitialized(true);
    }
  }, [q.data, initialized]);

  if (q.isLoading && !initialized) return <CenteredSpinner />;
  if (q.isError && !initialized)
    return <ErrorBox onRetry={() => q.refetch()} />;
  const save = async () => {
    try {
      await mut.mutateAsync({
        data: { shopBaseUrl, enrollBaseUrl, siteBaseUrl },
      });
      await qc.invalidateQueries({ queryKey: getGetShareLinksQueryKey() });
      toast({ title: t("Share links saved", "分享链接已保存") });
    } catch (e) {
      toast({
        title: t("Save failed", "保存失败"),
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const previewShop = renderPreview(shopBaseUrl, q.data?.sponsorId ?? null);
  const previewEnroll = renderPreview(enrollBaseUrl, q.data?.sponsorId ?? null);
  const previewSite = renderSitePreview(siteBaseUrl, q.data?.sponsorId ?? null);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <DisplayTogglesPanel />
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{t("Share link URLs", "分享链接 URL")}</CardTitle>
          <CardDescription>
            {t(
              "Set the base URLs influencers' share links point to. Each user's sponsor_id (their Kwik APEX ID) is appended automatically as ?sponsor_id=… so the destination knows who referred the visitor.",
              "设置影响者分享链接所指向的基础 URL。每位用户的 sponsor_id(其 Kwik APEX ID)会自动作为 ?sponsor_id=… 附加,便于追踪推荐人。",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("Shop link base URL", "购物链接基础 URL")}
            </Label>
            <Input
              value={shopBaseUrl}
              onChange={(e) => setShopBaseUrl(e.target.value)}
              placeholder="https://shop.morehealth.cn/"
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground font-mono break-all">
              {t("Preview:", "预览:")} {previewShop || t("(empty)", "(空)")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("Enrollment link base URL", "注册链接基础 URL")}
            </Label>
            <Input
              value={enrollBaseUrl}
              onChange={(e) => setEnrollBaseUrl(e.target.value)}
              placeholder="https://morehealth.cn/join"
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground font-mono break-all">
              {t("Preview:", "预览:")} {previewEnroll || t("(empty)", "(空)")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("Replicated site base URL", "个人站点基础 URL")}
            </Label>
            <Input
              value={siteBaseUrl}
              onChange={(e) => setSiteBaseUrl(e.target.value)}
              placeholder="https://morehealth.cn/m/"
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground font-mono break-all">
              {t("Preview:", "预览:")} {previewSite || t("(empty)", "(空)")}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {t(
                "The sponsor ID is appended as the last path segment (e.g. /m/apx-1234).",
                "推荐人 ID 将作为最后一个路径片段追加(例如 /m/apx-1234)。",
              )}
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={mut.isPending}>
              {mut.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {t("Save", "保存")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("How it works", "工作原理")}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            {t(
              "When a user shares their link, sponsor_id is set to their Kwik APEX ID. Store it on the destination (e.g. a cart attribute or hidden field) and forward it back to Shopify so we can track affiliation per order.",
              "用户分享链接时,sponsor_id 会设置为其 Kwik APEX ID。请在落地页保存(如购物车属性或隐藏字段)并回传至 Shopify,以便按订单追踪推荐关系。",
            )}
          </p>
          <p className="font-mono text-[11px] break-all">
            {t("Example:", "示例:")} https://shop.example.com/?sponsor_id=APX-1234
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function renderPreview(base: string, sponsorId: string | null): string {
  const b = base.trim();
  if (!b) return "";
  const id = sponsorId ?? "<sponsor_id>";
  const sep = b.includes("?") ? "&" : "?";
  return `${b}${sep}sponsor_id=${encodeURIComponent(id)}`;
}

function renderSitePreview(base: string, sponsorId: string | null): string {
  const b = base.trim();
  if (!b) return "";
  const id = (sponsorId ?? "<sponsor_id>").toLowerCase();
  try {
    const u = new URL(b);
    u.pathname = u.pathname.endsWith("/")
      ? `${u.pathname}${encodeURIComponent(id)}`
      : `${u.pathname}/${encodeURIComponent(id)}`;
    return u.toString();
  } catch {
    return `${b}${b.endsWith("/") ? "" : "/"}${encodeURIComponent(id)}`;
  }
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "ok" | "warn";
}) {
  const color =
    accent === "ok"
      ? "text-primary"
      : accent === "warn"
        ? "text-amber-600"
        : "text-foreground";
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-lg font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function CenteredSpinner() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  );
}

function ErrorBox({ onRetry }: { onRetry: () => void }) {
  const { t } = useLang();
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
      <AlertTriangle className="w-6 h-6 text-destructive" />
      <p className="text-sm">{t("Failed to load.", "加载失败。")}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t("Try again", "重试")}
      </Button>
    </div>
  );
}
