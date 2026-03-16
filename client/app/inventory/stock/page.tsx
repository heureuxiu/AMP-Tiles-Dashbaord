"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Package, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Product = {
  _id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  finish: string;
  stock: number;
  unit: string;
  image?: string;
  coveragePerBox?: number;
  coveragePerBoxUnit?: string;
};

type StockStats = {
  totalProducts: number;
  totalStock: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
};

const normalizeTransactionQuantity = (
  value: number,
  unit: "boxes" | "sqrMtr"
) => {
  const numeric = Number.isFinite(value) ? value : 0;
  if (numeric <= 0) return 0;
  if (unit === "sqrMtr") return Math.round(numeric * 100) / 100;
  return Math.floor(numeric);
};

export default function StockUpdatePage() {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [actionType, setActionType] = useState<"stock-in" | "stock-out" | "">("");
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState<"boxes" | "sqrMtr">("boxes");
  const [remarks, setRemarks] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<StockStats>({
    totalProducts: 0,
    totalStock: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProduct = products.find((p) => p._id === selectedProductId);

  // Load products and stats on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch products and stats in parallel
      const [productsResponse, statsResponse] = await Promise.all([
        api.getProducts(),
        api.getStockStats(),
      ]);

      if (productsResponse.success && productsResponse.products) {
        setProducts(productsResponse.products);
      }

      if (statsResponse.success && statsResponse.stats) {
        setStats(statsResponse.stats as StockStats);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch data";
      toast.error("Failed to load data", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId || !actionType || quantity <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await api.createStockTransaction({
        productId: selectedProductId,
        type: actionType,
        quantity,
        sqrMtr: unit === "sqrMtr" ? quantity : undefined,
        remarks,
      });

      if (response.success) {
        toast.success(
          `Stock ${actionType === "stock-in" ? "added" : "removed"} successfully`,
          {
            description: `${quantity} ${unit === "sqrMtr" ? "Sqr Mtr" : "Boxes"} ${
              actionType === "stock-in" ? "added to" : "removed from"
            } ${selectedProduct?.name}`,

          }
        );

        // Refresh data
        await fetchData();

        // Reset form
        handleReset();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update stock";
      toast.error("Failed to update stock", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedProductId("");
    setActionType("");
    setQuantity(0);
    setUnit("boxes");
    setRemarks("");
  };

  const newStock = selectedProduct
    ? actionType === "stock-in"
      ? selectedProduct.stock + quantity
      : Math.max(0, selectedProduct.stock - quantity)
    : 0;

  const sqmPerBox =
    selectedProduct?.coveragePerBox
      ? selectedProduct.coveragePerBoxUnit === "sqm"
        ? selectedProduct.coveragePerBox
        : selectedProduct.coveragePerBox * 0.0929
      : null;
  const currentSqm = sqmPerBox !== null ? selectedProduct!.stock * sqmPerBox : null;
  const newSqm = sqmPerBox !== null ? newStock * sqmPerBox : null;

  return (
    <div className="min-w-0 w-full space-y-4 p-3 sm:space-y-6 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
          Stock Update
        </h1>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
          Manage inventory stock levels
        </p>
      </div>

      <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Stock Update Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="min-w-0 rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:col-span-2 lg:rounded-2xl"
        >
          {/* Header */}
          <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-6">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
                style={{ backgroundColor: "#c7a86415" }}
              >
                <Package className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#c7a864" }} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-neutral-900 dark:text-white sm:text-base">
                  Update Stock Form
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                  Add or remove stock quantities
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdateStock} className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Product Selection */}
              <div className="grid gap-2">
                <label
                  htmlFor="product"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Select Product <span className="text-red-500">*</span>
                </label>
                <select
                  id="product"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                  required

                  disabled={isLoading || isSubmitting}
                >
                  <option value="">Choose a product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Type */}
              <div className="grid gap-2">
                <label
                  htmlFor="actionType"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Action Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setActionType("stock-in")}
                    disabled={isSubmitting}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border-2 p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed sm:gap-2 sm:p-4 ${
                      actionType === "stock-in"
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm font-semibold sm:text-base">Stock In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType("stock-out")}
                    disabled={isSubmitting}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border-2 p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed sm:gap-2 sm:p-4 ${
                      actionType === "stock-out"
                        ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                        : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
                    }`}
                  >
                    <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm font-semibold sm:text-base">Stock Out</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div className="grid gap-2">
                <label
                  htmlFor="quantity"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Quantity <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    id="quantity"
                    type="number"
                    min={unit === "sqrMtr" ? "0.01" : "1"}
                    step={unit === "sqrMtr" ? "0.01" : "1"}
                    placeholder="Enter quantity"
                    value={quantity || ""}
                    onChange={(e) =>
                      setQuantity(
                        normalizeTransactionQuantity(
                          parseFloat(e.target.value) || 0,
                          unit
                        )
                      )
                    }
                    disabled={isSubmitting}
                    required
                    className="flex-1"
                  />
                  <select
                    value={unit}
                    onChange={(e) => {
                      const nextUnit = e.target.value as "boxes" | "sqrMtr";
                      setUnit(nextUnit);
                      setQuantity(
                        normalizeTransactionQuantity(quantity, nextUnit)
                      );
                    }}
                    disabled={isSubmitting}
                    className="h-10 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:focus-visible:ring-neutral-300"
                  >
                    <option value="boxes">Boxes</option>
                    <option value="sqrMtr">Sqr Mtr</option>
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div className="grid gap-2">
                <label
                  htmlFor="remarks"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Remarks <span className="text-neutral-400">(Optional)</span>
                </label>
                <textarea
                  id="remarks"
                  rows={3}
                  placeholder="Add notes or reasons for this stock update..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={isSubmitting}
                  className="flex w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 sm:gap-3">
                <Button type="submit" className="min-w-0 flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Stock"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="gap-2"
                  disabled={isSubmitting}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Current Stock Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="min-w-0 space-y-4 lg:col-span-1"
        >
          {/* Current Stock Card */}
          <div className="rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:rounded-2xl">
            <div className="border-b border-neutral-200/60 p-3 dark:border-neutral-700/60 sm:p-4">
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Stock Preview
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
                  <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                    Loading...
                  </p>
                </div>
              ) : selectedProduct ? (
                <div className="space-y-6">
                  {/* Product Info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16 rounded-xl">
                      <AvatarImage
                        src={selectedProduct.image || "/assets/products/placeholder.jpg"}
                        alt={selectedProduct.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-xl bg-neutral-200 dark:bg-neutral-700">
                        <Package className="h-8 w-8 text-neutral-500" strokeWidth={1.5} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-900 dark:text-white">
                        {selectedProduct.name}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {selectedProduct.sku}
                      </p>
                    </div>
                  </div>

                  {/* Current Stock */}
                  <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-900/50">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      Current Stock
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                        {selectedProduct.stock}
                      </span>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        {selectedProduct.unit}
                      </span>
                    </div>
                    {currentSqm !== null && (
                      <div className="mt-2 flex items-baseline gap-1 border-t border-neutral-200 pt-2 dark:border-neutral-700">
                        <span className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                          {currentSqm.toFixed(2)}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          m² (Sqr Mtr)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stock Change Preview */}
                  {actionType && quantity > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`rounded-xl p-4 ${
                        actionType === "stock-in"
                          ? "bg-green-50 dark:bg-green-950/30"
                          : "bg-red-50 dark:bg-red-950/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div
                            className={`text-sm font-medium ${
                              actionType === "stock-in"
                                ? "text-green-700 dark:text-green-400"
                                : "text-red-700 dark:text-red-400"
                            }`}
                          >
                            After Update
                          </div>
                          <div className="mt-1 space-y-0.5">
                            <div className="flex items-baseline gap-2">
                              <span
                                className={`text-2xl font-bold ${
                                  actionType === "stock-in"
                                    ? "text-green-900 dark:text-green-300"
                                    : "text-red-900 dark:text-red-300"
                                }`}
                              >
                                {newStock}
                              </span>
                              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                {selectedProduct.unit}
                              </span>
                            </div>
                            {newSqm !== null && (
                              <div className="flex items-baseline gap-1">
                                <span
                                  className={`text-sm font-semibold ${
                                    actionType === "stock-in"
                                      ? "text-green-800 dark:text-green-400"
                                      : "text-red-800 dark:text-red-400"
                                  }`}
                                >
                                  {newSqm.toFixed(2)}
                                </span>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                  m²
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-1 text-sm font-semibold ${
                            actionType === "stock-in"
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {actionType === "stock-in" ? "+" : "-"}
                          {quantity}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package
                    className="h-12 w-12 text-neutral-300 dark:text-neutral-600"
                    strokeWidth={1.5}
                  />
                  <p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    No product selected
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                    Select a product to preview stock
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="min-w-0 rounded-xl border border-neutral-200/60 bg-white p-3 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:rounded-2xl lg:p-4">
            <h4 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
              Quick Stats
            </h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Total Products</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {stats.totalProducts}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Total Stock</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {stats.totalStock}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">In Stock</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {stats.inStock}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Low Stock</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {stats.lowStock}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Out of Stock</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {stats.outOfStock}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
