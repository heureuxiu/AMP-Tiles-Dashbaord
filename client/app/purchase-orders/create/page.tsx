"use client";

import { useState, useEffect } from "react";
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
import { api } from "@/lib/api";

const UNIT_TYPES = ["Box", "Sq Ft", "Piece", "Pallet"] as const;
const PAYMENT_TERMS = ["", "COD", "Net 7", "Net 15", "Net 30", "Net 60"];
const CURRENCIES = ["AUD", "USD", "EUR", "GBP"];

type POItem = {
  id: string;
  product: string;
  productName: string;
  unitType: string;
  quantityOrdered: number;
  rate: number;
  discountPercent: number;
  taxPercent: number;
  lineTotal: number;
  coverageSqm?: number;
};

type Supplier = {
  _id: string;
  name: string;
  supplierNumber?: string;
};

type Product = {
  _id: string;
  name: string;
  sku: string;
  price?: number;
  retailPrice?: number;
  coveragePerBox?: number;
  coveragePerBoxUnit?: string;
  tilesPerBox?: number;
};

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplier, setSupplier] = useState("");
  const [poDate, setPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [currency, setCurrency] = useState("AUD");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<POItem[]>([
    { id: "1", product: "", productName: "", unitType: "Box", quantityOrdered: 0, rate: 0, discountPercent: 0, taxPercent: 0, lineTotal: 0 },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoadingData(true);
      const [suppliersResponse, productsResponse] = await Promise.all([
        api.getSuppliers(),
        api.getProducts(),
      ]);

      if (suppliersResponse.success && suppliersResponse.suppliers) {
        setSuppliers(suppliersResponse.suppliers as Supplier[]);
      }

      if (productsResponse.success && productsResponse.products) {
        setProducts(productsResponse.products);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load data";
      toast.error("Failed to load data", {
        description: errorMessage,
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), product: "", productName: "", unitType: "Box", quantityOrdered: 0, rate: 0, discountPercent: 0, taxPercent: 0, lineTotal: 0 },
    ]);
  };

  const getProduct = (productId: string) => products.find((p) => p._id === productId);

  const calcLineTotal = (item: POItem) => {
    const q = item.quantityOrdered || 0;
    const r = item.rate || 0;
    const d = item.discountPercent || 0;
    const t = item.taxPercent || 0;
    return Math.round(q * r * (1 - d / 100) * (1 + t / 100) * 100) / 100;
  };

  const calcCoverageSqm = (item: POItem): number | undefined => {
    const p = getProduct(item.product);
    if (!p || !item.quantityOrdered) return undefined;
    const cov = p.coveragePerBox ?? 0;
    const unit = p.coveragePerBoxUnit || "sqm";
    if (item.unitType === "Box" && cov) return Math.round(item.quantityOrdered * (unit === "sqm" ? cov : cov * 0.092903) * 100) / 100;
    if (item.unitType === "Sq Ft") return Math.round(item.quantityOrdered * 0.092903 * 100) / 100;
    return undefined;
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof POItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;
        const updatedItem = { ...item, [field]: value };
        if (field === "product") {
          const p = getProduct(String(value));
          if (p) {
            updatedItem.productName = p.name;
            updatedItem.rate = p.retailPrice ?? p.price ?? 0;
          }
        }
        updatedItem.lineTotal = calcLineTotal(updatedItem);
        updatedItem.coverageSqm = calcCoverageSqm(updatedItem);
        return updatedItem;
      })
    );
  };

  const validateForm = () => {
    if (!supplier) {
      toast.error("Please select a supplier");
      return false;
    }
    const validItems = items.filter((item) => item.product && item.quantityOrdered > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one item with quantity");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setIsSaving(true);
      const validItems = items.filter((item) => item.product && item.quantityOrdered > 0);
      const poData = {
        supplier,
        poDate,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        warehouseLocation: warehouseLocation || undefined,
        currency,
        paymentTerms: paymentTerms || undefined,
        deliveryAddress: deliveryAddress || undefined,
        items: validItems.map((item) => ({
          product: item.product,
          unitType: item.unitType,
          quantityOrdered: item.quantityOrdered,
          rate: item.rate,
          discountPercent: item.discountPercent,
          taxPercent: item.taxPercent,
        })),
        notes: notes || undefined,
        terms: terms || undefined,
      };
      const response = await api.createPurchaseOrder(poData);

      if (response.success) {
        const createdPO = response.purchaseOrder as { poNumber: string } | undefined;
        toast.success("Purchase order created successfully", {
          description: createdPO
            ? `PO ${createdPO.poNumber} has been created`
            : "Purchase order has been created",
        });
        router.push("/purchase-orders");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create purchase order";
      toast.error("Failed to create purchase order", {
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/purchase-orders");
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
          {isLoadingData ? (
            <div className="flex h-32 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading suppliers and products...</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* PO Number (Auto Generated) */}
              <div className="space-y-2 md:col-span-2">
                <Label>PO Number (Auto Generated)</Label>
                <Input
                  readOnly
                  value=""
                  placeholder="e.g. PO-2026-0012 (generated when saved)"
                  className="bg-neutral-50 dark:bg-neutral-900 font-mono text-neutral-500"
                />
              </div>

              {/* Supplier */}
              <div className="space-y-2">
                <Label htmlFor="supplier">
                  Supplier <span className="text-red-500">*</span>
                </Label>
                <select
                  id="supplier"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  disabled={isSaving}
                  className="w-full rounded-md border border-gray-200 bg-slate-100 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-amp-primary focus:bg-transparent focus:ring-2 focus:ring-amp-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((sup) => (
                    <option key={sup._id} value={sup._id}>
                      {sup.name} {sup.supplierNumber ? `(${sup.supplierNumber})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* PO Date */}
              <div className="space-y-2">
                <Label htmlFor="poDate">
                  PO Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="poDate"
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Expected Delivery Date */}
              <div className="space-y-2">
                <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
                <Input
                  id="expectedDeliveryDate"
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Warehouse Location */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="warehouseLocation">Warehouse Location <span className="text-neutral-500"></span></Label>
                <Input
                  id="warehouseLocation"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  placeholder="e.g. Sydney Warehouse, Unit 5"
                  disabled={isSaving}
                />
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={isSaving}
                  className="w-full rounded-md border border-gray-200 bg-slate-100 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Payment Terms */}
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <select
                  id="paymentTerms"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  disabled={isSaving}
                  className="w-full rounded-md border border-gray-200 bg-slate-100 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  {PAYMENT_TERMS.map((t) => (
                    <option key={t || "empty"} value={t}>{t || "Select"}</option>
                  ))}
                </select>
              </div>

              {/* Delivery Address (auto from warehouse but editable) */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <Input
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Same as warehouse or enter address"
                  disabled={isSaving}
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
                  disabled={isSaving}
                  className="w-full rounded-md border border-gray-200 bg-slate-100 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/50 focus:border-amp-primary focus:bg-transparent focus:ring-2 focus:ring-amp-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
            </div>
          )}
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
              disabled={isLoadingData || isSaving}
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
                  <TableHead className="min-w-[200px]">Product <span className="text-red-500">*</span></TableHead>
                  <TableHead className="min-w-[100px]">Unit Type</TableHead>
                  <TableHead className="min-w-[90px]">Qty Ordered <span className="text-red-500">*</span></TableHead>
                  <TableHead className="min-w-[90px]">Rate (Per Unit)</TableHead>
                  <TableHead className="min-w-[70px]">Disc. %</TableHead>
                  <TableHead className="min-w-[70px]">Tax %</TableHead>
                  <TableHead className="min-w-[90px]">Line Total</TableHead>
                  <TableHead className="min-w-[80px]">Coverage</TableHead>
                  <TableHead className="w-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <select
                        value={item.product}
                        onChange={(e) => handleItemChange(item.id, "product", e.target.value)}
                        disabled={isLoadingData || isSaving}
                        className="w-full rounded-md border border-gray-200 bg-slate-100 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <select
                        value={item.unitType}
                        onChange={(e) => handleItemChange(item.id, "unitType", e.target.value)}
                        disabled={isSaving}
                        className="w-full rounded-md border px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                      >
                        {UNIT_TYPES.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={item.quantityOrdered || ""}
                        onChange={(e) => handleItemChange(item.id, "quantityOrdered", Number(e.target.value))}
                        disabled={isSaving}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.rate || ""}
                        onChange={(e) => handleItemChange(item.id, "rate", Number(e.target.value))}
                        disabled={isSaving}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={item.discountPercent || ""}
                        onChange={(e) => handleItemChange(item.id, "discountPercent", Number(e.target.value))}
                        disabled={isSaving}
                        className="w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={item.taxPercent || ""}
                        onChange={(e) => handleItemChange(item.id, "taxPercent", Number(e.target.value))}
                        disabled={isSaving}
                        className="w-16"
                      />
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(item.lineTotal)}</TableCell>
                    <TableCell className="text-xs text-neutral-600 dark:text-neutral-400">
                      {item.coverageSqm != null ? `${item.coverageSqm} sq m` : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length === 1 || isSaving}
                        className="h-8 w-8 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
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
          <div />
          <div className="text-right">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Grand Total</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {formatCurrency(calculateGrandTotal())}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isSaving || isLoadingData}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {isSaving ? "Saving..." : "Create Purchase Order"}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
