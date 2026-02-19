"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Edit, ArrowLeft, ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";

type QuotationStatus = "draft" | "sent" | "converted" | "expired" | "cancelled";

type QuotationItem = {
  _id: string;
  productName: string;
  quantity: number;
  rate: number;
  lineTotal: number;
};

type QuotationData = {
  _id: string;
  quotationNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  quotationDate: string;
  notes?: string;
  status: QuotationStatus;
  items: QuotationItem[];
  subtotal: number;
  tax: number;
  taxRate?: number;
  grandTotal: number;
};

export default function ViewQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;

  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuotation = async () => {
    try {
      setIsLoading(true);
      const response = await api.getQuotation(quotationId);
      
      if (response.success && response.quotation) {
        setQuotation(response.quotation as QuotationData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load quotation";
      toast.error("Failed to load quotation", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationId]);

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

  const handleEdit = () => {
    if (!quotation || quotation.status === "converted") {
      toast.error("Cannot edit converted quotation");
      return;
    }
    router.push(`/quotations/${quotationId}/edit`);
  };

  const handleConvert = async () => {
    if (!quotation || quotation.status === "converted") {
      toast.error("This quotation has already been converted");
      return;
    }

    try {
      const response = await api.convertQuotationToInvoice(quotationId);
      if (response.success) {
        toast.success("Quotation converted to invoice", {
          description: `${quotation.quotationNumber} has been converted successfully`,
        });
        fetchQuotation(); // Refresh data
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to convert quotation";
      toast.error("Failed to convert quotation", {
        description: errorMessage,
      });
    }
  };

  const handleDownloadPDF = () => {
    toast.info("Generating PDF...");
    // TODO: Implement PDF generation
  };

  const getStatusBadgeClass = (status: QuotationStatus) => {
    switch (status) {
      case "draft":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400";
      case "sent":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
      case "converted":
        return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
      case "expired":
        return "bg-neutral-100 text-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
      default:
        return "bg-neutral-100 text-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Quotation not found
          </p>
          <Button onClick={() => router.push("/quotations")} className="mt-4">
            Back to Quotations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/quotations")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {quotation.quotationNumber}
            </h1>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              View quotation details
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          {quotation.status === "draft" && (
            <>
              <Button variant="outline" onClick={handleEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button onClick={handleConvert} className="gap-2">
                <ArrowRight className="h-4 w-4" />
                Convert to Invoice
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quotation Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
          >
            <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "#3b82f615" }}
                  >
                    <FileText
                      className="h-5 w-5"
                      style={{ color: "#3b82f6" }}
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">
                      Customer Information
                    </h3>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={getStatusBadgeClass(quotation.status)}
                >
                  {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    Customer Name
                  </label>
                  <p className="mt-1 text-base font-semibold text-neutral-900 dark:text-white">
                    {quotation.customerName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    Phone Number
                  </label>
                  <p className="mt-1 text-base font-semibold text-neutral-900 dark:text-white">
                    {quotation.customerPhone || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    Quotation Date
                  </label>
                  <p className="mt-1 text-base font-semibold text-neutral-900 dark:text-white">
                    {formatDate(quotation.quotationDate)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    Quote Number
                  </label>
                  <p className="mt-1 text-base font-mono font-semibold text-neutral-900 dark:text-white">
                    {quotation.quotationNumber}
                  </p>
                </div>
              </div>
              {quotation.notes && (
                <div>
                  <label className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    Notes
                  </label>
                  <p className="mt-1 text-base text-neutral-900 dark:text-white">
                    {quotation.notes}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quotation Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
          >
            <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
              <h3 className="font-bold text-neutral-900 dark:text-white">
                Quotation Items
              </h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                      <th className="pb-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Product
                      </th>
                      <th className="pb-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Quantity
                      </th>
                      <th className="pb-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Rate
                      </th>
                      <th className="pb-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((item) => (
                      <tr
                        key={item._id}
                        className="border-b border-neutral-100 dark:border-neutral-800"
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
            </div>
          </motion.div>
        </div>

        {/* Summary Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800">
            <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60">
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Summary
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Subtotal
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {formatCurrency(quotation.subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Tax (GST {quotation.taxRate || 10}%)
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {formatCurrency(quotation.tax)}
                </span>
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-700"></div>

              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-neutral-900 dark:text-white">
                  Grand Total
                </span>
                <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(quotation.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
