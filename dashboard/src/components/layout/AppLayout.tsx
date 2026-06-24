import React from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

export function AppLayout({ children, activeId: _activeId }: { children: React.ReactNode; activeId?: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      <Sidebar />
      <div className="flex-1 ml-[248px] flex flex-col min-h-screen">
        <TopHeader />
        <main className="flex-1 p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
