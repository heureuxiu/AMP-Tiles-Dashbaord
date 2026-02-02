"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Package, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

// Mock products data (in real app, fetch from API or shared state)
const productsData = [
  {
    id: "1",
    productName: "Amaze Grey Polished",
    model: "Marble Look Porcelain Tile",
    src: "/assets/products/amaze-grey.jpg",
    stock: 245,
  },
  {
    id: "2",
    productName: "Amaze Luxury Matt",
    model: "Marble Look Porcelain Tile",
    src: "/assets/products/amaze-luxury.jpg",
    stock: 156,
  },
  {
    id: "3",
    productName: "Artic Apricot Matt",
    model: "Porcelain Tile",
    src: "/assets/products/artic-apricot.jpg",
    stock: 89,
  },
  {
    id: "4",
    productName: "Artic Cloud Matt",
    model: "Porcelain Tile",
    src: "/assets/products/artic-cloud.jpg",
    stock: 23,
  },
  {
    id: "5",
    productName: "Aspen Ash Grey",
    model: "Steel Matt Porcelain",
    src: "/assets/products/aspen-ash.jpg",
    stock: 12,
  },
  {
    id: "6",
    productName: "Bianco Matt",
    model: "Marble Look Porcelain",
    src: "/assets/products/bianco-matt.jpg",
    stock: 0,
  },
];

export default function StockUpdatePage() {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [actionType, setActionType] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [products, setProducts] = useState(productsData);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleUpdateStock = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId || !actionType || quantity <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    // Update stock
    setProducts(
      products.map((p) => {
        if (p.id === selectedProductId) {
          const newStock =
            actionType === "stock-in" ? p.stock + quantity : p.stock - quantity;
          return { ...p, stock: Math.max(0, newStock) };
        }
        return p;
      })
    );

    toast.success(
      `Stock ${actionType === "stock-in" ? "added" : "removed"} successfully`,
      {
        description: `${quantity} boxes ${actionType === "stock-in" ? "added to" : "removed from"} ${
          selectedProduct?.productName
        }`,
      }
    );

    // Reset form
    handleReset();
  };

  const handleReset = () => {
    setSelectedProductId("");
    setActionType("");
    setQuantity(0);
    setRemarks("");
  };

  const newStock = selectedProduct
    ? actionType === "stock-in"
      ? selectedProduct.stock + quantity
      : Math.max(0, selectedProduct.stock - quantity)
    : 0;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Bar */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Stock Update
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Manage inventory stock levels
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stock Update Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
        >
          {/* Header */}
          <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "#c7a86415" }}
              >
                <Package className="h-5 w-5" style={{ color: "#c7a864" }} strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  Update Stock Form
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Add or remove stock quantities
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdateStock} className="p-6">
            <div className="space-y-6">
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
                >
                  <option value="">Choose a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.productName} - {product.model}
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
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActionType("stock-in")}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      actionType === "stock-in"
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
                    }`}
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span className="font-semibold">Stock In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType("stock-out")}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      actionType === "stock-out"
                        ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                        : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
                    }`}
                  >
                    <TrendingDown className="h-5 w-5" />
                    <span className="font-semibold">Stock Out</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div className="grid gap-2">
                <label
                  htmlFor="quantity"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Quantity (boxes) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={quantity || ""}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  required
                />
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
                  className="flex w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">
                  Update Stock
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="gap-2"
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
          className="lg:col-span-1 space-y-4"
        >
          {/* Current Stock Card */}
          <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800">
            <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60">
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Stock Preview
              </h3>
            </div>
            <div className="p-6">
              {selectedProduct ? (
                <div className="space-y-6">
                  {/* Product Info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16 rounded-xl">
                      <AvatarImage
                        src={selectedProduct.src}
                        alt={selectedProduct.productName}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-xl bg-neutral-200 dark:bg-neutral-700">
                        <Package className="h-8 w-8 text-neutral-500" strokeWidth={1.5} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-900 dark:text-white">
                        {selectedProduct.productName}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {selectedProduct.model}
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
                        boxes
                      </span>
                    </div>
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
                          <div className="mt-1 flex items-baseline gap-2">
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
                              boxes
                            </span>
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
          <div className="rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800">
            <h4 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
              Quick Stats
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Total Products</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {products.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Total Stock</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {products.reduce((sum, p) => sum + p.stock, 0)} boxes
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Low Stock Items</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {products.filter((p) => p.stock > 0 && p.stock <= 30).length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Out of Stock</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {products.filter((p) => p.stock === 0).length}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
