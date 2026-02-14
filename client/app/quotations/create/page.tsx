"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, FileText, Save, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Product = {
  _id: string;
  name: string;
  sku: string;
  price: number;
};

type QuotationItem = {
  id: string;
  product: string;
  productName: string;
  quantity: number;
  rate: number;
  lineTotal: number;
};

export default function CreateQuotationPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: "1",
      product: "",
      productName: "",
      quantity: 0,
      rate: 0,
      lineTotal: 0,
    },
  ]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await api.getProducts();
      if (response.success && response.products) {
        setProducts(response.products);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch products";
      toast.error("Failed to load products", {
        description: errorMessage,
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleAddItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      product: "",
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
    const product = products.find((p) => p._id === productId);
    if (!product) return;

    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              product: product._id,
              productName: product.name,
              rate: product.price,
              lineTotal: item.quantity * product.price,
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

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    const validItems = items.filter(
      (item) => item.product && item.quantity > 0
    );

    if (validItems.length === 0) {
      toast.error("Please add at least one item with quantity");
      return;
    }

    try {
      setIsSaving(true);

      const quotationData = {
        customerName,
        customerPhone,
        quotationDate,
        notes,
        items: validItems.map(item => ({
          product: item.product,
          quantity: item.quantity,
          rate: item.rate,
        })),
        status: "draft",
      };

      const response = await api.createQuotation(quotationData);

      if (response.success) {
        toast.success("Quotation saved as draft", {
          description: `Quote for ${customerName} has been saved`,
        });

        setTimeout(() => {
          router.push("/quotations");
        }, 1000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create quotation";
      toast.error("Failed to save quotation", {
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Create Quotation
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Fill in the details to create a new quotation
        </p>
      </div>

      <form onSubmit={handleSaveDraft}>
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
                              value={item.product}
                              onChange={(e) =>
                                handleProductChange(item.id, e.target.value)
                              }
                              disabled={isLoadingProducts}
                              className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300"
                              required
                            >
                              <option value="">
                                {isLoadingProducts ? "Loading..." : "Select product"}
                              </option>
                              {products.map((product) => (
                                <option key={product._id} value={product._id}>
                                  {product.name} ({product.sku})
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
                <Button type="submit" className="w-full gap-2" size="lg" disabled={isSaving || isLoadingProducts}>
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save as Draft"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <XIcon className="h-4 w-4" />
                  Cancel
                </Button>
              </div>

              {/* Info Box */}
              <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <strong>Note:</strong> This quotation will be saved as a draft
                  and can be edited later. You can convert it to an invoice from
                  the quotations list.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
