import React from "react";

export function MobileFrame({
  children,
  bg = "bg-background",
}: {
  children: React.ReactNode;
  bg?: string;
}) {
  return (
    <div
      className={`${bg} min-h-[844px] w-full max-w-[390px] mx-auto relative overflow-hidden font-sans shadow-[0_0_40px_rgba(0,0,0,0.1)] border border-border/50 rounded-[40px] flex flex-col`}
    >
      {/* iOS status bar */}
      <div className="h-12 w-full flex justify-between items-center px-6 pt-2 shrink-0">
        <span className="text-xs font-semibold">9:41</span>
        <div className="flex gap-1.5 items-center">
          <div className="w-4 h-3 bg-foreground rounded-sm" />
          <div className="w-3 h-3 bg-foreground rounded-full" />
          <div className="w-5 h-3 border border-foreground rounded-sm" />
        </div>
      </div>
      {children}
      {/* iOS home indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-foreground rounded-full z-50" />
    </div>
  );
}

export function MobileTabBar({
  active = "Home",
}: {
  active?: "Home" | "Orders" | "Storefront" | "Wallet" | "More";
}) {
  const items = [
    { label: "Home", icon: HomeIcon },
    { label: "Orders", icon: BagIcon },
    { label: "Storefront", icon: StoreIcon },
    { label: "Wallet", icon: WalletIcon },
    { label: "More", icon: MenuIcon },
  ] as const;
  return (
    <nav className="absolute bottom-0 left-0 w-full h-[84px] bg-background/90 backdrop-blur-xl border-t border-border/50 flex justify-around items-start pt-3 px-2 pb-6 z-50">
      {items.map((it) => {
        const isActive = it.label === active;
        const Icon = it.icon;
        return (
          <button key={it.label} className="flex flex-col items-center gap-1 w-16">
            <Icon className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
            <span
              className={`text-[10px] font-medium ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {it.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function HomeIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V10.5z" />
    </svg>
  );
}
function BagIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7a3 3 0 116 0" />
    </svg>
  );
}
function StoreIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 9l1-4h16l1 4M4 9v11h16V9M4 9h16" />
    </svg>
  );
}
function WalletIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M16 13h2" />
    </svg>
  );
}
function MenuIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
