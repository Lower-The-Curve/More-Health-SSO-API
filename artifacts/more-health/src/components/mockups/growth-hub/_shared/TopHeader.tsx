import React from "react";
import { Link } from "wouter";
import { Globe, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLang } from "@/lib/i18n";
import { useCurrentUser } from "@/lib/useCurrentUser";

export function TopHeader({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { lang, toggle } = useLang();
  const { initials, imageUrl } = useCurrentUser();
  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 md:px-8 gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onOpenMenu}
          className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 md:gap-6 shrink-0">
        <button
          onClick={toggle}
          aria-label="Toggle language"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">
            <span className={lang === "en" ? "text-foreground font-semibold" : ""}>EN</span>
            <span className="mx-1 text-muted-foreground/60">/</span>
            <span className={lang === "zh" ? "text-foreground font-semibold" : ""}>中</span>
          </span>
        </button>

        <div className="h-5 w-px bg-border hidden sm:block" />

        <Link href="/settings" className="block">
          <Avatar className="w-8 h-8 cursor-pointer border border-border hover:opacity-80 transition-opacity">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials.toUpperCase()}</AvatarFallback>
            {imageUrl ? <AvatarImage src={imageUrl} /> : null}
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
