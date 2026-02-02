"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Receipt, Save, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Mock products data
const productsData = [
  { id: "1", name: "Amaze Grey Polished", rate: 45.50 },
  { id: "2", name: "Amaze Luxury Matt", rate: 42.00 },
  { id: "3", name: "Artic Apricot Matt", rate: 38.75 },
  { id: "4", name: "Artic Cloud Matt", rate: 40.00 },
  { id: "5", name: "Aspen Ash Grey", rate: 35.50 },
  { id: "6", name: "Bianco Matt", rate: 48.00 },
];

type InvoiceItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  lineTotal: number;
};

export default function CreateInvoicePage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      productId: "",
      productName: "",
      quantity: 0,
      rate: 0,
      lineTotal: 0,
    },
  ]);

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
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
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const handleProductChange = (itemId: string, productId: string) => {
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

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    const validItems = items.filter(
      (item) => item.productId && item.quantity > 0 && item.rate >= 0
    );

    if (validItems.length === 0) {
      toast.error("Please add at least one item with quantity");
      return;
    }

    // Generate invoice ID
    const invoiceId = `INV-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;

    // TODO: Save to backend
    toast.success("Invoice created successfully", {
      description: `Invoice ${invoiceId} has been generated`,
    });

    setTimeout(() => {
      router.push(`/invoices/${invoiceId}`);
    }, 1000);
  };

  const handleCancel = () => {
    router.push("/invoices");
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Create Invoice
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Generate a new invoice directly
        </p>
      </div>

      <form onSubmit={handleSaveInvoice}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information Section */}
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
                    style={{ backgroundColor: "#8b5cf615" }}
                  >
                    <Receipt
                      className="h-5 w-5"
                      style={{ color: "#8b5cf6" }}
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">
                      Customer Information
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Customer and invoice details
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
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                    />
                  </div>

                  {/* Customer Email */}
                  <div className="grid gap-2">
                    <label
                      htmlFor="customerEmail"
                      className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                    >
                      Customer Email{" "}
                      <span className="text-neutral-400">(Optional)</span>
                    </label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="Enter email address"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Invoice Date */}
                <div className="grid gap-2">
                  <label
                    htmlFor="invoiceDate"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
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
                    className="flex w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                  />
                </div>
              </div>
            </motion.div>

            {/* Invoice Items Section */}
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
                      Invoice Items
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Add products and quantities
                    </p>
                  </div>
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
                        <th className="pb-3 w-10"></th>
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
                              min="1"
                              step="1"
                              placeholder="0"
                              value={item.quantity || ""}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
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
                              className="w-32"
                              required
                            />
                          </td>
                          <td className="py-4 pr-4 text-right font-semibold text-neutral-900 dark:text-white">
                            {formatCurrency(item.lineTotal)}
                          </td>
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
              <div className="space-y-3">
                <Button type="submit" className="w-full gap-2" size="lg">
                  <Save className="h-4 w-4" />
                  Save Invoice
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

              {/* Info Box */}
              <div className="rounded-xl bg-purple-50 p-4 dark:bg-purple-950/30">
                <p className="text-xs text-purple-700 dark:text-purple-400">
                  <strong>Note:</strong> This invoice will be created directly
                  and can be viewed, printed, or downloaded from the invoices
                  list.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
