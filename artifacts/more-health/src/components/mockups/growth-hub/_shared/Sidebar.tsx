import React from "react";
import { Link, useLocation } from "wouter";
import { BrandLogo } from "./BrandLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLang } from "@/lib/i18n";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useDisplayFlags } from "@/lib/displayFlags";
import { useLogout } from "@/lib/auth";
import { useGetShareLinks } from "@workspace/api-client-react";
import { LogOut } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingBag,
  UserPlus,
  Store,
  Wallet,
  LineChart,
  ShoppingBasket,
  HandCoins,
  Settings,
  LifeBuoy,
  Shield,
  X,
} from "lucide-react";

type NavItem = {
  icon: typeof LayoutDashboard;
  en: string;
  zh: string;
  id: string;
  path: string;
  external?: boolean;
  badge?: number;
};

type NavSection = {
  id: string;
  labelEn: string;
  labelZh: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    id: "overview",
    labelEn: "Overview",
    labelZh: "概览",
    items: [
      { icon: LayoutDashboard, en: "Dashboard", zh: "仪表盘", id: "dashboard", path: "/dashboard" },
    ],
  },
  {
    id: "selling",
    labelEn: "Selling",
    labelZh: "销售",
    items: [
      { icon: ShoppingBag, en: "Shop", zh: "商城", id: "shop", path: "https://morehealth-3.myshopify.com/collections/all?password=kwik", external: true },
      { icon: Store, en: "Storefront", zh: "我的店铺", id: "storefront", path: "/storefront" },
      { icon: HandCoins, en: "Order on Behalf Of", zh: "代客下单", id: "order-behalf", path: "/order-behalf" },
      { icon: ShoppingBasket, en: "Orders", zh: "订单", id: "orders", path: "/orders" },
    ],
  },
  {
    id: "network",
    labelEn: "Network",
    labelZh: "团队",
    items: [
      // Enroll path is overridden at render time from useGetShareLinks() so it
      // matches the user's Settings → Placement enrollment link (with sponsor_id).
      { icon: UserPlus, en: "Enroll", zh: "邀请伙伴", id: "enroll", path: "", external: true },
      // Enroll on Behalf Of opens an internal selector first so the user can
      // pick which downline person they're enrolling for, then continues to
      // that member's Shopify enrollment URL.
      { icon: UserPlus, en: "Enroll on Behalf Of", zh: "代客注册", id: "enroll-behalf", path: "/enroll-behalf" },
    ],
  },
  {
    id: "finance",
    labelEn: "Finance",
    labelZh: "财务",
    items: [
      { icon: Wallet, en: "Wallet", zh: "钱包", id: "wallet", path: "https://login.dev.newulife.com/", external: true },
      { icon: LineChart, en: "Earnings", zh: "收入", id: "earnings", path: "/earnings" },
    ],
  },
];

const FOOTER_ITEMS: NavItem[] = [
  { icon: Settings, en: "Settings", zh: "设置", id: "settings", path: "/settings" },
  { icon: LifeBuoy, en: "Support", zh: "客服支持", id: "support", path: "https://www.morehealth.com/form/contact-us", external: true },
];

function NavLinkItem({
  item,
  activeId,
  location,
  t,
}: {
  item: NavItem;
  activeId?: string;
  location: string;
  t: (en: string, zh: string) => string;
}) {
  const isActive =
    !item.external &&
    (activeId
      ? item.id === activeId
      : location === item.path || (location === "/" && item.id === "dashboard"));
  const Icon = item.icon;
  const className = `w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
    isActive
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
  }`;
  const inner = (
    <>
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-70"}`} />
        <span>{t(item.en, item.zh)}</span>
      </div>
      {item.badge ? (
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
            isActive ? "bg-white/20 text-primary-foreground" : "bg-primary/10 text-primary"
          }`}
        >
          {item.badge}
        </span>
      ) : null}
    </>
  );
  if (item.external) {
    return (
      <a href={item.path} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={item.path} className={className}>
      {inner}
    </Link>
  );
}

export function Sidebar({ activeId, mobileOpen = false, onClose }: { activeId?: string; mobileOpen?: boolean; onClose?: () => void }) {
  const [location] = useLocation();
  const { t } = useLang();
  const { fullName, initials, imageUrl, rank, isAdmin } = useCurrentUser();
  const { hideInfluencerStatus, hideEarnings } = useDisplayFlags();
  const logout = useLogout();
  const shareLinksQuery = useGetShareLinks();
  const enrollShareUrl = shareLinksQuery.data?.enrollShareUrl ?? null;
  return (
    <div
      className={`w-[248px] h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 md:translate-x-0 md:z-20 ${
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}
    >
      <div className="p-6 flex items-center justify-between">
        <BrandLogo />
        <button
          onClick={onClose}
          className="md:hidden text-muted-foreground hover:text-foreground p-1 -mr-1"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 mb-6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
          <Avatar className="w-10 h-10 border border-background">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials.toUpperCase()}</AvatarFallback>
            {imageUrl ? <AvatarImage src={imageUrl} /> : null}
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">{fullName}</span>
            {!hideInfluencerStatus ? (
              <span className="text-xs text-muted-foreground">{t(rank, rank === "Influencer" ? "影响者" : rank)}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6 scrollbar-hide">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={section.id} className={idx === 0 ? "" : "mt-5"}>
            <div className="px-3 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {t(section.labelEn, section.labelZh)}
              </span>
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const resolved =
                  item.id === "enroll" && enrollShareUrl
                    ? { ...item, path: enrollShareUrl }
                    : item;
                // Hide the Enroll item until its share-link URL has loaded
                // so we never send the user to a bare/incorrect destination.
                if (item.id === "enroll" && !enrollShareUrl) return null;
                // Earnings tab visibility is admin-controlled.
                if (item.id === "earnings" && hideEarnings) return null;
                return (
                  <NavLinkItem
                    key={item.id}
                    item={resolved}
                    activeId={activeId}
                    location={location}
                    t={t}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 pt-2 pb-3 mt-auto border-t border-border space-y-1">
        {isAdmin && (
          <NavLinkItem
            item={{ icon: Shield, en: "Admin", zh: "管理后台", id: "admin", path: "/admin" }}
            activeId={activeId}
            location={location}
            t={t}
          />
        )}
        {FOOTER_ITEMS.map((item) => (
          <NavLinkItem key={item.id} item={item} activeId={activeId} location={location} t={t} />
        ))}
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{t("Sign out", "退出登录")}</span>
        </button>
      </div>

    </div>
  );
}
