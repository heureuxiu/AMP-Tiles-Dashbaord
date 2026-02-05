"use client";

import { useId, useState } from "react";
import { PencilIcon, Trash2Icon, ArchiveIcon, Package, Search, X, ChevronDown, Filter } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const stockData = [
  {
    id: "1",
    productName: "Amaze Grey Polished",
    model: "Marble Look Porcelain Tile",
    src: "/assets/products/amaze-grey.jpg",
    fallback: "AGP",
    category: "Royal Series",
    finish: "Polished",
    stock: 245,
  },
  {
    id: "2",
    productName: "Amaze Luxury Matt",
    model: "Marble Look Porcelain Tile",
    src: "/assets/products/amaze-luxury.jpg",
    fallback: "ALM",
    category: "Royal Series",
    finish: "Matt",
    stock: 156,
  },
  {
    id: "3",
    productName: "Artic Apricot Matt",
    model: "Porcelain Tile",
    src: "/assets/products/artic-apricot.jpg",
    fallback: "AAM",
    category: "Artic Series",
    finish: "Matt",
    stock: 89,
  },
  {
    id: "4",
    productName: "Artic Cloud Matt",
    model: "Porcelain Tile",
    src: "/assets/products/artic-cloud.jpg",
    fallback: "ACM",
    category: "Artic Series",
    finish: "Matt",
    stock: 23,
  },
  {
    id: "5",
    productName: "Aspen Ash Grey",
    model: "Steel Matt Porcelain",
    src: "/assets/products/aspen-ash.jpg",
    fallback: "AAG",
    category: "Galaxy Series",
    finish: "Matt",
    stock: 12,
  },
  {
    id: "6",
    productName: "Bianco Matt",
    model: "Marble Look Porcelain",
    src: "/assets/products/bianco-matt.jpg",
    fallback: "BMM",
    category: "Marella Series",
    finish: "Matt",
    stock: 0,
  },
];

const categories = ["Royal Series", "Artic Series", "Galaxy Series", "Marella Series"];
const finishes = ["Matt", "Polished", "Gloss", "In & Out (P4)"];

export function StockOverview() {
  const id = useId();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFinishes, setSelectedFinishes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  // Filter logic
  const filteredData = stockData.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(item.category);

    const matchesFinish =
      selectedFinishes.length === 0 || selectedFinishes.includes(item.finish);

    const stockStatus = item.stock === 0 ? "out" : item.stock <= 30 ? "low" : "good";
    const matchesStatus =
      selectedStatus.length === 0 ||
      (selectedStatus.includes("in-stock") && stockStatus === "good") ||
      (selectedStatus.includes("low-stock") && stockStatus === "low") ||
      (selectedStatus.includes("out-of-stock") && stockStatus === "out");

    return matchesSearch && matchesCategory && matchesFinish && matchesStatus;
  });

  const inStock = filteredData.filter((item) => item.stock > 30).length;
  const lowStock = filteredData.filter((item) => item.stock > 0 && item.stock <= 30).length;
  const outOfStock = filteredData.filter((item) => item.stock === 0).length;

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-full rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
    >
      {/* Header */}
      <div className="border-b border-neutral-200/60 p-4 sm:p-6 dark:border-neutral-700/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl"
              style={{ backgroundColor: "#c7a86415" }}
            >
              <Package className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#c7a864" }} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">Stock Overview</h3>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Current inventory status</p>
            </div>
          </div>
          <Link href="/dashboard/inventory" className="text-xs sm:text-sm font-semibold hover:underline" style={{ color: "#c7a864" }}>
            View All
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="border-b border-neutral-200/60 p-4 sm:p-6 dark:border-neutral-700/60"
      >
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-4"
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
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Filter Dropdowns */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-wrap items-center gap-3"
        >
          <Filter className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />

          {/* Category Dropdown */}
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
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  className="flex items-center gap-2 cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleCategory(category);
                  }}
                >
                  <Checkbox
                    checked={selectedCategories.includes(category)}
                    readOnly
                  />
                  <span>{category}</span>
                </DropdownMenuItem>
              ))}
              {selectedCategories.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-neutral-600 dark:text-neutral-400"
                    onSelect={() => setSelectedCategories([])}
                  >
                    <X className="mr-2 h-3.5 w-3.5" />
                    Clear
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Finish Dropdown */}
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
              {finishes.map((finish) => (
                <DropdownMenuItem
                  key={finish}
                  className="flex items-center gap-2 cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleFinish(finish);
                  }}
                >
                  <Checkbox
                    checked={selectedFinishes.includes(finish)}
                    readOnly
                  />
                  <span>{finish}</span>
                </DropdownMenuItem>
              ))}
              {selectedFinishes.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-neutral-600 dark:text-neutral-400"
                    onSelect={() => setSelectedFinishes([])}
                  >
                    <X className="mr-2 h-3.5 w-3.5" />
                    Clear
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Dropdown */}
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
                className="flex items-center gap-2 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  toggleStatus("in-stock");
                }}
              >
                <Checkbox
                  checked={selectedStatus.includes("in-stock")}
                  readOnly
                />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>In Stock</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  toggleStatus("low-stock");
                }}
              >
                <Checkbox
                  checked={selectedStatus.includes("low-stock")}
                  readOnly
                />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Low Stock</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  toggleStatus("out-of-stock");
                }}
              >
                <Checkbox
                  checked={selectedStatus.includes("out-of-stock")}
                  readOnly
                />
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
                    onSelect={() => setSelectedStatus([])}
                  >
                    <X className="mr-2 h-3.5 w-3.5" />
                    Clear
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear All Filters */}
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
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 text-sm text-neutral-600 dark:text-neutral-400"
          >
            Showing {filteredData.length} of {stockData.length} products
          </motion.div>
        )}
      </motion.div>

      {/* Table Content */}
      <div className="p-4 sm:p-6">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-lg border border-neutral-200/60 dark:border-neutral-700/60">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="hidden sm:table-cell">
                      <Checkbox id={id} aria-label="select-all" />
                    </TableHead>
                    <TableHead className="min-w-[200px]">Product</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Finish</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="w-0">Actions</TableHead>
                  </TableRow>
                </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-12 w-12 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
                      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No products found</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">
                        Try adjusting your filters
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => {
                const stockStatus = item.stock === 0 ? "out" : item.stock <= 30 ? "low" : "good";

                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-b transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800"
                  >
                    <TableCell className="hidden sm:table-cell">
                      <Checkbox id={`table-checkbox-${item.id}`} aria-label={`product-checkbox-${item.id}`} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="rounded-lg h-10 w-10 sm:h-12 sm:w-12">
                          <AvatarImage src={item.src} alt={item.model} />
                          <AvatarFallback className="text-xs rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-500" strokeWidth={1.5} />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-sm sm:text-base text-neutral-900 dark:text-white truncate">{item.productName}</div>
                          <span className="mt-0.5 text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 block md:hidden">{item.category}</span>
                          <span className="mt-0.5 text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400">{item.model}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-neutral-700 dark:text-neutral-300">{item.category}</TableCell>
                    <TableCell className="hidden lg:table-cell text-neutral-700 dark:text-neutral-300">{item.finish}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span
                          className={`text-base sm:text-lg font-bold ${
                            stockStatus === "out"
                              ? "text-red-600 dark:text-red-400"
                              : stockStatus === "low"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {item.stock}
                        </span>
                        <span className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400">boxes</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            aria-label={`product-${item.id}-edit`}
                          >
                            <PencilIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="hidden sm:block">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            aria-label={`product-${item.id}-remove`}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="hidden lg:block">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            aria-label={`product-${item.id}-archive`}
                          >
                            <ArchiveIcon className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })
              )}
            </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="border-t border-neutral-200/60 p-4 sm:p-6 dark:border-neutral-700/60"
      >
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500" />
              <span className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">In Stock: {inStock}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-amber-500" />
              <span className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">Low Stock: {lowStock}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500" />
              <span className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">Out of Stock: {outOfStock}</span>
            </div>
          </div>
          <span className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
            Total: {filteredData.length} {activeFiltersCount > 0 ? `of ${stockData.length}` : ""} Products
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

