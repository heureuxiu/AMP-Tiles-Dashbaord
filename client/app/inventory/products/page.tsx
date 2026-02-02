"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
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

// Initial products data
const initialProductsData = [
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

type Product = {
  id: string;
  productName: string;
  model: string;
  src: string;
  fallback: string;
  category: string;
  finish: string;
  stock: number;
};

export default function ProductsPage() {
  const id = useId();
  const [products, setProducts] = useState<Product[]>(initialProductsData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFinishes, setSelectedFinishes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    productName: "",
    model: "",
    category: "",
    finish: "",
    stock: 0,
    imageUrl: "",
  });

  // Filter logic
  const filteredData = products.filter((item) => {
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

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      productName: "",
      model: "",
      category: "",
      finish: "",
      stock: 0,
      imageUrl: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName,
      model: product.model,
      category: product.category,
      finish: product.finish,
      stock: product.stock,
      imageUrl: product.src,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    toast.success("Product deleted successfully");
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.productName ||
      !formData.model ||
      !formData.category ||
      !formData.finish ||
      formData.stock < 0
    ) {
      toast.error("Please fill all fields correctly");
      return;
    }

    if (editingProduct) {
      // Update existing product
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                productName: formData.productName,
                model: formData.model,
                category: formData.category,
                finish: formData.finish,
                stock: formData.stock,
                src: formData.imageUrl || p.src,
              }
            : p
        )
      );
      toast.success("Product updated successfully");
    } else {
      // Add new product
      const newProduct: Product = {
        id: String(Math.max(...products.map((p) => parseInt(p.id))) + 1),
        productName: formData.productName,
        model: formData.model,
        category: formData.category,
        finish: formData.finish,
        stock: formData.stock,
        src: formData.imageUrl || "/assets/products/placeholder.jpg",
        fallback: formData.productName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 3),
      };
      setProducts([...products, newProduct]);
      toast.success("Product added successfully");
    }

    setIsDialogOpen(false);
    setFormData({
      productName: "",
      model: "",
      category: "",
      finish: "",
      stock: 0,
      imageUrl: "",
    });
    setEditingProduct(null);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setFormData({
      productName: "",
      model: "",
      category: "",
      finish: "",
      stock: 0,
      imageUrl: "",
    });
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Products
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Manage your product inventory
          </p>
        </div>
        <Button onClick={handleAddProduct} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
      >
        {/* Header */}
        <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "#c7a86415" }}
              >
                <Package className="h-5 w-5" style={{ color: "#c7a864" }} strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Stock Overview</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
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
          className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60"
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
                    <Checkbox checked={selectedCategories.includes(category)} readOnly />
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
                    <Checkbox checked={selectedFinishes.includes(finish)} readOnly />
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
                  <Checkbox checked={selectedStatus.includes("in-stock")} readOnly />
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
                  <Checkbox checked={selectedStatus.includes("low-stock")} readOnly />
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
                  <Checkbox checked={selectedStatus.includes("out-of-stock")} readOnly />
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
        <div className="p-6">
          <div className="[&>div]:rounded-lg [&>div]:border [&>div]:border-neutral-200/60 dark:[&>div]:border-neutral-700/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>
                    <Checkbox id={id} aria-label="select-all" />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Finish</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="w-0">Actions</TableHead>
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
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800"
                      >
                        <TableCell>
                          <Checkbox
                            id={`table-checkbox-${item.id}`}
                            aria-label={`product-checkbox-${item.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="rounded-lg h-12 w-12">
                              <AvatarImage src={item.src} alt={item.model} />
                              <AvatarFallback className="text-xs rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                                <Package
                                  className="h-6 w-6 text-neutral-500"
                                  strokeWidth={1.5}
                                />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-neutral-900 dark:text-white">
                                {item.productName}
                              </div>
                              <span className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                                {item.model}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-neutral-700 dark:text-neutral-300">
                          {item.category}
                        </TableCell>
                        <TableCell className="text-neutral-700 dark:text-neutral-300">
                          {item.finish}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-lg font-bold ${
                                stockStatus === "out"
                                  ? "text-red-600 dark:text-red-400"
                                  : stockStatus === "low"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-green-600 dark:text-green-400"
                              }`}
                            >
                              {item.stock}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                              boxes
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                              onClick={() => handleEditProduct(item)}
                              aria-label={`product-${item.id}-edit`}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                              onClick={() => handleDeleteProduct(item.id)}
                              aria-label={`product-${item.id}-remove`}
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="border-t border-neutral-200/60 p-6 dark:border-neutral-700/60"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  In Stock: {inStock}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Low Stock: {lowStock}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Out of Stock: {outOfStock}
                </span>
              </div>
            </div>
            <span className="font-bold text-neutral-900 dark:text-white">
              Total: {filteredData.length}{" "}
              {activeFiltersCount > 0 ? `of ${products.length}` : ""} Products
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSaveProduct}>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Update the product details below."
                  : "Fill in the details to add a new product."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Product Image Upload */}
              <div className="grid gap-2">
                <label
                  htmlFor="imageUpload"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Product Image
                </label>
                
                {/* Image Preview */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-32 w-32 overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800">
                    {formData.imageUrl ? (
                      <Avatar className="h-full w-full rounded-xl">
                        <AvatarImage
                          src={formData.imageUrl}
                          alt="Product preview"
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-xl bg-neutral-200 dark:bg-neutral-700">
                          <Package className="h-12 w-12 text-neutral-500" strokeWidth={1.5} />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-12 w-12 text-neutral-400" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  {/* File Input Button */}
                  <div className="flex flex-col items-center gap-2">
                    <label
                      htmlFor="imageUpload"
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      <Upload className="h-4 w-4" />
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
                            setFormData({ ...formData, imageUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {formData.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: "" })}
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
                  htmlFor="productName"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Product Name
                </label>
                <Input
                  id="productName"
                  placeholder="e.g., Artic Apricot Matt"
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData({ ...formData, productName: e.target.value })
                  }
                  required
                />
              </div>

              {/* Model/Description */}
              <div className="grid gap-2">
                <label
                  htmlFor="model"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Model/Description
                </label>
                <Input
                  id="model"
                  placeholder="e.g., Porcelain Tile"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>

              {/* Category */}
              <div className="grid gap-2">
                <label
                  htmlFor="category"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Finish */}
              <div className="grid gap-2">
                <label
                  htmlFor="finish"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Finish
                </label>
                <select
                  id="finish"
                  value={formData.finish}
                  onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                  required
                >
                  <option value="">Select finish</option>
                  {finishes.map((fin) => (
                    <option key={fin} value={fin}>
                      {fin}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Quantity */}
              <div className="grid gap-2">
                <label
                  htmlFor="stock"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Stock Quantity (boxes)
                </label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="e.g., 100"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                  }
                  required
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
