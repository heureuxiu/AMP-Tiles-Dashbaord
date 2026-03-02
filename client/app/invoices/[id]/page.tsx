"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Receipt, Download, Printer, ArrowLeft, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";

type InvoiceItem = {
  _id?: string;
  productName: string;
  unitType?: string;
  quantity: number;
  rate: number;
  discountPercent?: number;
  taxPercent?: number;
  lineTotal: number;
  coverageSqm?: number;
};

type InvoiceData = {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  invoiceDate: string;
  dueDate?: string;
  quotation?: { quotationNumber: string };
  items: InvoiceItem[];
  subtotal: number;
  discountAmount?: number;
  tax?: number;
  grandTotal: number;
  status: string;
  paymentMethod?: string;
  amountPaid?: number;
  remainingBalance?: number;
  paymentStatus?: string;
};

const companyInfo = {
  name: "AMP Tiles Australia",
  address: "456 Business Park Drive, Melbourne VIC 3000",
  phone: "+61 3 9999 8888",
  email: "info@amptiles.com.au",
  abn: "12 345 678 901",
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.getInvoice(invoiceId);
        if (response.success && response.invoice) {
          setInvoice(response.invoice as InvoiceData);
        } else {
          toast.error("Invoice not found");
          router.push("/invoices");
        }
      } catch {
        toast.error("Failed to load invoice");
        router.push("/invoices");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [invoiceId, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      setIsPdfLoading(true);
      toast.info("Generating PDF...");
      const blob = await api.getInvoicePdfBlob(invoice._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded", {
        description: `${invoice.invoiceNumber}.pdf`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to download PDF";
      toast.error("Failed to download PDF", { description: msg });
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const fetchInvoice = async () => {
    try {
      const response = await api.getInvoice(invoiceId);
      if (response.success && response.invoice) {
        setInvoice(response.invoice as InvoiceData);
      }
    } catch {
      toast.error("Failed to load invoice");
    }
  };

  const handleRecordPayment = async () => {
    if (!invoice) return;
    const amount = parseFloat(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const currentPaid = invoice.amountPaid ?? 0;
    const newTotalPaid = currentPaid + amount;
    if (newTotalPaid > grandTotal) {
      toast.error("Amount paid cannot exceed total amount");
      return;
    }
    try {
      setIsRecordingPayment(true);
      await api.updateInvoice(invoice._id, {
        amountPaid: newTotalPaid,
        ...(paymentMethod && { paymentMethod }),
      });
      toast.success("Payment recorded", {
        description: `${formatCurrency(amount)} added. Total paid: ${formatCurrency(newTotalPaid)}, Remaining: ${formatCurrency(Math.max(0, grandTotal - newTotalPaid))}`,
      });
      setPaymentAmount("");
      setPaymentMethod("");
      await fetchInvoice();
    } catch (e) {
      toast.error("Failed to record payment");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  if (isLoading || !invoice) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
      </div>
    );
  }

  const subtotal = invoice.subtotal ?? invoice.items.reduce((sum, i) => sum + i.lineTotal, 0);
  const grandTotal = invoice.grandTotal ?? subtotal;

  return (
    <>
      <div className="space-y-6 p-6 lg:p-8 print:p-0">
        {/* Top Bar - Hidden on print */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/invoices")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {invoice.invoiceNumber}
              </h1>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                Invoice details
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="gap-2"
              disabled={isPdfLoading}
            >
              <Download className="h-4 w-4" />
              {isPdfLoading ? "Generating..." : "Download PDF"}
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-4xl rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 print:max-w-full print:border-0 print:shadow-none"
        >
          <div className="p-8 print:p-12">
            {/* Company Header */}
            <div className="mb-8 flex items-start justify-between border-b border-neutral-200 pb-8 dark:border-neutral-700">
              <div>
                <h2 className="text-3xl font-bold" style={{ color: "#c7a864" }}>
                  {companyInfo.name}
                </h2>
                <div className="mt-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                  <p>{companyInfo.address}</p>
                  <p>Phone: {companyInfo.phone}</p>
                  <p>Email: {companyInfo.email}</p>
                  <p>ABN: {companyInfo.abn}</p>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "#8b5cf615" }}
                >
                  <Receipt
                    className="h-10 w-10"
                    style={{ color: "#8b5cf6" }}
                    strokeWidth={2}
                  />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  INVOICE
                </h3>
              </div>
            </div>

            {/* Invoice Info */}
            <div className="mb-8 grid gap-8 sm:grid-cols-2">
              <div>
                <h4 className="mb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  BILL TO
                </h4>
                <div className="space-y-1">
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {invoice.customerName}
                  </p>
                  {invoice.customerAddress && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {invoice.customerAddress}
                    </p>
                  )}
                  {invoice.customerPhone && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {invoice.customerPhone}
                    </p>
                  )}
                  {invoice.customerEmail && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {invoice.customerEmail}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="space-y-2">
                  <div className="flex justify-end gap-3">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Invoice Number:
                    </span>
                    <span className="font-mono text-neutral-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </span>
                  </div>
                  <div className="flex justify-end gap-3">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Invoice Date:
                    </span>
                    <span className="text-neutral-900 dark:text-white">
                      {formatDate(invoice.invoiceDate)}
                    </span>
                  </div>
                  <div className="flex justify-end gap-3">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Status:
                    </span>
                    <span className="capitalize text-neutral-900 dark:text-white">
                      {invoice.status?.replace(/_/g, " ") ?? "—"}
                    </span>
                  </div>
                  {invoice.quotation?.quotationNumber && (
                    <div className="flex justify-end gap-3">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        Quote Reference:
                      </span>
                      <span className="font-mono text-neutral-600 dark:text-neutral-400">
                        {invoice.quotation.quotationNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Items Table */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-neutral-300 dark:border-neutral-600">
                    <th className="pb-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      PRODUCT
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      UNIT
                    </th>
                    <th className="pb-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      QTY
                    </th>
                    <th className="pb-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      RATE
                    </th>
                    <th className="pb-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      DISC %
                    </th>
                    <th className="pb-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      TAX %
                    </th>
                    <th className="pb-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      AMOUNT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr
                      key={item._id ?? idx}
                      className="border-b border-neutral-200 dark:border-neutral-700"
                    >
                      <td className="py-4 text-neutral-900 dark:text-white">
                        {item.productName}
                      </td>
                      <td className="py-4 text-neutral-600 dark:text-neutral-400">
                        {item.unitType ?? "—"}
                      </td>
                      <td className="py-4 text-right text-neutral-600 dark:text-neutral-400">
                        {item.quantity}
                      </td>
                      <td className="py-4 text-right text-neutral-600 dark:text-neutral-400">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="py-4 text-right text-neutral-600 dark:text-neutral-400">
                        {item.discountPercent != null ? `${item.discountPercent}%` : "—"}
                      </td>
                      <td className="py-4 text-right text-neutral-600 dark:text-neutral-400">
                        {item.taxPercent != null ? `${item.taxPercent}%` : "—"}
                      </td>
                      <td className="py-4 text-right font-semibold text-neutral-900 dark:text-white">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Summary */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-700">
                  <span className="text-neutral-700 dark:text-neutral-300">
                    Subtotal:
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                {(invoice.discountAmount ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">Discount:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      -{formatCurrency(invoice.discountAmount ?? 0)}
                    </span>
                  </div>
                )}
                {(invoice.tax ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">Tax (GST):</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {formatCurrency(invoice.tax ?? 0)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t-2 border-neutral-300 pt-3 dark:border-neutral-600">
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">
                    TOTAL:
                  </span>
                  <span className="text-2xl font-bold" style={{ color: "#8b5cf6" }}>
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment & Status */}
            <div className="mb-8 space-y-6 border-t border-neutral-200 pt-8 dark:border-neutral-700">
              {/* Payment summary – clear record: Total | Paid | Remaining */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-600 dark:bg-neutral-800/50">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <DollarSign className="h-4 w-4" />
                  Payment record
                </h4>
                <div className="grid gap-4 sm:grid-cols-4 text-sm">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Total amount</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(grandTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Amount received</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(invoice.amountPaid ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Remaining</p>
                    <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                      {formatCurrency(invoice.remainingBalance ?? grandTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Payment status</p>
                    <p className="capitalize font-medium text-neutral-900 dark:text-white">
                      {(invoice.paymentStatus ?? "unpaid").replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                {(invoice.paymentMethod || "").trim() && (
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Method: {(invoice.paymentMethod || "").replace(/_/g, " ")}
                  </p>
                )}
              </div>

              {/* Record new payment – when there is remaining balance and not cancelled */}
              {(invoice.remainingBalance ?? grandTotal) > 0 && invoice.status !== "cancelled" && (
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-600 dark:bg-neutral-800/30 print:hidden">
                  <h4 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Record new payment
                  </h4>
                  <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                    Client ne jo amount diya hai wo yahan enter karein – remaining balance khud update ho jayegi.
                  </p>
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        Amount received
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 100"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        disabled={isRecordingPayment}
                        className="h-10 w-32 rounded-lg border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        disabled={isRecordingPayment}
                        className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                      >
                        <option value="">— Optional —</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="eftpos">EFTPOS</option>
                        <option value="credit">Credit</option>
                      </select>
                    </div>
                    <Button
                      type="button"
                      onClick={handleRecordPayment}
                      disabled={isRecordingPayment || !paymentAmount.trim()}
                      className="gap-2"
                    >
                      {isRecordingPayment ? "Saving..." : "Record payment"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                    INVOICE STATUS
                  </h4>
                  <p className="capitalize text-neutral-900 dark:text-white">
                    {invoice.status?.replace(/_/g, " ") ?? "Draft"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Stock is reduced when status is Confirmed or Delivered.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-12 border-t border-neutral-200 pt-6 dark:border-neutral-700">
              <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                Thank you for your business!
              </p>
              <p className="mt-2 text-center text-xs text-neutral-400 dark:text-neutral-500">
                This is a computer generated invoice and does not require a signature.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:p-12 {
            padding: 3rem !important;
          }
          .print\\:max-w-full {
            max-width: 100% !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
}
