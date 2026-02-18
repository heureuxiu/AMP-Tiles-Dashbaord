"use client";

import { motion } from "framer-motion";
import { FileText, Receipt, Package, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: "Add Product",
      description: "Create new product",
      icon: Package,
      color: "#c7a864",
      action: () => router.push("/inventory/products"),
    },
    {
      title: "New Quotation",
      description: "Create quote",
      icon: FileText,
      color: "#3b82f6",
      action: () => router.push("/quotations/create"),
    },
    {
      title: "New Invoice",
      description: "Generate invoice",
      icon: Receipt,
      color: "#8b5cf6",
      action: () => router.push("/invoices/create"),
    },
    {
      title: "Update Stock",
      description: "Manage inventory",
      icon: RefreshCw,
      color: "#10b981",
      action: () => router.push("/inventory/stock"),
    },
  ];

  return (
    <div className="w-full rounded-xl border border-neutral-200/60 bg-white p-4 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 sm:p-5 lg:rounded-2xl lg:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-5 lg:mb-6">
        <h2 className="text-base font-bold text-neutral-900 dark:text-white sm:text-lg lg:text-xl">Quick Actions</h2>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 sm:mt-1 sm:text-sm">
          Common tasks for quick access
        </p>
      </div>

      {/* Actions Grid */}
      <div className="grid gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.action}
              className="group relative rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-3 text-left transition-all hover:border-neutral-300 hover:bg-white hover:shadow-sm active:scale-95 dark:border-neutral-700/60 dark:bg-neutral-900/50 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 sm:p-4 lg:p-5"
            >
              <div className="space-y-2 sm:space-y-3">
                {/* Icon */}
                <div 
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 sm:h-11 sm:w-11 lg:h-12 lg:w-12"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <Icon className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6" style={{ color: action.color }} strokeWidth={2} />
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white sm:text-sm lg:text-base">{action.title}</h3>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 sm:text-xs lg:text-sm">{action.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

