import "./_group.css";
import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { AppLayout } from "./_shared/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Kpi } from "./_shared/Kpi";
import { Copy, ExternalLink, QrCode, Share2, Download, MessageCircle, ShoppingCart } from "lucide-react";

export function Storefront() {
  return (
    <AppLayout activeId="storefront">
      <div className="space-y-6 max-w-5xl mx-auto">
        
        <div className="flex items-end justify-between mb-2">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">My Personal Website</h1>
            <p className="text-muted-foreground text-sm">我的个人店铺</p>
          </div>
          <div className="inline-flex items-center gap-2 bg-secondary border border-border/60 px-3 py-1.5 rounded-full text-xs font-medium text-foreground">
            <span>Apr 11 – Apr 17, 2026</span>
            <span className="text-muted-foreground">vs. Apr 4 – Apr 10</span>
          </div>
        </div>

        {/* HERO PREVIEW CARD */}
        <Card className="shadow-md border-border/50 rounded-3xl overflow-hidden bg-card">
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
              <Badge className="w-fit mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-transparent shadow-none">Live Storefront</Badge>
              <h2 className="text-3xl font-display font-bold mb-2 text-foreground">morehealth.com/brady</h2>
              <p className="text-muted-foreground mb-8 text-lg">Share this link to earn commission on all purchases made through your store.</p>
              
              <div className="flex flex-wrap gap-3">
                <Button className="rounded-xl h-12 px-6 gap-2 text-base shadow-sm">
                  <Copy className="w-4 h-4" /> Copy Link
                </Button>
                <Button variant="outline" className="rounded-xl h-12 px-6 gap-2 text-base shadow-sm bg-background border-border/80">
                  <ExternalLink className="w-4 h-4" /> Open Store
                </Button>
              </div>
            </div>
            <div className="bg-secondary/50 border-l border-border/50 p-8 md:p-10 flex flex-col items-center justify-center min-w-[300px]">
              <div className="w-52 h-52 bg-white rounded-2xl p-4 shadow-sm border border-border flex items-center justify-center">
                <QRCodeSVG
                  value="https://morehealth.com/brady"
                  size={184}
                  bgColor="#ffffff"
                  fgColor="#0B271F"
                  level="H"
                  marginSize={0}
                  imageSettings={{
                    src: "/__mockup/images/more-health-logo.png",
                    height: 44,
                    width: 44,
                    excavate: true,
                  }}
                />
              </div>
              <Button variant="ghost" className="mt-4 gap-2 text-muted-foreground hover:text-foreground">
                <Download className="w-4 h-4" /> Download QR Code
              </Button>
            </div>
          </div>
        </Card>

        {/* KPIS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Store Visits" value="1,248" delta="+24%" compare="vs. Apr 4 – Apr 10" />
          <Kpi label="Conversion Rate" value="4.2%" delta="+0.8%" compare="vs. Apr 4 – Apr 10" />
          <Kpi label="Store Revenue" value="¥28,400" delta="+12%" compare="vs. Apr 4 – Apr 10" />
          <Kpi label="Direct Commissions" value="¥5,680" delta="+12%" compare="vs. Apr 4 – Apr 10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* BEST SELLERS */}
          <Card className="lg:col-span-2 shadow-sm border-border/50 rounded-2xl bg-card">
            <div className="p-6 border-b border-border/50 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Best Products Sold</h3>
              <Button variant="ghost" size="sm" className="text-primary">View All</Button>
            </div>
            <div className="p-0">
              {[
                { name: "SomaDerm Transdermal Gel", units: 42, rev: "¥51,408", thumb: "/__mockup/images/somaderm.png" },
                { name: "Rose & Cole Luxe Set", units: 15, rev: "¥50,760", thumb: "/__mockup/images/rose-cole-luxe.png" },
                { name: "TRi-M*LT Liquid Shot", units: 22, rev: "¥18,216", thumb: "/__mockup/images/tri-mlt.png" },
                { name: "Revitalize Eye Cream", units: 28, rev: "¥15,680", thumb: "/__mockup/images/revitalize-eye-cream.png" },
              ].map((product, i) => (
                <div key={i} className="flex items-center justify-between p-4 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border border-border/50 shadow-sm overflow-hidden p-1">
                      <img src={product.thumb} alt={product.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.units} units sold</p>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums text-foreground">{product.rev}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* SHARE PANEL */}
          <Card className="shadow-sm border-border/50 rounded-2xl bg-card h-fit">
            <div className="p-6 border-b border-border/50">
              <h3 className="font-semibold text-lg">Quick Share</h3>
              <p className="text-sm text-muted-foreground mt-1">Share directly to social platforms</p>
            </div>
            <CardContent className="p-6 space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 bg-emerald-50/50">
                <MessageCircle className="w-5 h-5" /> WeChat / 微信
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-red-50/50">
                <ShoppingBag className="w-5 h-5" /> Xiaohongshu / 小红书
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl text-zinc-800 border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 bg-zinc-50">
                <ShoppingCart className="w-5 h-5" /> Douyin / 抖音
              </Button>
              <div className="pt-4 mt-4 border-t border-border/50 flex gap-2">
                <Button variant="secondary" className="flex-1 rounded-xl h-10 gap-2">
                  <Copy className="w-4 h-4" /> Link
                </Button>
                <Button variant="secondary" className="flex-1 rounded-xl h-10 gap-2">
                  <QrCode className="w-4 h-4" /> QR
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}

// Simple fallback icon for ShoppingBag since we only imported ShoppingCart in the main import above
function ShoppingBag(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
}

function Badge({ className, children, ...props }: any) {
  return <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`} {...props}>{children}</span>
}
