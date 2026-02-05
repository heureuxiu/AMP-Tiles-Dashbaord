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

type POStatus = "draft" | "received";

type POItem = {
  id: string;
  productSku: string;
  quantity: number;
  rate?: number;
  lineTotal?: number;
};

type PurchaseOrderDetail = {
  poNo: string;
  supplierName: string;
  poDate: string;
  status: POStatus;
  notes?: string;
  items: POItem[];
};

// Mock data
const mockPOData: Record<string, PurchaseOrderDetail> = {
  "PO-2024-001": {
    poNo: "PO-2024-001",
    supplierName: "Tiles International Pty Ltd",
    poDate: "2024-01-28",
    status: "received",
    notes: "Premium tiles order for new project",
    items: [
      {
        id: "1",
        productSku: "CERAMIC-WHITE-60X60",
        quantity: 100,
        rate: 45.0,
        lineTotal: 4500,
      },
      {
        id: "2",
        productSku: "PORCELAIN-GREY-80X80",
        quantity: 50,
        rate: 85.0,
        lineTotal: 4250,
      },
      {
        id: "3",
        productSku: "MARBLE-CLASSIC-60X120",
        quantity: 30,
        rate: 150.0,
        lineTotal: 4500,
      },
      {
        id: "4",
        productSku: "GRANITE-BLACK-30X30",
        quantity: 75,
        rate: 25.0,
        lineTotal: 1875,
      },
      {
        id: "5",
        productSku: "TILES-WOOD-LOOK-20X120",
        quantity: 40,
        rate: 95.0,
        lineTotal: 3800,
      },
    ],
  },
  "PO-2024-002": {
    poNo: "PO-2024-002",
    supplierName: "Stone & Marble Wholesale",
    poDate: "2024-01-29",
    status: "draft",
    notes: "Natural stone collection",
    items: [
      {
        id: "1",
        productSku: "STONE-NATURAL-40X40",
        quantity: 80,
        rate: 55.0,
        lineTotal: 4400,
      },
      {
        id: "2",
        productSku: "MARBLE-CLASSIC-60X120",
        quantity: 45,
        rate: 150.0,
        lineTotal: 6750,
      },
      {
        id: "3",
        productSku: "GRANITE-BLACK-30X30",
        quantity: 60,
        rate: 25.0,
        lineTotal: 1500,
      },
    ],
  },
  "PO-2024-003": {
    poNo: "PO-2024-003",
    supplierName: "Ceramic Pro Supplies",
    poDate: "2024-01-30",
    status: "draft",
    notes: "",
    items: [
      {
        id: "1",
        productSku: "CERAMIC-WHITE-60X60",
        quantity: 150,
        rate: 42.0,
        lineTotal: 6300,
      },
      {
        id: "2",
        productSku: "PORCELAIN-GREY-80X80",
        quantity: 80,
        rate: 82.0,
        lineTotal: 6560,
      },
      {
        id: "3",
        productSku: "MOSAIC-GLASS-30X30",
        quantity: 100,
        rate: 35.0,
        lineTotal: 3500,
      },
      {
        id: "4",
        productSku: "TILES-WOOD-LOOK-20X120",
        quantity: 60,
        rate: 92.0,
        lineTotal: 5520,
      },
    ],
  },
  "PO-2024-004": {
    poNo: "PO-2024-004",
    supplierName: "Porcelain World",
    poDate: "2024-01-26",
    status: "received",
    notes: "Imported porcelain tiles",
    items: [
      {
        id: "1",
        productSku: "PORCELAIN-GREY-80X80",
        quantity: 120,
        rate: 88.0,
        lineTotal: 10560,
      },
      {
        id: "2",
        productSku: "CERAMIC-WHITE-60X60",
        quantity: 90,
        rate: 46.0,
        lineTotal: 4140,
      },
    ],
  },
};

export default function PurchaseOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const poNo = params.poNo as string;

  const [isLoading, setIsLoading] = useState(true);
  const [poData, setPoData] = useState<PurchaseOrderDetail | null>(null);

  useEffect(() => {
    // TODO: Replace with actual API call
    setTimeout(() => {
      const data = mockPOData[poNo];
      if (data) {
        setPoData(data);
      } else {
        toast.error("Purchase Order not found");
        router.push("/purchase-orders");
      }
      setIsLoading(false);
    }, 500);
  }, [poNo, router]);

  const handleMarkReceived = () => {
    if (!poData) return;

    setPoData({ ...poData, status: "received" });
    toast.success("Purchase Order marked as received", {
      description: `${poNo} has been marked as received`,
    });
  };

  const handleBack = () => {
    router.push("/purchase-orders");
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

  const calculateGrandTotal = () => {
    if (!poData) return 0;
    return poData.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
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
              PO #{poNo}
            </h1>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              Purchase order details
            </p>
          </div>
        </div>
        {poData.status === "draft" && (
          <Button
            onClick={handleMarkReceived}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            Mark as Received
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
                {poData.supplierName}
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
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Status
              </p>
              <div className="mt-1">{getStatusBadge(poData.status)}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Total Items
              </p>
              <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
                {poData.items.reduce((sum, item) => sum + item.quantity, 0)} items
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
                {poData.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-neutral-900 dark:text-white">
                      {item.productSku}
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
                {formatCurrency(calculateGrandTotal())}
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
              How to Update Stock (Phase-0)
            </h4>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
              Stock is not auto-updated in this phase. To add received stock, go to{" "}
              <span className="font-semibold">Inventory → Stock Update</span> and enter
              the quantity manually. You may mention this PO number ({poNo}) in remarks
              for tracking purposes.
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
