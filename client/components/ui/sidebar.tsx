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
  Users,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sidebarNav, type SidebarNavSection } from "@/lib/sidebar-nav";
import { useAuth } from "@/contexts/auth-context";

const sectionIcons: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  Dashboard: LayoutDashboard,
  Inventory: Package,
  Quotations: FileText,
  Invoices: Receipt,
  Suppliers: Users,
  "Purchase Orders": ShoppingCart,
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

  // Close sidebar on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, setOpen]);

  // Prevent body scroll when sidebar is open on mobile
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - on mobile: max 85vw with safe-area; on md+: full width */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full max-h-dvh w-[min(280px,85vw)] max-w-[280px] flex-col overflow-hidden border-r border-amp-footer-light bg-amp-footer shadow-2xl transition-transform duration-300 ease-in-out pl-[env(safe-area-inset-left)] md:translate-x-0 md:w-[280px] md:max-w-none md:shadow-none lg:w-[300px]",
          open ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {children ? (
          children
        ) : (
          <>
            {/* Header - touch-friendly height on mobile */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-amp-footer-light px-3 sm:h-16 sm:px-4 lg:h-18 lg:px-5">
              <Link
                href="/dashboard"
                className="flex items-center"
                onClick={() => setOpen(false)}
              >
                <Image
                  src="/assets/AMP-TILES-LOGO.png"
                  alt="AMP Tiles"
                  width={160}
                  height={54}
                  className="h-11 w-auto object-contain lg:h-12"
                  priority
                />
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl text-amp-footer-text transition-all hover:bg-amp-footer-light active:scale-95 md:hidden"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              </button>
            </div>

            {/* Navigation - overflow for small screens */}
            <nav className="scrollbar-thin scrollbar-thumb-amp-footer-light scrollbar-track-transparent flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4 lg:px-4 lg:py-5">
              <ul className="space-y-1">
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

            {/* Footer - touch-friendly padding */}
            <div className="shrink-0 space-y-3 border-t border-amp-footer-light px-3 py-4 sm:px-4 lg:px-4 lg:py-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {/* Logout Button */}
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl bg-red-500/10 px-3 py-2.5 text-left font-bold text-red-500 transition-all hover:bg-red-500/20 active:scale-[0.98] lg:px-4 lg:py-3"
                onClick={() => {
                  setOpen(false);
                  logout();
                  toast.success("Logged out successfully", {
                    description: "You have been signed out.",
                  });
                  router.push("/login");
                }}
              >
                <LogOut className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                <span className="text-sm lg:text-base">Logout</span>
              </button>

              {/* User Info */}
              <div className="flex items-center gap-3 rounded-xl bg-neutral-200/80 px-3 py-3 dark:bg-neutral-600/80 lg:px-4 lg:py-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white lg:h-11 lg:w-11">
                  <User className="h-5 w-5 shrink-0 lg:h-6 lg:w-6" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-100 lg:text-base">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="truncate text-xs font-normal text-neutral-600 dark:text-neutral-400 lg:text-sm">
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
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold text-amp-footer-text transition-all hover:bg-amp-footer-light hover:text-amp-primary active:scale-[0.98] lg:px-4 lg:py-3"
        onClick={() => setExpanded((e) => !e)}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />}
        <span className="flex-1 text-sm lg:text-base">{section.label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            expanded && "rotate-180"
          )}
          strokeWidth={2.5}
          
        />
      </button>
      {expanded && (
        <ul className="ml-4 mt-1 space-y-0.5 border-l-2 border-amp-footer-light pl-3 lg:ml-5 lg:pl-4">
          {section.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm transition-all lg:px-4 lg:py-2.5 lg:text-base",
                    isActive
                      ? "bg-amp-primary/20 font-semibold text-amp-primary shadow-sm"
                      : "font-medium text-amp-footer-text/90 hover:bg-amp-footer-light hover:text-amp-primary active:scale-[0.98]"
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
