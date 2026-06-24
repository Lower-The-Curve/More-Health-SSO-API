import React from "react";
import { useRouteLoaderData } from "react-router";
import { useTranslation } from "react-i18next";
import { Search, Globe, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { loader as rootLoader } from "~/root";

export function TopHeader() {
  const { t } = useTranslation("common");
  const user = useRouteLoaderData<typeof rootLoader>("root");

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
      <div className="w-96 relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t("header.searchPlaceholder")}
          className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border/50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Globe className="w-4 h-4" />
          <span>{t("header.languageToggle")}</span>
        </button>

        <button className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full border-2 border-card" />
        </button>

        <div className="h-5 w-px bg-border mx-2" />

        <Avatar className="w-8 h-8 cursor-pointer border border-border hover:opacity-80 transition-opacity">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">{user?.initials}</AvatarFallback>
          <AvatarImage src={user?.avatarUrl} />
        </Avatar>
      </div>
    </header>
  );
}
