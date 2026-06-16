import "./_group.css";
import React from "react";
import { MobileFrame, MobileTabBar } from "./_shared/MobileFrame";
import { ChevronLeft, Copy, Share2, QrCode, ExternalLink, Eye } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

const PRODUCTS = [
  { name: "SomaDerm Transdermal Gel", img: "/images/somaderm.png", price: "¥1,224", commission: "¥244.80" },
  { name: "Revitalize Eye Cream", img: "/images/revitalize-eye-cream.png", price: "¥560", commission: "¥112.00" },
  { name: "Rose & Cole Luxe Bundle", img: "/images/rose-cole-luxe.png", price: "¥3,384", commission: "¥676.80" },
  { name: "TRi-M*LT Daily Stack", img: "/images/tri-mlt.png", price: "¥828", commission: "¥165.60" },
];

export function MobileStorefront() {
  return (
    <MobileFrame>
      <header className="px-5 py-2 flex items-center justify-between shrink-0">
        <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-display font-semibold">Storefront · 店铺</h1>
        <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <Eye className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-28 scrollbar-hide">
        {/* Share card */}
        <div className="px-5 mt-2">
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Your storefront link</p>
            <p className="text-sm font-mono mt-1.5 truncate">morehealth.com/brady</p>

            <div className="flex items-center gap-3 mt-4">
              <div className="bg-white border border-border/60 rounded-xl p-2.5">
                <QRCodeCanvas
                  value="https://morehealth.com/brady"
                  size={84}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#0a0a0a"
                />
              </div>
              <div className="flex-1 grid gap-2">
                <button className="h-9 rounded-lg bg-foreground text-background text-xs font-semibold inline-flex items-center justify-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> Share link
                </button>
                <button className="h-9 rounded-lg border border-border/60 text-xs font-semibold inline-flex items-center justify-center gap-1.5">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
                <button className="h-9 rounded-lg border border-border/60 text-xs font-semibold inline-flex items-center justify-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5" /> Download QR
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 mt-4 grid grid-cols-3 gap-2">
          <Stat label="Visits 7D" value="1,248" />
          <Stat label="Conv." value="6.4%" />
          <Stat label="Revenue" value="¥4.8k" />
        </div>

        {/* Quick channels */}
        <div className="px-5 mt-4">
          <p className="text-xs font-semibold mb-2">Share to · 分享到</p>
          <div className="grid grid-cols-4 gap-2">
            {["WeChat", "Weibo", "RED", "Email"].map((ch) => (
              <button key={ch} className="bg-card border border-border/50 rounded-xl py-3 text-[11px] font-medium">{ch}</button>
            ))}
          </div>
        </div>

        {/* Featured products */}
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-display font-semibold">Featured products · 主推商品</h3>
            <span className="text-xs text-primary font-semibold">Edit</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PRODUCTS.map((p) => (
              <div key={p.name} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                <div className="aspect-square bg-secondary">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] font-semibold leading-tight line-clamp-2 min-h-[28px]">{p.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs font-semibold tabular-nums">{p.price}</span>
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{p.commission}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 mt-5 mb-2">
          <button className="w-full h-11 rounded-xl border border-border/60 bg-card text-xs font-semibold inline-flex items-center justify-center gap-1.5">
            Open public storefront <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </main>

      <MobileTabBar active="Storefront" />
    </MobileFrame>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-base font-display font-bold tabular-nums mt-0.5">{value}</p>
    </div>
  );
}
