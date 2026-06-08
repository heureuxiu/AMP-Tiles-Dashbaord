"use client";

import type { ComponentType, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  FileText,
  Package,
  Receipt,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

type Customer = {
  _id: string;
  customerNumber?: string;
  name: string;
  phone?: string;
  email?: string;
  abn?: string;
};

type StatementInvoice = {
  _id: string;
  invoiceNumber: string;
  date: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  gst: number;
  delivery: number;
  discount: number;
  total: number;
  paid: number;
  outstanding: number;
};

type StatementQuotation = {
  _id: string;
  quotationNumber: string;
  date: string;
  status: string;
  subtotal: number;
  gst: number;
  delivery: number;
  discount: number;
  total: number;
};

type ProductSummary = {
  productId?: string;
  productName: string;
  size?: string;
  unitType?: string;
  quantity: number;
  boxes: number;
  coverageSqm: number;
  coverageSqft: number;
  unitPrice: number;
  total: number;
};

type MonthlyStatement = {
  customer: {
    _id: string;
    customerNumber?: string;
    name: string;
    phone?: string;
    email?: string;
    abn?: string;
    address?: string;
  };
  month: string;
  monthLabel: string;
  transactionCount: number;
  totalInvoiceCount: number;
  totalQuotationCount: number;
  invoices: StatementInvoice[];
  quotations: StatementQuotation[];
  productSummary: ProductSummary[];
  totals: {
    subtotalBeforeGst: number;
    gstTotal: number;
    deliveryTotal: number;
    discountTotal: number;
    grandTotal: number;
    paidTotal: number;
    outstandingTotal: number;
  };
};

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value) || 0);
}

function formatDate(value: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatQuantity(value: number) {
  const rounded = Math.round((Number(value) || 0) * 1000) / 1000;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(3).replace(/\.?0+$/, "");
}

function normalizeStatus(value?: string) {
  return String(value || "N/A").replace(/_/g, " ");
}

export default function MonthlyStatementsPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.customerId as string;
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [month, setMonth] = useState(getCurrentMonth());
  const [statement, setStatement] = useState<MonthlyStatement | null>(null);
  const [isCustomerLoading, setIsCustomerLoading] = useState(true);
  const [isStatementLoading, setIsStatementLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [statementError, setStatementError] = useState("");
  const [activeView, setActiveView] = useState<"invoices" | "products" | "quotations">("invoices");

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        setIsCustomerLoading(true);
        const response = await api.getCustomer(customerId);
        if (response.success && response.customer) {
          setSelectedCustomer(response.customer as Customer);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load customer";
        toast.error("Failed to load customer", { description: errorMessage });
        router.push("/records/monthly-statements");
      } finally {
        setIsCustomerLoading(false);
      }
    };

    loadCustomer();
  }, [customerId, router]);

  const fetchStatement = useCallback(async () => {
    if (!customerId || !month) {
      setStatement(null);
      return;
    }

    try {
      setIsStatementLoading(true);
      setStatementError("");
      const response = await api.getCustomerMonthlyStatement(customerId, month);

      if (response.success && response.monthlyStatement) {
        setStatement(response.monthlyStatement as MonthlyStatement);
        router.replace(`/records/monthly-statements/${customerId}`, { scroll: false });
      } else {
        setStatement(null);
        setStatementError("Failed to load monthly statement");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load monthly statement";
      setStatement(null);
      setStatementError(errorMessage);
      toast.error("Failed to load monthly statement", { description: errorMessage });
    } finally {
      setIsStatementLoading(false);
    }
  }, [customerId, month, router]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const handleDownloadPdf = async () => {
    if (!customerId) return;

    try {
      setIsDownloadingPdf(true);
      const blob = await api.getCustomerMonthlyStatementPdfBlob(customerId, month);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `monthly-statement-${selectedCustomer?.name || "customer"}-${month}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Monthly statement PDF downloaded");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to download monthly statement PDF";
      toast.error("Failed to download PDF", { description: errorMessage });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const totals = statement?.totals;
  const hasTransactions = Boolean(statement && statement.transactionCount > 0);
  const activeRowsCount =
    activeView === "invoices"
      ? statement?.invoices.length || 0
      : activeView === "products"
        ? statement?.productSummary.length || 0
        : statement?.quotations.length || 0;

  return (
    <div className="min-w-0 space-y-5 p-3 sm:p-6 lg:p-8">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/records/monthly-statements")}
              className="h-8 w-8 rounded-lg p-0 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              title="Back to Customers"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">CUSTOMER RECORDS</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            Monthly Statement
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Comprehensive view of invoices, quotations, products, and payment summary
          </p>
        </div>
        <Button
          onClick={handleDownloadPdf}
          disabled={!statement || isStatementLoading || isDownloadingPdf}
          className="shrink-0 gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
        >
          <Download className="h-4 w-4" />
          {isDownloadingPdf ? "Downloading..." : "Download PDF"}
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-5"
      >
        <div className="rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
                style={{ backgroundColor: "#8b5cf615" }}
              >
                <UserRound className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: "#8b5cf6" }} strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-white sm:text-lg">
                  {isCustomerLoading ? "Loading customer..." : selectedCustomer?.name || "Customer"}
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                  {[selectedCustomer?.customerNumber, selectedCustomer?.phone, selectedCustomer?.email, selectedCustomer?.abn ? `ABN ${selectedCustomer.abn}` : ""]
                    .filter(Boolean)
                    .join(" • ") || "Customer details"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
              <div className="space-y-2">
                <Label htmlFor="statementMonth" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Select Month</Label>
                <Input
                  id="statementMonth"
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  className="rounded-lg border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={fetchStatement}
                disabled={isCustomerLoading || isStatementLoading}
                className="rounded-lg"
              >
                {isStatementLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {isCustomerLoading || isStatementLoading ? (
            <div className="flex h-56 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading monthly records...</p>
              </div>
            </div>
          ) : statementError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {statementError}
            </div>
          ) : !statement ? (
            <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
              <FileText className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Select a customer and month to view records.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-3">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:col-span-2"
                >
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">Statement Period</p>
                      <h2 className="mt-2 text-xl font-bold text-neutral-900 dark:text-white sm:text-2xl">
                        {statement.monthLabel}
                      </h2>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        {statement.customer.name} • {statement.customer.customerNumber || "Customer"}
                      </p>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Transactions</p>
                        <p className="mt-1.5 text-2xl font-bold text-neutral-900 dark:text-white">{statement.transactionCount}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Invoices</p>
                        <p className="mt-1.5 text-2xl font-bold text-neutral-900 dark:text-white">{statement.totalInvoiceCount}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Quotations</p>
                        <p className="mt-1.5 text-2xl font-bold text-neutral-900 dark:text-white">{statement.totalQuotationCount}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  className="rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
                >
                  <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">Financial Summary</p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Grand Total</p>
                      <p className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
                        {formatCurrency(totals?.grandTotal || 0)}
                      </p>
                    </div>
                    <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">Amount Paid</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(totals?.paidTotal || 0)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">Outstanding</span>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(totals?.outstandingTotal || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {!hasTransactions && (
                <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
                  <FileText className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
                  <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    No transactions found for this month.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400\">View</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <ViewButton
                      active={activeView === "invoices"}
                      icon={Receipt}
                      label="Invoices"
                      value={statement.totalInvoiceCount}
                      onClick={() => setActiveView("invoices")}
                    />
                    <ViewButton
                      active={activeView === "products"}
                      icon={Package}
                      label="Products"
                      value={statement.productSummary.length}
                      onClick={() => setActiveView("products")}
                    />
                    <ViewButton
                      active={activeView === "quotations"}
                      icon={FileText}
                      label="Quotations"
                      value={statement.totalQuotationCount}
                      onClick={() => setActiveView("quotations")}
                    />
                  </div>
                </div>
              </div>

              {activeView === "invoices" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <StatementSection title="Invoice Breakdown">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-right">GST</TableHead>
                        <TableHead className="text-right">Delivery</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Outstanding</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statement.invoices.length === 0 ? (
                        <EmptyRow colSpan={9} label="No invoices for this month." />
                      ) : (
                        statement.invoices.map((invoice) => (
                          <TableRow key={invoice._id}>
                            <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                            <TableCell>{formatDate(invoice.date)}</TableCell>
                            <TableCell className="capitalize">{normalizeStatus(invoice.status)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(invoice.subtotal)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(invoice.gst)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(invoice.delivery)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(invoice.paid)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(invoice.outstanding)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    </Table>
                  </StatementSection>
                </motion.div>
              )}

              {activeView === "products" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <StatementSection title="Product / Tile Summary\">
                    <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Boxes</TableHead>
                      <TableHead className="text-right">Sqm</TableHead>
                      <TableHead className="text-right">Sqft</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statement.productSummary.length === 0 ? (
                      <EmptyRow colSpan={9} label="No products sold for this month." />
                    ) : (
                      statement.productSummary.map((item) => (
                        <TableRow key={`${item.productId || item.productName}-${item.size || ""}-${item.unitType || ""}`}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell>{item.size || "N/A"}</TableCell>
                          <TableCell>{item.unitType || "N/A"}</TableCell>
                          <TableCell className="text-right">{formatQuantity(item.quantity)}</TableCell>
                          <TableCell className="text-right">{formatQuantity(item.boxes)}</TableCell>
                          <TableCell className="text-right">{formatQuantity(item.coverageSqm)}</TableCell>
                          <TableCell className="text-right">{formatQuantity(item.coverageSqft)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                    </Table>
                  </StatementSection>
                </motion.div>
              )}

              {activeView === "quotations" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <StatementSection title="Quotation Breakdown">
                    <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quotation</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">GST</TableHead>
                      <TableHead className="text-right">Delivery</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statement.quotations.length === 0 ? (
                      <EmptyRow colSpan={8} label="No quotations for this month." />
                    ) : (
                      statement.quotations.map((quotation) => (
                        <TableRow key={quotation._id}>
                          <TableCell className="font-mono">{quotation.quotationNumber}</TableCell>
                          <TableCell>{formatDate(quotation.date)}</TableCell>
                          <TableCell className="capitalize">{normalizeStatus(quotation.status)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(quotation.subtotal)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(quotation.gst)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(quotation.delivery)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(quotation.discount)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(quotation.total)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  </Table>
                </StatementSection>
              </motion.div>
            )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function MiniTotal({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "red";
}) {
  const toneClass = {
    neutral: "text-neutral-900 dark:text-white",
    green: "text-green-700 dark:text-green-400",
    red: "text-red-700 dark:text-red-400",
  }[tone];

  const bgClass = {
    neutral: "bg-neutral-50/50 dark:bg-neutral-900/40",
    green: "bg-green-50/50 dark:bg-green-950/30",
    red: "bg-red-50/50 dark:bg-red-950/30",
  }[tone];

  return (
    <div className={`rounded-lg border border-neutral-200/50 p-3 ${bgClass} dark:border-neutral-700/50`}>
      <p className="text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400">{label}</p>
      <p className={`mt-2 text-lg font-bold tabular-nums sm:text-xl ${toneClass}`}>{value}</p>
    </div>
  );
}

function ViewButton({
  active,
  icon: Icon,
  label,
  value,
  onClick,
}: {
  active: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left font-semibold transition-all ${
        active
          ? "border-purple-600 bg-purple-600 text-white shadow-md dark:border-purple-600 dark:bg-purple-600"
          : "border-neutral-200/60 bg-white text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50/50 dark:border-neutral-700/60 dark:bg-neutral-800 dark:text-white dark:hover:border-neutral-600 dark:hover:bg-neutral-700/50"
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="text-sm sm:text-base">{label}</span>
      </span>
      <span
        className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
          active
            ? "bg-white/20 text-current"
            : "bg-neutral-100 text-neutral-700 dark:bg-neutral-700/50 dark:text-neutral-300"
        }`}
      >
        {value}
      </span>
    </motion.button>
  );
}

function StatementSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      <h2 className="text-sm font-bold uppercase text-neutral-900 dark:text-white">{title}</h2>
      <div className="overflow-x-auto rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800">
        {children}
      </div>
    </motion.div>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center text-neutral-500">
        {label}
      </TableCell>
    </TableRow>
  );
}
