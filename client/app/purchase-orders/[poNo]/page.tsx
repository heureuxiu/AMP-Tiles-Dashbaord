"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
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
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";

type POStatus = "draft" | "sent" | "received" | "cancelled";

type POItem = {
  _id: string;
  product?: { name: string; sku: string; unit?: string };
  productName: string;
  quantity: number;
  rate: number;
  lineTotal: number;
};

type PurchaseOrderDetail = {
  _id: string;
  poNumber: string;
  supplier?: { name: string; supplierNumber?: string };
  supplierName: string;
  poDate: string;
  expectedDeliveryDate?: string;
  status: POStatus;
  notes?: string;
  items: POItem[];
  subtotal: number;
  tax?: number;
  grandTotal: number;
  receivedDate?: string;
};

export default function PurchaseOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const poId = params.poNo as string; // From list we pass _id, so URL is /purchase-orders/:id

  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingReceived, setIsMarkingReceived] = useState(false);
  const [poData, setPoData] = useState<PurchaseOrderDetail | null>(null);

  useEffect(() => {
    const fetchPO = async () => {
      try {
        const response = await api.getPurchaseOrder(poId);
        if (response.success && response.purchaseOrder) {
          setPoData(response.purchaseOrder);
        } else {
          toast.error("Purchase order not found");
          router.push("/purchase-orders");
        }
      } catch {
        toast.error("Failed to load purchase order");
        router.push("/purchase-orders");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPO();
  }, [poId, router]);

  const handleMarkReceived = async () => {
    if (!poData) return;
    try {
      setIsMarkingReceived(true);
      const response = await api.receivePurchaseOrder(poData._id);
      if (response.success && response.purchaseOrder) {
        setPoData(response.purchaseOrder);
        toast.success("Purchase order marked as received", {
          description: `${poData.poNumber} has been received and stock updated`,
        });
      } else {
        toast.error("Failed to mark as received");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to mark as received";
      toast.error(msg);
    } finally {
      setIsMarkingReceived(false);
    }
  };

  const handleBack = () => {
    router.push("/purchase-orders");
  };

  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case "received":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
            Received
          </Badge>
        );
      case "sent":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
            Sent
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
            Draft
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount == null) return "-";
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const getProductDisplay = (item: POItem) => {
    const name = item.productName || item.product?.name;
    const sku = item.product?.sku;
    return sku ? `${name} (${sku})` : name || "—";
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Loading purchase order...
          </p>
        </div>
      </div>
    );
  }

  if (!poData) {
    return null;
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {poData.poNumber}
            </h1>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              Purchase order details
            </p>
          </div>
        </div>
        {(poData.status === "draft" || poData.status === "sent") && (
          <Button
            onClick={handleMarkReceived}
            disabled={isMarkingReceived}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            {isMarkingReceived ? "Marking..." : "Mark as Received"}
          </Button>
        )}
      </div>

      {/* Supplier & PO Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
      >
        <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#8b5cf615" }}
            >
              <ShoppingCart
                className="h-5 w-5"
                style={{ color: "#8b5cf6" }}
                strokeWidth={2}
              />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white">
                Purchase Order Information
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Supplier and PO details
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Supplier Name
              </p>
              <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
                {poData.supplierName || poData.supplier?.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                PO Date
              </p>
              <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
                {formatDate(poData.poDate)}
              </p>
            </div>
            {poData.expectedDeliveryDate && (
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Expected Delivery
                </p>
                <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
                  {formatDate(poData.expectedDeliveryDate)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Status
              </p>
              <div className="mt-1">{getStatusBadge(poData.status)}</div>
            </div>
            {poData.status === "received" && poData.receivedDate && (
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Received On
                </p>
                <p className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatDate(poData.receivedDate)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Total Items
              </p>
              <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
                {poData.items?.length ?? 0} line items
              </p>
            </div>
            {poData.notes && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Notes
                </p>
                <p className="mt-1 text-neutral-900 dark:text-white">{poData.notes}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Items Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
      >
        <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
          <h3 className="font-bold text-neutral-900 dark:text-white">Items</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Products in this purchase order
          </p>
        </div>

        <div className="p-6">
          <div className="[&>div]:rounded-lg [&>div]:border [&>div]:border-neutral-200/60 dark:[&>div]:border-neutral-700/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Product / SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(poData.items || []).map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium text-neutral-900 dark:text-white">
                      {getProductDisplay(item)}
                    </TableCell>
                    <TableCell className="font-semibold text-neutral-900 dark:text-white">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-neutral-600 dark:text-neutral-400">
                      {formatCurrency(item.rate)}
                    </TableCell>
                    <TableCell className="font-semibold text-neutral-900 dark:text-white">
                      {formatCurrency(item.lineTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Grand Total */}
          <div className="mt-4 flex justify-end border-t border-neutral-200/60 pt-4 dark:border-neutral-700/60">
            <div className="text-right">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Grand Total</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(poData.grandTotal)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stock Update Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-2xl border border-amber-200/60 bg-amber-50 p-6 dark:border-amber-700/60 dark:bg-amber-900/20"
      >
        <div className="flex gap-4">
          <div className="shrink-0">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-200">
              {poData.status === "received"
                ? "Stock from this PO"
                : "How to Update Stock (Phase-0)"}
            </h4>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
              {poData.status === "received"
                ? "This purchase order has been marked as received. You can still view its details above. Stock updates are reflected in Inventory → Stock Update."
                : "Stock is not auto-updated in this phase. After marking as received, go to Inventory → Stock Update and enter the quantity manually. You may mention this PO number (" +
                  poData.poNumber +
                  ") in remarks for tracking."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/inventory/stock")}
              className="mt-4 border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-900/30"
            >
              Go to Stock Update
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
