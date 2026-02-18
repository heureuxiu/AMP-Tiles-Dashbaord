"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, PencilIcon, FileText, Eye, ArrowRight, Search, X, Trash2 } from "lucide-react";
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

type QuotationStatus = "draft" | "sent" | "converted" | "expired" | "cancelled";

type Quotation = {
  _id: string;
  quotationNumber: string;
  customerName: string;
  quotationDate: string;
  grandTotal: number;
  status: QuotationStatus;
  convertedToInvoice: boolean;
};

export default function QuotationsPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    draft: 0,
    sent: 0,
    converted: 0,
    expired: 0,
    cancelled: 0,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setIsLoading(true);
      const response = await api.getQuotations();
      if (response.success && response.quotations) {
        setQuotations(response.quotations);
        if (response.stats) {
          setStats({
            draft: response.stats.draft || 0,
            sent: response.stats.sent || 0,
            converted: response.stats.converted || 0,
            expired: response.stats.expired || 0,
            cancelled: response.stats.cancelled || 0,
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch quotations";
      toast.error("Failed to load quotations", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter quotations based on search
  const filteredQuotations = quotations.filter(
    (q) =>
      searchQuery === "" ||
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateQuotation = () => {
    router.push("/quotations/create");
  };

  const handleEditQuotation = (id: string) => {
    router.push(`/quotations/${id}/edit`);
  };

  const handleConvertToInvoice = async (quotation: Quotation) => {
    if (quotation.status === "converted") {
      toast.error("This quotation has already been converted");
      return;
    }

    try {
      const response = await api.convertQuotationToInvoice(quotation._id);
      if (response.success) {
        toast.success("Quotation converted to invoice", {
          description: `${quotation.quotationNumber} has been converted successfully`,
        });
        fetchQuotations(); // Refresh list
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to convert quotation";
      toast.error("Failed to convert quotation", {
        description: errorMessage,
      });
    }
  };

  const handleViewQuotation = (id: string) => {
    router.push(`/quotations/${id}`);
  };

  const openDeleteModal = (quotation: Quotation) => {
    setQuotationToDelete(quotation);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteQuotation = async () => {
    if (!quotationToDelete) return;
    try {
      const response = await api.deleteQuotation(quotationToDelete._id);
      if (response.success) {
        toast.success("Quotation deleted", {
          description: `${quotationToDelete.quotationNumber} has been removed`,
        });
        fetchQuotations();
      } else {
        toast.error("Failed to delete quotation");
        throw new Error();
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "") {
        toast.error("Failed to delete quotation", {
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

  const getStatusBadgeClass = (status: QuotationStatus) => {
    switch (status) {
      case "draft":
        return "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400";
      case "sent":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400";
      case "converted":
        return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-400";
      case "expired":
        return "bg-neutral-100 text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-900/40 dark:text-neutral-400";
      case "cancelled":
        return "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-400";
      default:
        return "bg-neutral-100 text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-900/40 dark:text-neutral-400";
    }
  };

  const getStatusLabel = (status: QuotationStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Quotations
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Manage customer quotations and convert to invoices
          </p>
        </div>
        <Button onClick={handleCreateQuotation} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Quotation
        </Button>
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
                style={{ backgroundColor: "#3b82f615" }}
              >
                <FileText className="h-5 w-5" style={{ color: "#3b82f6" }} strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  All Quotations
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  View and manage customer quotes
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
              placeholder="Search by Quote No or Customer Name..."
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
              Showing {filteredQuotations.length} of {quotations.length} quotations
            </p>
          )}
        </motion.div>

        {/* Table Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading quotations...</p>
              </div>
            </div>
          ) : (
            <div className="[&>div]:rounded-lg [&>div]:border [&>div]:border-neutral-200/60 dark:[&>div]:border-neutral-700/60">
              <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Quote No</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText
                          className="h-12 w-12 text-neutral-300 dark:text-neutral-600"
                          strokeWidth={1.5}
                        />
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          No quotations found
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500">
                          {searchQuery
                            ? "Try adjusting your search"
                            : "Create your first quotation to get started"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotations.map((quotation, index) => (
                    <motion.tr
                      key={quotation._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                    >
                      <TableCell className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
                        {quotation.quotationNumber}
                      </TableCell>
                      <TableCell className="font-medium text-neutral-900 dark:text-white">
                        {quotation.customerName}
                      </TableCell>
                      <TableCell className="text-neutral-600 dark:text-neutral-400">
                        {formatDate(quotation.quotationDate)}
                      </TableCell>
                      <TableCell className="font-semibold text-neutral-900 dark:text-white">
                        {formatCurrency(quotation.grandTotal)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStatusBadgeClass(quotation.status)}
                        >
                          {getStatusLabel(quotation.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        {/* Edit Button */}
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            onClick={() => handleEditQuotation(quotation._id)}
                            aria-label={`Edit ${quotation.quotationNumber}`}
                            title="Edit Quotation"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </motion.div>

                        {/* Convert to Invoice Button */}
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-full ${
                              quotation.status === "converted"
                                ? "cursor-not-allowed opacity-50"
                                : "hover:bg-green-100 dark:hover:bg-green-900/20"
                            }`}
                            onClick={() => handleConvertToInvoice(quotation)}
                            disabled={quotation.status === "converted"}
                            aria-label={`Convert ${quotation.quotationNumber} to invoice`}
                            title="Convert to Invoice"
                          >
                            <ArrowRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </Button>
                        </motion.div>

                        {/* View Button */}
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            onClick={() => handleViewQuotation(quotation._id)}
                            aria-label={`View ${quotation.quotationNumber}`}
                            title="View Quotation"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </motion.div>

                        {/* Delete Button */}
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20"
                            onClick={() => openDeleteModal(quotation)}
                            aria-label={`Delete ${quotation.quotationNumber}`}
                            title="Delete Quotation"
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
        {quotations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="border-t border-neutral-200/60 p-6 dark:border-neutral-700/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Draft: {stats.draft}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Sent: {stats.sent}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Converted: {stats.converted}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Total Value:{" "}
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {formatCurrency(quotations.reduce((sum, q) => sum + q.grandTotal, 0))}
                  </span>
                </span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  Total: {filteredQuotations.length}{" "}
                  {searchQuery ? `of ${quotations.length}` : ""} Quotations
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <DeleteConfirmDialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setQuotationToDelete(null);
        }}
        title="Delete Quotation?"
        description={
          quotationToDelete
            ? `Are you sure you want to delete ${quotationToDelete.quotationNumber}? This cannot be undone.`
            : ""
        }
        onConfirm={handleConfirmDeleteQuotation}
      />
    </div>
  );
}
