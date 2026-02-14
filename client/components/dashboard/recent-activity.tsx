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
        // Get last 5 quotations
        setRecentQuotations(quotationsResponse.quotations.slice(0, 5));
      }
      
      if (invoicesResponse.success && invoicesResponse.invoices) {
        // Get last 5 invoices
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
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
            </div>
          ) : recentQuotations.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">No quotations yet</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentQuotations.map((quote, index) => (
                <Link key={quote._id} href={`/quotations/${quote._id}`}>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group flex items-center justify-between rounded-lg sm:rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-3 sm:p-4 transition-all hover:border-neutral-300 hover:bg-white hover:shadow-sm hover:cursor-pointer dark:border-neutral-700/60 dark:bg-neutral-900/50 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">{quote.quotationNumber}</span>
                        <span className="text-xs sm:text-sm font-semibold" style={{ color: "#3b82f6" }}>{formatCurrency(quote.grandTotal)}</span>
                      </div>
                      <div className="mt-0.5 sm:mt-1 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        <span className="truncate">{quote.customerName}</span>
                        <span className="text-[10px] sm:text-xs">•</span>
                        <span className="text-[10px] sm:text-xs whitespace-nowrap">{formatDate(quote.quotationDate)}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 shrink-0 ml-2" />
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
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
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
            </div>
          ) : recentInvoices.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentInvoices.map((invoice, index) => (
                <Link key={invoice._id} href={`/invoices/${invoice._id}`}>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group flex items-center justify-between rounded-lg sm:rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-3 sm:p-4 transition-all hover:border-neutral-300 hover:bg-white hover:shadow-sm hover:cursor-pointer dark:border-neutral-700/60 dark:bg-neutral-900/50 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">{invoice.invoiceNumber}</span>
                        <span className="text-xs sm:text-sm font-semibold" style={{ color: "#8b5cf6" }}>{formatCurrency(invoice.grandTotal)}</span>
                        <span className={`rounded-full px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold ${getStatusBadge(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </div>
                      <div className="mt-0.5 sm:mt-1 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        <span className="truncate">{invoice.customerName}</span>
                        <span className="text-[10px] sm:text-xs">•</span>
                        <span className="text-[10px] sm:text-xs whitespace-nowrap">{formatDate(invoice.invoiceDate)}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 shrink-0 ml-2" />
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
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
