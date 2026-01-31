import type { LucideIcon } from "lucide-react";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
};

export type SidebarNavSection = {
  label: string;
  icon?: LucideIcon;
  items: SidebarNavItem[];
};

export const sidebarNav: SidebarNavSection[] = [
  {
    label: "Dashboard",
    items: [{ label: "Overview", href: "/dashboard" }],
  },
  {
    label: "Inventory",
    items: [
      { label: "Products (List / Add / Edit)", href: "/inventory/products" },
      { label: "Stock Update (Stock In / Stock Out)", href: "/inventory/stock" },
    ],
  },
  {
    label: "Quotations",
    items: [
      { label: "All Quotations", href: "/quotations" },
      { label: "Create Quotation", href: "/quotations/create" },
    ],
  },
  {
    label: "Invoices",
    items: [
      { label: "All Invoices", href: "/invoices" },
      { label: "Invoice Detail / PDF", href: "/invoices/detail" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Company Profile", href: "/settings/profile" },
      { label: "Admin Account", href: "/settings/admin" },
    ],
  },
];
