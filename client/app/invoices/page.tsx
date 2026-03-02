"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Receipt, Eye, Download, Search, X, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

type InvoiceStatus = "draft" | "confirmed" | "delivered" | "cancelled" | "sent" | "paid" | "overdue";

type Invoice = {
  _id: string;
  invoiceNumber: string;
  quotation?: {
    _id: string;
    quotationNumber: string;
  };
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  invoiceDate: string;
  dueDate?: string;
  grandTotal: number;
  status: InvoiceStatus;
  paymentStatus?: string;
  amountPaid?: number;
  remainingBalance?: number;
  items: Array<{
    _id: string;
    product: string;
    productName: string;
    unitType?: string;
    quantity: number;
    rate: number;
    lineTotal: number;
  }>;
};

type Stats = {
  total: number;
  draft: number;
  confirmed: number;
  delivered: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalRevenue: number;
  pendingAmount: number;
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<Stats>({
    total: 0,
    draft: 0,
    confirmed: 0,
    delivered: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
    cancelled: 0,
    totalRevenue: 0,
    pendingAmount: 0,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await api.getInvoices({ sortBy: 'createdAt', sortOrder: 'desc' });
      
      if (response.success && response.invoices) {
        setInvoices(response.invoices as Invoice[]);
        if (response.stats) {
          setStats(response.stats as Stats);
        }
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter invoices based on search
  const filteredInvoices = invoices.filter(
    (inv) =>
      searchQuery === "" ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerPhone && inv.customerPhone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.customerEmail && inv.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleViewInvoice = (id: string) => {
    router.push(`/invoices/${id}`);
  };

  const handleEditInvoice = (id: string) => {
    router.push(`/invoices/${id}/edit`);
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      toast.info(`Generating PDF for ${invoice.invoiceNumber}...`);
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
      const errorMessage = error instanceof Error ? error.message : "Failed to download PDF";
      toast.error("Failed to download PDF", { description: errorMessage });
    }
  };

  const openDeleteModal = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    try {
      const response = await api.deleteInvoice(invoiceToDelete._id);
      if (response.success) {
        toast.success("Invoice deleted", {
          description: `${invoiceToDelete.invoiceNumber} has been removed`,
        });
        fetchInvoices();
      } else {
        toast.error("Failed to delete invoice");
        throw new Error();
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "") {
        toast.error("Failed to delete invoice", {
          description: error.message,
        });
      }
      throw error;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-w-0 w-full space-y-4 p-3 sm:space-y-6 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
          Invoices
        </h1>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
          View and manage customer invoices
        </p>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-w-0 overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:rounded-2xl"
      >
        {/* Header */}
        <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
              style={{ backgroundColor: "#8b5cf615" }}
            >
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#8b5cf6" }} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-neutral-900 dark:text-white sm:text-base">
                All Invoices
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                Generated from converted quotations
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by Invoice No or Customer Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </p>
          )}
        </motion.div>

        {/* Table Content */}
        <div className="overflow-x-auto p-3 sm:p-6">
          <div className="inline-block min-w-full align-middle">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
            </div>
          ) : (
            <div className="[&>div]:rounded-lg [&>div]:border [&>div]:border-neutral-200/60 dark:[&>div]:border-neutral-700/60">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Amount received</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Payment status</TableHead>
                    <TableHead className="w-0">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Receipt
                            className="h-12 w-12 text-neutral-300 dark:text-neutral-600"
                            strokeWidth={1.5}
                          />
                          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            No invoices found
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500">
                            {searchQuery
                              ? "Try adjusting your search"
                              : "Convert quotations to create invoices"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice, index) => (
                      <motion.tr
                        key={invoice._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                      >
                        <TableCell className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell className="font-medium text-neutral-900 dark:text-white">
                          {invoice.customerName}
                        </TableCell>
                        <TableCell className="text-neutral-600 dark:text-neutral-400">
                          {formatDate(invoice.invoiceDate)}
                        </TableCell>
                        <TableCell className="text-neutral-600 dark:text-neutral-400">
                          {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-neutral-900 dark:text-white">
                          {formatCurrency(invoice.grandTotal)}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(invoice.amountPaid ?? 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {formatCurrency(invoice.remainingBalance ?? (invoice.grandTotal ?? 0))}
                          </span>
                        </TableCell>
                        <TableCell className="capitalize text-neutral-900 dark:text-white">
                          {(invoice.paymentStatus ?? "unpaid").replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          {/* View Button */}
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                              onClick={() => handleViewInvoice(invoice._id)}
                              aria-label={`View ${invoice.invoiceNumber}`}
                              title="View Invoice"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </motion.div>

                          {/* Edit Button – hide for cancelled */}
                          {invoice.status !== "cancelled" && (
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                onClick={() => handleEditInvoice(invoice._id)}
                                aria-label={`Edit ${invoice.invoiceNumber}`}
                                title="Edit Invoice"
                              >
                                <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                            </motion.div>
                          )}

                          {/* Download PDF Button */}
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/20"
                              onClick={() => handleDownloadPDF(invoice)}
                              aria-label={`Download ${invoice.invoiceNumber}`}
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </Button>
                          </motion.div>

                          {/* Delete Button (only draft) */}
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 rounded-full ${invoice.status !== "draft" ? "cursor-not-allowed opacity-50" : "hover:bg-red-100 dark:hover:bg-red-900/20"}`}
                              onClick={() => invoice.status === "draft" && openDeleteModal(invoice)}
                              disabled={invoice.status !== "draft"}
                              aria-label={`Delete ${invoice.invoiceNumber}`}
                              title={invoice.status === "draft" ? "Delete Invoice" : "Only draft invoices can be deleted"}
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </motion.div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          </div>
        </div>

        {/* Footer Summary */}
        {!isLoading && invoices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="border-t border-neutral-200/60 p-4 sm:p-6 dark:border-neutral-700/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                <div>
                  Total Revenue:{" "}
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(stats.totalRevenue)}
                  </span>
                </div>
                <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
                <div>
                  Pending:{" "}
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(stats.pendingAmount)}
                  </span>
                </div>
                <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-600" />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {stats.draft ?? 0} Draft
                  </Badge>
                  <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {stats.confirmed ?? 0} Confirmed
                  </Badge>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {stats.delivered ?? 0} Delivered
                  </Badge>
                  <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-400">
                    {stats.cancelled ?? 0} Cancelled
                  </Badge>
                  {(stats.sent ?? 0) + (stats.paid ?? 0) + (stats.overdue ?? 0) > 0 && (
                    <>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {stats.sent ?? 0} Sent
                      </Badge>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {stats.paid ?? 0} Paid
                      </Badge>
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {stats.overdue ?? 0} Overdue
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              <span className="font-bold text-neutral-900 dark:text-white">
                Total: {filteredInvoices.length}{" "}
                {searchQuery ? `of ${invoices.length}` : ""} Invoices
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

      <DeleteConfirmDialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setInvoiceToDelete(null);
        }}
        title="Delete Invoice?"
        description={
          invoiceToDelete
            ? `Are you sure you want to delete ${invoiceToDelete.invoiceNumber}? This cannot be undone.`
            : ""
        }
        onConfirm={handleConfirmDeleteInvoice}
      />
    </div>
  );
}
