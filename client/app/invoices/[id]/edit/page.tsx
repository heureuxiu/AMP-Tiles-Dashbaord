"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Trash2, Receipt, Save, X as XIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";

const UNIT_TYPES = ["Box", "Sq Ft", "Sq Meter", "Piece"] as const;
const PAYMENT_METHODS = [
  { value: "", label: "— Select —" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "eftpos", label: "EFTPOS" },
  { value: "credit", label: "Credit" },
];
const INVOICE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

type Product = {
  _id: string;
  name: string;
  price?: number;
  retailPrice?: number;
  sku: string;
  stock: number;
  coveragePerBox?: number | null;
  coveragePerBoxUnit?: string;
  taxPercent?: number | null;
};

type InvoiceItem = {
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

function calcLineTotal(item: InvoiceItem): number {
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

const toCents = (value: number) => Math.round((Number(value) || 0) * 100);

type FetchedInvoice = {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  invoiceDate: string;
  dueDate?: string;
  items: Array<{
    product: { _id: string } | string;
    productName: string;
    unitType?: string;
    quantity: number;
    rate: number;
    discountPercent?: number;
    taxPercent?: number;
    lineTotal: number;
  }>;
  notes?: string;
  terms?: string;
  status: string;
  paymentMethod?: string;
  amountPaid?: number;
  grandTotal?: number;
};

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState<string>("draft");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isDraft, setIsDraft] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoadingData(true);
        const [invRes, prodRes] = await Promise.all([
          api.getInvoice(invoiceId),
          api.getProducts({ status: "active" }),
        ]);
        if (!invRes.success || !invRes.invoice) {
          setNotFound(true);
          toast.error("Invoice not found");
          return;
        }
        if (prodRes.success && prodRes.products) {
          setProducts((prodRes.products as Product[]) || []);
        }
        const inv = invRes.invoice as FetchedInvoice;
        setCustomerName(inv.customerName || "");
        setCustomerPhone(inv.customerPhone || "");
        setCustomerEmail(inv.customerEmail || "");
        setCustomerAddress(inv.customerAddress || "");
        setInvoiceDate(
          inv.invoiceDate
            ? new Date(inv.invoiceDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0]
        );
        setDueDate(
          inv.dueDate
            ? new Date(inv.dueDate).toISOString().split("T")[0]
            : ""
        );
        setNotes(inv.notes || "");
        setTerms(inv.terms || "");
        setInvoiceStatus(inv.status || "draft");
        setPaymentMethod(inv.paymentMethod || "");
        setAmountPaid(inv.amountPaid ?? 0);
        setIsDraft(inv.status === "draft");

        const productId = (p: { _id: string } | string) =>
          typeof p === "string" ? p : p?._id;
        setItems(
          (inv.items || []).map((it, idx) => ({
            id: `${idx}-${Date.now()}`,
            product: productId(it.product),
            productName: it.productName || "",
            unitType: it.unitType || "Box",
            quantity: it.quantity || 0,
            rate: it.rate || 0,
            discountPercent: it.discountPercent ?? 0,
            taxPercent: it.taxPercent ?? 0,
            lineTotal: it.lineTotal || 0,
            coverageInput: "",
          }))
        );
        if (!inv.items?.length) {
          setItems([
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
          ]);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load invoice");
        setNotFound(true);
      } finally {
        setIsLoadingData(false);
      }
    };
    load();
  }, [invoiceId]);

  const getProduct = (id: string) => products.find((p) => p._id === id);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
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
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("At least one item is required");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleProductChange = (itemId: string, productId: string) => {
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
                quantity: item.quantity,
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
    field: keyof InvoiceItem,
    value: string | number
  ) => {
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

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const grandTotal = Math.round(subtotal * 100) / 100;
  const paidCents = toCents(amountPaid || 0);
  const grandTotalCents = toCents(grandTotal);
  const remaining = Math.max(0, grandTotalCents - paidCents) / 100;
  const paymentStatus =
    paidCents <= 0
      ? "Unpaid"
      : paidCents >= grandTotalCents
        ? "Fully Paid"
        : "Partially Paid";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    const validItems = items.filter(
      (i) => i.product && i.quantity > 0 && i.rate >= 0
    );
    if (isDraft && validItems.length === 0) {
      toast.error("Add at least one item with product, quantity and rate");
      return;
    }
    try {
      setIsSaving(true);
      const payload: Parameters<typeof api.updateInvoice>[1] = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        invoiceDate,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        status: invoiceStatus,
        paymentMethod: paymentMethod || undefined,
        amountPaid: amountPaid || undefined,
      };
      if (isDraft && validItems.length > 0) {
        payload.items = validItems.map((i) => ({
          product: i.product,
          unitType: i.unitType,
          quantity: i.quantity,
          rate: i.rate,
          discountPercent: i.discountPercent || 0,
          taxPercent: i.taxPercent || 0,
        }));
      }
      await api.updateInvoice(invoiceId, payload);
      toast.success("Invoice updated");
      router.push(`/invoices/${invoiceId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update invoice");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-neutral-600 dark:text-neutral-400">
          Invoice not found
        </p>
        <Button variant="outline" onClick={() => router.push("/invoices")}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  if (isLoadingData && items.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(`/invoices/${invoiceId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Edit Invoice
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Update customer, items (draft only), payment & status
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Customer & dates – same as create */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
            >
              <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "#8b5cf615" }}
                  >
                    <Receipt className="h-5 w-5" style={{ color: "#8b5cf6" }} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">
                      Customer &amp; dates
                    </h3>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={isSaving}
                    required
                    className="mt-1"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Phone</label>
                    <Input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      disabled={isSaving}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      disabled={isSaving}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Address</label>
                  <Input
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    disabled={isSaving}
                    className="mt-1"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Invoice Date</label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      disabled={isSaving}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Due Date</label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={isSaving}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Items – editable only for draft */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
            >
              <div className="flex items-center justify-between border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-white">Invoice Items</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {isDraft
                      ? "Edit products, qty, rate, discount & tax"
                      : "Items can only be edited when invoice is Draft"}
                  </p>
                </div>
                {isDraft && (
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                      <th className="pb-2 text-left font-semibold">Product</th>
                      <th className="pb-2 text-left font-semibold">Unit</th>
                      <th className="pb-2 text-left font-semibold">Qty</th>
                      <th className="pb-2 text-left font-semibold">Rate</th>
                      <th className="pb-2 text-left font-semibold">Disc %</th>
                      <th className="pb-2 text-left font-semibold">Tax %</th>
                      <th className="pb-2 text-right font-semibold">Line Total</th>
                      {isDraft && <th className="w-10 pb-2"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const product = getProduct(item.product);
                      const showCoverage =
                        isDraft &&
                        (item.unitType === "Sq Meter" || item.unitType === "Sq Ft") &&
                        product &&
                        (product.coveragePerBox ?? 0) > 0;
                      return (
                        <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-800">
                          <td className="py-2 pr-2">
                            {isDraft ? (
                              <select
                                value={item.product}
                                onChange={(e) => handleProductChange(item.id, e.target.value)}
                                disabled={isSaving}
                                className="h-9 w-full min-w-[140px] rounded-lg border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                                required
                              >
                                <option value="">Select product</option>
                                {products.map((p) => (
                                  <option key={p._id} value={p._id}>
                                    {p.name} ({p.sku})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-neutral-900 dark:text-white">{item.productName}</span>
                            )}
                          </td>
                          <td className="py-2 pr-2">
                            {isDraft ? (
                              <select
                                value={item.unitType}
                                onChange={(e) => handleItemChange(item.id, "unitType", e.target.value)}
                                disabled={isSaving}
                                className="h-9 min-w-[90px] rounded-lg border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                              >
                                {UNIT_TYPES.map((u) => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            ) : (
                              item.unitType || "—"
                            )}
                          </td>
                          <td className="py-2 pr-2">
                            {isDraft && showCoverage ? (
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder={item.unitType === "Sq Meter" ? "e.g. 20" : "e.g. 215"}
                                  value={item.coverageInput}
                                  onChange={(e) => handleItemChange(item.id, "coverageInput", e.target.value)}
                                  onBlur={() => handleCoverageBlur(item.id)}
                                  disabled={isSaving}
                                  className="h-9 w-20 text-sm"
                                />
                                <span className="text-xs text-neutral-500">→ {item.quantity} box(es)</span>
                              </div>
                            ) : isDraft ? (
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={item.quantity || ""}
                                onChange={(e) =>
                                  handleItemChange(item.id, "quantity", parseFloat(e.target.value) || 0)
                                }
                                disabled={isSaving}
                                className="h-9 w-20 text-sm"
                                required
                              />
                            ) : (
                              item.quantity
                            )}
                          </td>
                          <td className="py-2 pr-2">
                            {isDraft ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.rate || ""}
                                onChange={(e) =>
                                  handleItemChange(item.id, "rate", parseFloat(e.target.value) || 0)
                                }
                                disabled={isSaving}
                                className="h-9 w-24 text-sm"
                                required
                              />
                            ) : (
                              formatCurrency(item.rate)
                            )}
                          </td>
                          <td className="py-2 pr-2">
                            {isDraft ? (
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={item.discountPercent || ""}
                                onChange={(e) =>
                                  handleItemChange(item.id, "discountPercent", parseFloat(e.target.value) || 0)
                                }
                                disabled={isSaving}
                                className="h-9 w-14 text-sm"
                              />
                            ) : (
                              item.discountPercent != null ? `${item.discountPercent}%` : "—"
                            )}
                          </td>
                          <td className="py-2 pr-2">
                            {isDraft ? (
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={item.taxPercent || ""}
                                onChange={(e) =>
                                  handleItemChange(item.id, "taxPercent", parseFloat(e.target.value) || 0)
                                }
                                disabled={isSaving}
                                className="h-9 w-14 text-sm"
                              />
                            ) : (
                              item.taxPercent != null ? `${item.taxPercent}%` : "—"
                            )}
                          </td>
                          <td className="py-2 text-right font-medium">
                            {formatCurrency(item.lineTotal)}
                          </td>
                          {isDraft && (
                            <td className="py-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                                className="h-8 w-8 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                                disabled={items.length === 1 || isSaving}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 dark:border-neutral-700/60 dark:bg-neutral-800">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isSaving}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Terms</label>
                  <textarea
                    rows={2}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    disabled={isSaving}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 dark:border-neutral-700/60 dark:bg-neutral-800">
                <h3 className="font-semibold text-neutral-900 dark:text-white">Summary</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200 pt-2 dark:border-neutral-700">
                    <span className="font-semibold">Grand Total</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 dark:border-neutral-700/60 dark:bg-neutral-800">
                <h3 className="font-semibold text-neutral-900 dark:text-white">Payment</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={isSaving}
                      className="mt-1 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                    >
                      {PAYMENT_METHODS.map((o) => (
                        <option key={o.value || "none"} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Amount Paid</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amountPaid || ""}
                      onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                      disabled={isSaving}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Remaining</span>
                    <span className="font-semibold">{formatCurrency(remaining)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Status</span>
                    <span>{paymentStatus}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 dark:border-neutral-700/60 dark:bg-neutral-800">
                <h3 className="font-semibold text-neutral-900 dark:text-white">Invoice Status</h3>
                <select
                  value={invoiceStatus}
                  onChange={(e) => setInvoiceStatus(e.target.value)}
                  disabled={isSaving}
                  className="mt-2 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                >
                  {INVOICE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full gap-2"
                  size="lg"
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => router.push(`/invoices/${invoiceId}`)}
                  disabled={isSaving}
                >
                  <XIcon className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
