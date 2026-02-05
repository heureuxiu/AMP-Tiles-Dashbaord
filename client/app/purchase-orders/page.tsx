"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Eye, CheckCircle, Edit, Plus, Filter, X } from "lucide-react";
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

type POStatus = "draft" | "received";

type PurchaseOrder = {
  id: string;
  poNo: string;
  supplierName: string;
  poDate: string;
  status: POStatus;
  totalItems: number;
  totalAmount?: number;
};

// Mock data
const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: "1",
    poNo: "PO-2024-001",
    supplierName: "Tiles International Pty Ltd",
    poDate: "2024-01-28",
    status: "received",
    totalItems: 5,
    totalAmount: 15000,
  },
  {
    id: "2",
    poNo: "PO-2024-002",
    supplierName: "Stone & Marble Wholesale",
    poDate: "2024-01-29",
    status: "draft",
    totalItems: 3,
    totalAmount: 8500,
  },
  {
    id: "3",
    poNo: "PO-2024-003",
    supplierName: "Ceramic Pro Supplies",
    poDate: "2024-01-30",
    status: "draft",
    totalItems: 8,
    totalAmount: 22000,
  },
  {
    id: "4",
    poNo: "PO-2024-004",
    supplierName: "Porcelain World",
    poDate: "2024-01-26",
    status: "received",
    totalItems: 4,
    totalAmount: 12500,
  },
];

const mockSuppliers = [
  "All Suppliers",
  "Tiles International Pty Ltd",
  "Stone & Marble Wholesale",
  "Ceramic Pro Supplies",
  "Porcelain World",
  "Australian Tile Distributors",
];

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [supplierFilter, setSupplierFilter] = useState("All Suppliers");
  const [statusFilter, setStatusFilter] = useState<"all" | POStatus>("all");

  // Filter purchase orders
  const filteredPurchaseOrders = purchaseOrders.filter((po) => {
    const matchesSupplier =
      supplierFilter === "All Suppliers" || po.supplierName === supplierFilter;
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;
    return matchesSupplier && matchesStatus;
  });

  const handleView = (poNo: string) => {
    router.push(`/purchase-orders/${poNo}`);
  };

  const handleEdit = (poNo: string) => {
    router.push(`/purchase-orders/${poNo}/edit`);
  };

  const handleMarkReceived = (poNo: string) => {
    setPurchaseOrders(
      purchaseOrders.map((po) =>
        po.poNo === poNo ? { ...po, status: "received" as POStatus } : po
      )
    );
    toast.success("Purchase Order marked as received", {
      description: `${poNo} has been marked as received`,
    });
  };

  const handleCreatePO = () => {
    router.push("/purchase-orders/create");
  };

  const getStatusBadge = (status: POStatus) => {
    if (status === "received") {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
          Received
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
        Draft
      </Badge>
    );
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

  const hasActiveFilters = supplierFilter !== "All Suppliers" || statusFilter !== "all";

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Purchase Orders
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Track and manage purchase orders
          </p>
        </div>
        <Button
          onClick={handleCreatePO}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
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
                <ShoppingCart className="h-5 w-5" style={{ color: "#8b5cf6" }} strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  All Purchase Orders
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Manage supplier purchase orders
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Filters:
            </span>

            {/* Supplier Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {supplierFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                {mockSuppliers.map((supplier) => (
                  <DropdownMenuItem
                    key={supplier}
                    onClick={() => setSupplierFilter(supplier)}
                  >
                    {supplier}
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
                    : statusFilter === "draft"
                    ? "Draft"
                    : "Received"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
                  Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("received")}>
                  Received
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSupplierFilter("All Suppliers");
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
        <div className="p-6">
          <div className="[&>div]:rounded-lg [&>div]:border [&>div]:border-neutral-200/60 dark:[&>div]:border-neutral-700/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>PO No</TableHead>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>PO Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Items</TableHead>
                  <TableHead className="w-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
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
                      key={po.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                    >
                      <TableCell className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
                        {po.poNo}
                      </TableCell>
                      <TableCell className="font-medium text-neutral-900 dark:text-white">
                        {po.supplierName}
                      </TableCell>
                      <TableCell className="text-neutral-600 dark:text-neutral-400">
                        {formatDate(po.poDate)}
                      </TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell className="font-semibold text-neutral-900 dark:text-white">
                        {po.totalItems} items
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        {/* View Button */}
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            onClick={() => handleView(po.poNo)}
                            aria-label={`View ${po.poNo}`}
                            title="View Purchase Order"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </motion.div>

                        {/* Mark as Received Button (only for draft) */}
                        {po.status === "draft" && (
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20"
                              onClick={() => handleMarkReceived(po.poNo)}
                              aria-label={`Mark ${po.poNo} as received`}
                              title="Mark as Received"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </Button>
                          </motion.div>
                        )}

                        {/* Edit Button (only for draft) */}
                        {po.status === "draft" && (
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/20"
                              onClick={() => handleEdit(po.poNo)}
                              aria-label={`Edit ${po.poNo}`}
                              title="Edit Purchase Order"
                            >
                              <Edit className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </Button>
                          </motion.div>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Summary */}
        {purchaseOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="border-t border-neutral-200/60 p-6 dark:border-neutral-700/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
                    {purchaseOrders.filter((po) => po.status === "draft").length} Draft
                  </Badge>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                    {purchaseOrders.filter((po) => po.status === "received").length} Received
                  </Badge>
                </div>
              </div>
              <span className="font-bold text-neutral-900 dark:text-white">
                Total: {filteredPurchaseOrders.length}{" "}
                {hasActiveFilters ? `of ${purchaseOrders.length}` : ""} Purchase Orders
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
