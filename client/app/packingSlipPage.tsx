"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Download, Search, X } from "lucide-react";
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
import { api } from "@/lib/api";

type Invoice = {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  customerAddress?: string;
  invoiceDate: string;
  items: Array<{
    _id: string;
    productName: string;
    unitType?: string;
    quantity: number;
  }>;
};

export default function PackingSlipPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await api.getInvoices({ sortBy: "createdAt", sortOrder: "desc" });
      if (response.success && response.invoices) {
        setInvoices(response.invoices as Invoice[]);
      }
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      searchQuery === "" ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerPhone && inv.customerPhone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const handleDownloadPackingSlip = async (invoice: Invoice) => {
    try {
      setDownloadingId(invoice._id);
      toast.info(`Generating packing slip for ${invoice.invoiceNumber}...`);
      const blob = await api.getPackingSlipPdfBlob(invoice._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `packing-slip-${invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Packing slip downloaded", {
        description: `packing-slip-${invoice.invoiceNumber}.pdf`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download packing slip";
      toast.error("Failed to download packing slip", { description: message });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-w-0 w-full space-y-4 p-3 sm:space-y-6 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
          Packing Slips
        </h1>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
          Download warehouse packing slips for each invoice
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-w-0 overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:rounded-2xl"
      >
        <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
              style={{ backgroundColor: "#10b98115" }}
            >
              <Package className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#10b981" }} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-neutral-900 dark:text-white sm:text-base">
                All Packing Slips
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                One packing slip is available per invoice - for warehouse / packing use
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-6">
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
                type="button"
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
        </div>

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
                      <TableHead>Phone</TableHead>
                      <TableHead>Delivery Address</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="w-0">Download</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Package className="h-12 w-12 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
                            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                              No invoices found
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              {searchQuery ? "Try adjusting your search" : "Convert quotations to create invoices first"}
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
                          transition={{ duration: 0.3, delay: index * 0.04 }}
                          className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                        >
                          <TableCell className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell className="font-medium text-neutral-900 dark:text-white">
                            {invoice.customerName}
                          </TableCell>
                          <TableCell className="text-neutral-600 dark:text-neutral-400">
                            {invoice.customerPhone || "-"}
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate text-neutral-600 dark:text-neutral-400">
                            {invoice.deliveryAddress || invoice.customerAddress || "-"}
                          </TableCell>
                          <TableCell className="text-neutral-600 dark:text-neutral-400">
                            {formatDate(invoice.invoiceDate)}
                          </TableCell>
                          <TableCell className="text-neutral-600 dark:text-neutral-400">
                            {invoice.items?.length ?? 0} item{(invoice.items?.length ?? 0) !== 1 ? "s" : ""}
                          </TableCell>
                          <TableCell>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                disabled={downloadingId === invoice._id}
                                onClick={() => handleDownloadPackingSlip(invoice)}
                              >
                                <Download className="h-4 w-4" />
                                {downloadingId === invoice._id ? "Generating..." : "Packing Slip"}
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
      </motion.div>
    </div>
  );
}
