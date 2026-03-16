"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Package,
  Edit,
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  FileText,
  MapPin,
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
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Supplier = {
  _id: string;
  supplierNumber: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  website?: string;
  abn?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  paymentTerms?: string;
  deliveryMethod?: string;
  status: string;
  notes?: string;
};

type Product = {
  _id: string;
  name: string;
  sku: string;
  category: string;
  finish: string;
  size: string;
  stock: number;
  unit: string;
  retailPrice: number;
  pricingUnit: string;
  coveragePerBox?: number;
  coveragePerBoxUnit?: string;
  isActive: boolean;
};

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  const fetchSupplier = async () => {
    try {
      setIsLoading(true);
      const response = await api.getSupplier(supplierId);
      if (response.success && response.supplier) {
        const s = response.supplier as Supplier;
        setSupplier(s);
        fetchProducts(s.name);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load supplier";
      toast.error("Failed to load supplier", { description: errorMessage });
      router.push("/suppliers");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async (supplierName: string) => {
    try {
      setIsLoadingProducts(true);
      const response = await api.getProducts({ supplierName });
      if (response.success && response.products) {
        setProducts(response.products as Product[]);
      }
    } catch {
      // silently ignore — products section is supplementary
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const getSqm = (product: Product): string | null => {
    if (!product.coveragePerBox) return null;
    const sqmPerBox =
      product.coveragePerBoxUnit === "sqm"
        ? product.coveragePerBox
        : product.coveragePerBox * 0.0929;
    return (product.stock * sqmPerBox).toFixed(2);
  };

  const totalBoxes = products.reduce((sum, p) => sum + p.stock, 0);
  const totalSqm = products.reduce((sum, p) => {
    if (!p.coveragePerBox) return sum;
    const sqmPerBox =
      p.coveragePerBoxUnit === "sqm"
        ? p.coveragePerBox
        : p.coveragePerBox * 0.0929;
    return sum + p.stock * sqmPerBox;
  }, 0);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Loading supplier...
          </p>
        </div>
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <div className="min-w-0 w-full space-y-4 p-3 sm:space-y-6 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/suppliers")}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              {supplier.name}
            </h1>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
              {supplier.supplierNumber} · Supplier Details
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/suppliers/${supplierId}/edit`)}
          className="w-full shrink-0 gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 sm:w-auto"
        >
          <Edit className="h-4 w-4" />
          Edit Supplier
        </Button>
      </div>

      {/* Supplier Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="min-w-0 rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:rounded-2xl"
      >
        <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
              style={{ backgroundColor: "#8b5cf615" }}
            >
              <Users
                className="h-4 w-4 sm:h-5 sm:w-5"
                style={{ color: "#8b5cf6" }}
                strokeWidth={2}
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-neutral-900 dark:text-white sm:text-base">
                Supplier Information
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                Contact &amp; business details
              </p>
            </div>
            <div className="ml-auto">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  supplier.status === "active"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                    : "bg-neutral-100 text-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400"
                }`}
              >
                {supplier.status.charAt(0).toUpperCase() +
                  supplier.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {supplier.contactPerson && (
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Contact Person
                </p>
                <p className="mt-0.5 text-sm font-medium text-neutral-900 dark:text-white">
                  {supplier.contactPerson}
                </p>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Phone</p>
                <p className="mt-0.5 text-sm font-medium text-neutral-900 dark:text-white">
                  {supplier.phone}
                </p>
              </div>
            </div>
            {supplier.email && (
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Email</p>
                  <p className="mt-0.5 text-sm font-medium text-neutral-900 dark:text-white">
                    {supplier.email}
                  </p>
                </div>
              </div>
            )}
            {supplier.website && (
              <div className="flex items-start gap-2">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Website</p>
                  <p className="mt-0.5 text-sm font-medium text-neutral-900 dark:text-white">
                    {supplier.website}
                  </p>
                </div>
              </div>
            )}
            {supplier.abn && (
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">ABN</p>
                <p className="mt-0.5 text-sm font-medium text-neutral-900 dark:text-white">
                  {supplier.abn}
                </p>
              </div>
            )}
            {(supplier.address?.city || supplier.address?.state || supplier.address?.street) && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Address</p>
                  <p className="mt-0.5 text-sm font-medium text-neutral-900 dark:text-white">
                    {[
                      supplier.address?.street,
                      supplier.address?.city,
                      supplier.address?.state,
                      supplier.address?.postcode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}
            {supplier.paymentTerms && (
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Payment Terms</p>
                <p className="mt-0.5 text-sm font-medium text-neutral-900 dark:text-white">
                  {supplier.paymentTerms}
                </p>
              </div>
            )}
            {supplier.deliveryMethod && (
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Delivery Method
                </p>
                <p className="mt-0.5 text-sm font-medium text-neutral-900 dark:text-white">
                  {supplier.deliveryMethod}
                </p>
              </div>
            )}
          </div>
          {supplier.notes && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900/50">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Notes</p>
                <p className="mt-0.5 text-sm text-neutral-700 dark:text-neutral-300">
                  {supplier.notes}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Products from this supplier */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="min-w-0 overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:rounded-2xl"
      >
        <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-6">
          <div className="flex items-center gap-3">
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
            <div className="min-w-0">
              <h3 className="font-bold text-neutral-900 dark:text-white sm:text-base">
                Third-Party Stock / Products
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                All products linked to {supplier.name}
              </p>
            </div>
            {!isLoadingProducts && products.length > 0 && (
              <div className="ml-auto flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Boxes</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">
                    {totalBoxes}
                  </p>
                </div>
                {totalSqm > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Sqr Mtr</p>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white">
                      {totalSqm.toFixed(2)} m²
                    </p>
                  </div>
                )}
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
                  {products.length} products
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto p-3 sm:p-6">
          <div className="inline-block min-w-full align-middle">
            {isLoadingProducts ? (
              <div className="flex h-40 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-7 w-7 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Loading products...
                  </p>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2">
                <Package
                  className="h-10 w-10 text-neutral-300 dark:text-neutral-600"
                  strokeWidth={1.5}
                />
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  No products linked to this supplier
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  Products with supplier name &quot;{supplier.name}&quot; will appear here
                </p>
              </div>
            ) : (
              <div className="[&>div]:rounded-lg [&>div]:border [&>div]:border-neutral-200/60 dark:[&>div]:border-neutral-700/60">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Stock (Boxes)</TableHead>
                      <TableHead>Stock (Sqr Mtr)</TableHead>
                      <TableHead>Retail Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, index) => (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.04 }}
                        className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                      >
                        <TableCell className="font-medium text-neutral-900 dark:text-white">
                          {product.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
                          {product.sku}
                        </TableCell>
                        <TableCell className="text-neutral-600 dark:text-neutral-400">
                          {product.category}
                        </TableCell>
                        <TableCell className="text-neutral-600 dark:text-neutral-400">
                          {product.size}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              product.stock === 0
                                ? "text-red-600 dark:text-red-400"
                                : product.stock <= 30
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {product.stock} boxes
                          </span>
                        </TableCell>
                        <TableCell className="text-neutral-600 dark:text-neutral-400">
                          {getSqm(product) ? (
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">
                              {getSqm(product)} m²
                            </span>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-neutral-700 dark:text-neutral-300">
                          ${product.retailPrice?.toFixed(2) ?? "—"}
                          <span className="ml-1 text-xs text-neutral-400">
                            /{product.pricingUnit?.replace("per_", "")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              product.isActive
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                : "bg-neutral-100 text-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
