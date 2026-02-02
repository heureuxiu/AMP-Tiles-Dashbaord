"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Receipt, Eye, Download, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Mock invoices data (converted from quotations)
const initialInvoices = [
  {
    id: "INV-2024-001",
    quotationId: "QT-2024-003",
    customerName: "Mike Wilson",
    invoiceDate: "2024-01-26",
    totalAmount: 1800,
  },
  {
    id: "INV-2024-002",
    quotationId: "QT-2024-005",
    customerName: "David Brown",
    invoiceDate: "2024-01-24",
    totalAmount: 2950,
  },
  {
    id: "INV-2024-003",
    quotationId: "QT-2024-007",
    customerName: "Robert Taylor",
    invoiceDate: "2024-01-22",
    totalAmount: 1250,
  },
  {
    id: "INV-2024-004",
    quotationId: "QT-2024-010",
    customerName: "Alice Cooper",
    invoiceDate: "2024-01-28",
    totalAmount: 5600,
  },
  {
    id: "INV-2024-005",
    quotationId: "QT-2024-011",
    customerName: "Carol White",
    invoiceDate: "2024-01-26",
    totalAmount: 2800,
  },
  {
    id: "INV-2024-006",
    quotationId: "QT-2024-012",
    customerName: "Daniel Lee",
    invoiceDate: "2024-01-25",
    totalAmount: 4200,
  },
];

type Invoice = {
  id: string;
  quotationId: string;
  customerName: string;
  invoiceDate: string;
  totalAmount: number;
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices] = useState<Invoice[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter invoices based on search
  const filteredInvoices = invoices.filter(
    (inv) =>
      searchQuery === "" ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewInvoice = (id: string) => {
    router.push(`/invoices/${id}`);
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    toast.info(`Generating PDF for ${invoice.id}...`);
    // TODO: Implement PDF generation
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
          <div className="[&>div]:rounded-lg [&>div]:border [&>div]:border-neutral-200/60 dark:[&>div]:border-neutral-700/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead className="w-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
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
                      key={invoice.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                    >
                      <TableCell className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
                        {invoice.id}
                      </TableCell>
                      <TableCell className="font-medium text-neutral-900 dark:text-white">
                        {invoice.customerName}
                      </TableCell>
                      <TableCell className="text-neutral-600 dark:text-neutral-400">
                        {formatDate(invoice.invoiceDate)}
                      </TableCell>
                      <TableCell className="font-semibold text-neutral-900 dark:text-white">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        {/* View Button */}
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            onClick={() => handleViewInvoice(invoice.id)}
                            aria-label={`View ${invoice.id}`}
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
                            aria-label={`Download ${invoice.id}`}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4 text-purple-600 dark:text-purple-400" />
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
        {invoices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="border-t border-neutral-200/60 p-6 dark:border-neutral-700/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Total Revenue:{" "}
                <span className="font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(invoices.reduce((sum, inv) => sum + inv.totalAmount, 0))}
                </span>
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
