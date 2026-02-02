"use client";

import { motion } from "framer-motion";
import { Plus, FileText, Receipt, Package, RefreshCw } from "lucide-react";
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
    <div className="rounded-xl border border-neutral-200/60 bg-white p-4 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 sm:rounded-2xl sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white sm:text-lg">Quick Actions</h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 sm:mt-1 sm:text-sm">
            Common tasks for quick access
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#c7a864] to-[#c7a864]/80 sm:h-10 sm:w-10 sm:rounded-xl">
          <Plus className="h-4 w-4 text-white sm:h-5 sm:w-5" strokeWidth={2.5} />
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
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
              className="group relative rounded-lg border border-neutral-200/60 bg-neutral-50/50 p-4 text-left transition-all hover:border-neutral-300 hover:bg-white hover:shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/50 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 sm:rounded-xl sm:p-5"
            >
              <div className="space-y-3 sm:space-y-4">
                {/* Icon */}
                <div 
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110 sm:h-12 sm:w-12 sm:rounded-xl"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: action.color }} strokeWidth={2} />
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white sm:text-base">{action.title}</h3>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 sm:mt-1 sm:text-sm">{action.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

