"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, CheckCircle, ArrowLeft, AlertCircle, Download } from "lucide-react";
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

type POStatus = "draft" | "sent_to_supplier" | "confirmed" | "partially_received" | "received" | "cancelled";

type POItem = {
  _id: string;
  product?: { name: string; sku: string; unit?: string; coveragePerBox?: number; coveragePerBoxUnit?: string };
  productName: string;
  sku?: string;
  unitType?: string;
  quantityOrdered: number;
  rate: number;
  discountPercent?: number;
  taxPercent?: number;
  lineTotal: number;
  coverageSqm?: number;
  quantityReceived?: number;
  damagedQuantity?: number;
  batchNumber?: string;
  receivedDate?: string | null;
};

type PurchaseOrderDetail = {
  _id: string;
  poNumber: string;
  supplier?: { name: string; supplierNumber?: string };
  supplierName: string;
  poDate: string;
  expectedDeliveryDate?: string;
  warehouseLocation?: string;
  currency?: string;
  paymentTerms?: string;
  deliveryAddress?: string;
  status: POStatus;
  notes?: string;
  createdBy?: { name?: string; email?: string };
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
  const [receiveMode, setReceiveMode] = useState<"auto" | "manual" | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [poData, setPoData] = useState<PurchaseOrderDetail | null>(null);

  useEffect(() => {
    const fetchPO = async () => {
      try {
        const response = await api.getPurchaseOrder(poId);
        if (response.success && response.purchaseOrder) {
          setPoData(response.purchaseOrder as PurchaseOrderDetail);
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

  const handleDownloadPDF = async () => {
    if (!poData) return;
    try {
      setIsPdfLoading(true);
      toast.info("Generating PDF...");
      const blob = await api.getPurchaseOrderPdfBlob(poData._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `purchase-order-${poData.poNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded", {
        description: `${poData.poNumber}.pdf`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to download PDF";
      toast.error("Failed to download PDF", { description: msg });
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleMarkReceived = async (applyStockUpdate = true) => {
    if (!poData) return;
    try {
      setReceiveMode(applyStockUpdate ? "auto" : "manual");
      const response = await api.receivePurchaseOrder(poData._id, { applyStockUpdate });
      if (response.success && response.purchaseOrder) {
        setPoData(response.purchaseOrder as PurchaseOrderDetail);
        const successDescription =
          typeof response.message === "string" && response.message.trim().length > 0
            ? response.message
            : applyStockUpdate
            ? `${poData.poNumber} has been received and stock updated`
            : `${poData.poNumber} has been received (manual stock update mode)`;
        toast.success(
          applyStockUpdate
            ? "Purchase order marked as received"
            : "Purchase order received (manual stock mode)",
          {
            description: successDescription,
          }
        );
      } else {
        toast.error("Failed to mark as received");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to mark as received";
      toast.error(msg);
    } finally {
      setReceiveMode(null);
    }
  };

  const handleBack = () => {
    router.push("/purchase-orders");
  };

  const getStatusBadge = (status: POStatus) => {
    const map: Record<POStatus, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
      sent_to_supplier: { label: "Sent to Supplier", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      confirmed: { label: "Confirmed", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
      partially_received: { label: "Partially Received", className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
      received: { label: "Received", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    };
    const s = map[status] || map.draft;
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isPdfLoading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isPdfLoading ? "Generating..." : "Download PDF"}
          </Button>

          {!["received", "cancelled"].includes(poData.status) && (
            <>
              <Button
                onClick={() => handleMarkReceived(true)}
                disabled={receiveMode !== null}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                {receiveMode === "auto" ? "Marking..." : "Receive + Auto Stock"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleMarkReceived(false)}
                disabled={receiveMode !== null}
                className="flex items-center gap-2"
              >
                {receiveMode === "manual" ? "Marking..." : "Receive (Manual Stock)"}
              </Button>
            </>
          )}
        </div>
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
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Supplier</p>
              <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">{poData.supplierName || poData.supplier?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">PO Date</p>
              <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">{formatDate(poData.poDate)}</p>
            </div>
            {poData.expectedDeliveryDate && (
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Expected Delivery</p>
                <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">{formatDate(poData.expectedDeliveryDate)}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Status</p>
              <div className="mt-1">{getStatusBadge(poData.status)}</div>
            </div>
            {poData.warehouseLocation && (
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Warehouse Location</p>
                <p className="mt-1 font-semibold text-neutral-900 dark:text-white">{poData.warehouseLocation}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Currency</p>
              <p className="mt-1 font-semibold text-neutral-900 dark:text-white">{poData.currency || "AUD"}</p>
            </div>
            {poData.paymentTerms && (
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Payment Terms</p>
                <p className="mt-1 font-semibold text-neutral-900 dark:text-white">{poData.paymentTerms}</p>
              </div>
            )}
            {poData.deliveryAddress && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Delivery Address</p>
                <p className="mt-1 font-semibold text-neutral-900 dark:text-white">{poData.deliveryAddress}</p>
              </div>
            )}
            {poData.createdBy?.name && (
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Created By</p>
                <p className="mt-1 font-semibold text-neutral-900 dark:text-white">{poData.createdBy.name}</p>
              </div>
            )}
            {poData.notes && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Notes</p>
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
                  <TableHead>Product</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Qty Ordered</TableHead>
                  <TableHead>Cost Rate</TableHead>
                  <TableHead>Disc %</TableHead>
                  <TableHead>Tax %</TableHead>
                  <TableHead>Line Total</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Qty Received</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Damaged</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Received Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(poData.items || []).map((item) => {
                  const qtyOrdered = item.quantityOrdered ?? (item as unknown as { quantity?: number }).quantity ?? 0;
                  const qtyRec = item.quantityReceived ?? 0;
                  const damaged = item.damagedQuantity ?? 0;
                  const remaining = Math.max(0, qtyOrdered - qtyRec - damaged);
                  return (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium text-neutral-900 dark:text-white">{getProductDisplay(item)}</TableCell>
                      <TableCell>{item.unitType ?? "Box"}</TableCell>
                      <TableCell className="font-semibold">{qtyOrdered}</TableCell>
                      <TableCell>{formatCurrency(item.rate)}</TableCell>
                      <TableCell>{item.discountPercent ?? 0}%</TableCell>
                      <TableCell>{item.taxPercent ?? 0}%</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(item.lineTotal)}</TableCell>
                      <TableCell className="text-neutral-600 dark:text-neutral-400">{item.coverageSqm != null ? `${item.coverageSqm} sq m` : "—"}</TableCell>
                      <TableCell className="text-green-600 dark:text-green-400">{qtyRec}</TableCell>
                      <TableCell>{remaining}</TableCell>
                      <TableCell className="text-amber-600 dark:text-amber-400">{damaged}</TableCell>
                      <TableCell className="text-xs">{item.batchNumber || "—"}</TableCell>
                      <TableCell className="text-xs">{item.receivedDate ? formatDate(item.receivedDate) : "—"}</TableCell>
                    </TableRow>
                  );
                })}
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

      {/* Goods Receiving / Stock Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`rounded-2xl border p-6 ${poData.status === "received" ? "border-green-200/60 bg-green-50 dark:border-green-700/60 dark:bg-green-900/20" : "border-amber-200/60 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-900/20"}`}
      >
        <div className="flex gap-4">
          <div className="shrink-0">
            {poData.status === "received" ? (
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div>
            <h4 className={`font-bold ${poData.status === "received" ? "text-green-900 dark:text-green-200" : "text-amber-900 dark:text-amber-200"}`}>
              {poData.status === "received"
                ? "Goods received"
                : "Goods Receiving"}
            </h4>
            <p className={`mt-2 text-sm ${poData.status === "received" ? "text-green-800 dark:text-green-300" : "text-amber-800 dark:text-amber-300"}`}>
              {poData.status === "received"
                ? "This PO has been marked as received. If automatic stock-on-receive is enabled, stock has already been increased. Otherwise use Manual Stock Update."
                : "Use one of the receive actions above. Auto mode updates stock immediately; manual mode keeps stock unchanged so you can update it later from Stock Update."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/inventory/stock")}
                className={
                  poData.status === "received"
                    ? "border-green-300 text-green-900 hover:bg-green-100 dark:border-green-600 dark:text-green-200 dark:hover:bg-green-900/30"
                    : "border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-900/30"
                }
              >
                {poData.status === "received" ? "View / Adjust Stock" : "Manual Stock Update"}
              </Button>
              {poData.receivedDate && (
                <span className={`text-xs ${poData.status === "received" ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"}`}>
                  Received on {formatDate(poData.receivedDate)}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
