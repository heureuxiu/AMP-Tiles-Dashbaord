"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Trash2, FileText, Save, X as XIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Mock products data
const productsData = [
  { id: "1", name: "Amaze Grey Polished", rate: 45.50 },
  { id: "2", name: "Amaze Luxury Matt", rate: 42.00 },
  { id: "3", name: "Artic Apricot Matt", rate: 38.75 },
  { id: "4", name: "Artic Cloud Matt", rate: 40.00 },
  { id: "5", name: "Aspen Ash Grey", rate: 35.50 },
  { id: "6", name: "Bianco Matt", rate: 48.00 },
];

// Mock existing quotation data
const mockQuotationData = {
  id: "QT-2024-001",
  customerName: "John Smith",
  customerPhone: "+61 400 123 456",
  date: "2024-01-28",
  notes: "Customer requested delivery by end of month",
  status: "draft" as const,
  items: [
    {
      id: "1",
      productId: "1",
      productName: "Amaze Grey Polished",
      quantity: 50,
      rate: 45.50,
      lineTotal: 2275.00,
    },
    {
      id: "2",
      productId: "4",
      productName: "Artic Cloud Matt",
      quantity: 30,
      rate: 40.00,
      lineTotal: 1200.00,
    },
  ],
};

type QuotationItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  lineTotal: number;
};

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;

  // In real app, fetch quotation data based on ID
  const existingQuotation = mockQuotationData;

  const [customerName, setCustomerName] = useState(existingQuotation.customerName);
  const [customerPhone, setCustomerPhone] = useState(existingQuotation.customerPhone);
  const [quotationDate, setQuotationDate] = useState(existingQuotation.date);
  const [notes, setNotes] = useState(existingQuotation.notes);
  const [status] = useState(existingQuotation.status);
  const [items, setItems] = useState<QuotationItem[]>(existingQuotation.items);

  const isReadOnly = status === "converted";

  const handleAddItem = () => {
    if (isReadOnly) return;
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      quantity: 0,
      rate: 0,
      lineTotal: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (isReadOnly) return;
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const handleProductChange = (itemId: string, productId: string) => {
    if (isReadOnly) return;
    const product = productsData.find((p) => p.id === productId);
    if (!product) return;

    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              productId: product.id,
              productName: product.name,
              rate: product.rate,
              lineTotal: item.quantity * product.rate,
            }
          : item
      )
    );
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (isReadOnly) return;
    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              lineTotal: quantity * item.rate,
            }
          : item
      )
    );
  };

  const handleRateChange = (itemId: string, rate: number) => {
    if (isReadOnly) return;
    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              rate,
              lineTotal: item.quantity * rate,
            }
          : item
      )
    );
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (isReadOnly) {
      toast.error("Cannot edit converted quotation");
      return;
    }

    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    const validItems = items.filter(
      (item) => item.productId && item.quantity > 0
    );

    if (validItems.length === 0) {
      toast.error("Please add at least one item with quantity");
      return;
    }

    // TODO: Save to backend
    toast.success("Quotation updated successfully", {
      description: `${quotationId} has been updated`,
    });

    setTimeout(() => {
      router.push("/quotations");
    }, 1000);
  };

  const handleCancel = () => {
    router.push("/quotations");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const subtotal = calculateSubtotal();
  const grandTotal = subtotal;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/quotations")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Edit Quotation
              </h1>
              <Badge
                variant="secondary"
                className={
                  status === "draft"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                    : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                }
              >
                {status === "draft" ? "Draft" : "Converted"}
              </Badge>
            </div>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              {isReadOnly
                ? "This quotation has been converted and is read-only"
                : `Editing ${quotationId}`}
            </p>
          </div>
        </div>
      </div>

      {isReadOnly && (
        <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>Note:</strong> This quotation has been converted to an invoice and cannot be edited.
            View it in read-only mode or go back to the quotations list.
          </p>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
            >
              {/* Header */}
              <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "#3b82f615" }}
                  >
                    <FileText
                      className="h-5 w-5"
                      style={{ color: "#3b82f6" }}
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">
                      Basic Information
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Customer and quotation details
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="p-6 space-y-4">
                {/* Customer Name */}
                <div className="grid gap-2">
                  <label
                    htmlFor="customerName"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="customerName"
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={isReadOnly}
                    required
                  />
                </div>

                {/* Customer Phone */}
                <div className="grid gap-2">
                  <label
                    htmlFor="customerPhone"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Customer Phone{" "}
                    <span className="text-neutral-400">(Optional)</span>
                  </label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>

                {/* Quotation Date */}
                <div className="grid gap-2">
                  <label
                    htmlFor="quotationDate"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Quotation Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="quotationDate"
                    type="date"
                    value={quotationDate}
                    onChange={(e) => setQuotationDate(e.target.value)}
                    disabled={isReadOnly}
                    required
                  />
                </div>

                {/* Notes */}
                <div className="grid gap-2">
                  <label
                    htmlFor="notes"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Notes <span className="text-neutral-400">(Optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Add any additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isReadOnly}
                    className="flex w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                  />
                </div>
              </div>
            </motion.div>

            {/* Quotation Items Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
            >
              {/* Header */}
              <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">
                      Quotation Items
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Add products and quantities
                    </p>
                  </div>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItem}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700">
                        <th className="pb-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Product
                        </th>
                        <th className="pb-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Quantity
                        </th>
                        <th className="pb-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Rate
                        </th>
                        <th className="pb-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Line Total
                        </th>
                        {!isReadOnly && <th className="pb-3 w-10"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-neutral-100 dark:border-neutral-800"
                        >
                          <td className="py-4 pr-4">
                            <select
                              value={item.productId}
                              onChange={(e) =>
                                handleProductChange(item.id, e.target.value)
                              }
                              disabled={isReadOnly}
                              className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300"
                              required
                            >
                              <option value="">Select product</option>
                              {productsData.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-4 pr-4">
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              value={item.quantity || ""}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              disabled={isReadOnly}
                              className="w-24"
                              required
                            />
                          </td>
                          <td className="py-4 pr-4">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={item.rate || ""}
                              onChange={(e) =>
                                handleRateChange(
                                  item.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              disabled={isReadOnly}
                              className="w-32"
                              required
                            />
                          </td>
                          <td className="py-4 pr-4 text-right font-semibold text-neutral-900 dark:text-white">
                            {formatCurrency(item.lineTotal)}
                          </td>
                          {!isReadOnly && (
                            <td className="py-4">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                                className="h-8 w-8 rounded-full text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                disabled={items.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Summary Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 space-y-6">
              {/* Summary Card */}
              <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800">
                <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60">
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    Summary
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Subtotal
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  <div className="border-t border-neutral-200 dark:border-neutral-700"></div>

                  {/* Grand Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-neutral-900 dark:text-white">
                      Grand Total
                    </span>
                    <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isReadOnly && (
                <div className="space-y-3">
                  <Button type="submit" className="w-full gap-2" size="lg">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleCancel}
                  >
                    <XIcon className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}

              {isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={handleCancel}
                >
                  Back to Quotations
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
