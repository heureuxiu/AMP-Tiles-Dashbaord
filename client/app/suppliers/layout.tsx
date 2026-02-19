"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export default function SuppliersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-dvh w-full max-w-[100vw] overflow-x-hidden bg-background font-sans">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex min-h-dvh w-full min-w-0 flex-col transition-all duration-300 pl-0 md:pl-[280px] lg:pl-[300px]">
        <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center gap-2 border-b border-neutral-200/60 bg-white/95 px-3 backdrop-blur-md dark:border-neutral-700/60 dark:bg-neutral-900/95 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Open menu"
            className={cn(
              "flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl text-neutral-700 transition-all hover:bg-neutral-100 active:scale-95 dark:text-neutral-200 dark:hover:bg-neutral-800 md:hidden",
              sidebarOpen && "pointer-events-none invisible"
            )}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-neutral-900 dark:text-white sm:text-base lg:text-lg">
              AMP Tiles Admin
            </span>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50 dark:bg-neutral-900">
          {children}
        </main>
      </div>
    </div>
  );
}
