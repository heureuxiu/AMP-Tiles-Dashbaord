"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Receipt, Download, Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";

type InvoiceItem = {
  _id: string;
  productName: string;
  quantity: number;
  rate: number;
  lineTotal: number;
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

  useEffect(() => {
    const fetchInvoice = async () => {
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
    fetchInvoice();
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
                    <th className="pb-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      QUANTITY
                    </th>
                    <th className="pb-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      RATE
                    </th>
                    <th className="pb-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      AMOUNT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b border-neutral-200 dark:border-neutral-700"
                    >
                      <td className="py-4 text-neutral-900 dark:text-white">
                        {item.productName}
                      </td>
                      <td className="py-4 text-right text-neutral-600 dark:text-neutral-400">
                        {item.quantity}
                      </td>
                      <td className="py-4 text-right text-neutral-600 dark:text-neutral-400">
                        {formatCurrency(item.rate)}
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
