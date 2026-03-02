"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Eye, CheckCircle, Plus, Filter, X, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

type POStatus = "draft" | "sent" | "sent_to_supplier" | "confirmed" | "partially_received" | "received" | "cancelled";

const PO_STATUS_OPTIONS: { value: POStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent_to_supplier", label: "Sent to Supplier" },
  { value: "sent", label: "Sent" },
  { value: "confirmed", label: "Confirmed" },
  { value: "partially_received", label: "Partially Received" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_DOT_COLORS: Record<POStatus, string> = {
  draft: "bg-amber-500",
  sent: "bg-blue-500",
  sent_to_supplier: "bg-blue-500",
  confirmed: "bg-indigo-500",
  partially_received: "bg-cyan-500",
  received: "bg-green-500",
  cancelled: "bg-red-500",
};

type PurchaseOrder = {
  _id: string;
  poNumber: string;
  supplierName: string;
  supplier?: { _id: string; name: string };
  poDate: string;
  status: POStatus;
  items: { quantityOrdered?: number; quantity?: number; rate: number; lineTotal?: number }[];
  grandTotal: number;
};

type Supplier = { _id: string; name: string };

type Stats = {
  total: number;
  draft?: number;
  sent_to_supplier?: number;
  confirmed?: number;
  partially_received?: number;
  received?: number;
  cancelled?: number;
  sent?: number;
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | POStatus>("all");
  const [stats, setStats] = useState<Stats>({
    total: 0,
    draft: 0,
    sent_to_supplier: 0,
    confirmed: 0,
    partially_received: 0,
    received: 0,
    cancelled: 0,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [poResponse, suppliersResponse] = await Promise.all([
        api.getPurchaseOrders(),
        api.getSuppliers(),
      ]);

      if (poResponse.success && poResponse.purchaseOrders) {
        setPurchaseOrders(poResponse.purchaseOrders as PurchaseOrder[]);
        if (poResponse.stats) {
          setStats(poResponse.stats as Stats);
        }
      }

      if (suppliersResponse.success && suppliersResponse.suppliers) {
        setSuppliers(suppliersResponse.suppliers as Supplier[]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load data";
      toast.error("Failed to load purchase orders", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter purchase orders
  const filteredPurchaseOrders = purchaseOrders.filter((po) => {
    const matchesSupplier = supplierFilter === "all" || po.supplier?._id === supplierFilter;
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;
    return matchesSupplier && matchesStatus;
  });

  const handleView = (id: string) => {
    router.push(`/purchase-orders/${id}`);
  };

  const handleStatusChange = async (poId: string, newStatus: POStatus) => {
    try {
      setUpdatingStatusId(poId);
      const response = await api.updatePurchaseOrder(poId, { status: newStatus });
      if (response.success) {
        toast.success("Status updated", {
          description: `PO status changed to ${PO_STATUS_OPTIONS.find((s) => s.value === newStatus)?.label ?? newStatus}`,
        });
        fetchData();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update status";
      toast.error("Failed to update status", { description: errorMessage });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleMarkReceived = async (id: string, poNumber: string) => {
    try {
      const response = await api.receivePurchaseOrder(id);
      if (response.success) {
        toast.success("Purchase Order marked as received", {
          description: `${poNumber} has been marked as received and stock updated`,
        });
        fetchData();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to mark as received";
      toast.error("Failed to mark as received", {
        description: errorMessage,
      });
    }
  };

  const handleCreatePO = () => {
    router.push("/purchase-orders/create");
  };

  const openDeleteModal = (po: PurchaseOrder) => {
    setPoToDelete(po);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeletePurchaseOrder = async () => {
    if (!poToDelete) return;
    try {
      const response = await api.deletePurchaseOrder(poToDelete._id);
      if (response.success) {
        toast.success("Purchase order deleted", {
          description: `${poToDelete.poNumber} has been removed`,
        });
        fetchData();
      } else {
        toast.error("Failed to delete purchase order");
        throw new Error();
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "") {
        toast.error("Failed to delete purchase order", {
          description: error.message,
        });
      }
      throw error;
    }
  };

  const STATUS_STYLE: Record<POStatus, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    sent: { label: "Sent", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    sent_to_supplier: { label: "Sent to Supplier", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    confirmed: { label: "Confirmed", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
    partially_received: { label: "Part. Received", className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
    received: { label: "Received", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  };

  const getStatusBadge = (status: POStatus) => {
    const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const hasActiveFilters = supplierFilter !== "all" || statusFilter !== "all";

  return (
    <div className="min-w-0 w-full space-y-4 p-3 sm:space-y-6 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            Purchase Orders
          </h1>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
            Track and manage purchase orders
          </p>
        </div>
        <Button
          onClick={handleCreatePO}
          className="w-full shrink-0 gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Create Purchase Order
        </Button>
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
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#8b5cf6" }} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-neutral-900 dark:text-white sm:text-base">
                All Purchase Orders
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                Manage supplier purchase orders
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-6"
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Filter className="h-4 w-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Filters:
            </span>

            {/* Supplier Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {supplierFilter === "all" 
                    ? "All Suppliers" 
                    : suppliers.find(s => s._id === supplierFilter)?.name || "All Suppliers"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                <DropdownMenuItem onClick={() => setSupplierFilter("all")}>
                  All Suppliers
                </DropdownMenuItem>
                {suppliers.map((supplier) => (
                  <DropdownMenuItem
                    key={supplier._id}
                    onClick={() => setSupplierFilter(supplier._id)}
                  >
                    {supplier.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {statusFilter === "all"
                    ? "All Status"
                    : statusFilter === "sent_to_supplier"
                    ? "Sent to Supplier"
                    : statusFilter === "partially_received"
                    ? "Partially Received"
                    : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("draft")}>Draft</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("sent_to_supplier")}>Sent to Supplier</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("confirmed")}>Confirmed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("partially_received")}>Partially Received</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("received")}>Received</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>Cancelled</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSupplierFilter("all");
                  setStatusFilter("all");
                }}
                className="gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <X className="h-3 w-3" />
                Clear Filters
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Showing {filteredPurchaseOrders.length} of {purchaseOrders.length} purchase orders
            </p>
          )}
        </motion.div>

        {/* Table Content */}
        <div className="overflow-x-auto p-3 sm:p-6">
          <div className="inline-block min-w-full align-middle">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading purchase orders...</p>
              </div>
            </div>
          ) : (
            <div className="[&>div]:rounded-lg [&>div]:border [&>div]:border-neutral-200/60 dark:[&>div]:border-neutral-700/60">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>PO No</TableHead>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>PO Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Items</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead className="w-0">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchaseOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ShoppingCart
                            className="h-12 w-12 text-neutral-300 dark:text-neutral-600"
                            strokeWidth={1.5}
                          />
                          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            No purchase orders found
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500">
                            {hasActiveFilters
                              ? "Try adjusting your filters"
                              : "Create your first purchase order to get started"}
                          </p>
                          {!hasActiveFilters && (
                            <Button
                              onClick={handleCreatePO}
                              className="mt-2 flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                            >
                              <Plus className="h-4 w-4" />
                              Create Purchase Order
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPurchaseOrders.map((po, index) => (
                      <motion.tr
                        key={po._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                      >
                        <TableCell className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
                          {po.poNumber}
                        </TableCell>
                        <TableCell className="font-medium text-neutral-900 dark:text-white">
                          {po.supplierName}
                        </TableCell>
                        <TableCell className="text-neutral-600 dark:text-neutral-400">
                          {formatDate(po.poDate)}
                        </TableCell>
                        <TableCell>{getStatusBadge(po.status)}</TableCell>
                        <TableCell className="font-semibold text-neutral-900 dark:text-white">
                          {po.items?.length || 0} items
                        </TableCell>
                        <TableCell className="font-semibold text-neutral-900 dark:text-white">
                          {formatCurrency(po.grandTotal)}
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          {/* View Button */}
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                              onClick={() => handleView(po._id)}
                              aria-label={`View ${po.poNumber}`}
                              title="View Purchase Order"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </motion.div>

                          {/* Status change dropdown (badge-style trigger + options with colored dots) */}
                          {po.status !== "received" && po.status !== "cancelled" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={updatingStatusId === po._id}
                                  className={`h-8 shrink-0 gap-1.5 rounded-lg border-0 px-2.5 py-1 text-xs font-medium shadow-sm hover:opacity-90 ${STATUS_STYLE[po.status]?.className ?? STATUS_STYLE.draft.className}`}
                                >
                                  {STATUS_STYLE[po.status]?.label ?? "Draft"}
                                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-[180px] rounded-lg p-1 shadow-lg">
                                {PO_STATUS_OPTIONS.map((opt) => (
                                  <DropdownMenuItem
                                    key={opt.value}
                                    onClick={() => handleStatusChange(po._id, opt.value)}
                                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm focus:bg-neutral-100 dark:focus:bg-neutral-700"
                                  >
                                    <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT_COLORS[opt.value]}`} />
                                    {opt.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          {/* Mark as Received Button (only for draft/sent) */}
                          {!["received", "cancelled"].includes(po.status) && (
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20"
                                onClick={() => handleMarkReceived(po._id, po.poNumber)}
                                aria-label={`Mark ${po.poNumber} as received`}
                                title="Mark as Received"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </Button>
                            </motion.div>
                          )}
                          {/* Delete Button (backend allows only draft) */}
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 rounded-full ${
                                po.status !== "draft"
                                  ? "cursor-not-allowed opacity-50"
                                  : "hover:bg-red-100 dark:hover:bg-red-900/20"
                              }`}
                              onClick={() => openDeleteModal(po)}
                              disabled={po.status !== "draft"}
                              aria-label={`Delete ${po.poNumber}`}
                              title={po.status === "draft" ? "Delete Purchase Order" : "Only draft orders can be deleted"}
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
        {!isLoading && purchaseOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="border-t border-neutral-200/60 p-4 sm:p-6 dark:border-neutral-700/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{stats.draft ?? 0} Draft</Badge>
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{stats.sent_to_supplier ?? 0} Sent</Badge>
                <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{stats.confirmed ?? 0} Confirmed</Badge>
                <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">{stats.partially_received ?? 0} Part. Rec.</Badge>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{stats.received ?? 0} Received</Badge>
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{stats.cancelled ?? 0} Cancelled</Badge>
              </div>
              <span className="font-bold text-neutral-900 dark:text-white">
                Total: {filteredPurchaseOrders.length}{" "}
                {hasActiveFilters ? `of ${purchaseOrders.length}` : ""} Purchase Orders
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

      <DeleteConfirmDialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setPoToDelete(null);
        }}
        title="Delete Purchase Order?"
        description={
          poToDelete
            ? `Are you sure you want to delete ${poToDelete.poNumber}? This cannot be undone.`
            : ""
        }
        onConfirm={handleConfirmDeletePurchaseOrder}
      />
    </div>
  );
}
