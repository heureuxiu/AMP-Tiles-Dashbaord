"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background font-sans">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex flex-1 flex-col md:pl-[300px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border border-neutral-200 border-b border-l-0 bg-white px-4 md:px-6 dark:border-neutral-700 dark:bg-neutral-900">
          <button
            type="button"
            aria-label="Open sidebar"
            className={cn(
              "rounded-none p-2 text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 md:hidden",
              sidebarOpen && "hidden"
            )}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-foreground/80">
            AMP Tiles Admin
          </span>
        </header>

        <main className="flex-1 overflow-auto border border-neutral-200 border-t-0 border-l-0 bg-white p-4 md:p-6 dark:border-neutral-700 dark:bg-neutral-900">
          {children}
        </main>
      </div>
    </div>
  );
}
