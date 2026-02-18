"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import {
  Plus,
  PencilIcon,
  Trash2Icon,
  Package,
  Search,
  X,
  ChevronDown,
  Filter,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type Product = {
  _id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  finish: string;
  size?: string;
  price: number;
  stock: number;
  unit: string;
  image?: string;
  isActive: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFinishes, setSelectedFinishes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    finish: "",
    size: "",
    price: 0,
    stock: 0,
    unit: "boxes",
    image: "",
  });

  // Load products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  // Extract unique categories and finishes from products
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map((p) => p.category))];
    return uniqueCategories.filter(Boolean).sort();
  }, [products]);

  const finishes = useMemo(() => {
    const uniqueFinishes = [...new Set(products.map((p) => p.finish))];
    return uniqueFinishes.filter(Boolean).sort();
  }, [products]);

  // Filter logic
  const filteredData = products.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

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

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: "",
      description: "",
      category: "",
      finish: "",
      size: "",
      price: 0,
      stock: 0,
      unit: "boxes",
      image: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description,
      category: product.category,
      finish: product.finish,
      size: product.size || "",
      price: product.price,
      stock: product.stock,
      unit: product.unit,
      image: product.image || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await api.deleteProduct(productId);
      if (response.success) {
        toast.success("Product deleted successfully");
        fetchProducts(); // Refresh list
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete product";
      toast.error("Failed to delete product", {
        description: errorMessage,
      });
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.sku ||
      !formData.category ||
      !formData.finish ||
      formData.price <= 0
    ) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    try {
      if (editingProduct) {
        // Update existing product
        const response = await api.updateProduct(editingProduct._id, formData);
        if (response.success) {
          toast.success("Product updated successfully");
          fetchProducts(); // Refresh list
        }
      } else {
        // Add new product
        const response = await api.createProduct(formData);
        if (response.success) {
          toast.success("Product added successfully");
          fetchProducts(); // Refresh list
        }
      }

      setIsDialogOpen(false);
      setFormData({
        name: "",
        sku: "",
        description: "",
        category: "",
        finish: "",
        size: "",
        price: 0,
        stock: 0,
        unit: "boxes",
        image: "",
      });
      setEditingProduct(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save product";
      toast.error(editingProduct ? "Failed to update product" : "Failed to add product", {
        description: errorMessage,
      });
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setFormData({
      name: "",
      sku: "",
      description: "",
      category: "",
      finish: "",
      size: "",
      price: 0,
      stock: 0,
      unit: "boxes",
      image: "",
    });
    setEditingProduct(null);
  };

  return (
    <div className="w-full min-w-0 space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl lg:text-3xl">
            Products
          </h1>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
            Manage your product inventory
          </p>
        </div>
        <Button onClick={handleAddProduct} className="w-full shrink-0 gap-2 sm:w-auto">
          <Plus className="h-4 w-4" />
          <span className="text-sm">Add Product</span>
        </Button>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full min-w-0 overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:rounded-2xl"
      >
        {/* Header */}
        <div className="w-full border-b border-neutral-200/60 p-3 dark:border-neutral-700/60 sm:p-4 lg:p-5">
          <div className="flex w-full min-w-0 items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 lg:rounded-xl"
                style={{ backgroundColor: "#c7a86415" }}
              >
                <Package className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5" style={{ color: "#c7a864" }} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-xs font-bold text-neutral-900 dark:text-white sm:text-sm lg:text-base">Stock Overview</h3>
                <p className="truncate text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
                  Current inventory status
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full border-b border-neutral-200/60 p-3 dark:border-neutral-700/60 sm:p-4 lg:p-5"
        >
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mb-2.5 w-full sm:mb-3"
          >
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400 sm:left-3 sm:h-4 sm:w-4" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full pl-8 pr-9 text-xs sm:h-10 sm:pl-10 sm:pr-10 sm:text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 sm:right-3"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Filter Dropdowns */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex w-full min-w-0 flex-wrap items-center gap-1.5 sm:gap-2"
          >
            <Filter className="h-3.5 w-3.5 shrink-0 text-neutral-500 dark:text-neutral-400 sm:h-4 sm:w-4" />

            {/* Category Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs sm:h-9 sm:gap-2 sm:text-sm">
                  <span className="hidden sm:inline">Category</span>
                  <span className="sm:hidden">Cat</span>
                  {selectedCategories.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-0.5 h-4 px-1 text-[10px] sm:ml-1 sm:h-5 sm:px-1.5 sm:text-xs"
                      style={{ backgroundColor: "#c7a864", color: "white" }}
                    >
                      {selectedCategories.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50 sm:h-3.5 sm:w-3.5" />
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
                    onChange={() => {}}
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
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs sm:h-9 sm:gap-2 sm:text-sm">
                  <span className="hidden sm:inline">Finish</span>
                  <span className="sm:hidden">Fin</span>
                  {selectedFinishes.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-0.5 h-4 px-1 text-[10px] sm:ml-1 sm:h-5 sm:px-1.5 sm:text-xs"
                      style={{ backgroundColor: "#c7a864", color: "white" }}
                    >
                      {selectedFinishes.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50 sm:h-3.5 sm:w-3.5" />
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
                      onChange={() => {}}
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
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs sm:h-9 sm:gap-2 sm:text-sm">
                  <span className="hidden sm:inline">Status</span>
                  <span className="sm:hidden">Stat</span>
                  {selectedStatus.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-0.5 h-4 px-1 text-[10px] sm:ml-1 sm:h-5 sm:px-1.5 sm:text-xs"
                      style={{ backgroundColor: "#c7a864", color: "white" }}
                    >
                      {selectedStatus.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50 sm:h-3.5 sm:w-3.5" />
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
                    onChange={() => {}}
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
                    onChange={() => {}}
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
                    onChange={() => {}}
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
              Showing {filteredData.length} of {products.length} products
            </motion.div>
          )}
        </motion.div>

        {/* Table Content */}
        <div className="p-4 sm:p-5 lg:p-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading products...</p>
              </div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="min-w-[180px] sm:min-w-[200px]">Product</TableHead>
                        <TableHead className="hidden md:table-cell">Category</TableHead>
                        <TableHead className="hidden lg:table-cell">Finish</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
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
                    const stockStatus =
                      item.stock === 0 ? "out" : item.stock <= 30 ? "low" : "good";

                    return (
                      <motion.tr
                        key={item._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="h-10 w-10 shrink-0 rounded-lg sm:h-12 sm:w-12">
                              <AvatarImage src={item.image || "/assets/products/placeholder.jpg"} alt={item.name} />
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
                              <span className="mt-0.5 block text-[10px] text-neutral-500 dark:text-neutral-400 md:hidden sm:text-xs">{item.category}</span>
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
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                onClick={() => handleEditProduct(item)}
                                aria-label={`product-${item._id}-edit`}
                              >
                                <PencilIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                onClick={() => handleDeleteProduct(item._id)}
                                aria-label={`product-${item._id}-remove`}
                              >
                                <Trash2Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
          )}
        </div>

        {/* Footer Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full border-t border-neutral-200/60 p-3 dark:border-neutral-700/60 sm:p-4 lg:p-5"
        >
          <div className="flex w-full min-w-0 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5 sm:gap-3 lg:gap-4">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="h-2 w-2 shrink-0 rounded-full bg-green-500 sm:h-2.5 sm:w-2.5" />
                <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 sm:text-xs">
                  In Stock: {inStock}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="h-2 w-2 shrink-0 rounded-full bg-amber-500 sm:h-2.5 sm:w-2.5" />
                <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 sm:text-xs">
                  Low Stock: {lowStock}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="h-2 w-2 shrink-0 rounded-full bg-red-500 sm:h-2.5 sm:w-2.5" />
                <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 sm:text-xs">
                  Out of Stock: {outOfStock}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-neutral-900 dark:text-white sm:text-sm">
              Total: {filteredData.length}{" "}
              {activeFiltersCount > 0 ? `of ${products.length}` : ""} Products
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <form onSubmit={handleSaveProduct}>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingProduct
                  ? "Update the product details below."
                  : "Fill in the details to add a new product."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 sm:gap-4">
              {/* Product Image Upload */}
              <div className="grid gap-2">
                <label
                  htmlFor="imageUpload"
                  className="text-xs font-medium text-neutral-700 dark:text-neutral-300 sm:text-sm"
                >
                  Product Image
                </label>
                
                {/* Image Preview */}
                <div className="flex flex-col items-center gap-2 sm:gap-3">
                  <div className="relative h-24 w-24 overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 sm:h-32 sm:w-32">
                    {formData.image ? (
                      <Avatar className="h-full w-full rounded-xl">
                        <AvatarImage
                          src={formData.image}
                          alt="Product preview"
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-xl bg-neutral-200 dark:bg-neutral-700">
                          <Package className="h-10 w-10 text-neutral-500 sm:h-12 sm:w-12" strokeWidth={1.5} />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-10 w-10 text-neutral-400 sm:h-12 sm:w-12" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  {/* File Input Button */}
                  <div className="flex flex-col items-center gap-2">
                    <label
                      htmlFor="imageUpload"
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 sm:px-4 sm:py-2 sm:text-sm"
                    >
                      <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Choose Image
                    </label>
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Convert image to base64
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, image: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {formData.image && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: "" })}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-center text-neutral-500 dark:text-neutral-400">
                  Upload product image from your device (JPG, PNG, GIF)
                </p>
              </div>

              {/* Product Name */}
              <div className="grid gap-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Product Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="e.g., Artic Apricot Matt"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* SKU */}
              <div className="grid gap-2">
                <label
                  htmlFor="sku"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  SKU <span className="text-red-500">*</span>
                </label>
                <Input
                  id="sku"
                  placeholder="e.g., CERAMIC-WHITE-60X60"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <label
                  htmlFor="description"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Description (Optional)
                </label>
                <Input
                  id="description"
                  placeholder="e.g., Porcelain Tile"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Size */}
              <div className="grid gap-2">
                <label
                  htmlFor="size"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Size (Optional)
                </label>
                <Input
                  id="size"
                  placeholder="e.g., 60x60 cm"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                />
              </div>

              {/* Price */}
              <div className="grid gap-2">
                <label
                  htmlFor="price"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Price (AUD) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 45.00"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>

              {/* Category */}
              <div className="grid gap-2">
                <label
                  htmlFor="category"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                <Input
                  id="category"
                  list="category-options"
                  placeholder="Select or type category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                />
                <datalist id="category-options">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                {formData.category && !categories.includes(formData.category) && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ This will create a new category: &ldquo;{formData.category}&rdquo;
                  </p>
                )}
              </div>

              {/* Finish */}
              <div className="grid gap-2">
                <label
                  htmlFor="finish"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Finish <span className="text-red-500">*</span>
                </label>
                <Input
                  id="finish"
                  list="finish-options"
                  placeholder="Select or type finish"
                  value={formData.finish}
                  onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                  required
                />
                <datalist id="finish-options">
                  {finishes.map((fin) => (
                    <option key={fin} value={fin} />
                  ))}
                </datalist>
                {formData.finish && !finishes.includes(formData.finish) && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ This will create a new finish: &ldquo;{formData.finish}&rdquo;
                  </p>
                )}
              </div>

              {/* Stock Quantity */}
              <div className="grid gap-2">
                <label
                  htmlFor="stock"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Stock Quantity
                </label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="e.g., 100"
                  value={formData.stock || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              {/* Unit */}
              <div className="grid gap-2">
                <label
                  htmlFor="unit"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Unit
                </label>
                <Input
                  id="unit"
                  placeholder="e.g., boxes, pieces, sqm"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">{editingProduct ? "Update" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
