"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Save, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type POItem = {
  id: string;
  productSku: string;
  quantity: number;
  rate: number;
  lineTotal: number;
};

// Mock data
const mockSuppliers = [
  "Tiles International Pty Ltd",
  "Stone & Marble Wholesale",
  "Ceramic Pro Supplies",
  "Porcelain World",
  "Australian Tile Distributors",
];

const mockProducts = [
  "CERAMIC-WHITE-60X60",
  "PORCELAIN-GREY-80X80",
  "MARBLE-CLASSIC-60X120",
  "GRANITE-BLACK-30X30",
  "TILES-WOOD-LOOK-20X120",
  "MOSAIC-GLASS-30X30",
  "STONE-NATURAL-40X40",
];

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [poDate, setPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<POItem[]>([
    { id: "1", productSku: "", quantity: 0, rate: 0, lineTotal: 0 },
  ]);

  const handleAddItem = () => {
    const newItem: POItem = {
      id: Date.now().toString(),
      productSku: "",
      quantity: 0,
      rate: 0,
      lineTotal: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof POItem,
    value: string | number
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Auto-calculate line total
          if (field === "quantity" || field === "rate") {
            updatedItem.lineTotal = updatedItem.quantity * updatedItem.rate;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const validateForm = () => {
    if (!supplier) {
      toast.error("Please select a supplier");
      return false;
    }

    if (items.length === 0) {
      toast.error("At least one item is required");
      return false;
    }

    for (const item of items) {
      if (!item.productSku) {
        toast.error("All items must have a product/SKU selected");
        return false;
      }
      if (item.quantity <= 0) {
        toast.error("Quantity must be greater than 0");
        return false;
      }
    }

    return true;
  };

  const handleSaveDraft = () => {
    if (!validateForm()) return;

    // TODO: Implement actual API call
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Purchase Order saved as draft", {
        description: "PO has been saved successfully",
      });
      router.push("/purchase-orders");
    }, 1000);
  };

  const handleCancel = () => {
    router.push("/purchase-orders");
  };

  const calculateTotalItems = () => {
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Create Purchase Order
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Create a new purchase order for supplier
          </p>
        </div>
      </div>

      {/* PO Header Card */}
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
                PO Header Information
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Enter purchase order details
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Supplier */}
            <div className="space-y-2">
              <Label htmlFor="supplier">
                Supplier <span className="text-red-500">*</span>
              </Label>
              <select
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-slate-100 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-amp-primary focus:bg-transparent focus:ring-2 focus:ring-amp-primary/20 dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="">Select Supplier</option>
                {mockSuppliers.map((sup) => (
                  <option key={sup} value={sup}>
                    {sup}
                  </option>
                ))}
              </select>
            </div>

            {/* PO Date */}
            <div className="space-y-2">
              <Label htmlFor="poDate">PO Date</Label>
              <Input
                id="poDate"
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional notes"
                rows={3}
                className="w-full rounded-md border border-gray-200 bg-slate-100 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/50 focus:border-amp-primary focus:bg-transparent focus:ring-2 focus:ring-amp-primary/20 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* PO Items Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
      >
        <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white">PO Items</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Add products to this purchase order
              </p>
            </div>
            <Button
              onClick={handleAddItem}
              size="sm"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[200px]">
                    Product / SKU <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    Quantity <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="min-w-[120px]">Rate (Optional)</TableHead>
                  <TableHead className="min-w-[120px]">Line Total</TableHead>
                  <TableHead className="w-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <select
                        value={item.productSku}
                        onChange={(e) =>
                          handleItemChange(item.id, "productSku", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-200 bg-slate-100 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-amp-primary focus:bg-transparent focus:ring-2 focus:ring-amp-primary/20 dark:border-neutral-700 dark:bg-neutral-900"
                      >
                        <option value="">Select Product</option>
                        {mockProducts.map((product) => (
                          <option key={product} value={product}>
                            {product}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          handleItemChange(item.id, "quantity", Number(e.target.value))
                        }
                        placeholder="0"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate || ""}
                        onChange={(e) =>
                          handleItemChange(item.id, "rate", Number(e.target.value))
                        }
                        placeholder="0.00"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-neutral-900 dark:text-white">
                      {formatCurrency(item.lineTotal)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>

      {/* Summary Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Items</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {calculateTotalItems()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Grand Total</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(calculateGrandTotal())}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex gap-3"
      >
        <Button
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save as Draft"}
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </motion.div>
    </div>
  );
}
