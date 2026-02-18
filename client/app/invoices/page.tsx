"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Receipt, Eye, Download, Search, X, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  items: Array<{
    _id: string;
    product: string;
    productName: string;
    quantity: number;
    rate: number;
    lineTotal: number;
  }>;
};

type Stats = {
  total: number;
  draft: number;
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
    sent: 0,
    paid: 0,
    overdue: 0,
    cancelled: 0,
    totalRevenue: 0,
    pendingAmount: 0,
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await api.getInvoices({ sortBy: 'createdAt', sortOrder: 'desc' });
      
      if (response.success && response.invoices) {
        setInvoices(response.invoices);
        if (response.stats) {
          setStats(response.stats);
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

  const handleDownloadPDF = (invoice: Invoice) => {
    toast.info(`Generating PDF for ${invoice.invoiceNumber}...`);
    // TODO: Implement PDF generation
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${invoice.invoiceNumber}? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      const response = await api.deleteInvoice(invoice._id);
      if (response.success) {
        toast.success("Invoice deleted", {
          description: `${invoice.invoiceNumber} has been removed`,
        });
        fetchInvoices();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete invoice";
      toast.error("Failed to delete invoice", {
        description: errorMessage,
      });
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: "draft" | "sent" | "paid" | "overdue" | "cancelled") => {
    try {
      // If marking as paid, call the specific API
      if (newStatus === "paid") {
        const response = await api.markInvoiceAsPaid(invoiceId, {});
        if (response.success) {
          toast.success("Invoice marked as paid");
          fetchInvoices();
        }
      } else {
        // Update status for other statuses
        const response = await api.updateInvoice(invoiceId, { status: newStatus });
        if (response.success) {
          toast.success(`Invoice status updated to ${newStatus}`);
          fetchInvoices();
        }
      }
    } catch (error) {
      console.error("Failed to update invoice status:", error);
      toast.error("Failed to update invoice status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
            Paid
          </Badge>
        );
      case "sent":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
            Sent
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
            Overdue
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-neutral-100 text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-900/30 dark:text-neutral-400">
            Cancelled
          </Badge>
        );
      default: // draft
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
            Draft
          </Badge>
        );
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
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Invoices
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            View and manage customer invoices
          </p>
        </div>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
      >
        {/* Header */}
        <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "#8b5cf615" }}
              >
                <Receipt className="h-5 w-5" style={{ color: "#8b5cf6" }} strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  All Invoices
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Generated from converted quotations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60"
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
        <div className="p-6">
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
                    <TableHead>Status</TableHead>
                    <TableHead className="w-0">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
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
                          {/* Status Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="flex items-center gap-1 outline-none">
                                {getStatusBadge(invoice.status)}
                                <ChevronDown className="h-3 w-3 text-neutral-400" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(invoice._id, "draft")}
                                className="gap-2"
                              >
                                <div className="h-2 w-2 rounded-full bg-amber-500" />
                                Draft
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(invoice._id, "sent")}
                                className="gap-2"
                              >
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                Sent
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(invoice._id, "paid")}
                                className="gap-2"
                              >
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(invoice._id, "overdue")}
                                className="gap-2"
                              >
                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                Overdue
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(invoice._id, "cancelled")}
                                className="gap-2"
                              >
                                <div className="h-2 w-2 rounded-full bg-neutral-500" />
                                Cancelled
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

                          {/* Delete Button */}
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteInvoice(invoice)}
                              aria-label={`Delete ${invoice.invoiceNumber}`}
                              title="Delete Invoice"
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

        {/* Footer Summary */}
        {!isLoading && invoices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="border-t border-neutral-200/60 p-6 dark:border-neutral-700/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
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
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                    {stats.paid} Paid
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
                    {stats.sent} Sent
                  </Badge>
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                    {stats.overdue} Overdue
                  </Badge>
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
    </div>
  );
}
