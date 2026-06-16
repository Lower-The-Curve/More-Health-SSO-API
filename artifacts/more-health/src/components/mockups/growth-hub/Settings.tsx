import "./_group.css";
import React, { useEffect, useRef, useState } from "react";
import { AppLayout } from "./_shared/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  User,
  MapPin,
  Shield,
  History,
  Network,
  Globe,
  Plus,
  Pencil,
  Trash2,
  Smartphone,
  Key,
  LogOut,
  Monitor,
  Download,
  CheckCircle2,
  Users,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useDisplayFlags } from "@/lib/displayFlags";
import {
  useGetProfile,
  useUpdateProfile,
  useListAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useGetPlacement,
  getGetProfileQueryKey,
  getListAddressesQueryKey,
  type AddressItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type TabId = "profile" | "addresses" | "security" | "records" | "placement" | "language";

export function Settings() {
  const { lang, setLang, t } = useLang();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const SUBNAV: { id: TabId; icon: typeof User; label: string }[] = [
    { id: "profile", icon: User, label: t("Profile", "个人资料") },
    { id: "addresses", icon: MapPin, label: t("Addresses", "地址簿") },
    { id: "security", icon: Shield, label: t("Security", "安全") },
    { id: "records", icon: History, label: t("Account Records", "账户记录") },
    { id: "placement", icon: Network, label: t("Placement", "团队归属") },
    { id: "language", icon: Globe, label: t("Language", "语言") },
  ];

  return (
    <AppLayout activeId="settings">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold tracking-tight">{t("Settings", "设置")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("Manage your account preferences and information.", "管理你的账户偏好与信息。")}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-64 shrink-0 space-y-1">
            {SUBNAV.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <Card className="flex-1 shadow-sm border-border/50 rounded-2xl bg-card w-full">
            {activeTab === "profile" && <ProfilePanel t={t} lang={lang} setLang={setLang} />}
            {activeTab === "addresses" && <AddressesPanel t={t} />}
            {activeTab === "security" && <SecurityPanel t={t} />}
            {activeTab === "records" && <RecordsPanel t={t} />}
            {activeTab === "placement" && <PlacementPanel t={t} />}
            {activeTab === "language" && <LanguagePanel t={t} lang={lang} setLang={setLang} />}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

type T = (en: string, zh: string) => string;

function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="p-6 sm:p-8 border-b border-border/50">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

function ProfilePanel({ t, lang, setLang }: { t: T; lang: "en" | "zh"; setLang: (l: "en" | "zh") => void }) {
  const { user, initials, fullName } = useCurrentUser();
  const profileQuery = useGetProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const p = profileQuery.data;

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
  });
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const hydratedRef = useRef(false);

  // Hydrate the form once when the profile first arrives. We deliberately do
  // NOT rehydrate on background refetches: that would clobber in-progress
  // edits whenever React Query refreshes the cached profile.
  useEffect(() => {
    if (!p || hydratedRef.current) return;
    setForm({
      firstName: p.firstName ?? "",
      lastName: p.lastName ?? "",
      phone: p.phone ?? "",
      dateOfBirth: p.dateOfBirth ?? "",
    });
    hydratedRef.current = true;
  }, [p]);

  const setField = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
    setSavedAt(null);
  };

  const onSave = async () => {
    await updateProfile.mutateAsync({
      data: {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth ? form.dateOfBirth : null,
      },
    });
    await queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    // After a successful save, allow the next profile fetch to re-hydrate
    // the form (so server-side normalizations are reflected).
    hydratedRef.current = false;
    setDirty(false);
    setSavedAt(Date.now());
  };

  const onCancel = () => {
    if (!p) return;
    setForm({
      firstName: p.firstName ?? "",
      lastName: p.lastName ?? "",
      phone: p.phone ?? "",
      dateOfBirth: p.dateOfBirth ?? "",
    });
    setDirty(false);
  };

  const email = user?.email ?? p?.email ?? "";

  return (
    <>
      <PanelHeader
        title={t("Profile Information", "个人资料")}
        subtitle={t("Update your personal details and public profile.", "更新你的个人信息与公开资料。")}
      />
      <CardContent className="p-6 sm:p-8 space-y-8">
        <div className="flex items-center gap-6">
          <Avatar className="w-20 h-20 border-2 border-background shadow-sm ring-1 ring-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-base font-semibold">{fullName}</p>
            {email ? (
              <p className="text-xs text-muted-foreground mt-1.5">{email}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FieldControlled
            label={t("First Name", "名")}
            id="firstName"
            value={form.firstName}
            onChange={(v) => setField("firstName", v)}
          />
          <FieldControlled
            label={t("Last Name", "姓")}
            id="lastName"
            value={form.lastName}
            onChange={(v) => setField("lastName", v)}
          />
          <div className="space-y-2">
            <Label htmlFor="email">{t("Email Address", "邮箱地址")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              className="bg-secondary/50 rounded-xl cursor-not-allowed"
            />
            <p className="text-[11px] text-muted-foreground">
              {t(
                "Managed by your sign-in. Contact support to change.",
                "由登录服务管理。如需修改请联系客服。",
              )}
            </p>
          </div>
          <FieldControlled
            label={t("Phone Number", "手机号")}
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(v) => setField("phone", v)}
          />
          <div className="space-y-2">
            <Label htmlFor="accountNumber">{t("Account Number", "账户编号")}</Label>
            <Input
              id="accountNumber"
              value={p?.kwikApexId ?? ""}
              readOnly
              placeholder={t("Not assigned yet", "尚未分配")}
              className="bg-secondary/50 rounded-xl cursor-not-allowed font-mono tracking-wide"
            />
            <p className="text-[11px] text-muted-foreground">
              {t(
                "Your Kwik APEX ID. Used as the sponsor ID on your share links.",
                "您的 Kwik APEX 编号。作为分享链接中的推荐人 ID。",
              )}
            </p>
          </div>
          <FieldControlled
            label={t("Date of Birth", "出生日期")}
            id="dob"
            type="date"
            value={form.dateOfBirth}
            onChange={(v) => setField("dateOfBirth", v)}
          />
          <div className="space-y-2">
            <Label htmlFor="lang">{t("Preferred Language", "偏好语言")}</Label>
            <div className="relative">
              <select
                id="lang"
                value={lang}
                onChange={(e) => setLang(e.target.value as "en" | "zh")}
                className="flex h-9 w-full rounded-xl border border-input bg-secondary/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none"
              >
                <option value="en">English</option>
                <option value="zh">简体中文</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border/50 flex justify-end gap-3 items-center">
          {savedAt && !dirty && (
            <span className="text-xs text-emerald-600 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("Saved", "已保存")}
            </span>
          )}
          <Button variant="ghost" className="rounded-xl" onClick={onCancel} disabled={!dirty}>
            {t("Cancel", "取消")}
          </Button>
          <Button
            className="rounded-xl shadow-sm px-8"
            onClick={onSave}
            disabled={!dirty || updateProfile.isPending}
          >
            {updateProfile.isPending ? t("Saving…", "保存中…") : t("Save Changes", "保存修改")}
          </Button>
        </div>
      </CardContent>
    </>
  );
}

function FieldControlled({
  label,
  id,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-secondary/30 rounded-xl"
      />
    </div>
  );
}

type AddressFormState = {
  label: string;
  recipient: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const emptyAddress = (): AddressFormState => ({
  label: "",
  recipient: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "CN",
  isDefault: false,
});

function AddressesPanel({ t }: { t: T }) {
  const addressesQuery = useListAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<AddressFormState>(emptyAddress());

  const addresses = addressesQuery.data ?? [];
  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: getListAddressesQueryKey() });

  const startNew = () => {
    setForm(emptyAddress());
    setEditingId("new");
  };
  const startEdit = (a: AddressItem) => {
    setForm({
      label: a.label,
      recipient: a.recipient,
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      region: a.region,
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
    });
    setEditingId(a.id);
  };
  const cancel = () => setEditingId(null);

  const save = async () => {
    if (editingId === "new") {
      await createAddress.mutateAsync({ data: form });
    } else if (typeof editingId === "number") {
      await updateAddress.mutateAsync({ id: editingId, data: form });
    }
    await refetch();
    setEditingId(null);
  };

  const remove = async (id: number) => {
    await deleteAddress.mutateAsync({ id });
    await refetch();
  };

  const setDefault = async (a: AddressItem) => {
    await updateAddress.mutateAsync({
      id: a.id,
      data: {
        label: a.label,
        recipient: a.recipient,
        line1: a.line1,
        line2: a.line2 ?? "",
        city: a.city,
        region: a.region,
        postalCode: a.postalCode,
        country: a.country,
        isDefault: true,
      },
    });
    await refetch();
  };

  return (
    <>
      <PanelHeader
        title={t("Saved Addresses", "已保存地址")}
        subtitle={t("Shipping and billing addresses for your orders and payouts.", "用于订单与款项的收货与账单地址。")}
      />
      <CardContent className="p-6 sm:p-8 space-y-4">
        <div className="flex justify-end">
          <Button className="rounded-xl shadow-sm gap-2" onClick={startNew} disabled={editingId !== null}>
            <Plus className="w-4 h-4" />
            {t("Add Address", "添加地址")}
          </Button>
        </div>

        {editingId !== null && (
          <AddressForm
            t={t}
            form={form}
            setForm={setForm}
            onCancel={cancel}
            onSave={save}
            saving={createAddress.isPending || updateAddress.isPending}
          />
        )}

        {addressesQuery.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t("Loading…", "加载中…")}
          </div>
        ) : addresses.length === 0 && editingId === null ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
            <p className="text-sm font-semibold">{t("No addresses yet", "暂无地址")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "Add your first shipping address, or place an order to seed one automatically.",
                "添加您的第一个收货地址,或下单后自动生成。",
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((a) => (
              <div key={a.id} className="rounded-2xl border border-border/50 bg-secondary/20 p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{a.label}</span>
                    {a.isDefault && (
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary border-0">
                        {t("Default", "默认")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <button
                      className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors"
                      aria-label="edit"
                      onClick={() => startEdit(a)}
                      disabled={editingId !== null}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg hover:bg-background hover:text-destructive transition-colors"
                      aria-label="delete"
                      onClick={() => remove(a.id)}
                      disabled={editingId !== null || deleteAddress.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground">{a.recipient}</p>
                <div className="text-sm text-muted-foreground mt-1 leading-relaxed flex-1">
                  <p>{a.line1}</p>
                  {a.line2 && <p>{a.line2}</p>}
                  <p>
                    {[a.city, a.region, a.postalCode].filter(Boolean).join(", ")}
                  </p>
                  <p>{a.country}</p>
                </div>
                {!a.isDefault && (
                  <button
                    className="mt-3 text-xs font-semibold text-primary hover:underline self-start disabled:opacity-50"
                    onClick={() => setDefault(a)}
                    disabled={editingId !== null || updateAddress.isPending}
                  >
                    {t("Set as default", "设为默认")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </>
  );
}

function AddressForm({
  t,
  form,
  setForm,
  onSave,
  onCancel,
  saving,
}: {
  t: T;
  form: AddressFormState;
  setForm: React.Dispatch<React.SetStateAction<AddressFormState>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const set = <K extends keyof AddressFormState>(k: K, v: AddressFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const canSave =
    form.label && form.recipient && form.line1 && form.city && form.region && form.postalCode;
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldControlled label={t("Label", "标签")} id="addr-label" value={form.label} onChange={(v) => set("label", v)} />
        <FieldControlled label={t("Recipient", "收件人")} id="addr-recipient" value={form.recipient} onChange={(v) => set("recipient", v)} />
        <FieldControlled label={t("Address Line 1", "地址 1")} id="addr-l1" value={form.line1} onChange={(v) => set("line1", v)} />
        <FieldControlled label={t("Address Line 2", "地址 2")} id="addr-l2" value={form.line2} onChange={(v) => set("line2", v)} />
        <FieldControlled label={t("City", "城市")} id="addr-city" value={form.city} onChange={(v) => set("city", v)} />
        <FieldControlled label={t("Region / Province", "省/州")} id="addr-region" value={form.region} onChange={(v) => set("region", v)} />
        <FieldControlled label={t("Postal Code", "邮编")} id="addr-postal" value={form.postalCode} onChange={(v) => set("postalCode", v)} />
        <FieldControlled label={t("Country", "国家")} id="addr-country" value={form.country} onChange={(v) => set("country", v)} />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={form.isDefault} onCheckedChange={(v) => set("isDefault", v)} />
          {t("Set as default", "设为默认")}
        </label>
        <div className="flex gap-2">
          <Button variant="ghost" className="rounded-xl" onClick={onCancel}>
            {t("Cancel", "取消")}
          </Button>
          <Button className="rounded-xl shadow-sm" onClick={onSave} disabled={!canSave || saving}>
            {saving ? t("Saving…", "保存中…") : t("Save", "保存")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SecurityPanel({ t }: { t: T }) {
  const sessions = [
    { id: "s1", device: "MacBook Pro · Chrome", deviceZh: "MacBook Pro · Chrome", location: "Shanghai, CN", locationZh: "中国 上海", time: "Active now", timeZh: "当前活跃", current: true },
    { id: "s2", device: "iPhone 15 · MoreHealth App", deviceZh: "iPhone 15 · MoreHealth App", location: "Shanghai, CN", locationZh: "中国 上海", time: "2 hours ago", timeZh: "2 小时前" },
    { id: "s3", device: "iPad · Safari", deviceZh: "iPad · Safari", location: "Hangzhou, CN", locationZh: "中国 杭州", time: "Yesterday", timeZh: "昨天" },
  ];
  return (
    <>
      <PanelHeader
        title={t("Security", "安全")}
        subtitle={t("Protect your account with a strong password and two-factor authentication.", "通过强密码与双重验证保护您的账户。")}
      />
      <CardContent className="p-6 sm:p-8 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{t("Change Password", "修改密码")}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              "Password management is handled by your sign-in provider. Use the account menu to reset.",
              "密码管理由登录服务处理。请在账户菜单中重置。",
            )}
          </p>
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-semibold">{t("Two-Factor Authentication", "双重身份验证")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("Receive a one-time code via SMS when signing in.", "登录时通过短信接收一次性验证码。")}
                </p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-semibold">{t("Login Alerts", "登录提醒")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("Email me whenever a new device signs in.", "新设备登录时通过邮件提醒我。")}
                </p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{t("Active Sessions", "活跃会话")}</h3>
          </div>
          <div className="rounded-2xl border border-border/50 divide-y divide-border/50 overflow-hidden">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    {t(s.device, s.deviceZh)}
                    {s.current && (
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary border-0">
                        {t("This device", "当前设备")}
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t(s.location, s.locationZh)} · {t(s.time, s.timeZh)}
                  </p>
                </div>
                {!s.current && (
                  <button className="text-xs font-semibold text-destructive hover:underline inline-flex items-center gap-1">
                    <LogOut className="w-3.5 h-3.5" />
                    {t("Sign out", "退出")}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </>
  );
}

function RecordsPanel({ t }: { t: T }) {
  const { hideInfluencerStatus } = useDisplayFlags();
  const records = [
    { id: "r1", typeEn: "Rank Promotion", typeZh: "等级晋升", descEn: "Promoted to Elite Influencer", descZh: "晋升为精英影响者", dateEn: "Apr 14, 2026", dateZh: "2026年4月14日", color: "bg-primary/10 text-primary" },
    { id: "r2", typeEn: "Payout", typeZh: "结算", descEn: "Weekly payout · ¥1,950.20", descZh: "每周结算 · ¥1,950.20", dateEn: "Apr 11, 2026", dateZh: "2026年4月11日", color: "bg-amber-100 text-amber-700" },
    { id: "r3", typeEn: "Login", typeZh: "登录", descEn: "Signed in from Shanghai, CN (Chrome)", descZh: "在中国上海登录(Chrome)", dateEn: "Apr 10, 2026", dateZh: "2026年4月10日", color: "bg-sky-100 text-sky-700" },
  ];
  return (
    <>
      <PanelHeader
        title={t("Account Records", "账户记录")}
        subtitle={t("A timeline of important changes and activity on your account.", "账户重要变更与活动的时间线。")}
      />
      <CardContent className="p-6 sm:p-8 space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" className="rounded-xl gap-2 shadow-sm">
            <Download className="w-4 h-4" />
            {t("Export CSV", "导出 CSV")}
          </Button>
        </div>
        <div className="rounded-2xl border border-border/50 divide-y divide-border/50 overflow-hidden">
          {records
            .filter((r) => !(hideInfluencerStatus && r.typeEn === "Rank Promotion"))
            .map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-4 p-4 hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${r.color}`}>
                  {t(r.typeEn, r.typeZh)}
                </span>
                <p className="text-sm text-foreground truncate">{t(r.descEn, r.descZh)}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{t(r.dateEn, r.dateZh)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );
}

function PlacementPanel({ t }: { t: T }) {
  const { hideInfluencerStatus } = useDisplayFlags();
  const placementQuery = useGetPlacement();
  const p = placementQuery.data;
  const sponsorName =
    p?.sponsor
      ? [p.sponsor.firstName, p.sponsor.lastName].filter(Boolean).join(" ") ||
        t("Unnamed sponsor", "未命名推荐人")
      : null;
  const sponsorInitials = p?.sponsor
    ? ((p.sponsor.firstName?.[0] ?? "") + (p.sponsor.lastName?.[0] ?? "")) ||
      "?"
    : "?";

  return (
    <>
      <PanelHeader
        title={t("Placement & Sponsorship", "团队归属与推荐")}
        subtitle={t("Your position in the MoreHealth network and the team you belong to.", "您在 MoreHealth 团队中的位置与归属。")}
      />
      <CardContent className="p-6 sm:p-8 space-y-6">
        {placementQuery.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t("Loading…", "加载中…")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/50 bg-secondary/20 p-5">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {t("Your Sponsor", "您的推荐人")}
                </p>
                {p?.sponsor ? (
                  <div className="flex items-center gap-3 mt-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {sponsorInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{sponsorName}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {p.sponsor.influencerId}
                        {!hideInfluencerStatus ? ` · ${p.sponsor.rank}` : ""}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-3">
                    {p?.sponsorId
                      ? t(
                          `Sponsor ID ${p.sponsorId} — no matching influencer found.`,
                          `推荐人编号 ${p.sponsorId} — 未找到匹配的影响者。`,
                        )
                      : t(
                          "No sponsor on record. You joined directly.",
                          "未记录推荐人,您直接加入。",
                        )}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-border/50 bg-secondary/20 p-5">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {t("Your Sponsor ID", "您的推荐编号")}
                </p>
                <p className="text-base font-semibold text-foreground mt-3 font-mono">
                  {p?.kwikApexId ?? t("Not assigned yet", "尚未分配")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(
                    "Customers using your share link with this ID are attributed to you.",
                    "客户通过带此编号的分享链接下单时会归属于您。",
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatTile label={t("Influencer ID", "影响者编号")} value={p?.influencerId ?? "—"} />
              {!hideInfluencerStatus ? (
                <StatTile label={t("Current Rank", "当前等级")} value={p?.rank ?? "—"} />
              ) : null}
              <StatTile
                label={t("Joined", "加入日期")}
                value={
                  p?.joinedAt
                    ? new Date(p.joinedAt).toLocaleDateString()
                    : "—"
                }
              />
            </div>

            <div className="rounded-2xl border border-border/50 p-5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">
                  {t("Frontline Influencers", "一线影响者")}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t(
                  "Your enrolled team will appear here as new influencers join under you.",
                  "新影响者加入您的团队后将在此显示。",
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-amber-900">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <div className="text-sm">
                <p className="font-semibold">{t("Placement is locked", "团队归属已锁定")}</p>
                <p className="text-xs text-amber-800/80 mt-1">
                  {t(
                    "Sponsorship and placement cannot be changed once your account is active. Contact support if you believe this is an error.",
                    "账户激活后,推荐人与归属无法修改。如有疑问,请联系客服。",
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/20 p-4">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-foreground mt-1">{value}</p>
    </div>
  );
}

function LanguagePanel({ t, lang, setLang }: { t: T; lang: "en" | "zh"; setLang: (l: "en" | "zh") => void }) {
  return (
    <>
      <PanelHeader
        title={t("Language", "语言")}
        subtitle={t("Choose the language for menus, labels, and notifications.", "选择菜单、标签与通知所用语言。")}
      />
      <CardContent className="p-6 sm:p-8 space-y-3">
        {[
          { v: "en" as const, en: "English", zh: "英文" },
          { v: "zh" as const, en: "简体中文", zh: "简体中文" },
        ].map((opt) => {
          const active = lang === opt.v;
          return (
            <button
              key={opt.v}
              onClick={() => setLang(opt.v)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:bg-secondary/30"
              }`}
            >
              <span className="text-sm font-medium">{t(opt.en, opt.zh)}</span>
              {active && <CheckCircle2 className="w-4 h-4 text-primary" />}
            </button>
          );
        })}
      </CardContent>
    </>
  );
}
