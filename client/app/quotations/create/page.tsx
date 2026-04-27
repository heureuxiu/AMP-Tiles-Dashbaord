"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, FileText, Save, Send, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const UNIT_TYPES = ["Sq Meter"] as const;
type PricingUnit = "per_box" | "per_sqft" | "per_sqm" | "per_piece";
const SQFT_PER_SQM = 10.764;
const DELIVERY_GST_RATE = 10;

type Product = {
  _id: string;
  name: string;
  sku: string;
  unit?: string;
  price?: number;
  retailPrice?: number;
  pricingUnit?: PricingUnit;
  tilesPerBox?: number | null;
  coveragePerBox?: number | null;
  coveragePerBoxUnit?: string;
  stock?: number;
  taxPercent?: number | null;
  supplierType?: "third-party" | "own";
  supplier?: { _id: string; name?: string; supplierNumber?: string } | string | null;
  supplierName?: string;
};

type Supplier = {
  _id: string;
  name: string;
  supplierNumber?: string;
};

type QuotationItem = {
  id: string;
  supplierId: string;
  product: string;
  productName: string;
  unitType: string;
  quantity: number;
  rate: number;
  discountPercent: number;
  taxPercent: number;
  lineTotal: number;
  coverageInput: string;
};
type SaveMode = "draft" | "send";

type StockUnit = "box" | "piece" | "sqm" | "sqft";

function roundQty(value: number): number {
  return Math.round((Number(value) || 0) * 1000) / 1000;
}

function normalizeStockUnit(rawUnit?: string, pricingUnit?: PricingUnit): StockUnit {
  const normalized = String(rawUnit || "")
    .toLowerCase()
    .replace(/[\s._-]+/g, "");

  if (
    normalized.includes("sqm") ||
    normalized.includes("sqmeter") ||
    normalized.includes("sqmetre") ||
    normalized.includes("m2") ||
    normalized.includes("mÂ²")
  ) {
    return "sqm";
  }

  if (
    normalized.includes("sqft") ||
    normalized.includes("sqfeet") ||
    normalized.includes("ft2") ||
    normalized.includes("ftÂ²")
  ) {
    return "sqft";
  }

  if (normalized.includes("piece")) return "piece";
  if (normalized.includes("box")) return "box";

  if (pricingUnit === "per_sqm") return "sqm";
  if (pricingUnit === "per_sqft") return "sqft";
  if (pricingUnit === "per_piece") return "piece";
  return "box";
}

function normalizeCoverageUnit(
  rawUnit?: string | null,
  pricingUnit?: PricingUnit
): "sqm" | "sqft" {
  const normalized = String(rawUnit || "")
    .toLowerCase()
    .replace(/[\s._-]+/g, "");

  if (
    normalized.includes("sqm") ||
    normalized.includes("sqmeter") ||
    normalized.includes("sqmetre") ||
    normalized.includes("m2") ||
    normalized.includes("m²")
  ) {
    return "sqm";
  }

  if (
    normalized.includes("sqft") ||
    normalized.includes("sqfeet") ||
    normalized.includes("ft2") ||
    normalized.includes("ft²")
  ) {
    return "sqft";
  }

  if (pricingUnit === "per_sqm") return "sqm";
  if (pricingUnit === "per_sqft") return "sqft";
  return "sqft";
}

function getSqmPerBox(product?: Product): number {
  if (!product) return 0;
  const cov = Number(product.coveragePerBox) || 0;
  if (cov <= 0) return 0;
  const covUnit = normalizeCoverageUnit(
    product.coveragePerBoxUnit,
    product.pricingUnit
  );
  return covUnit === "sqm" ? cov : cov / SQFT_PER_SQM;
}

function getTilesPerBox(product?: Product): number {
  if (!product) return 0;
  const tilesPerBox = Number(product.tilesPerBox) || 0;
  return tilesPerBox > 0 ? tilesPerBox : 0;
}

function getSqmPerPiece(product?: Product): number {
  const sqmPerBox = getSqmPerBox(product);
  const tilesPerBox = getTilesPerBox(product);
  if (sqmPerBox <= 0 || tilesPerBox <= 0) return 0;
  return sqmPerBox / tilesPerBox;
}

function getRatePerSqm(product?: Product): number {
  if (!product) return 0;

  const baseRate = Number(product.retailPrice ?? product.price) || 0;
  if (baseRate <= 0) return 0;

  const pricingUnit = product.pricingUnit || "per_box";
  if (pricingUnit === "per_sqm") return baseRate;
  if (pricingUnit === "per_sqft") return baseRate * SQFT_PER_SQM;

  const sqmPerBox = getSqmPerBox(product);
  if (pricingUnit === "per_box") {
    return sqmPerBox > 0 ? baseRate / sqmPerBox : baseRate;
  }

  const sqmPerPiece = getSqmPerPiece(product);
  if (pricingUnit === "per_piece") {
    return sqmPerPiece > 0 ? baseRate / sqmPerPiece : baseRate;
  }

  return baseRate;
}

function getBillableQuantity(item: QuotationItem): number {
  return Number(item.quantity) || 0;
}

function calcLineTotal(item: QuotationItem): number {
  const billableQty = getBillableQuantity(item);
  const base = billableQty * item.rate;
  const taxPercent = Number(item.taxPercent ?? 10);
  const taxAmount = base * (taxPercent / 100);
  return Math.round((base + taxAmount) * 100) / 100;
}

function getBoxesFromSqm(sqmValue: number, product?: Product): number | null {
  const sqmPerBox = getSqmPerBox(product);
  if (sqmPerBox <= 0) return null;
  if (!Number.isFinite(sqmValue) || sqmValue <= 0) return null;
  return sqmValue / sqmPerBox;
}

function formatQty(value: number): string {
  const rounded = roundQty(value);
  if (!Number.isFinite(rounded) || rounded <= 0) return "";
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(3).replace(/\.?0+$/, "");
}

function getItemCoverageSqm(product: Product, item: QuotationItem): number | null {
  const explicitCoverageSqm = Number((item as { coverageSqm?: number }).coverageSqm);
  if (Number.isFinite(explicitCoverageSqm) && explicitCoverageSqm > 0) {
    return explicitCoverageSqm;
  }

  const quantity = Number(item.quantity) || 0;
  return quantity > 0 ? quantity : null;
}

function getItemStockDemand(product: Product, item: QuotationItem): number {
  const quantity = Number(item.quantity) || 0;
  const coverageSqm = getItemCoverageSqm(product, item);
  if (coverageSqm == null) return quantity;

  const stockUnit = normalizeStockUnit(product.unit, product.pricingUnit);
  if (stockUnit === "sqm") return coverageSqm;
  if (stockUnit === "sqft") return coverageSqm * SQFT_PER_SQM;

  const sqmPerBox = getSqmPerBox(product);
  if (stockUnit === "box") {
    return sqmPerBox > 0 ? coverageSqm / sqmPerBox : quantity;
  }

  const sqmPerPiece = getSqmPerPiece(product);
  if (stockUnit === "piece") {
    return sqmPerPiece > 0 ? coverageSqm / sqmPerPiece : quantity;
  }

  return quantity;
}

function getCoverageSqmForPayload(
  item: QuotationItem,
  product?: Product
): number | undefined {
  if (!product) return undefined;
  const derivedCoverageSqm = getItemCoverageSqm(product, item);
  if (derivedCoverageSqm != null && derivedCoverageSqm > 0) {
    return roundQty(derivedCoverageSqm);
  }
  return undefined;
}

function getMaxQuantityFromAvailableStock(
  product: Product,
  availableStockInUnit: number
): number {
  const safeAvailable = Math.max(0, availableStockInUnit || 0);
  const stockUnit = normalizeStockUnit(product.unit, product.pricingUnit);
  const sqmPerBox = getSqmPerBox(product);
  const sqmPerPiece = getSqmPerPiece(product);

  if (stockUnit === "sqm") {
    return safeAvailable;
  }
  if (stockUnit === "sqft") {
    return safeAvailable / SQFT_PER_SQM;
  }
  if (stockUnit === "box") {
    return sqmPerBox > 0 ? safeAvailable * sqmPerBox : safeAvailable;
  }
  if (stockUnit === "piece") {
    return sqmPerPiece > 0 ? safeAvailable * sqmPerPiece : safeAvailable;
  }
  return safeAvailable;
}

function formatStockQty(value: number): string {
  const rounded = roundQty(value);
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(3).replace(/\.?0+$/, "");
}

const createEmptyItem = (id?: string): QuotationItem => ({
  id: id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  supplierId: "",
  product: "",
  productName: "",
  unitType: "Sq Meter",
  quantity: 0,
  rate: 0,
  lineTotal: 0,
  discountPercent: 0,
  taxPercent: 10,
  coverageInput: "",
});

export default function CreateQuotationPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productsBySupplier, setProductsBySupplier] = useState<
    Record<string, Product[]>
  >({});
  const [isLoadingProductsBySupplier, setIsLoadingProductsBySupplier] = useState<
    Record<string, boolean>
  >({});
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<SaveMode | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [reference, setReference] = useState("");
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [deliveryCost, setDeliveryCost] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<QuotationItem[]>([createEmptyItem("1")]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Default: valid until = quotationDate + 7 days (can be overridden)
  useEffect(() => {
    if (!quotationDate) return;
    const d = new Date(quotationDate);
    d.setDate(d.getDate() + 7);
    setValidUntil(d.toISOString().split("T")[0]);
  }, [quotationDate]);

  const fetchSuppliers = async () => {
    try {
      setIsLoadingSuppliers(true);
      const response = await api.getSuppliers();
      if (response.success && response.suppliers) {
        setSuppliers(response.suppliers as Supplier[]);
      } else {
        setSuppliers([]);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch suppliers";
      toast.error("Failed to load suppliers", {
        description: errorMessage,
      });
      setSuppliers([]);
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  const fetchProducts = async (supplierId: string) => {
    if (!supplierId) return;
    if (productsBySupplier[supplierId]) return;
    try {
      setIsLoadingProducts(true);
      setIsLoadingProductsBySupplier((prev) => ({ ...prev, [supplierId]: true }));
      const response = await api.getProducts({ supplier: supplierId });
      const supplierProducts =
        response.success && response.products
          ? (response.products as Product[])
          : [];
      setProductsBySupplier((prev) => ({
        ...prev,
        [supplierId]: supplierProducts,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch products";
      toast.error("Failed to load supplier products", {
        description: errorMessage,
      });
      setProductsBySupplier((prev) => ({ ...prev, [supplierId]: [] }));
    } finally {
      setIsLoadingProducts(false);
      setIsLoadingProductsBySupplier((prev) => ({ ...prev, [supplierId]: false }));
    }
  };

  const getProductsForSupplier = (supplierId: string) => {
    if (!supplierId) return [];
    return productsBySupplier[supplierId] || [];
  };

  const handleItemSupplierChange = (itemId: string, supplierId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id !== itemId
          ? item
          : {
              ...item,
              supplierId,
              product: "",
              productName: "",
              coverageInput: "",
              quantity: 0,
              rate: 0,
              taxPercent: 10,
              lineTotal: 0,
              unitType: "Sq Meter",
            }
      )
    );

    if (supplierId) fetchProducts(supplierId);
  };

  const getProduct = (id: string) => {
    if (!id) return undefined;
    for (const supplierProducts of Object.values(productsBySupplier)) {
      const found = supplierProducts.find((p) => p._id === id);
      if (found) return found;
    }
    return undefined;
  };
  const getPreferredUnitType = () => "Sq Meter";
  const getStockUnitLabel = (product?: Product) => product?.unit || "boxes";
  const isStockRestrictedProduct = (product?: Product) => Boolean(product);

  const getMaxQuantityForItem = (
    currentItems: QuotationItem[],
    itemId: string,
    productId: string
  ) => {
    const product = getProduct(productId);
    if (!product) return 0;
    if (!isStockRestrictedProduct(product)) return Number.POSITIVE_INFINITY;

    const available = Number(product.stock ?? 0);
    const usedInOtherRows = currentItems.reduce((sum, item) => {
      if (item.id === itemId || item.product !== productId) return sum;
      return sum + getItemStockDemand(product, item);
    }, 0);
    const availableForCurrentRow = roundQty(Math.max(0, available - usedInOtherRows));
    return roundQty(getMaxQuantityFromAvailableStock(product, availableForCurrentRow));
  };

  const clampQuantityToStock = (
    currentItems: QuotationItem[],
    itemId: string,
    productId: string,
    requestedQuantity: number
  ) => {
    const product = getProduct(productId);
    if (!product) {
      return {
        quantity: Math.max(0, requestedQuantity || 0),
        maxQuantity: 0,
        wasClamped: false,
      };
    }

    if (!isStockRestrictedProduct(product)) {
      const safeQuantity = Math.max(0, requestedQuantity || 0);
      return {
        quantity: safeQuantity,
        maxQuantity: safeQuantity,
        wasClamped: false,
      };
    }

    const maxQuantity = getMaxQuantityForItem(currentItems, itemId, productId);
    const nextQuantity = Math.min(
      Math.max(0, requestedQuantity || 0),
      maxQuantity
    );
    return {
      quantity: nextQuantity,
      maxQuantity,
      wasClamped: nextQuantity !== (requestedQuantity || 0),
    };
  };

  const getStockValidationMessage = (candidateItems: QuotationItem[]) => {
    const requestedByProduct = new Map<string, { requested: number; available: number; product: Product }>();
    for (const item of candidateItems) {
      if (!item.product || (Number(item.quantity) || 0) <= 0) continue;
      const product = getProduct(item.product);
      if (!product) continue;
      if (!isStockRestrictedProduct(product)) continue;
      const requestedDemand = getItemStockDemand(product, item);
      const existing = requestedByProduct.get(item.product);
      requestedByProduct.set(item.product, {
        requested: (existing?.requested || 0) + requestedDemand,
        available: Number(product.stock ?? 0),
        product,
      });
    }

    for (const [, entry] of requestedByProduct.entries()) {
      const requested = roundQty(entry.requested);
      const available = roundQty(entry.available);
      if (requested > available) {
        const requestedSqm = roundQty(
          getMaxQuantityFromAvailableStock(entry.product, requested)
        );
        const availableSqm = roundQty(
          getMaxQuantityFromAvailableStock(entry.product, available)
        );
        return `${entry.product.name}: requested ${formatStockQty(requestedSqm)} sqm, available ${formatStockQty(availableSqm)} sqm`;
      }
    }

    return null;
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const handleProductChange = (itemId: string, productId: string) => {
    if (!productId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id !== itemId
            ? item
            : {
                ...item,
                product: "",
                productName: "",
                coverageInput: "",
                quantity: 0,
                rate: 0,
                taxPercent: 10,
                lineTotal: 0,
              }
        )
      );
      return;
    }

    const currentItem = items.find((item) => item.id === itemId);
    const supplierProducts = getProductsForSupplier(currentItem?.supplierId || "");
    const product = supplierProducts.find((p) => p._id === productId) || getProduct(productId);
    if (!product) return;
    const rate = getRatePerSqm(product);
    const taxPercent = 10;
    const preferredUnitType = getPreferredUnitType();
    let stockMessage: string | null = null;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const requestedQuantity = 0;
        const { quantity: safeQuantity, wasClamped, maxQuantity } =
          clampQuantityToStock(prev, itemId, productId, requestedQuantity);

        if (wasClamped && !stockMessage) {
          stockMessage = `Only ${formatStockQty(maxQuantity)} sqm available for ${product.name}`;
        }

        const next = {
          ...item,
          product: product._id,
          productName: product.name,
          unitType: preferredUnitType,
          coverageInput: "",
          quantity: safeQuantity,
          rate,
          taxPercent,
        };
        return {
          ...next,
          lineTotal: calcLineTotal(next),
        };
      })
    );

    if (stockMessage) {
      toast.error("Insufficient stock", {
        description: stockMessage,
      });
    }
  };

  const handleItemChange = (
    itemId: string,
    field: keyof QuotationItem,
    value: string | number
  ) => {
    let stockMessage: string | null = null;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const next = { ...item, [field]: value };
        const product = next.product ? getProduct(next.product) : undefined;
        next.unitType = "Sq Meter";

        if (next.product) {
          const requestedQuantity = Number(next.quantity) || 0;
          const { quantity: safeQuantity, wasClamped, maxQuantity } =
            clampQuantityToStock(prev, itemId, next.product, requestedQuantity);
          next.quantity = safeQuantity;

          if (wasClamped && !stockMessage && product) {
            stockMessage = `Only ${formatStockQty(maxQuantity)} sqm available for ${product.name}`;
          }
        }

        if (
          field === "quantity" ||
          field === "rate" ||
          field === "discountPercent" ||
          field === "taxPercent" ||
          field === "unitType"
        ) {
          next.lineTotal = calcLineTotal(next);
        }

        return next;
      })
    );

    if (stockMessage) {
      toast.error("Insufficient stock", {
        description: stockMessage,
      });
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  const saveQuotation = async (mode: SaveMode) => {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (mode === "send" && !customerEmail.trim()) {
      toast.error("Customer email is required to send quotation");
      return;
    }

    const validItems = items.filter(
      (item) => item.product && item.quantity > 0
    );

    if (validItems.length === 0) {
      toast.error("Please add at least one item with quantity");
      return;
    }

    const stockValidationMessage = getStockValidationMessage(validItems);
    if (stockValidationMessage) {
      toast.error("Insufficient stock", {
        description: stockValidationMessage,
      });
      return;
    }

    try {
      setIsSaving(true);
      setSaveMode(mode);

      const quotationData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        deliveryAddress: customerAddress.trim() || undefined,
        reference: reference.trim() || undefined,
        quotationDate,
        validUntil,
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        deliveryCost,
        items: validItems.map(item => ({
          product: item.product,
          unitType: "Sq Meter",
          quantity: item.quantity,
          rate: item.rate,
          discountPercent: 0,
          taxPercent: item.taxPercent ?? 10,
          coverageSqm: getCoverageSqmForPayload(item, getProduct(item.product)),
        })),
        status: "draft",
        sendEmail: mode === "send",
      };

      const response = await api.createQuotation(quotationData);

      if (response.success) {
        const createdQuotation = response.quotation as
          | { _id?: string; quotationNumber?: string }
          | undefined;

        if (mode === "send") {
          if (response.emailSent) {
            toast.success("Quotation sent by email", {
              description: `Quote for ${customerName} has been emailed`,
            });
          } else {
            toast.error("Quotation saved but email not sent", {
              description:
                response.message ||
                response.emailError ||
                "Please check SMTP settings and try again.",
            });
          }
        } else {
          toast.success("Quotation saved as draft", {
            description: `Quote for ${customerName} has been saved`,
          });
        }

        setTimeout(() => {
          if (createdQuotation?._id) {
            router.push(`/quotations/${createdQuotation._id}`);
            return;
          }
          router.push("/quotations");
        }, 1000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create quotation";
      toast.error(mode === "send" ? "Failed to send quotation" : "Failed to save quotation", {
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
      setSaveMode(null);
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveQuotation("draft");
  };

  const handleSaveAndSend = async () => {
    await saveQuotation("send");
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
  const deliveryGst = Math.round((deliveryCost * (DELIVERY_GST_RATE / 100)) * 100) / 100;
  const grandTotal = Math.round((subtotal + deliveryCost + deliveryGst) * 100) / 100;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Bar */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Create Quotation
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Tiles-friendly quotation: unit type, per-line discount/tax, expiry date
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

                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Select supplier per item below to include products from multiple suppliers in one quotation.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
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
                  {/* Customer Email */}
                  <div className="grid gap-2">
                    <label
                      htmlFor="customerEmail"
                      className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                    >
                      Customer Email{" "}
                      <span className="text-neutral-400">(Optional)</span>
                    </label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="Enter email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="grid gap-2">
                  <label
                    htmlFor="customerAddress"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Delivery Address{" "}
                    <span className="text-neutral-400">(Optional)</span>
                  </label>
                  <Input
                    id="customerAddress"
                    placeholder="Enter address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <label
                    htmlFor="reference"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Reference <span className="text-neutral-400">(Optional)</span>
                  </label>
                  <Input
                    id="reference"
                    placeholder="Client reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>

                {/* Dates */}
                <div className="grid gap-4 sm:grid-cols-2">
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
                  <div className="grid gap-2">
                    <label
                      htmlFor="validUntil"
                      className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                    >
                      Valid Until / Expiry Date
                    </label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                    />
                    <div className="flex gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>Quick set:</span>
                      <button
                        type="button"
                        className="underline-offset-2 hover:underline"
                        onClick={() => {
                          const d = new Date(quotationDate || new Date().toISOString());
                          d.setDate(d.getDate() + 7);
                          setValidUntil(d.toISOString().split("T")[0]);
                        }}
                      >
                        +7 days
                      </button>
                      <button
                        type="button"
                        className="underline-offset-2 hover:underline"
                        onClick={() => {
                          const d = new Date(quotationDate || new Date().toISOString());
                          d.setDate(d.getDate() + 14);
                          setValidUntil(d.toISOString().split("T")[0]);
                        }}
                      >
                        +14 days
                      </button>
                    </div>
                  </div>
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
                    className="flex w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                  />
                </div>

                {/* Terms */}
                <div className="grid gap-2">
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Terms & Conditions{" "}
                    <span className="text-neutral-400">(Optional)</span>
                  </label>
                  <textarea
                    id="terms"
                    rows={3}
                    placeholder="Add terms and conditions..."
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="flex w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
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
                    disabled={isSaving || isLoadingProducts}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Items Cards */}
              <div className="p-4 space-y-3">
                {items.map((item, idx) => {
                  const product = getProduct(item.product);
                  const isStockRestricted = isStockRestrictedProduct(product);
                  const isUnitLocked = true;
                  const stockUnitLabel = getStockUnitLabel(product);
                  const maxQuantityForItem = item.product
                    ? getMaxQuantityForItem(items, item.id, item.product)
                    : 0;
                  const maxQuantityLimit =
                    item.product && Number.isFinite(maxQuantityForItem)
                      ? maxQuantityForItem
                      : undefined;
                  const hasTileInfo =
                    product &&
                    ((product.tilesPerBox ?? 0) > 0 ||
                      (product.coveragePerBox ?? 0) > 0 ||
                      (product.stock ?? 0) > 0);
                  const estimatedBoxes = getBoxesFromSqm(item.quantity, product);
                  const rowProducts = getProductsForSupplier(item.supplierId);
                  const isCurrentSupplierLoading = Boolean(
                    item.supplierId && isLoadingProductsBySupplier[item.supplierId]
                  );

                  const fieldCls =
                    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 outline-none transition-colors focus:border-amp-primary focus:ring-2 focus:ring-amp-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:focus:border-amp-primary";

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900"
                    >
                      {/* Item number + delete */}
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                          Item {idx + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-7 w-7 rounded-full text-red-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Row 1: Supplier / Product / Unit */}
                      <div className="mb-3 grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Supplier
                          </label>
                          <select
                            value={item.supplierId}
                            onChange={(e) => handleItemSupplierChange(item.id, e.target.value)}
                            disabled={isSaving || isLoadingSuppliers}
                            className={fieldCls}
                            required
                          >
                            <option value="">
                              {isLoadingSuppliers ? "Loading…" : "Select supplier"}
                            </option>
                            {suppliers.map((sup) => (
                              <option key={sup._id} value={sup._id}>
                                {sup.name}
                                {sup.supplierNumber ? ` (${sup.supplierNumber})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Product
                          </label>
                          <select
                            value={item.product}
                            onChange={(e) => handleProductChange(item.id, e.target.value)}
                            disabled={!item.supplierId || isCurrentSupplierLoading}
                            className={fieldCls}
                            required
                          >
                            <option value="">
                              {!item.supplierId
                                ? "Select supplier first"
                                : isCurrentSupplierLoading
                                ? "Loading…"
                                : rowProducts.length === 0
                                ? "No products available"
                                : "Select product"}
                            </option>
                            {rowProducts.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Unit
                          </label>
                          <select
                            value={item.unitType}
                            onChange={(e) => handleItemChange(item.id, "unitType", e.target.value)}
                            disabled={isUnitLocked}
                            className={fieldCls}
                          >
                            {UNIT_TYPES.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Row 2: Qty / Rate / Disc% / Tax% / Line Total */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Piece (sqm)
                          </label>
                          <div className="space-y-1">
                            <input
                              type="number"
                              min="0"
                              max={maxQuantityLimit}
                              step="0.001"
                              placeholder={item.product ? "e.g. 32" : "—"}
                              value={item.quantity || ""}
                              onChange={(e) => {
                                const typedQuantity = Math.max(0, parseFloat(e.target.value) || 0);
                                handleItemChange(item.id, "quantity", typedQuantity);
                              }}
                              disabled={!item.product || isLoadingProducts}
                              className={fieldCls}
                              style={{ MozAppearance: "textfield" } as React.CSSProperties}
                              required
                            />
                            {estimatedBoxes != null && (
                              <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                                ≈ {formatQty(estimatedBoxes) || "0"} boxes
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Rate ($/sqm)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={item.rate || ""}
                            onChange={(e) =>
                              handleItemChange(item.id, "rate", parseFloat(e.target.value) || 0)
                            }
                            className={fieldCls}
                            style={{ MozAppearance: "textfield" } as React.CSSProperties}
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Disc %
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            placeholder="10"
                            value={0}
                            readOnly
                            disabled
                            className={fieldCls}
                            style={{ MozAppearance: "textfield" } as React.CSSProperties}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Tax %
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            placeholder="10"
                            value={item.taxPercent ?? 10}
                            onChange={(e) =>
                              handleItemChange(item.id, "taxPercent", parseFloat(e.target.value) || 0)
                            }
                            className={fieldCls}
                            style={{ MozAppearance: "textfield" } as React.CSSProperties}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Line Total
                          </label>
                          <div className="flex h-9.5 items-center rounded-lg border border-neutral-200 bg-white px-3 text-sm font-bold text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white">
                            {formatCurrency(item.lineTotal)}
                          </div>
                        </div>
                      </div>

                      {/* Tile info row */}
                      {hasTileInfo && (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                          {product?.tilesPerBox != null && product.tilesPerBox > 0 && (
                            <span>Tiles/box: <strong className="text-neutral-700 dark:text-neutral-300">{product.tilesPerBox}</strong></span>
                          )}
                          {product?.coveragePerBox != null && product.coveragePerBox > 0 && (
                            <span>Coverage/box: <strong className="text-neutral-700 dark:text-neutral-300">{product.coveragePerBox} {product.coveragePerBoxUnit === "sqm" ? "sqm" : "sq ft"}</strong></span>
                          )}
                          {product?.stock != null && (
                            <span>Stock: <strong className="text-neutral-700 dark:text-neutral-300">{product.stock}</strong> {stockUnitLabel}</span>
                          )}
                          {product?.stock != null && item.product && isStockRestricted && (
                            <span>Available to quote: <strong className="text-neutral-700 dark:text-neutral-300">{formatStockQty(maxQuantityForItem)}</strong> sqm</span>
                          )}
                          {!isStockRestricted && item.product && (
                            <span>Stock check: <strong className="text-neutral-700 dark:text-neutral-300">Skipped (third-party)</strong></span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Delivery Cost
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryCost}
                      onChange={(e) =>
                        setDeliveryCost(Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      disabled={isSaving}
                      className="h-8 w-28 text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Delivery GST ({DELIVERY_GST_RATE}%)
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {formatCurrency(deliveryGst)}
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
                  {isSaving && saveMode === "draft" ? "Saving..." : "Save as Draft"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleSaveAndSend}
                  disabled={isSaving || isLoadingProducts}
                >
                  <Send className="h-4 w-4" />
                  {isSaving && saveMode === "send" ? "Sending..." : "Save & Send Email"}
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
                  <strong>Note:</strong> Save as draft for later edits, or use
                  Save &amp; Send Email to send the quotation directly to the
                  customer.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
