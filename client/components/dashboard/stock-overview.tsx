"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  PencilIcon,
  Trash2Icon,
  Package,
  Search,
  X,
  ChevronDown,
  Filter,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

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
};

type StockStatus = "out" | "low" | "good";

const getStockStatus = (stock: number): StockStatus => {
  if (stock === 0) return "out";
  if (stock <= 30) return "low";
  return "good";
};

// ✅ Typed wrapper so framer-motion can animate shadcn TableRow without `any`
const MotionTableRowBase = React.forwardRef<
  HTMLTableRowElement,
  React.ComponentPropsWithoutRef<"tr">
>((props, ref) => <TableRow ref={ref} {...props} />);

MotionTableRowBase.displayName = "MotionTableRowBase";

const MotionTableRow = motion(MotionTableRowBase);

export function StockOverview() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFinishes, setSelectedFinishes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.getProducts();

      if (response?.success && Array.isArray(response?.products)) {
        setProducts(response.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch products";
      toast.error("Failed to load products", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Extract unique categories and finishes
  const categories = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return unique.sort();
  }, [products]);

  const finishes = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.finish).filter(Boolean))];
    return unique.sort();
  }, [products]);

  // Filter products (memoized)
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return products.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const sku = (item.sku || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();

      const matchesSearch =
        q === "" || name.includes(q) || sku.includes(q) || desc.includes(q);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(item.category);

      const matchesFinish =
        selectedFinishes.length === 0 || selectedFinishes.includes(item.finish);

      const stockStatus = getStockStatus(item.stock);

      const matchesStatus =
        selectedStatus.length === 0 ||
        (selectedStatus.includes("in-stock") && stockStatus === "good") ||
        (selectedStatus.includes("low-stock") && stockStatus === "low") ||
        (selectedStatus.includes("out-of-stock") && stockStatus === "out");

      return matchesSearch && matchesCategory && matchesFinish && matchesStatus;
    });
  }, [products, searchQuery, selectedCategories, selectedFinishes, selectedStatus]);

  const inStock = useMemo(
    () => filteredData.filter((item) => item.stock > 30).length,
    [filteredData]
  );

  const lowStock = useMemo(
    () => filteredData.filter((item) => item.stock > 0 && item.stock <= 30).length,
    [filteredData]
  );

  const outOfStock = useMemo(
    () => filteredData.filter((item) => item.stock === 0).length,
    [filteredData]
  );

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleFinish = (finish: string) => {
    setSelectedFinishes((prev) =>
      prev.includes(finish) ? prev.filter((f) => f !== finish) : [...prev, finish]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedFinishes([]);
    setSelectedStatus([]);
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    selectedCategories.length +
    selectedFinishes.length +
    selectedStatus.length;

  const openDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const response = await api.deleteProduct(productToDelete._id);
      if (response?.success) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        toast.error("Failed to delete product", {
          description: response?.message || "Unknown error",
        });
        throw new Error();
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "") {
        toast.error("Failed to delete product", {
          description: error.message,
        });
      }
      throw error;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:rounded-2xl"
    >
      {/* Header */}
      <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-5 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
              style={{ backgroundColor: "#c7a86415" }}
            >
              <Package
                className="h-4 w-4 sm:h-5 sm:w-5"
                style={{ color: "#c7a864" }}
                strokeWidth={2}
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white sm:text-base">
                Stock Overview
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                Current inventory status
              </p>
            </div>
          </div>

          <Link
            href="/inventory/products"
            className="text-xs font-semibold hover:underline sm:text-sm"
            style={{ color: "#c7a864" }}
          >
            View All
          </Link>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-5 lg:p-6"
      >
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-3 sm:mb-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Dropdowns */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-wrap items-center gap-2 sm:gap-3"
        >
          <Filter className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" />

          {/* Category */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Category
                {selectedCategories.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5"
                    style={{ backgroundColor: "#c7a864", color: "white" }}
                  >
                    {selectedCategories.length}
                  </Badge>
                )}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56">
              {categories.length === 0 ? (
                <DropdownMenuItem disabled>No categories</DropdownMenuItem>
              ) : (
                categories.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    className="flex cursor-pointer items-center gap-2"
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleCategory(category);
                    }}
                  >
                    <Checkbox checked={selectedCategories.includes(category)} />
                    <span>{category}</span>
                  </DropdownMenuItem>
                ))
              )}

              {selectedCategories.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-neutral-600 dark:text-neutral-400"
                    onSelect={(e) => {
                      e.preventDefault();
                      setSelectedCategories([]);
                    }}
                  >
                    <X className="mr-2 h-3.5 w-3.5" />
                    Clear
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Finish */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Finish
                {selectedFinishes.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5"
                    style={{ backgroundColor: "#c7a864", color: "white" }}
                  >
                    {selectedFinishes.length}
                  </Badge>
                )}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56">
              {finishes.length === 0 ? (
                <DropdownMenuItem disabled>No finishes</DropdownMenuItem>
              ) : (
                finishes.map((finish) => (
                  <DropdownMenuItem
                    key={finish}
                    className="flex cursor-pointer items-center gap-2"
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleFinish(finish);
                    }}
                  >
                    <Checkbox checked={selectedFinishes.includes(finish)} />
                    <span>{finish}</span>
                  </DropdownMenuItem>
                ))
              )}

              {selectedFinishes.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-neutral-600 dark:text-neutral-400"
                    onSelect={(e) => {
                      e.preventDefault();
                      setSelectedFinishes([]);
                    }}
                  >
                    <X className="mr-2 h-3.5 w-3.5" />
                    Clear
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Status
                {selectedStatus.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5"
                    style={{ backgroundColor: "#c7a864", color: "white" }}
                  >
                    {selectedStatus.length}
                  </Badge>
                )}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem
                className="flex cursor-pointer items-center gap-2"
                onSelect={(e) => {
                  e.preventDefault();
                  toggleStatus("in-stock");
                }}
              >
                <Checkbox checked={selectedStatus.includes("in-stock")} />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>In Stock</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex cursor-pointer items-center gap-2"
                onSelect={(e) => {
                  e.preventDefault();
                  toggleStatus("low-stock");
                }}
              >
                <Checkbox checked={selectedStatus.includes("low-stock")} />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Low Stock</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex cursor-pointer items-center gap-2"
                onSelect={(e) => {
                  e.preventDefault();
                  toggleStatus("out-of-stock");
                }}
              >
                <Checkbox checked={selectedStatus.includes("out-of-stock")} />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span>Out of Stock</span>
                </div>
              </DropdownMenuItem>

              {selectedStatus.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-neutral-600 dark:text-neutral-400"
                    onSelect={(e) => {
                      e.preventDefault();
                      setSelectedStatus([]);
                    }}
                  >
                    <X className="mr-2 h-3.5 w-3.5" />
                    Clear
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear All */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="ml-auto text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              <X className="mr-1 h-4 w-4" />
              Clear All ({activeFiltersCount})
            </Button>
          )}
        </motion.div>

        {/* Results Count */}
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="mt-4 text-sm text-neutral-600 dark:text-neutral-400"
          >
            Showing {filteredData.length} of {products.length} products
          </motion.div>
        )}
      </motion.div>

      {/* Table */}
      <div className="p-4 sm:p-5 lg:p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Loading products...
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[180px] sm:min-w-[200px]">
                        Product
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Category
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Finish
                      </TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Package
                              className="h-12 w-12 text-neutral-300 dark:text-neutral-600"
                              strokeWidth={1.5}
                            />
                            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                              No products found
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              Try adjusting your filters
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item, index) => {
                        const stockStatus = getStockStatus(item.stock);

                        return (
                          <MotionTableRow
                            key={item._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: index * 0.05,
                            }}
                            className="border-b transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800"
                          >
                            <TableCell>
                              <div className="flex items-center gap-2 sm:gap-3">
                                <Avatar className="h-10 w-10 shrink-0 rounded-lg sm:h-12 sm:w-12">
                                  <AvatarImage
                                    src={
                                      item.image ||
                                      "/assets/products/placeholder.jpg"
                                    }
                                    alt={item.name}
                                  />
                                  <AvatarFallback className="flex items-center justify-center rounded-lg bg-neutral-200 text-xs dark:bg-neutral-700">
                                    <Package
                                      className="h-5 w-5 text-neutral-500 sm:h-6 sm:w-6"
                                      strokeWidth={1.5}
                                    />
                                  </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium text-neutral-900 dark:text-white sm:text-base">
                                    {item.name}
                                  </div>
                                  <span className="mt-0.5 block text-[10px] text-neutral-500 dark:text-neutral-400 md:hidden sm:text-xs">
                                    {item.category}
                                  </span>
                                  <span className="mt-0.5 block text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
                                    {item.sku}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="hidden text-neutral-700 dark:text-neutral-300 md:table-cell">
                              {item.category}
                            </TableCell>

                            <TableCell className="hidden text-neutral-700 dark:text-neutral-300 lg:table-cell">
                              {item.finish}
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span
                                  className={`text-base font-bold sm:text-lg ${
                                    stockStatus === "out"
                                      ? "text-red-600 dark:text-red-400"
                                      : stockStatus === "low"
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-green-600 dark:text-green-400"
                                  }`}
                                >
                                  {item.stock}
                                </span>
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
                                  {item.unit}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-0.5 sm:gap-1">
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {/* ✅ If you have edit page like /inventory/products/[id]/edit, use that */}
                                  <Link href={`/inventory/products`}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 shrink-0 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                      aria-label={`product-${item._id}-edit`}
                                    >
                                      <PencilIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </Button>
                                  </Link>
                                </motion.div>

                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openDeleteModal(item)}
                                    className="h-8 w-8 shrink-0 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    aria-label={`product-${item._id}-remove`}
                                  >
                                    <Trash2Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </Button>
                                </motion.div>
                              </div>
                            </TableCell>
                          </MotionTableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="border-t border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-5 lg:p-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 sm:h-3 sm:w-3" />
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 sm:text-sm">
                In Stock: {inStock}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500 sm:h-3 sm:w-3" />
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 sm:text-sm">
                Low Stock: {lowStock}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 sm:h-3 sm:w-3" />
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 sm:text-sm">
                Out of Stock: {outOfStock}
              </span>
            </div>
          </div>

          <span className="text-sm font-bold text-neutral-900 dark:text-white sm:text-base">
            Total: {filteredData.length}{" "}
            {activeFiltersCount > 0 ? `of ${products.length}` : ""} Products
          </span>
        </div>
      </motion.div>

      <DeleteConfirmDialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setProductToDelete(null);
        }}
        title="Delete Product?"
        description={
          productToDelete
            ? `Are you sure you want to delete ${productToDelete.name} (${productToDelete.sku})? This cannot be undone.`
            : ""
        }
        onConfirm={handleConfirmDelete}
      />
    </motion.div>
  );
}
