"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Product = {
  _id: string;
  name: string;
  sku: string;
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

const statusStyles: Record<StockStatus, string> = {
  good: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  low: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  out: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const statusLabels: Record<StockStatus, string> = {
  good: "In Stock",
  low: "Low Stock",
  out: "Out of Stock",
};

export function StockOverview() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getProducts({
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 5,
      });

      setProducts(
        response?.success && Array.isArray(response?.products)
          ? (response.products as Product[]).slice(0, 5)
          : []
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch products";
      toast.error("Failed to load products", { description: errorMessage });
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const stockCounts = useMemo(() => {
    return products.reduce(
      (counts, product) => {
        const status = getStockStatus(product.stock);
        counts[status] += 1;
        return counts;
      },
      { good: 0, low: 0, out: 0 }
    );
  }, [products]);

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:rounded-2xl">
      <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-5 lg:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
              style={{ backgroundColor: "#c7a86415" }}
            >
              <Package className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#c7a864" }} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-neutral-900 dark:text-white sm:text-base">
                Stock Overview
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                Recent 5 products
              </p>
            </div>
          </div>

          <Link
            href="/inventory/products"
            className="group flex shrink-0 items-center gap-1.5 text-xs font-semibold hover:underline sm:text-sm"
            style={{ color: "#c7a864" }}
          >
            View All
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <div className="p-4 sm:p-5 lg:p-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[200px]">Product</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Finish</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`stock-skeleton-${index}`}>
                        <TableCell colSpan={5} className="h-[72px]">
                          <div className="h-4 w-full max-w-md animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package
                            className="h-10 w-10 text-neutral-300 dark:text-neutral-600"
                            strokeWidth={1.5}
                          />
                          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            No products found
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((item) => {
                      const stockStatus = getStockStatus(item.stock);

                      return (
                        <TableRow
                          key={item._id}
                          className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Avatar className="h-10 w-10 shrink-0 rounded-lg sm:h-11 sm:w-11">
                                <AvatarImage
                                  src={item.image || "/assets/products/placeholder.jpg"}
                                  alt={item.name}
                                />
                                <AvatarFallback className="flex items-center justify-center rounded-lg bg-neutral-200 text-xs dark:bg-neutral-700">
                                  <Package
                                    className="h-5 w-5 text-neutral-500"
                                    strokeWidth={1.5}
                                  />
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-neutral-900 dark:text-white sm:text-base">
                                  {item.name}
                                </div>
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
                            <span className="text-sm font-bold text-neutral-900 dark:text-white sm:text-base">
                              {item.stock}
                            </span>
                            <span className="ml-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
                              {item.unit}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusStyles[stockStatus]}>
                              {statusLabels[stockStatus]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 sm:text-sm">
              In Stock: {stockCounts.good}
            </span>
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 sm:text-sm">
              Low Stock: {stockCounts.low}
            </span>
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 sm:text-sm">
              Out of Stock: {stockCounts.out}
            </span>
          </div>

          <span className="text-sm font-bold text-neutral-900 dark:text-white sm:text-base">
            Showing {products.length} Products
          </span>
        </div>
      </div>
    </div>
  );
}
