"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Package,
  FileText,
  Receipt,
  Settings,
  ChevronDown,
  X,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sidebarNav, type SidebarNavSection } from "@/lib/sidebar-nav";
import { useAuth } from "@/contexts/auth-context";

const sectionIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Dashboard: LayoutDashboard,
  Inventory: Package,
  Quotations: FileText,
  Invoices: Receipt,
  Settings: Settings,
};

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  className?: string;
  children?: React.ReactNode;
}

export function Sidebar({ open, setOpen, className, children }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col overflow-hidden border-r border-amp-footer-light bg-amp-footer px-3 py-3 text-amp-footer-text transition-transform duration-300 ease-in-out sm:w-[300px] sm:px-4 sm:py-4 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {children ? (
          children
        ) : (
          <>
            <div className="flex h-12 items-center justify-between shrink-0 sm:h-14">
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <Image
                  src="/assets/AMP-TILES-LOGO.png"
                  alt="AMP Tiles"
                  width={160}
                  height={54}
                  className="h-10 w-auto object-contain sm:h-12"
                  priority
                />
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                className="rounded-lg p-2 text-amp-footer-text transition-colors hover:bg-amp-footer-light active:scale-95 md:hidden"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="scrollbar-hide flex-1 overflow-y-auto py-3 sm:py-4">
              <ul className="space-y-0.5 sm:space-y-1">
                {sidebarNav.map((section) => (
                  <SidebarSection
                    key={section.label}
                    section={section}
                    pathname={pathname}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </ul>
            </nav>
            <div className="shrink-0 space-y-2.5 border-t border-amp-footer-light pt-3 sm:space-y-3 sm:pt-4">
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg bg-red-500/10 px-2.5 py-2 text-left text-sm font-bold text-red-500 transition-all hover:bg-red-500/15 hover:text-red-500 active:scale-[0.98] sm:gap-3 sm:px-3 sm:py-2.5"
                onClick={() => {
                  setOpen(false);
                  logout();
                  toast.success("Logged out successfully", {
                    description: "You have been signed out.",
                  });
                  router.push("/login");
                }}
              >
                <LogOut className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm">Logout</span>
              </button>
              <div className="flex items-center gap-2.5 rounded-lg bg-neutral-200 px-2.5 py-2.5 dark:bg-neutral-600 sm:gap-3 sm:px-3 sm:py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white sm:h-10 sm:w-10">
                  <User className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-neutral-900 dark:text-neutral-100 sm:text-sm">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="truncate text-[10px] font-normal text-neutral-600 dark:text-neutral-400 sm:text-xs">
                    {user?.email || "admin@amptiles.com.au"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/dashboard"
      className="relative z-20 flex items-center gap-2 py-1 text-sm font-normal text-amp-footer-text"
      onClick={onClick}
    >
      <Image
        src="/assets/AMP-TILES-LOGO.png"
        alt="AMP Tiles"
        width={160}
        height={54}
        className="h-12 w-auto object-contain"
      />
    </Link>
  );
}

export function LogoIcon({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/dashboard"
      className="relative z-20 flex items-center justify-center py-1 text-sm font-normal text-amp-footer-text"
      onClick={onClick}
    >
      <Image
        src="/assets/AMP-TILES-LOGO.png"
        alt="AMP Tiles"
        width={48}
        height={48}
        className="h-11 w-11 object-contain"
      />
    </Link>
  );
}

export function SidebarNavSections({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="scrollbar-hide mt-8 flex-1 overflow-y-auto">
      <ul className="space-y-1">
        {sidebarNav.map((section) => (
          <SidebarSection
            key={section.label}
            section={section}
            pathname={pathname}
            onNavigate={onNavigate ?? (() => {})}
          />
        ))}
      </ul>
    </nav>
  );
}

interface SidebarSectionProps {
  section: SidebarNavSection;
  pathname: string;
  onNavigate: () => void;
}

function SidebarSection({
  section,
  pathname,
  onNavigate,
}: SidebarSectionProps) {
  const [expanded, setExpanded] = React.useState(true);
  const Icon = sectionIcons[section.label];

  return (
    <li>
      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-amp-footer-text transition-all hover:bg-amp-footer-light hover:text-amp-primary active:scale-[0.98] sm:gap-3 sm:py-2.5"
        onClick={() => setExpanded((e) => !e)}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />}
        <span className="flex-1 text-xs sm:text-sm">{section.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200 sm:h-4 sm:w-4",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && (
        <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-amp-footer-light pl-2.5 sm:ml-4 sm:mt-1 sm:pl-3">
          {section.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-xs transition-all sm:py-2 sm:text-sm",
                    isActive
                      ? "bg-amp-primary/15 font-medium text-amp-primary"
                      : "text-amp-footer-text/90 hover:bg-amp-footer-light hover:text-amp-primary active:scale-[0.98]"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export function SidebarBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col", className)}>{children}</div>;
}

export function SidebarLink({
  link,
  className,
}: {
  link: { label: string; href: string; icon?: React.ReactNode };
  className?: string;
}) {
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center gap-3 px-2 py-2 text-sm text-amp-footer-text transition-colors hover:bg-amp-footer-light hover:text-amp-primary",
        className
      )}
    >
      {link.icon}
      <span>{link.label}</span>
    </Link>
  );
}
