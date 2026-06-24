import "./_group.css";
import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, CalendarClock, CreditCard, MapPin, PackageOpen } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const SUBSCRIPTIONS = [
  { id: "SUB-001", product: "SomaDerm Transdermal Gel", freq: "Monthly / 月度", date: "Nov 02, 2023", amount: "¥1,224.00", pm: "Visa •••• 4242", city: "Shanghai", status: "Active", image: "/__mockup/images/somaderm.png" },
  { id: "SUB-002", product: "Revitalize Eye Cream", freq: "Monthly / 月度", date: "Nov 05, 2023", amount: "¥560.00", pm: "WeChat Pay", city: "Beijing", status: "Active", image: "/__mockup/images/revitalize-eye-cream.png" },
  { id: "SUB-003", product: "TRi-M*LT Liquid Shot", freq: "Bi-Monthly / 双月", date: "Dec 10, 2023", amount: "¥828.00", pm: "Alipay", city: "Shenzhen", status: "Paused", image: "/__mockup/images/tri-mlt.png" },
];

export function Subscriptions() {
  return (
    <AppLayout activeId="subscriptions">
      <div className="space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
          <div className="flex gap-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-display font-bold tracking-tight">Active Subscriptions</h1>
              <p className="text-muted-foreground text-sm">活跃订阅</p>
            </div>
            <div className="w-px bg-border/80 hidden sm:block"></div>
            <div className="flex gap-8">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Count</span>
                <span className="text-2xl font-bold font-display">142</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Est. MRR</span>
                <span className="text-2xl font-bold font-display text-primary">¥48,200</span>
              </div>
            </div>
          </div>
          <Button className="gap-2 shadow-sm rounded-xl bg-primary text-primary-foreground h-11 px-6">
            <Plus className="w-4 h-4" /> Add Subscription
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {SUBSCRIPTIONS.map((sub) => (
            <Card key={sub.id} className="shadow-sm border-border/50 rounded-2xl overflow-hidden bg-card hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-border/50 bg-secondary/20 flex gap-4 items-center">
                <div className="w-16 h-16 rounded-xl bg-white border border-border/50 flex items-center justify-center shadow-sm overflow-hidden p-1.5">
                  <img src={sub.image} alt={sub.product} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="bg-background text-[10px] uppercase font-bold tracking-wider mb-1">
                      {sub.freq}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuItem>Edit Products</DropdownMenuItem>
                        <DropdownMenuItem>Change Address</DropdownMenuItem>
                        <DropdownMenuItem>Change Payment</DropdownMenuItem>
                        <DropdownMenuItem>Skip Next</DropdownMenuItem>
                        {sub.status === "Active" ? (
                          <DropdownMenuItem className="text-amber-600">Pause Subscription</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-emerald-600">Resume Subscription</DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-semibold text-foreground truncate">{sub.product}</h3>
                  <p className="text-primary font-bold tabular-nums text-sm mt-0.5">{sub.amount}</p>
                </div>
              </div>

              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <Badge variant={sub.status === "Active" ? "default" : "secondary"} className={
                    sub.status === "Active" ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20" : ""
                  }>
                    {sub.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{sub.id}</span>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarClock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-20">Next ship:</span>
                    <span className="font-medium">{sub.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-20">Payment:</span>
                    <span className="font-medium">{sub.pm}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-20">Shipping:</span>
                    <span className="font-medium">{sub.city}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Empty State / Add New Card */}
          <Card className="border-2 border-dashed border-border/60 rounded-2xl bg-transparent hover:bg-secondary/30 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[300px] text-muted-foreground hover:text-foreground group">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PackageOpen className="w-6 h-6" />
            </div>
            <p className="font-semibold text-lg">New Subscription</p>
            <p className="text-sm mt-1 text-center px-6">Set up auto-ship for yourself or a customer.</p>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
