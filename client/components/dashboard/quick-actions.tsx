"use client";

import { motion } from "framer-motion";
import { Plus, FileText, Receipt, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const actions = [
  {
    title: "Add Product",
    description: "Create new product",
    icon: Package,
    color: "#c7a864",
    action: () => toast.success("Opening Add Product form..."),
  },
  {
    title: "New Quotation",
    description: "Create quote",
    icon: FileText,
    color: "#3b82f6",
    action: () => toast.success("Opening Create Quotation form..."),
  },
  {
    title: "New Invoice",
    description: "Generate invoice",
    icon: Receipt,
    color: "#8b5cf6",
    action: () => toast.success("Opening Create Invoice form..."),
  },
  {
    title: "Update Stock",
    description: "Manage inventory",
    icon: RefreshCw,
    color: "#10b981",
    action: () => toast.success("Opening Update Stock form..."),
  },
];

export function QuickActions() {
  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Quick Actions</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Common tasks for quick access
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#c7a864] to-[#c7a864]/80">
          <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              className="group relative rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-5 text-left transition-all hover:border-neutral-300 hover:bg-white hover:shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/50 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
            >
              <div className="space-y-4">
                {/* Icon */}
                <div 
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: action.color }} strokeWidth={2} />
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">{action.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{action.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
