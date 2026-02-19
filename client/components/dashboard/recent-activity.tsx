"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Receipt, ArrowRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

type Quotation = {
  _id: string;
  quotationNumber: string;
  customerName: string;
  quotationDate: string;
  grandTotal: number;
  status: string;
};

type Invoice = {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  grandTotal: number;
  status: string;
};

export function RecentActivity() {
  const [recentQuotations, setRecentQuotations] = useState<Quotation[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentData();
  }, []);

  const fetchRecentData = async () => {
    try {
      setIsLoading(true);
      const [quotationsResponse, invoicesResponse] = await Promise.all([
        api.getQuotations({ sortBy: 'createdAt', sortOrder: 'desc' }),
        api.getInvoices({ sortBy: 'createdAt', sortOrder: 'desc' }),
      ]);
      
      if (quotationsResponse.success && quotationsResponse.quotations) {
        setRecentQuotations(quotationsResponse.quotations.slice(0, 5));
      }
      
      if (invoicesResponse.success && invoicesResponse.invoices) {
        setRecentInvoices(invoicesResponse.invoices.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to fetch recent data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
      case "sent":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
      case "overdue":
        return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
      case "converted":
        return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="grid w-full min-w-0 gap-4 sm:gap-5 lg:grid-cols-2 lg:gap-6">
      {/* Recent Quotations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:rounded-2xl"
      >
        {/* Header */}
        <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-5 lg:p-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10" style={{ backgroundColor: "#3b82f615" }}>
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#3b82f6" }} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white sm:text-base">Recent Quotations</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">Last 5 entries</p>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="p-4 sm:p-5 lg:p-6">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
            </div>
          ) : recentQuotations.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">No quotations yet</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-2.5">
              {recentQuotations.map((quote, index) => (
                <Link key={quote._id} href={`/quotations/${quote._id}`}>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group flex min-w-0 items-center justify-between gap-2 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-3 transition-all hover:border-neutral-300 hover:bg-white hover:shadow-sm active:scale-[0.99] dark:border-neutral-700/60 dark:bg-neutral-900/50 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 sm:p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white sm:text-sm">{quote.quotationNumber}</span>
                        <span className="text-xs font-semibold sm:text-sm" style={{ color: "#3b82f6" }}>{formatCurrency(quote.grandTotal)}</span>
                      </div>
                      <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
                        <span className="truncate">{quote.customerName}</span>
                        <span className="text-[10px] shrink-0">•</span>
                        <span className="shrink-0 text-[10px] sm:text-xs">{formatDate(quote.quotationDate)}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200/60 p-3 dark:border-neutral-700/60 sm:p-4">
          <Link
            href="/quotations"
            className="group flex items-center justify-center gap-2 text-xs font-semibold transition-all hover:gap-3 sm:text-sm" 
            style={{ color: "#3b82f6" }}
          >
            View all quotations
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" />
          </Link>
        </div>
      </motion.div>

      {/* Recent Invoices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:rounded-2xl"
      >
        {/* Header */}
        <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-5 lg:p-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10" style={{ backgroundColor: "#8b5cf615" }}>
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#8b5cf6" }} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white sm:text-base">Recent Invoices</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">Last 5 entries</p>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="p-4 sm:p-5 lg:p-6">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
            </div>
          ) : recentInvoices.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-2.5">
              {recentInvoices.map((invoice, index) => (
                <Link key={invoice._id} href={`/invoices/${invoice._id}`}>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group flex min-w-0 items-center justify-between gap-2 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-3 transition-all hover:border-neutral-300 hover:bg-white hover:shadow-sm active:scale-[0.99] dark:border-neutral-700/60 dark:bg-neutral-900/50 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 sm:p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white sm:text-sm">{invoice.invoiceNumber}</span>
                        <span className="text-xs font-semibold sm:text-sm" style={{ color: "#8b5cf6" }}>{formatCurrency(invoice.grandTotal)}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${getStatusBadge(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </div>
                      <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
                        <span className="truncate">{invoice.customerName}</span>
                        <span className="text-[10px] shrink-0">•</span>
                        <span className="shrink-0 text-[10px] sm:text-xs">{formatDate(invoice.invoiceDate)}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200/60 p-3 dark:border-neutral-700/60 sm:p-4">
          <Link
            href="/invoices"
            className="group flex items-center justify-center gap-2 text-xs font-semibold transition-all hover:gap-3 sm:text-sm"
            style={{ color: "#8b5cf6" }}
          >
            View all invoices
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
