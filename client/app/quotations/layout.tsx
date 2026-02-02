"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export default function QuotationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background font-sans">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex flex-1 flex-col md:pl-[300px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-neutral-200/60 bg-white/80 px-6 backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-900/80">
          <button
            type="button"
            aria-label="Open sidebar"
            className={cn(
              "rounded-lg p-2 text-foreground transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 md:hidden",
              sidebarOpen && "hidden"
            )}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
            AMP Tiles Admin
          </span>
        </header>

        <main className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-900">
          {children}
        </main>
      </div>
    </div>
  );
}
