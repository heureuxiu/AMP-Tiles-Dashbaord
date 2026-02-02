"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, PencilIcon, FileText, Eye, ArrowRight, Search, X } from "lucide-react";
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

type QuotationStatus = "draft" | "converted";

// Mock quotations data
const initialQuotations = [
  {
    id: "QT-2024-001",
    customerName: "John Smith",
    date: "2024-01-28",
    totalAmount: 2450,
    status: "draft" as QuotationStatus,
  },
  {
    id: "QT-2024-002",
    customerName: "Sarah Johnson",
    date: "2024-01-27",
    totalAmount: 3200,
    status: "draft" as QuotationStatus,
  },
  {
    id: "QT-2024-003",
    customerName: "Mike Wilson",
    date: "2024-01-26",
    totalAmount: 1800,
    status: "converted" as QuotationStatus,
  },
  {
    id: "QT-2024-004",
    customerName: "Emma Davis",
    date: "2024-01-25",
    totalAmount: 4100,
    status: "draft" as QuotationStatus,
  },
  {
    id: "QT-2024-005",
    customerName: "David Brown",
    date: "2024-01-24",
    totalAmount: 2950,
    status: "converted" as QuotationStatus,
  },
  {
    id: "QT-2024-006",
    customerName: "Lisa Anderson",
    date: "2024-01-23",
    totalAmount: 5600,
    status: "draft" as QuotationStatus,
  },
  {
    id: "QT-2024-007",
    customerName: "Robert Taylor",
    date: "2024-01-22",
    totalAmount: 1250,
    status: "converted" as QuotationStatus,
  },
  {
    id: "QT-2024-008",
    customerName: "Jennifer White",
    date: "2024-01-21",
    totalAmount: 3800,
    status: "draft" as QuotationStatus,
  },
];

type Quotation = {
  id: string;
  customerName: string;
  date: string;
  totalAmount: number;
  status: QuotationStatus;
};

export default function QuotationsPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter quotations based on search
  const filteredQuotations = quotations.filter(
    (q) =>
      searchQuery === "" ||
      q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const draftCount = quotations.filter((q) => q.status === "draft").length;
  const convertedCount = quotations.filter((q) => q.status === "converted").length;

  const handleCreateQuotation = () => {
    router.push("/quotations/create");
  };

  const handleEditQuotation = (id: string) => {
    router.push(`/quotations/${id}/edit`);
  };

  const handleConvertToInvoice = (quotation: Quotation) => {
    if (quotation.status === "converted") {
      toast.error("This quotation has already been converted");
      return;
    }

    setQuotations(
      quotations.map((q) =>
        q.id === quotation.id ? { ...q, status: "converted" as QuotationStatus } : q
      )
    );
    toast.success("Quotation converted to invoice", {
      description: `${quotation.id} has been converted successfully`,
    });
  };

  const handleViewQuotation = (id: string) => {
    router.push(`/quotations/${id}`);
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
                      key={quotation.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                    >
                      <TableCell className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
                        {quotation.id}
                      </TableCell>
                      <TableCell className="font-medium text-neutral-900 dark:text-white">
                        {quotation.customerName}
                      </TableCell>
                      <TableCell className="text-neutral-600 dark:text-neutral-400">
                        {formatDate(quotation.date)}
                      </TableCell>
                      <TableCell className="font-semibold text-neutral-900 dark:text-white">
                        {formatCurrency(quotation.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            quotation.status === "draft"
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400"
                              : "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-400"
                          }
                        >
                          {quotation.status === "draft" ? "Draft" : "Converted"}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        {/* Edit Button */}
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            onClick={() => handleEditQuotation(quotation.id)}
                            aria-label={`Edit ${quotation.id}`}
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
                            aria-label={`Convert ${quotation.id} to invoice`}
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
                            onClick={() => handleViewQuotation(quotation.id)}
                            aria-label={`View ${quotation.id}`}
                            title="View Quotation"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
                    Draft: {draftCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Converted: {convertedCount}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Total Value:{" "}
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {formatCurrency(quotations.reduce((sum, q) => sum + q.totalAmount, 0))}
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
    </div>
  );
}
