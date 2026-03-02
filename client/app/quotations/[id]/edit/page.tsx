"use client";

import { useState, useEffect, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Trash2, FileText, Save, X as XIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";

const UNIT_TYPES = ["Box", "Sq Ft", "Sq Meter", "Piece"] as const;

type Product = {
  _id: string;
  name: string;
  sku: string;
  price?: number;
  retailPrice?: number;
  tilesPerBox?: number | null;
  coveragePerBox?: number | null;
  coveragePerBoxUnit?: string;
  stock?: number;
  taxPercent?: number | null;
};

type QuotationStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted"
  | "cancelled";

type QuotationItem = {
  id: string;
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

type Quotation = {
  _id: string;
  quotationNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  quotationDate: string;
  validUntil?: string;
  notes?: string;
  terms?: string;
  status: QuotationStatus;
  items: Array<{
    _id?: string;
    product:
      | {
          _id: string;
          name: string;
        }
      | string;
    productName: string;
    unitType?: string;
    quantity: number;
    rate: number;
    discountPercent?: number;
    taxPercent?: number;
    lineTotal: number;
    coverageSqm?: number;
  }>;
};

function calcLineTotal(item: QuotationItem): number {
  const base = item.quantity * item.rate;
  const afterDisc = base * (1 - (item.discountPercent || 0) / 100);
  return Math.round(afterDisc * (1 + (item.taxPercent || 0) / 100) * 100) / 100;
}

function getBoxesFromCoverage(
  coverageValue: number,
  unitType: string,
  product: Product
): number {
  const cov = product.coveragePerBox;
  const covUnit = (product.coveragePerBoxUnit || "sqft").toLowerCase();
  if (!cov || cov <= 0) return 0;
  let coverageInSqm = coverageValue;
  if (unitType === "Sq Ft") coverageInSqm = coverageValue / 10.764;
  const sqmPerBox = covUnit === "sqm" ? cov : cov / 10.764;
  return Math.ceil(coverageInSqm / sqmPerBox) || 0;
}

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [quotationNumber, setQuotationNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [quotationDate, setQuotationDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [status, setStatus] = useState<QuotationStatus>("draft");
  const [items, setItems] = useState<QuotationItem[]>([]);

  const isReadOnly = status === "converted";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const [productsResponse, quotationResponse] = await Promise.all([
          api.getProducts({ status: "active" }),
          api.getQuotation(quotationId),
        ]);

        if (productsResponse.success && productsResponse.products) {
          setProducts(productsResponse.products as Product[]);
        }

        if (quotationResponse.success && quotationResponse.quotation) {
          const q = quotationResponse.quotation as Quotation;
          setQuotationNumber(q.quotationNumber);
          setCustomerName(q.customerName || "");
          setCustomerPhone(q.customerPhone || "");
          setCustomerEmail(q.customerEmail || "");
          setCustomerAddress(q.customerAddress || "");
          setQuotationDate(
            q.quotationDate ? q.quotationDate.split("T")[0] : new Date().toISOString().split("T")[0]
          );
          setValidUntil(q.validUntil ? q.validUntil.split("T")[0] : "");
          setNotes(q.notes || "");
          setTerms(q.terms || "");
          setStatus(q.status);

          const mappedItems: QuotationItem[] = (q.items || []).map((item, index) => {
            const productId =
              typeof item.product === "string" ? item.product : item.product?._id;
            return {
              id: `${item._id || index}`,
              product: productId || "",
              productName: item.productName || "",
              unitType: item.unitType || "Box",
              quantity: item.quantity || 0,
              rate: item.rate || 0,
              discountPercent: item.discountPercent ?? 0,
              taxPercent: item.taxPercent ?? 0,
              lineTotal: item.lineTotal || 0,
              coverageInput: "",
            };
          });
          setItems(
            mappedItems.length
              ? mappedItems
              : [
                  {
                    id: "1",
                    product: "",
                    productName: "",
                    unitType: "Box",
                    quantity: 0,
                    rate: 0,
                    discountPercent: 0,
                    taxPercent: 0,
                    lineTotal: 0,
                    coverageInput: "",
                  },
                ]
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load data";
        toast.error("Failed to load quotation", {
          description: errorMessage,
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [quotationId]);

  const getProduct = (id: string) => products.find((p) => p._id === id);

  const handleAddItem = () => {
    if (isReadOnly) return;
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      product: "",
      productName: "",
      unitType: "Box",
      quantity: 0,
      rate: 0,
      discountPercent: 0,
      taxPercent: 0,
      lineTotal: 0,
      coverageInput: "",
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (isReadOnly) return;
    setItems((prev) => {
      if (prev.length === 1) {
        toast.error("At least one item is required");
        return prev;
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleProductChange = (itemId: string, productId: string) => {
    if (isReadOnly) return;
    const product = products.find((p) => p._id === productId);
    if (!product) return;
    const rate = product.retailPrice ?? product.price ?? 0;
    const taxPercent = product.taxPercent ?? 0;

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              product: product._id,
              productName: product.name,
              rate,
              taxPercent,
              lineTotal: calcLineTotal({
                ...item,
                rate,
                taxPercent,
              }),
            }
          : item
      )
    );
  };

  const handleItemChange = (
    itemId: string,
    field: keyof QuotationItem,
    value: string | number
  ) => {
    if (isReadOnly) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const next = { ...item, [field]: value };
        if (
          field === "quantity" ||
          field === "rate" ||
          field === "discountPercent" ||
          field === "taxPercent"
        ) {
          next.lineTotal = calcLineTotal(next);
        }
        if (field === "coverageInput" && typeof value === "string") {
          const num = parseFloat(value) || 0;
          const product = getProduct(item.product);
          if (
            product &&
            (item.unitType === "Sq Meter" || item.unitType === "Sq Ft") &&
            num > 0
          ) {
            next.quantity = getBoxesFromCoverage(num, item.unitType, product);
            next.lineTotal = calcLineTotal({ ...next, quantity: next.quantity });
          }
        }
        return next;
      })
    );
  };

  const handleCoverageBlur = (itemId: string) => {
    if (isReadOnly) return;
    const item = items.find((i) => i.id === itemId);
    if (!item?.coverageInput) return;
    const product = getProduct(item.product);
    if (
      !product ||
      (item.unitType !== "Sq Meter" && item.unitType !== "Sq Ft")
    )
      return;
    const num = parseFloat(item.coverageInput) || 0;
    if (num <= 0) return;
    const boxes = getBoxesFromCoverage(num, item.unitType, product);
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              quantity: boxes,
              lineTotal: calcLineTotal({ ...i, quantity: boxes }),
            }
          : i
      )
    );
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isReadOnly) {
      toast.error("Cannot edit converted quotation");
      return;
    }

    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    const validItems = items.filter(
      (item) => item.product && item.quantity > 0
    );

    if (!isReadOnly && validItems.length === 0) {
      toast.error("Please add at least one item with quantity");
      return;
    }

    try {
      setIsSaving(true);

      const quotationData: Parameters<typeof api.updateQuotation>[1] = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        quotationDate,
        validUntil: validUntil || undefined,
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        status,
      };

      if (!isReadOnly && validItems.length > 0) {
        quotationData.items = validItems.map((item) => ({
          product: item.product,
          unitType: item.unitType,
          quantity: item.quantity,
          rate: item.rate,
          discountPercent: item.discountPercent || 0,
          taxPercent: item.taxPercent || 0,
        }));
      }

      const response = await api.updateQuotation(quotationId, quotationData);

      if (response.success) {
        toast.success("Quotation updated successfully", {
          description: `${quotationNumber} has been updated`,
        });

        setTimeout(() => {
          router.push("/quotations");
        }, 1000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update quotation";
      toast.error("Failed to update quotation", {
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
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
  const grandTotal = subtotal;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/quotations")}
            disabled={isSaving}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Edit Quotation
              </h1>
              <Badge
                variant="secondary"
                className={
                  status === "draft"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                    : status === "sent"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                    : status === "converted"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                    : "bg-neutral-100 text-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400"
                }
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              {isLoadingData
                ? "Loading..."
                : isReadOnly
                ? "This quotation has been converted and is read-only"
                : `Editing ${quotationNumber}`}
            </p>
          </div>
        </div>
      </div>

      {isReadOnly && (
        <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>Note:</strong> This quotation has been converted to an invoice and cannot be edited.
            View it in read-only mode or go back to the quotations list.
          </p>
        </div>
      )}

      <form onSubmit={handleSave}>
        {isLoadingData ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading quotation data...</p>
            </div>
          </div>
        ) : (
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
                      disabled={isReadOnly || isSaving}
                      required
                    />
                </div>

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
                      disabled={isReadOnly || isSaving}
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
                      disabled={isReadOnly || isSaving}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="grid gap-2">
                  <label
                    htmlFor="customerAddress"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Customer Address{" "}
                    <span className="text-neutral-400">(Optional)</span>
                  </label>
                  <Input
                    id="customerAddress"
                    placeholder="Enter address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    disabled={isReadOnly || isSaving}
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
                      disabled={isReadOnly || isSaving}
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
                      disabled={isReadOnly || isSaving}
                    />
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
                      disabled={isReadOnly || isSaving}
                      className="flex w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
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
                    disabled={isReadOnly || isSaving}
                    className="flex w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
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
                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItem}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700">
                        <th className="pb-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Product
                        </th>
                        <th className="pb-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Quantity
                        </th>
                        <th className="pb-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Rate
                        </th>
                        <th className="pb-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Line Total
                        </th>
                        {!isReadOnly && <th className="pb-3 w-10"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const product = getProduct(item.product);
                        const hasTileInfo =
                          product &&
                          ((product.tilesPerBox ?? 0) > 0 ||
                            (product.coveragePerBox ?? 0) > 0 ||
                            (product.stock ?? 0) > 0);
                        const showCoverageInput =
                          (item.unitType === "Sq Meter" ||
                            item.unitType === "Sq Ft") &&
                          product &&
                          (product.coveragePerBox ?? 0) > 0;
                        return (
                          <Fragment key={item.id}>
                            <tr className="border-b border-neutral-100 dark:border-neutral-800">
                              <td className="py-3 pr-2 align-top">
                                <select
                                  value={item.product}
                                  onChange={(e) =>
                                    handleProductChange(item.id, e.target.value)
                                  }
                                  disabled={isReadOnly || isSaving}
                                  className="flex h-9 w-full min-w-[160px] rounded-lg border border-neutral-200 bg-white px-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300"
                                  required
                                >
                                  <option value="">Select product</option>
                                  {products.map((product) => (
                                    <option key={product._id} value={product._id}>
                                      {product.name} ({product.sku})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 pr-2 align-top">
                                <select
                                  value={item.unitType}
                                  onChange={(e) =>
                                    handleItemChange(item.id, "unitType", e.target.value)
                                  }
                                  disabled={isReadOnly || isSaving}
                                  className="h-9 min-w-[90px] rounded-lg border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                                >
                                  {UNIT_TYPES.map((u) => (
                                    <option key={u} value={u}>
                                      {u}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 pr-2 align-top">
                                {showCoverageInput ? (
                                  <div className="space-y-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder={
                                        item.unitType === "Sq Meter" ? "e.g. 20" : "e.g. 215"
                                      }
                                      value={item.coverageInput}
                                      onChange={(e) =>
                                        handleItemChange(
                                          item.id,
                                          "coverageInput",
                                          e.target.value
                                        )
                                      }
                                      onBlur={() => handleCoverageBlur(item.id)}
                                      disabled={isReadOnly || isSaving}
                                      className="h-9 w-20 text-sm"
                                    />
                                    <span className="text-xs text-neutral-500">
                                      → {item.quantity} box
                                      {item.quantity === 1 ? "" : "es"}
                                    </span>
                                  </div>
                                ) : (
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    placeholder="0"
                                    value={item.quantity || ""}
                                    onChange={(e) =>
                                      handleItemChange(
                                        item.id,
                                        "quantity",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    disabled={isReadOnly || isSaving}
                                    className="h-9 w-20 text-sm"
                                    required
                                  />
                                )}
                              </td>
                              <td className="py-3 pr-2 align-top">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={item.rate || ""}
                                  onChange={(e) =>
                                    handleItemChange(
                                      item.id,
                                      "rate",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  disabled={isReadOnly || isSaving}
                                  className="h-9 w-24 text-sm"
                                  required
                                />
                              </td>
                              <td className="py-3 pr-2 align-top">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={item.discountPercent || ""}
                                  onChange={(e) =>
                                    handleItemChange(
                                      item.id,
                                      "discountPercent",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  disabled={isReadOnly || isSaving}
                                  className="h-9 w-16 text-sm"
                                />
                              </td>
                              <td className="py-3 pr-2 align-top">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={item.taxPercent || ""}
                                  onChange={(e) =>
                                    handleItemChange(
                                      item.id,
                                      "taxPercent",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  disabled={isReadOnly || isSaving}
                                  className="h-9 w-16 text-sm"
                                />
                              </td>
                              <td className="py-3 pr-2 text-right align-top font-semibold text-neutral-900 dark:text-white">
                                {formatCurrency(item.lineTotal)}
                              </td>
                              {!isReadOnly && (
                                <td className="py-3 align-top">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="h-8 w-8 rounded-full text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                    disabled={items.length === 1 || isSaving}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              )}
                            </tr>
                            {hasTileInfo && (
                              <tr className="border-b border-neutral-100 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                                <td colSpan={8} className="pb-3 pl-4 pr-2 pt-0">
                                  {product?.tilesPerBox != null &&
                                    product.tilesPerBox > 0 && (
                                      <span className="mr-4">
                                        Tiles/box:{" "}
                                        <strong>{product.tilesPerBox}</strong>
                                      </span>
                                    )}
                                  {product?.coveragePerBox != null &&
                                    product.coveragePerBox > 0 && (
                                      <span className="mr-4">
                                        Coverage/box:{" "}
                                        <strong>
                                          {product.coveragePerBox}{" "}
                                          {product.coveragePerBoxUnit === "sqm"
                                            ? "sqm"
                                            : "sq ft"}
                                        </strong>
                                      </span>
                                    )}
                                  {product?.stock != null && (
                                    <span className="mr-4">
                                      Stock available:{" "}
                                      <strong>{product.stock}</strong> boxes
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
              {!isReadOnly && (
                <div className="space-y-3">
                  <Button type="submit" className="w-full gap-2" size="lg" disabled={isSaving}>
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
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
              )}

              {isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={handleCancel}
                >
                  Back to Quotations
                </Button>
              )}
            </div>
          </motion.div>
        </div>
        )}
      </form>
    </div>
  );
}
