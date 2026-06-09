"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, FileText, Receipt, RefreshCcw, UserRound } from "lucide-react";
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
import Image from "next/image";
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
  reference?: string;
  date: string;
  dueDate?: string;
  paidDate?: string;
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
  dateRange?: {
    start?: string;
    end?: string;
  };
  transactionCount: number;
  totalInvoiceCount: number;
  invoices: StatementInvoice[];
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

type ActivityRow = {
  id: string;
  date: string;
  activity: string;
  reference?: string;
  dueDate?: string;
  invoiceAmount?: number;
  paymentAmount?: number;
  balance: number;
  isInvoice?: boolean;
};

const companyInfo = {
  name: "AMP TILES PTY LTD",
  address: ["Unit 15/55 Anderson Road", "SMEATON GRANGE", "NSW 2567", "AUSTRALIA"],
  abn: "14 690 181 858",
  accountName: "AMP TILES PTY LTD",
  bsb: "082-356",
  accountNumber: "26-722-1347",
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

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildActivityRows(statement: MonthlyStatement): ActivityRow[] {
  let balance = 0;
  const rows: ActivityRow[] = [];

  statement.invoices.forEach((invoice) => {
    balance += Number(invoice.total) || 0;
    rows.push({
      id: `${invoice._id}-invoice`,
      date: invoice.date,
      activity: `Invoice # ${invoice.invoiceNumber}`,
      reference: invoice.reference || statement.customer.name,
      dueDate: invoice.dueDate,
      invoiceAmount: invoice.total,
      balance,
      isInvoice: true,
    });

    if ((Number(invoice.paid) || 0) > 0) {
      balance -= Number(invoice.paid) || 0;
      rows.push({
        id: `${invoice._id}-payment`,
        date: invoice.paidDate || invoice.date,
        activity: `Payment on Invoice # ${invoice.invoiceNumber}`,
        reference: invoice.invoiceNumber,
        paymentAmount: invoice.paid,
        balance,
      });
    }
  });

  return rows.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
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
        setStatementError("Failed to load activity statement");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load activity statement";
      setStatement(null);
      setStatementError(errorMessage);
      toast.error("Failed to load activity statement", { description: errorMessage });
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
      link.download = `activity-statement-${selectedCustomer?.name || "customer"}-${month}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Activity statement PDF downloaded");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to download activity statement PDF";
      toast.error("Failed to download PDF", { description: errorMessage });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const rows = useMemo(() => (statement ? buildActivityRows(statement) : []), [statement]);
  const totals = statement?.totals;
  const balanceDue = totals?.outstandingTotal || 0;

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
            Activity Statement
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Invoice activity, payments, and balance due for this customer.
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
        <div className="rounded-lg border border-neutral-200/70 bg-white p-4 shadow-sm dark:border-neutral-700/70 dark:bg-neutral-800 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-700">
                <UserRound className="h-5 w-5 text-neutral-700 dark:text-neutral-200" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-bold text-neutral-900 dark:text-white sm:text-lg">
                  {isCustomerLoading ? "Loading customer..." : selectedCustomer?.name || "Customer"}
                </h2>
                <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                  {[selectedCustomer?.customerNumber, selectedCustomer?.phone, selectedCustomer?.email, selectedCustomer?.abn ? `ABN ${selectedCustomer.abn}` : ""]
                    .filter(Boolean)
                    .join(" | ") || "Customer details"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="statementMonth" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Statement Month
                </Label>
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
                className="gap-2 rounded-lg"
              >
                <RefreshCcw className="h-4 w-4" />
                {isStatementLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </div>

        {isCustomerLoading || isStatementLoading ? (
          <LoadingState />
        ) : statementError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {statementError}
          </div>
        ) : !statement ? (
          <EmptyState label="Select a customer and month to view activity records." />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <StatementHeaderCard statement={statement} rowsCount={rows.length} />
              <BalanceCard balanceDue={balanceDue} paidTotal={totals?.paidTotal || 0} grandTotal={totals?.grandTotal || 0} />
            </div>

            <ActivityTable rows={rows} />

            <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <BankDetailsCard />
              <PaymentAdviceCard customerName={statement.customer.name} balanceDue={balanceDue} />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatementHeaderCard({ statement, rowsCount }: { statement: MonthlyStatement; rowsCount: number }) {
  return (
    <div className="rounded-lg border border-neutral-200/70 bg-white p-5 shadow-sm dark:border-neutral-700/70 dark:bg-neutral-800">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">Statement - Activity</p>
          <h2 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{statement.customer.name}</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{statement.monthLabel}</p>
        </div>
        <Image
          src="/assets/AMP-TILES-LOGO.png"
          alt="AMP Tiles"
          width={150}
          height={56}
          className="h-12 w-auto object-contain"
          priority
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <MiniMetric label="From Date" value={formatDate(statement.dateRange?.start)} />
        <MiniMetric label="To Date" value={formatDate(statement.dateRange?.end)} />
        <MiniMetric label="Activity Rows" value={String(rowsCount)} />
      </div>
    </div>
  );
}

function BalanceCard({
  balanceDue,
  paidTotal,
  grandTotal,
}: {
  balanceDue: number;
  paidTotal: number;
  grandTotal: number;
}) {
  return (
    <div className="rounded-lg border border-neutral-200/70 bg-white p-5 shadow-sm dark:border-neutral-700/70 dark:bg-neutral-800">
      <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">Balance Due</p>
      <div className="mt-3 flex items-baseline justify-between gap-4">
        <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">AUD</span>
        <span className="text-3xl font-bold tabular-nums text-neutral-900 dark:text-white">
          {formatAmount(balanceDue)}
        </span>
      </div>
      <div className="mt-5 space-y-2 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-700">
        <div className="flex justify-between gap-3">
          <span className="text-neutral-500 dark:text-neutral-400">Invoice Amount</span>
          <span className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(grandTotal)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-neutral-500 dark:text-neutral-400">Payments</span>
          <span className="font-semibold text-green-700 dark:text-green-400">{formatCurrency(paidTotal)}</span>
        </div>
      </div>
    </div>
  );
}

function ActivityTable({ rows }: { rows: ActivityRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200/70 bg-white shadow-sm dark:border-neutral-700/70 dark:bg-neutral-800">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4 dark:border-neutral-700">
        <Receipt className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
        <h3 className="font-bold text-neutral-900 dark:text-white">Transaction Activity</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Invoice Amount</TableHead>
              <TableHead className="text-right">Payments</TableHead>
              <TableHead className="text-right">Balance AUD</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-neutral-500 dark:text-neutral-400">
                  No transaction activity found for this month.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(row.date)}</TableCell>
                  <TableCell className="min-w-[220px]">
                    {row.isInvoice ? (
                      <span className="font-medium text-sky-700 underline dark:text-sky-400">{row.activity}</span>
                    ) : (
                      row.activity
                    )}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">{row.reference || ""}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.dueDate ? formatDate(row.dueDate) : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.invoiceAmount ? formatAmount(row.invoiceAmount) : ""}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.paymentAmount ? formatAmount(row.paymentAmount) : ""}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatAmount(row.balance)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BankDetailsCard() {
  return (
    <div className="rounded-lg border border-neutral-200/70 bg-white p-5 shadow-sm dark:border-neutral-700/70 dark:bg-neutral-800">
      <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">Company Details</p>
      <h3 className="mt-2 font-bold text-neutral-900 dark:text-white">{companyInfo.name}</h3>
      <div className="mt-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
        {companyInfo.address.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p>ABN {companyInfo.abn}</p>
      </div>
      <div className="mt-5 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-700">
        <p>Account Name: {companyInfo.accountName}</p>
        <p>BSB Number: {companyInfo.bsb}</p>
        <p>Account Number: {companyInfo.accountNumber}</p>
      </div>
    </div>
  );
}

function PaymentAdviceCard({ customerName, balanceDue }: { customerName: string; balanceDue: number }) {
  return (
    <div className="rounded-lg border border-neutral-200/70 bg-white p-5 shadow-sm dark:border-neutral-700/70 dark:bg-neutral-800">
      <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">Payment Advice</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <MiniMetric label="Customer" value={customerName} />
        <MiniMetric label="Overdue" value={formatAmount(balanceDue)} />
        <MiniMetric label="Total AUD Due" value={formatAmount(balanceDue)} />
      </div>
      <div className="mt-5">
        <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Amount Enclosed</Label>
        <div className="mt-3 h-10 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900" />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-700 dark:bg-neutral-900/50">
      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-neutral-900 dark:text-white">{value || "N/A"}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-56 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading activity records...</p>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
      <FileText className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
      <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</p>
    </div>
  );
}
