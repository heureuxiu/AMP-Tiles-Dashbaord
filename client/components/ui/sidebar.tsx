"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FileText,
  Receipt,
  Settings,
  ChevronDown,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sidebarNav, type SidebarNavSection } from "@/lib/sidebar-nav";

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
          "fixed left-0 top-0 z-50 flex h-screen w-[300px] flex-col overflow-hidden border-r border-amp-footer-light bg-amp-footer px-4 py-4 text-amp-footer-text transition-transform duration-200 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {children ? (
          children
        ) : (
          <>
            <div className="flex h-14 items-center justify-between shrink-0">
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
                  className="h-12 w-auto object-contain"
                />
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                className="rounded-none p-2 text-amp-footer-text hover:bg-amp-footer-light md:hidden"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="scrollbar-hide flex-1 overflow-y-auto py-4">
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
            <div className="shrink-0 space-y-1 border-t border-amp-footer-light pt-4">
              <div className="flex items-center gap-3 px-2 py-2 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-amp-primary/20 ring-2 ring-amp-footer-light">
                  <span className="text-sm font-medium text-amp-primary">A</span>
                </div>
                <span className="truncate font-medium text-amp-footer-text">
                  Admin
                </span>
              </div>
              <Link
                href="/login"
                className="flex items-center gap-3 px-2 py-2 text-sm text-amp-footer-text/80 transition-colors hover:bg-amp-footer-light hover:text-amp-primary"
                onClick={() => setOpen(false)}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Logout
              </Link>
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
        className="flex w-full items-center gap-3 px-2 py-2.5 text-left text-sm font-medium text-amp-footer-text transition-colors hover:translate-x-0.5 hover:bg-amp-footer-light hover:text-amp-primary"
        onClick={() => setExpanded((e) => !e)}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        <span className="flex-1">{section.label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && (
        <ul className="ml-4 mt-1 space-y-0.5 border-l border-amp-footer-light pl-3">
          {section.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "block px-2 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-amp-primary/15 font-medium text-amp-primary"
                      : "text-amp-footer-text/90 hover:bg-amp-footer-light hover:text-amp-primary"
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
