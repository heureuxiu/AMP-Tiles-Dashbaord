"use client";

import { motion } from "framer-motion";
import { FileText, Receipt, ArrowRight } from "lucide-react";
import Link from "next/link";

const recentQuotations = [
  { id: "QT-2024-001", customer: "John Smith", date: "Jan 28", amount: "$2,450" },
  { id: "QT-2024-002", customer: "Sarah Johnson", date: "Jan 27", amount: "$3,200" },
  { id: "QT-2024-003", customer: "Mike Wilson", date: "Jan 26", amount: "$1,800" },
  { id: "QT-2024-004", customer: "Emma Davis", date: "Jan 25", amount: "$4,100" },
  { id: "QT-2024-005", customer: "David Brown", date: "Jan 24", amount: "$2,950" },
];

const recentInvoices = [
  { id: "INV-2024-001", customer: "Alice Cooper", date: "Jan 28", amount: "$5,600", status: "Paid" },
  { id: "INV-2024-002", customer: "Bob Martin", date: "Jan 27", amount: "$3,400", status: "Pending" },
  { id: "INV-2024-003", customer: "Carol White", date: "Jan 26", amount: "$2,800", status: "Paid" },
  { id: "INV-2024-004", customer: "Daniel Lee", date: "Jan 25", amount: "$4,200", status: "Paid" },
  { id: "INV-2024-005", customer: "Eva Green", date: "Jan 24", amount: "$1,900", status: "Pending" },
];

export function RecentActivity() {
  return (
    <div className="grid w-full max-w-full gap-4 sm:gap-6 lg:grid-cols-2">
      {/* Recent Quotations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-full rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 sm:rounded-2xl"
      >
        {/* Header */}
        <div className="border-b border-neutral-200/60 p-4 sm:p-6 dark:border-neutral-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl" style={{ backgroundColor: "#3b82f615" }}>
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#3b82f6" }} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">Recent Quotations</h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Last 5 entries</p>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="p-4 sm:p-6">
          <div className="space-y-2 sm:space-y-3">
            {recentQuotations.map((quote, index) => (
              <Link key={quote.id} href={`/quotations/${quote.id}`}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group flex items-center justify-between rounded-lg sm:rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-3 sm:p-4 transition-all hover:border-neutral-300 hover:bg-white hover:shadow-sm hover:cursor-pointer dark:border-neutral-700/60 dark:bg-neutral-900/50 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">{quote.id}</span>
                      <span className="text-xs sm:text-sm font-semibold" style={{ color: "#3b82f6" }}>{quote.amount}</span>
                    </div>
                    <div className="mt-0.5 sm:mt-1 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                      <span className="truncate">{quote.customer}</span>
                      <span className="text-[10px] sm:text-xs">•</span>
                      <span className="text-[10px] sm:text-xs whitespace-nowrap">{quote.date}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 shrink-0 ml-2" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200/60 p-3 sm:p-4 dark:border-neutral-700/60">
          <Link
            href="/quotations"
            className="group flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all hover:gap-3" 
            style={{ color: "#3b82f6" }}
          >
            View all quotations
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>

      {/* Recent Invoices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl sm:rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
      >
        {/* Header */}
        <div className="border-b border-neutral-200/60 p-4 sm:p-6 dark:border-neutral-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl" style={{ backgroundColor: "#8b5cf615" }}>
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#8b5cf6" }} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">Recent Invoices</h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Last 5 entries</p>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="p-4 sm:p-6">
          <div className="space-y-2 sm:space-y-3">
            {recentInvoices.map((invoice, index) => (
              <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group flex items-center justify-between rounded-lg sm:rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-3 sm:p-4 transition-all hover:border-neutral-300 hover:bg-white hover:shadow-sm hover:cursor-pointer dark:border-neutral-700/60 dark:bg-neutral-900/50 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">{invoice.id}</span>
                      <span className="text-xs sm:text-sm font-semibold" style={{ color: "#8b5cf6" }}>{invoice.amount}</span>
                      <span className={`rounded-full px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold ${
                        invoice.status === "Paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="mt-0.5 sm:mt-1 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                      <span className="truncate">{invoice.customer}</span>
                      <span className="text-[10px] sm:text-xs">•</span>
                      <span className="text-[10px] sm:text-xs whitespace-nowrap">{invoice.date}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 shrink-0 ml-2" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200/60 p-3 sm:p-4 dark:border-neutral-700/60">
          <Link
            href="/invoices"
            className="group flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all hover:gap-3"
            style={{ color: "#8b5cf6" }}
          >
            View all invoices
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
