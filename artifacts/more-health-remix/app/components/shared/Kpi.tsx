import React from "react";
import { Card, CardContent } from "~/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export function Kpi({
  label,
  value,
  delta,
  trend = "up",
  sparkline,
  compare = "vs. previous 7 days"
}: {
  label: string,
  value: string,
  delta?: string,
  trend?: "up" | "down",
  sparkline?: React.ReactNode,
  compare?: string
}) {
  return (
    <Card className="shadow-sm border-border/50 bg-card overflow-hidden hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-5 flex flex-col justify-between h-full relative">
        <div className="flex flex-col gap-1 z-10">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <span className="text-2xl font-bold display-num tabular-nums tracking-tight">{value}</span>
        </div>

        <div className="flex items-center gap-2 mt-4 z-10 flex-wrap">
          {delta && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${
              trend === "up" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
            }`}>
              {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {delta}
            </div>
          )}
          {compare && (
            <span className="text-[11px] text-muted-foreground leading-none">{compare}</span>
          )}
        </div>

        {sparkline && (
          <div className="absolute bottom-0 right-0 w-24 h-12 opacity-40 group-hover:opacity-90 transition-opacity pointer-events-none">
            {sparkline}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
