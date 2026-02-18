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
    <div className="relative flex min-h-screen w-full bg-neutral-50 font-sans dark:bg-neutral-900">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex min-h-screen w-full flex-col transition-all duration-300 pl-0 md:pl-[280px] lg:pl-[300px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center gap-3 border-b border-neutral-200/60 bg-white/95 px-4 backdrop-blur-md dark:border-neutral-700/60 dark:bg-neutral-900/95 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label="Toggle sidebar"
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-neutral-700 transition-all hover:bg-neutral-100 active:scale-95 dark:text-neutral-200 dark:hover:bg-neutral-800 md:hidden",
              sidebarOpen && "hidden"
            )}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
          </button>

          {/* Header Title */}
          <div className="flex flex-1 items-center justify-between">
            <span className="text-sm font-bold text-neutral-900 dark:text-white sm:text-base lg:text-lg">
              AMP Tiles Admin
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="w-full flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
