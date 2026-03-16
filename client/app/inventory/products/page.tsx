"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import {
  Plus,
  Eye,
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
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
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
  size: string;
  price: number;
  stock: number;
  unit: string;
  image?: string;
  isActive: boolean;
  supplierType?: "third-party" | "own";
  supplierVendor?: string;
  supplierName?: string;
  boxCoveragePackingDetails?: string;
  tilesPerBox?: number;
  coveragePerBox?: number;
  coveragePerBoxUnit?: "sqft" | "sqm";
  weightPerBox?: number;
  retailPrice?: number;
  pricingUnit?: "per_box" | "per_sqft" | "per_sqm" | "per_piece";
  discountSalePrice?: number | null;
  builderPrice?: number | null;
  taxPercent?: number | null;
  costPrice?: number;
  profitMargin?: number | null;
};

const isSqmUnit = (unit?: string) =>
  String(unit || "")
    .trim()
    .toLowerCase() === "sqm";

const normalizeStockQuantity = (value: number, unit: string) => {
  const numericValue = Number.isFinite(value) ? value : 0;
  if (numericValue <= 0) return 0;
  if (isSqmUnit(unit)) return Math.round(numericValue * 100) / 100;
  return Math.floor(numericValue);
};

const parseStockInput = (rawValue: string, unit: string) => {
  if (rawValue === "") return 0;
  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) return 0;
  return normalizeStockQuantity(numericValue, unit);
};

const formatStockQuantity = (stock: number, unit?: string) => {
  const numericStock = Number(stock) || 0;
  if (isSqmUnit(unit)) {
    return (Math.round(numericStock * 100) / 100).toFixed(2);
  }
  return String(numericStock);
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [productToView, setProductToView] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFinishes, setSelectedFinishes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedSupplierTypes, setSelectedSupplierTypes] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>([]);
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
    supplierType: "own" as "third-party" | "own",
    supplierVendor: "",
    supplierName: "",
    boxCoveragePackingDetails: "",
    tilesPerBox: 0,
    coveragePerBox: 0,
    coveragePerBoxUnit: "sqft" as "sqft" | "sqm",
    weightPerBox: 0,
    retailPrice: 0,
    pricingUnit: "per_box" as "per_box" | "per_sqft" | "per_sqm" | "per_piece",
    discountSalePrice: null as number | null,
    builderPrice: null as number | null,
    taxPercent: null as number | null,
    costPrice: 0,
  });

  const emptyForm = () => ({
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
    supplierType: "own" as "third-party" | "own",
    supplierVendor: "",
    supplierName: "",
    boxCoveragePackingDetails: "",
    tilesPerBox: 0,
    coveragePerBox: 0,
    coveragePerBoxUnit: "sqft" as "sqft" | "sqm",
    weightPerBox: 0,
    retailPrice: 0,
    pricingUnit: "per_box" as "per_box" | "per_sqft" | "per_sqm" | "per_piece",
    discountSalePrice: null as number | null,
    builderPrice: null as number | null,
    taxPercent: null as number | null,
    costPrice: 0,
  });

  // Load products and suppliers from API
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const res = await api.getSuppliers();
        if (res.success && Array.isArray((res as { suppliers?: { _id: string; name: string }[] }).suppliers)) {
          setSuppliers((res as { suppliers: { _id: string; name: string }[] }).suppliers);
        }
      } catch {
        // ignore
      }
    };
    loadSuppliers();
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

    const itemSupplierType = item.supplierType ?? "own";
    const matchesSupplierType =
      selectedSupplierTypes.length === 0 ||
      selectedSupplierTypes.includes(itemSupplierType);

    return matchesSearch && matchesCategory && matchesFinish && matchesStatus && matchesSupplierType;
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

  const toggleSupplierType = (type: string) => {
    setSelectedSupplierTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedFinishes([]);
    setSelectedStatus([]);
    setSelectedSupplierTypes([]);
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    selectedCategories.length +
    selectedFinishes.length +
    selectedStatus.length +
    selectedSupplierTypes.length;

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData(emptyForm());
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description ?? "",
      category: product.category,
      finish: product.finish,
      size: product.size ?? "",
      price: product.price,
      stock: product.stock,
      unit: product.unit,
      image: product.image ?? "",
      supplierType: product.supplierType ?? "own",
      supplierVendor: product.supplierVendor ?? "",
      supplierName: product.supplierName ?? "",
      boxCoveragePackingDetails: product.boxCoveragePackingDetails ?? "",
      tilesPerBox: product.tilesPerBox ?? 0,
      coveragePerBox: product.coveragePerBox ?? 0,
      coveragePerBoxUnit: product.coveragePerBoxUnit ?? "sqft",
      weightPerBox: product.weightPerBox ?? 0,
      retailPrice: product.retailPrice ?? product.price,
      pricingUnit: product.pricingUnit ?? "per_box",
      discountSalePrice: product.discountSalePrice ?? null,
      builderPrice: product.builderPrice ?? null,
      taxPercent: product.taxPercent ?? null,
      costPrice: product.costPrice ?? 0,
    });
    setIsDialogOpen(true);
  };

  const openDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      const response = await api.deleteProduct(productToDelete._id);
      if (response.success) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        toast.error("Failed to delete product");
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

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!formData.sku?.trim()) {
      toast.error("SKU is required");
      return;
    }
    if (!formData.category?.trim()) {
      toast.error("Category is required");
      return;
    }
    if (!formData.finish?.trim()) {
      toast.error("Finish is required");
      return;
    }
    if (!formData.size?.trim()) {
      toast.error("Size is required");
      return;
    }
    if (formData.supplierType === "third-party" && !formData.supplierName?.trim()) {
      toast.error("Supplier name is required when Supplier Type is Third-Party");
      return;
    }
    if (!formData.boxCoveragePackingDetails?.trim()) {
      toast.error("Box coverage / packing details is required");
      return;
    }
    if (formData.tilesPerBox <= 0) {
      toast.error("Tiles per box is required and must be greater than 0");
      return;
    }
    if (formData.retailPrice <= 0) {
      toast.error("Retail price is required and must be greater than 0");
      return;
    }
    if (formData.costPrice <= 0) {
      toast.error("Cost price is required and must be greater than 0");
      return;
    }

    try {
      const payload = {
        ...formData,
        price: formData.retailPrice,
      };
      if (editingProduct) {
        const response = await api.updateProduct(editingProduct._id, payload);
        if (response.success) {
          toast.success("Product updated successfully");
          fetchProducts();
        }
      } else {
        const response = await api.createProduct(payload);
        if (response.success) {
          toast.success("Product added successfully");
          fetchProducts(); // Refresh list
        }
      }

      setIsDialogOpen(false);
      setFormData(emptyForm());
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
    setFormData(emptyForm());
    setEditingProduct(null);
  };

  return (
    <div className="w-full min-w-0 space-y-4 p-3 sm:space-y-6 sm:p-6 lg:p-8">
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

            {/* Supplier Type Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs sm:h-9 sm:gap-2 sm:text-sm">
                  <span className="hidden sm:inline">Supplier</span>
                  {selectedSupplierTypes.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-0.5 h-4 px-1 text-[10px] sm:ml-1 sm:h-5 sm:px-1.5 sm:text-xs"
                      style={{ backgroundColor: "#c7a864", color: "white" }}
                    >
                      {selectedSupplierTypes.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50 sm:h-3.5 sm:w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleSupplierType("own");
                  }}
                >
                  <Checkbox checked={selectedSupplierTypes.includes("own")} onChange={() => {}} />
                  <span>Own</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleSupplierType("third-party");
                  }}
                >
                  <Checkbox checked={selectedSupplierTypes.includes("third-party")} onChange={() => {}} />
                  <span>Third-Party</span>
                </DropdownMenuItem>
                {selectedSupplierTypes.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-neutral-600 dark:text-neutral-400"
                      onSelect={() => setSelectedSupplierTypes([])}
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
                        <TableHead className="min-w-[160px] sm:min-w-[180px]">Product</TableHead>
                        <TableHead className="hidden md:table-cell min-w-[70px]">Size</TableHead>
                        <TableHead className="hidden md:table-cell">Category</TableHead>
                        <TableHead className="hidden lg:table-cell">Finish</TableHead>
                        <TableHead className="hidden lg:table-cell min-w-[90px]">Supplier</TableHead>
                        <TableHead className="min-w-[80px]">Retail</TableHead>
                        <TableHead className="hidden xl:table-cell min-w-[80px]">Unit</TableHead>
                        <TableHead className="min-w-[70px]">Stock</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
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
                        <TableCell className="hidden text-neutral-700 dark:text-neutral-300 md:table-cell text-xs">
                          {item.size ?? "—"}
                        </TableCell>
                        <TableCell className="hidden text-neutral-700 dark:text-neutral-300 md:table-cell">
                          {item.category}
                        </TableCell>
                        <TableCell className="hidden text-neutral-700 dark:text-neutral-300 lg:table-cell">
                          {item.finish}
                        </TableCell>
                        <TableCell className="hidden text-neutral-700 dark:text-neutral-300 lg:table-cell">
                          <span className="text-xs">
                            {(item.supplierType ?? "own") === "third-party" ? "Third-Party" : "Own"}
                            {item.supplierName ? ` · ${String(item.supplierName).slice(0, 12)}${(item.supplierName?.length ?? 0) > 12 ? "…" : ""}` : ""}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-neutral-900 dark:text-white">
                          {item.retailPrice != null ? `$${Number(item.retailPrice).toFixed(2)}` : item.price != null ? `$${Number(item.price).toFixed(2)}` : "—"}
                        </TableCell>
                        <TableCell className="hidden text-neutral-600 dark:text-neutral-400 xl:table-cell text-xs capitalize">
                          {item.pricingUnit ? item.pricingUnit.replace("per_", "per ") : "—"}
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
                              {formatStockQuantity(item.stock, item.unit)}
                            </span>
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
                              {item.unit}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 h-8 text-xs sm:h-9 sm:text-sm"
                            onClick={() => {
                              setProductToView(item);
                              setViewModalOpen(true);
                            }}
                            aria-label={`View ${item.name}`}
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            View
                          </Button>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[540px]">
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
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Product Image (Optional)</label>
                <div className="flex flex-col items-center gap-2 sm:gap-3">
                  <div className="relative h-24 w-24 overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 sm:h-28 sm:w-28">
                    {formData.image ? (
                      <Avatar className="h-full w-full rounded-xl">
                        <AvatarImage src={formData.image} alt="Preview" className="object-cover" />
                        <AvatarFallback className="rounded-xl bg-neutral-200 dark:bg-neutral-700">
                          <Package className="h-8 w-8 text-neutral-500 sm:h-10 sm:w-10" strokeWidth={1.5} />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-8 w-8 text-neutral-400 sm:h-10 sm:w-10" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="product-image-upload"
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 sm:px-4 sm:py-2 sm:text-sm"
                    >
                      <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Choose Image
                    </label>
                    <input
                      id="product-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setFormData({ ...formData, image: reader.result as string });
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
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">JPG, PNG, GIF. Optional.</p>
              </div>

              {/* Basic */}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Product Name <span className="text-red-500">*</span></label>
                <Input placeholder="e.g., Artic Apricot Matt" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">SKU <span className="text-red-500">*</span></label>
                <Input placeholder="e.g., CERAMIC-WHITE-60X60" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Description (Optional)</label>
                <Input placeholder="e.g., Porcelain Tile" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Size <span className="text-red-500">*</span></label>
                <Input placeholder="e.g., 60x60 cm" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Category <span className="text-red-500">*</span></label>
                <Input list="category-options" placeholder="Select or type" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
                <datalist id="category-options">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Finish <span className="text-red-500">*</span></label>
                <Input list="finish-options" placeholder="Select or type" value={formData.finish} onChange={(e) => setFormData({ ...formData, finish: e.target.value })} required />
                <datalist id="finish-options">{finishes.map((f) => <option key={f} value={f} />)}</datalist>
              </div>

              {/* Supplier Type (toggle): Third-Party / Own */}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Supplier Type <span className="text-red-500">*</span></label>
                <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 p-1">
                  <button
                    type="button"
                    className={`flex-1 rounded-md py-2 text-sm font-medium ${formData.supplierType === "own" ? "bg-amp-primary text-white" : "text-neutral-600 dark:text-neutral-400"}`}
                    onClick={() => setFormData({ ...formData, supplierType: "own", supplierName: "" })}
                  >
                    Own
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-md py-2 text-sm font-medium ${formData.supplierType === "third-party" ? "bg-amp-primary text-white" : "text-neutral-600 dark:text-neutral-400"}`}
                    onClick={() => setFormData({ ...formData, supplierType: "third-party" })}
                  >
                    Third-Party
                  </button>
                </div>
              </div>
              {formData.supplierType === "third-party" && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Supplier Name <span className="text-red-500">*</span></label>
                  <Input list="supplier-names" placeholder="Select or type new" value={formData.supplierName} onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })} required={formData.supplierType === "third-party"} />
                  <datalist id="supplier-names">{suppliers.map((s) => <option key={s._id} value={s.name} />)}</datalist>
                </div>
              )}

              {/* Box Coverage / Packing */}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Box Coverage / Packing Details <span className="text-red-500">*</span></label>
                <Input placeholder="e.g., 6 tiles, 1.44 sqm per box" value={formData.boxCoveragePackingDetails} onChange={(e) => setFormData({ ...formData, boxCoveragePackingDetails: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Tiles per Box <span className="text-red-500">*</span></label>
                  <Input type="number" min={1} step={1} value={formData.tilesPerBox || ""} onChange={(e) => setFormData({ ...formData, tilesPerBox: parseInt(e.target.value) || 0 })} required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Coverage per Box (Optional)</label>
                  <Input type="number" min={0} step={0.01} value={formData.coveragePerBox || ""} onChange={(e) => setFormData({ ...formData, coveragePerBox: parseFloat(e.target.value) || 0 })} placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Coverage Unit</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                    value={formData.coveragePerBoxUnit}
                    onChange={(e) => setFormData({ ...formData, coveragePerBoxUnit: e.target.value as "sqft" | "sqm" })}
                  >
                    <option value="sqft">Sq Ft</option>
                    <option value="sqm">Sq Meter</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Weight per Box (kg) (Optional)</label>
                  <Input type="number" min={0} step={0.01} value={formData.weightPerBox || ""} onChange={(e) => setFormData({ ...formData, weightPerBox: parseFloat(e.target.value) || 0 })} placeholder="Optional" />
                </div>
              </div>

              {/* Sale (Customer Facing) */}
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 mt-1">
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">Sale (Customer Facing)</p>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Pricing Unit <span className="text-red-500">*</span></label>
                  <select
                    className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                    value={formData.pricingUnit}
                    onChange={(e) => setFormData({ ...formData, pricingUnit: e.target.value as "per_box" | "per_sqft" | "per_sqm" | "per_piece" })}
                  >
                    <option value="per_box">Per Box</option>
                    <option value="per_sqft">Per Sq Ft</option>
                    <option value="per_sqm">Per Sq Meter</option>
                    <option value="per_piece">Per Piece</option>
                  </select>
                  <p className="text-xs text-neutral-500">System will auto-convert using coverage per box & tiles per box.</p>
                </div>
                <div className="grid gap-2 mt-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Retail Price (per selected unit) <span className="text-red-500">*</span></label>
                  <Input type="number" min={0} step={0.01} placeholder="e.g., 45.00" value={formData.retailPrice || ""} onChange={(e) => setFormData({ ...formData, retailPrice: parseFloat(e.target.value) || 0 })} required />
                </div>
                <div className="grid gap-2 mt-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Builder Price (Optional)</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Special builder rate"
                    value={formData.builderPrice ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        builderPrice: e.target.value === "" ? null : parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2 mt-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Discount / Sale Price (Optional)</label>
                  <Input type="number" min={0} step={0.01} placeholder="Optional" value={formData.discountSalePrice ?? ""} onChange={(e) => setFormData({ ...formData, discountSalePrice: e.target.value === "" ? null : parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="grid gap-2 mt-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Tax % / VAT (Optional)</label>
                  <Input type="number" min={0} max={100} step={0.01} placeholder="e.g., 10" value={formData.taxPercent ?? ""} onChange={(e) => setFormData({ ...formData, taxPercent: e.target.value === "" ? null : parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              {/* Cost (Admin Only) */}
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 mt-1">
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">Cost (Admin Only)</p>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Cost Price <span className="text-red-500">*</span></label>
                  <Input type="number" min={0} step={0.01} placeholder="Supplier/production cost" value={formData.costPrice || ""} onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })} required />
                </div>
                <div className="grid gap-2 mt-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Profit Margin (auto)</label>
                  <Input
                    readOnly
                    className="bg-neutral-100 dark:bg-neutral-800"
                    value={
                      formData.costPrice > 0 && formData.retailPrice > 0
                        ? `${Math.round(((formData.retailPrice - formData.costPrice) / formData.costPrice) * 10000) / 100}%`
                        : "—"
                    }
                  />
                </div>
              </div>

              {/* Stock (optional) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Stock Qty</label>
                  <Input
                    type="number"
                    min={0}
                    step={isSqmUnit(formData.unit) ? 0.01 : 1}
                    value={formData.stock || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: parseStockInput(e.target.value, formData.unit),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Unit</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                    value={formData.unit || "boxes"}
                    onChange={(e) => {
                      const nextUnit = e.target.value;
                      setFormData({
                        ...formData,
                        unit: nextUnit,
                        stock: normalizeStockQuantity(formData.stock, nextUnit),
                      });
                    }}
                  >
                    <option value="boxes">Per Box</option>
                    <option value="sq ft">Per Sq Ft</option>
                    <option value="sqm">Per Sq Meter</option>
                    <option value="piece">Per Piece</option>
                    <option value="pieces">Per Pieces</option>
                  </select>
                </div>
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

      {/* View Product Modal (read-only) */}
      <Dialog open={viewModalOpen} onOpenChange={(open) => { setViewModalOpen(open); if (!open) setProductToView(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Product Details</DialogTitle>
            <DialogDescription>View only. No edits here.</DialogDescription>
          </DialogHeader>
          {productToView && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="flex justify-center mb-2">
                {productToView.image ? (
                  <Avatar className="h-24 w-24 rounded-xl sm:h-28 sm:w-28">
                    <AvatarImage src={productToView.image} alt={productToView.name} className="object-cover" />
                    <AvatarFallback className="rounded-xl bg-neutral-200 dark:bg-neutral-700"><Package className="h-10 w-10" /></AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 sm:h-28 sm:w-28">
                    <Package className="h-10 w-10 text-neutral-400" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <span className="text-neutral-500 dark:text-neutral-400">Name</span><span className="font-medium">{productToView.name}</span>
                <span className="text-neutral-500 dark:text-neutral-400">SKU</span><span className="font-medium">{productToView.sku}</span>
                <span className="text-neutral-500 dark:text-neutral-400">Size</span><span>{productToView.size ?? "—"}</span>
                <span className="text-neutral-500 dark:text-neutral-400">Category</span><span>{productToView.category}</span>
                <span className="text-neutral-500 dark:text-neutral-400">Finish</span><span>{productToView.finish}</span>
                <span className="text-neutral-500 dark:text-neutral-400">Supplier</span><span>{(productToView.supplierType ?? "own") === "third-party" ? "Third-Party" : "Own"}{productToView.supplierName ? ` · ${productToView.supplierName}` : ""}</span>
                <span className="text-neutral-500 dark:text-neutral-400">Box / Packing</span><span className="col-span-1">{productToView.boxCoveragePackingDetails ?? "—"}</span>
                <span className="text-neutral-500 dark:text-neutral-400">Tiles per Box</span><span>{productToView.tilesPerBox ?? "—"}</span>
                <span className="text-neutral-500 dark:text-neutral-400">Coverage per Box</span><span>{productToView.coveragePerBox != null ? `${productToView.coveragePerBox} ${productToView.coveragePerBoxUnit ?? "sqft"}` : "—"}</span>
                <span className="text-neutral-500 dark:text-neutral-400">Weight per Box (kg)</span><span>{productToView.weightPerBox ?? "—"}</span>
                <span className="text-neutral-500 dark:text-neutral-400">Retail Price</span><span className="font-medium">${Number(productToView.retailPrice ?? productToView.price ?? 0).toFixed(2)}</span>
                <span className="text-neutral-500 dark:text-neutral-400">Builder Price</span><span>{productToView.builderPrice != null ? `$${Number(productToView.builderPrice).toFixed(2)}` : "—"}</span>
                <span className="text-neutral-500 dark:text-neutral-400">Pricing Unit</span><span>{productToView.pricingUnit ? String(productToView.pricingUnit).replace("per_", "per ") : "—"}</span>
                <span className="text-neutral-500 dark:text-neutral-400">Cost Price</span><span>${Number(productToView.costPrice ?? 0).toFixed(2)}</span>
                <span className="text-neutral-500 dark:text-neutral-400">Profit Margin</span><span>{productToView.profitMargin != null ? `${productToView.profitMargin}%` : "—"}</span>
                <span className="text-neutral-500 dark:text-neutral-400">Stock</span><span>{formatStockQuantity(productToView.stock, productToView.unit)} {productToView.unit}</span>
              </div>
              {productToView.description && (
                <>
                  <span className="text-neutral-500 dark:text-neutral-400">Description</span>
                  <p className="text-neutral-700 dark:text-neutral-300">{productToView.description}</p>
                </>
              )}
              <DialogFooter className="gap-2 pt-4">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setViewModalOpen(false); handleEditProduct(productToView); setProductToView(null); setIsDialogOpen(true); }}>
                  <PencilIcon className="h-4 w-4" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30" onClick={() => { setViewModalOpen(false); setProductToView(null); openDeleteModal(productToView); }}>
                  <Trash2Icon className="h-4 w-4" /> Delete
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setViewModalOpen(false); setProductToView(null); }}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
        onConfirm={handleConfirmDeleteProduct}
      />
    </div>
  );
}
