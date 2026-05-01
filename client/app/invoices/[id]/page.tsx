"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Receipt, Download, Printer, ArrowLeft, DollarSign, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";

type InvoiceItem = {
  _id?: string;
  productName: string;
  product?: {
    size?: string;
  };
  size?: string;
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
  deliveryAddress?: string;
  invoiceDate: string;
  dueDate?: string;
  reference?: string;
  quotation?: { quotationNumber: string };
  items: InvoiceItem[];
  subtotal: number;
  discountAmount?: number;
  tax?: number;
  taxRate?: number;
  deliveryCost?: number;
  grandTotal: number;
  status: string;
  paymentMethod?: string;
  amountPaid?: number;
  remainingBalance?: number;
  paymentStatus?: string;
};

const companyInfo = {
  name: "AMP TILES PTY LTD",
  addressLine1: "Unit 15/55 Anderson Road",
  addressLine2: "Smeaton Grange, NSW 2567",
  abn: "14 690 181 858",
};

const bankInfo = {
  bank: "NAB",
  accountName: "AMP TILES PTY LTD",
  bsb: "082-356",
  accountNumber: "26-722-1347",
};

const SQFT_PER_SQM = 10.764;

const formatQty = (value: number) => {
  const numeric = Number(value) || 0;
  const rounded = Math.round(numeric * 1000) / 1000;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(3).replace(/\.?0+$/, "");
};

const getItemSize = (item: InvoiceItem) => {
  const value = item.product?.size ?? item.size;
  return value && String(value).trim().length > 0 ? String(value) : "-";
};

const toCents = (value: number) => Math.round((Number(value) || 0) * 100);

const formatPaymentStatus = (status?: string) => {
  if (status === "paid") return "Fully Paid";
  if (status === "partially_paid") return "Partially Paid";
  if (status === "unpaid" || !status) return "Unpaid";
  return status.replace(/_/g, " ");
};

const getDisplayQuantity = (item: InvoiceItem) => {
  const coverageSqm = Number(item.coverageSqm);
  if (item.unitType === "Sq Meter" && Number.isFinite(coverageSqm) && coverageSqm > 0) {
    return formatQty(coverageSqm);
  }
  if (item.unitType === "Sq Ft" && Number.isFinite(coverageSqm) && coverageSqm > 0) {
    return formatQty(coverageSqm * SQFT_PER_SQM);
  }
  return formatQty(item.quantity);
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
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sendEmailAfterPayment, setSendEmailAfterPayment] = useState(true);

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

  const handleSendInvoiceEmail = async () => {
    if (!invoice) return;
    if (!String(invoice.customerEmail || "").trim()) {
      toast.error("Customer email is missing for this invoice");
      return;
    }
    try {
      setIsSendingEmail(true);
      const response = await api.sendInvoiceByEmail(invoice._id);
      if (response.success) {
        toast.success("Invoice emailed", {
          description: response.message || `Invoice sent to ${invoice.customerEmail}`,
        });
      } else {
        toast.error("Failed to send invoice email");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send invoice email";
      toast.error("Failed to send invoice email", {
        description: message,
      });
    } finally {
      setIsSendingEmail(false);
    }
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
    const amountCents = toCents(amount);
    if (amountCents <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const currentPaidCents = toCents(invoice.amountPaid ?? 0);
    const grandTotalCents = toCents(grandTotal);
    const newTotalPaidCents = currentPaidCents + amountCents;
    if (newTotalPaidCents > grandTotalCents) {
      toast.error("Amount paid cannot exceed total amount");
      return;
    }
    if (sendEmailAfterPayment && !String(invoice.customerEmail || "").trim()) {
      toast.error("Customer email is required to send updated invoice");
      return;
    }
    const newTotalPaid = newTotalPaidCents / 100;
    const remaining = Math.max(0, grandTotalCents - newTotalPaidCents) / 100;
    try {
      setIsRecordingPayment(true);
      const response = await api.updateInvoice(invoice._id, {
        amountPaid: newTotalPaid,
        ...(paymentMethod && { paymentMethod }),
        sendEmail: sendEmailAfterPayment,
      });
      const defaultMessage = `${formatCurrency(amount)} added. Total paid: ${formatCurrency(newTotalPaid)}, Remaining: ${formatCurrency(remaining)}`;
      if (sendEmailAfterPayment && response.emailSent) {
        toast.success("Payment recorded and invoice emailed", {
          description: response.message || defaultMessage,
        });
      } else if (sendEmailAfterPayment && !response.emailSent) {
        toast.error("Payment saved but email not sent", {
          description: response.emailError || response.message || defaultMessage,
        });
      } else {
        toast.success("Payment recorded", {
          description: defaultMessage,
        });
      }
      setPaymentAmount("");
      setPaymentMethod("");
      await fetchInvoice();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to record payment";
      toast.error("Failed to record payment", {
        description: message,
      });
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

  // Derive effective GST rate from items (each item has taxPercent); fallback to invoice.taxRate or 10
  const effectiveTaxRate = invoice.items.length > 0
    ? Number(invoice.items[0].taxPercent ?? invoice.taxRate ?? 10)
    : Number(invoice.taxRate ?? 10);
  const taxRate = effectiveTaxRate > 0 ? effectiveTaxRate : 10;
  // Always recompute from line items so old DB values don't cause wrong display
  const subtotal = Math.round(invoice.items.reduce((sum, i) => {
    const taxP = Number(i.taxPercent ?? taxRate);
    return sum + (i.lineTotal / (1 + taxP / 100));
  }, 0) * 100) / 100;
  const discountAmount = invoice.discountAmount ?? 0;
  const taxAmount = Math.round(invoice.items.reduce((sum, i) => {
    const taxP = Number(i.taxPercent ?? taxRate);
    const lt = i.lineTotal;
    return sum + (lt - lt / (1 + taxP / 100));
  }, 0) * 100) / 100;
  const deliveryCost = Math.max(0, Number(invoice.deliveryCost) || 0);
  const deliveryGst = Math.round(deliveryCost * (taxRate / 100) * 100) / 100;
  const grandTotal = Math.round((subtotal - discountAmount + taxAmount + deliveryCost + deliveryGst) * 100) / 100;
  const remainingBalance = Math.max(0, Math.round((grandTotal - (invoice.amountPaid ?? 0)) * 100) / 100);

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
              onClick={handleSendInvoiceEmail}
              className="gap-2"
              disabled={isSendingEmail || !String(invoice.customerEmail || "").trim()}
              title={
                invoice.customerEmail
                  ? "Send invoice by email"
                  : "Customer email missing"
              }
            >
              <Mail className="h-4 w-4" />
              {isSendingEmail ? "Sending..." : "Send Email"}
            </Button>
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
                  <p>{companyInfo.addressLine1}</p>
                  <p>{companyInfo.addressLine2}</p>
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
                  {(invoice.deliveryAddress || invoice.customerAddress) && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Delivery Address: {invoice.deliveryAddress || invoice.customerAddress}
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
                      {invoice.status?.replace(/_/g, " ") ?? "-"}
                    </span>
                  </div>

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
                      SIZE
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      UNIT
                    </th>
                    <th className="pb-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      PIECE
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
                        {getItemSize(item)}
                      </td>
                      <td className="py-4 text-neutral-600 dark:text-neutral-400">
                        {item.unitType ?? "-"}
                      </td>
                      <td className="py-4 text-right text-neutral-600 dark:text-neutral-400">
                        {getDisplayQuantity(item)}
                      </td>
                      <td className="py-4 text-right text-neutral-600 dark:text-neutral-400">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="py-4 text-right text-neutral-600 dark:text-neutral-400">
                        {item.discountPercent != null ? `${item.discountPercent}%` : "-"}
                      </td>
                      <td className="py-4 text-right text-neutral-600 dark:text-neutral-400">
                        {item.taxPercent != null ? `${item.taxPercent}%` : "-"}
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
                    Subtotal (ex. GST):
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">Discount:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">Items GST ({taxRate}%):</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-700 dark:text-neutral-300">
                    Delivery Cost:
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {formatCurrency(deliveryCost)}
                  </span>
                </div>
                {deliveryGst > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      Delivery GST ({taxRate}%):
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {formatCurrency(deliveryGst)}
                    </span>
                  </div>
                )}
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300">
                  <p className="mb-2 font-semibold text-neutral-800 dark:text-neutral-100">
                    Bank Details
                  </p>
                  <div className="space-y-1">
                    <p>Bank: {bankInfo.bank}</p>
                    <p>Account Name: {bankInfo.accountName}</p>
                    <p>BSB: {bankInfo.bsb}</p>
                    <p>Account Number: {bankInfo.accountNumber}</p>
                  </div>
                </div>
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
              {/* Payment summary - clear record: Total | Paid | Remaining */}
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
                      {formatCurrency(remainingBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400">Payment status</p>
                    <p className="capitalize font-medium text-neutral-900 dark:text-white">
                      {formatPaymentStatus(invoice.paymentStatus)}
                    </p>
                  </div>
                </div>
                {(invoice.paymentMethod || "").trim() && (
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Method: {(invoice.paymentMethod || "").replace(/_/g, " ")}
                  </p>
                )}
              </div>

              {/* Record new payment - when there is remaining balance and not cancelled */}
              {toCents(remainingBalance) > 0 && invoice.status !== "cancelled" && (
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-600 dark:bg-neutral-800/30 print:hidden">
                  <h4 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Record new payment
                  </h4>
                  <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                    Enter the amount received from the client - the remaining balance will update automatically.
                  </p>
                  <label className="mb-3 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <input
                      type="checkbox"
                      checked={sendEmailAfterPayment}
                      onChange={(e) => setSendEmailAfterPayment(e.target.checked)}
                      disabled={isRecordingPayment}
                      className="h-4 w-4 rounded border-neutral-300 text-amp-primary focus:ring-amp-primary dark:border-neutral-600"
                    />
                    Email updated invoice to customer after this payment
                  </label>
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
                        <option value="">- Optional -</option>
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
                      {isRecordingPayment
                        ? sendEmailAfterPayment
                          ? "Saving & Sending..."
                          : "Saving..."
                        : "Record payment"}
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
