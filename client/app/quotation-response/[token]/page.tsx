"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, FileText, XCircle, MapPin, Phone, Mail, Calendar, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

type ResponseDecision = "accepted" | "rejected";

const SQFT_PER_SQM = 10.764;
const DELIVERY_GST_RATE = 10;

type QuotationItem = {
  _id?: string;
  productName?: string;
  size?: string;
  unitType?: string;
  quantity: number;
  rate: number;
  lineTotal: number;
  discountPercent?: number;
  taxPercent?: number;
  coverageSqm?: number;
  product?: {
    sku?: string;
    name?: string;
    size?: string;
    description?: string;
  };
};

type PublicQuotation = {
  _id: string;
  quotationNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryAddress?: string;
  reference?: string;
  quotationDate: string;
  validUntil?: string;
  items: QuotationItem[];
  subtotal: number;
  discount?: number;
  tax: number;
  taxRate?: number;
  deliveryCost?: number;
  grandTotal: number;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted" | "cancelled";
  clientResponseRemarks?: string;
  clientRespondedAt?: string;
  notes?: string;
  terms?: string;
};

function calcLineTotalExGst(item: QuotationItem): number {
  const base = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
  const discountAmount = base * ((Number(item.discountPercent) || 0) / 100);
  return Math.round(Math.max(0, base - discountAmount) * 100) / 100;
}

const fmtQty = (v: number) => {
  const r = Math.round(v * 1000) / 1000;
  return Number.isInteger(r) ? String(r) : r.toFixed(3).replace(/\.?0+$/, "");
};

function getDisplayQuantity(item: QuotationItem): string {
  const coverage = Number(item.coverageSqm);
  const unit = String(item.unitType || "").trim().toLowerCase();
  if ((unit === "sq meter" || unit === "sqm") && Number.isFinite(coverage) && coverage > 0)
    return fmtQty(coverage);
  if ((unit === "sq ft" || unit === "sqft") && Number.isFinite(coverage) && coverage > 0)
    return fmtQty(coverage * SQFT_PER_SQM);
  return fmtQty(Number(item.quantity) || 0);
}

function getDisplayUnit(item: QuotationItem): string {
  const u = String(item.unitType || "").trim().toLowerCase();
  if (u === "sq meter" || u === "sqm") return "sqm";
  if (u === "sq ft" || u === "sqft") return "sq ft";
  if (u === "lm") return "LM";
  if (u === "box") return "box";
  return item.unitType || "-";
}

function getItemSku(item: QuotationItem): string {
  const v = item.product?.sku;
  return v && String(v).trim().length > 0 ? v : "-";
}

function getItemDescription(item: QuotationItem): string {
  const v = item.product?.description;
  return v && String(v).trim().length > 0 ? v : "-";
}

function getItemSize(item: QuotationItem): string {
  const v = item.product?.size ?? item.size;
  return v && String(v).trim().length > 0 ? String(v) : "-";
}

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  expired: "bg-amber-50 text-amber-700 border-amber-200",
  converted: "bg-purple-50 text-purple-700 border-purple-200",
  cancelled: "bg-neutral-100 text-neutral-600 border-neutral-200",
  draft: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

export default function QuotationResponsePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || "";
  const [quotation, setQuotation] = useState<PublicQuotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decision, setDecision] = useState<ResponseDecision>("accepted");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    const fetchQuotation = async () => {
      if (!token) return;
      try {
        setIsLoading(true);
        const response = await api.getQuotationForResponse(token);
        if (response.success && response.quotation) {
          const loadedQuotation = response.quotation as PublicQuotation;
          setQuotation(loadedQuotation);
          if (loadedQuotation.status === "rejected") setDecision("rejected");
          if (loadedQuotation.clientResponseRemarks) setRemarks(loadedQuotation.clientResponseRemarks);
        }
      } catch (error) {
        toast.error("Unable to load quotation", {
          description: error instanceof Error ? error.message : "The quotation link may be invalid.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuotation();
  }, [token]);

  const hasResponded = quotation?.status === "accepted" || quotation?.status === "rejected";
  const canRespond = quotation && !hasResponded && !["converted", "expired", "cancelled"].includes(quotation.status);

  const totals = useMemo(() => {
    if (!quotation) return { subtotal: 0, discount: 0, tax: 0, deliveryGst: 0, totalGst: 0, deliveryCost: 0, grandTotal: 0 };
    const subtotal = Math.round((quotation.items || []).reduce((s, i) => s + calcLineTotalExGst(i), 0) * 100) / 100;
    const discount = Number(quotation.discount) || 0;
    const tax = Math.round((quotation.items || []).reduce((s, i) => {
      const pct = Number(i.taxPercent ?? quotation.taxRate ?? 10);
      return s + calcLineTotalExGst(i) * (pct / 100);
    }, 0) * 100) / 100;
    const baseTotal = subtotal - discount + tax;
    const parsedDelivery = Number(quotation.deliveryCost);
    const deliveryCost = Number.isFinite(parsedDelivery) && parsedDelivery >= 0
      ? parsedDelivery
      : Math.max(0, Math.round((Number(quotation.grandTotal) - baseTotal) * 100) / 100);
    const deliveryGst = Math.round(deliveryCost * (DELIVERY_GST_RATE / 100) * 100) / 100;
    const totalGst = Math.round((tax + deliveryGst) * 100) / 100;
    const grandTotal = Number.isFinite(Number(quotation.grandTotal))
      ? Number(quotation.grandTotal)
      : Math.round((baseTotal + deliveryCost + deliveryGst) * 100) / 100;
    return { subtotal, discount, tax, deliveryGst, totalGst, deliveryCost, grandTotal };
  }, [quotation]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);

  const formatDate = (value?: string) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" });
  };

  const submitResponse = async () => {
    const trimmedRemarks = remarks.trim();
    if (!trimmedRemarks) {
      toast.error("Remarks are required");
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await api.respondToQuotation(token, { decision, remarks: trimmedRemarks });
      if (response.success && response.quotation) {
        setQuotation(response.quotation as PublicQuotation);
        toast.success(`Quotation ${decision}`, {
          description: "Thank you. Your response has been submitted.",
        });
      }
    } catch (error) {
      toast.error("Unable to submit response", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f8f7f4] px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#c9a84c]/30 border-t-[#c9a84c]" />
          <p className="text-sm font-medium text-neutral-500 tracking-wide">Loading quotation…</p>
        </div>
      </main>
    );
  }

  if (!quotation) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f8f7f4] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <FileText className="h-7 w-7 text-neutral-400" />
          </div>
          <h1 className="mt-5 text-lg font-semibold text-neutral-900">Quotation Not Found</h1>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
            This response link is invalid or no longer available.
          </p>
        </div>
      </main>
    );
  }

  const statusStyle = STATUS_STYLES[quotation.status] ?? STATUS_STYLES.draft;

  return (
    <main className="min-h-dvh bg-[#f8f7f4] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-5">

        {/* ── Document Card ── */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">

          {/* Gold top bar */}
          <div className="h-1.5 w-full bg-linear-to-r from-[#c9a84c] via-[#e6c96e] to-[#c9a84c]" />

          {/* Header */}
          <div className="flex flex-col gap-6 border-b border-neutral-100 px-7 py-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/assets/AMP-TILES-LOGO.png"
                alt="AMP Tiles"
                width={140}
                height={52}
                className="h-auto w-32 sm:w-36 object-contain"
                priority
              />
              <div className="h-10 w-px bg-neutral-200 hidden sm:block" />
              <div className="hidden sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#c9a84c]">
                  Quotation
                </p>
                <p className="mt-0.5 text-xl font-bold text-neutral-900 tracking-tight">
                  {quotation.quotationNumber}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle}`}
              >
                {quotation.status}
              </span>
              <p className="text-xs text-neutral-400">
                Issued {formatDate(quotation.quotationDate)}
              </p>
            </div>
          </div>

          {/* Mobile quotation number */}
          <div className="px-7 pt-4 sm:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#c9a84c]">Quotation</p>
            <p className="mt-0.5 text-2xl font-bold text-neutral-900">{quotation.quotationNumber}</p>
          </div>

          {/* Prepared for / Meta */}
          <div className="grid gap-6 px-7 py-6 sm:grid-cols-2 border-b border-neutral-100">
            {/* Customer Info */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
                Prepared For
              </p>
              <p className="text-base font-semibold text-neutral-900">{quotation.customerName}</p>
              {quotation.customerEmail && (
                <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-[#c9a84c]" />
                  <span>{quotation.customerEmail}</span>
                </div>
              )}
              {quotation.customerPhone && (
                <div className="mt-1.5 flex items-center gap-2 text-sm text-neutral-500">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-[#c9a84c]" />
                  <span>{quotation.customerPhone}</span>
                </div>
              )}
              {quotation.customerAddress && (
                <div className="mt-1.5 flex items-start gap-2 text-sm text-neutral-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#c9a84c]" />
                  <span className="leading-relaxed">{quotation.customerAddress}</span>
                </div>
              )}
              {quotation.deliveryAddress && quotation.deliveryAddress !== quotation.customerAddress && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">
                    Delivery Address
                  </p>
                  <div className="flex items-start gap-2 text-sm text-neutral-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-neutral-400" />
                    <span className="leading-relaxed">{quotation.deliveryAddress}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Dates & Total */}
            <div className="flex flex-col gap-4 sm:items-end sm:text-right">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400 sm:justify-end mb-1">
                  <Calendar className="h-3 w-3" /> Quotation Date
                </div>
                <p className="text-sm font-medium text-neutral-800">{formatDate(quotation.quotationDate)}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400 sm:justify-end mb-1">
                  <Clock className="h-3 w-3" /> Valid Until
                </div>
                <p className="text-sm font-medium text-neutral-800">{formatDate(quotation.validUntil)}</p>
              </div>
              {quotation.reference && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 sm:text-right mb-1">
                    Reference
                  </p>
                  <p className="text-sm font-medium text-neutral-800">{quotation.reference}</p>
                </div>
              )}
              <div className="rounded-xl bg-[#faf7ee] border border-[#e8d9a0] px-5 py-3 sm:min-w-40">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c9a84c]">Grand Total</p>
                <p className="mt-1 text-2xl font-bold text-neutral-900">{formatCurrency(totals.grandTotal)}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-7 py-6 border-b border-neutral-100">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
              Items
            </p>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm" style={{ minWidth: "720px" }}>
                <thead>
                  <tr className="border-b border-neutral-100">
                    {["Product", "SKU", "Description", "Size", "Unit", "Qty", "Rate", "Discount", "GST", "Total ex GST"].map((h) => (
                      <th
                        key={h}
                        className={`pb-3 pr-4 last:pr-0 text-[11px] font-semibold uppercase tracking-widest text-neutral-400 ${
                          ["Qty", "Rate", "Discount", "GST", "Total ex GST"].includes(h) ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => {
                    const taxPct = Number(item.taxPercent ?? quotation.taxRate ?? 10);
                    const exGst = calcLineTotalExGst(item);
                    return (
                      <tr key={item._id || index} className="border-b border-neutral-50 last:border-0 align-top">
                        <td className="py-3.5 pr-4">
                          <p className="font-medium text-neutral-900 leading-snug">
                            {item.productName || item.product?.name || "Product"}
                          </p>
                        </td>
                        <td className="py-3.5 pr-4 text-neutral-500 text-xs">{getItemSku(item)}</td>
                        <td className="py-3.5 pr-4 text-neutral-500 text-xs max-w-35 leading-relaxed">
                          {getItemDescription(item)}
                        </td>
                        <td className="py-3.5 pr-4 text-neutral-600">{getItemSize(item)}</td>
                        <td className="py-3.5 pr-4 text-neutral-600">{getDisplayUnit(item)}</td>
                        <td className="py-3.5 pr-4 text-right text-neutral-700 font-medium tabular-nums">
                          {getDisplayQuantity(item)}
                        </td>
                        <td className="py-3.5 pr-4 text-right text-neutral-700 tabular-nums">
                          {formatCurrency(Number(item.rate) || 0)}
                        </td>
                        <td className="py-3.5 pr-4 text-right tabular-nums">
                          {Number(item.discountPercent) > 0
                            ? <span className="text-emerald-600 font-medium">{item.discountPercent}%</span>
                            : <span className="text-neutral-400">—</span>}
                        </td>
                        <td className="py-3.5 pr-4 text-right text-neutral-500 tabular-nums">
                          {taxPct}%
                        </td>
                        <td className="py-3.5 text-right font-semibold text-neutral-900 tabular-nums">
                          {formatCurrency(exGst)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary + Response */}
          <div className="grid gap-0 divide-y divide-neutral-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">

            {/* Totals */}
            <div className="px-7 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
                Summary
              </p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal (ex GST)</span>
                  <span className="font-medium text-neutral-800 tabular-nums">{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Discount</span>
                    <span className="font-medium text-emerald-600 tabular-nums">− {formatCurrency(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-600">
                  <span>GST on items {quotation.taxRate ? `(${quotation.taxRate}%)` : "(10%)"}</span>
                  <span className="font-medium text-neutral-800 tabular-nums">{formatCurrency(totals.tax)}</span>
                </div>
                {totals.deliveryCost > 0 && (
                  <>
                    <div className="flex justify-between text-neutral-600">
                      <span>Delivery (ex GST)</span>
                      <span className="font-medium text-neutral-800 tabular-nums">{formatCurrency(totals.deliveryCost)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>GST on delivery (10%)</span>
                      <span className="font-medium text-neutral-800 tabular-nums">{formatCurrency(totals.deliveryGst)}</span>
                    </div>
                  </>
                )}
                <div className="border-t border-neutral-100 pt-3 space-y-1.5">
                  {totals.deliveryCost > 0 && (
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>Total GST</span>
                      <span className="tabular-nums">{formatCurrency(totals.totalGst)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-semibold text-neutral-900">Grand Total (inc GST)</span>
                    <span className="text-base font-bold text-neutral-900 tabular-nums">{formatCurrency(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {(quotation.notes || quotation.terms) && (
                <div className="mt-5 space-y-3">
                  {quotation.notes && (
                    <div className="rounded-lg bg-neutral-50 border border-neutral-100 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Notes</p>
                      <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">{quotation.notes}</p>
                    </div>
                  )}
                  {quotation.terms && (
                    <div className="rounded-lg bg-neutral-50 border border-neutral-100 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Terms & Conditions</p>
                      <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">{quotation.terms}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Response Panel */}
            <div className="px-7 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
                Your Response
              </p>

              {hasResponded ? (
                <div
                  className={`rounded-xl border p-4 ${
                    quotation.status === "accepted"
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {quotation.status === "accepted" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    )}
                    <p className="font-semibold capitalize text-sm text-neutral-900">
                      Quotation {quotation.status}
                    </p>
                  </div>
                  {quotation.clientResponseRemarks && (
                    <p className="mt-3 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                      {quotation.clientResponseRemarks}
                    </p>
                  )}
                  {quotation.clientRespondedAt && (
                    <p className="mt-3 text-xs text-neutral-400">
                      Submitted {formatDate(quotation.clientRespondedAt)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {!canRespond && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-xs font-medium text-amber-700">
                        This quotation can no longer be responded to.
                      </p>
                    </div>
                  )}

                  {/* Accept / Reject toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDecision("accepted")}
                      disabled={!canRespond}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                        decision === "accepted"
                          ? "border-transparent bg-neutral-900 text-white shadow-sm"
                          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision("rejected")}
                      disabled={!canRespond}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                        decision === "rejected"
                          ? "border-transparent bg-neutral-900 text-white shadow-sm"
                          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>

                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    disabled={!canRespond}
                    rows={4}
                    placeholder="Add remarks or reason…"
                    className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/15 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
                  />

                  <button
                    type="button"
                    onClick={submitResponse}
                    disabled={!canRespond || isSubmitting}
                    className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Submitting…
                      </span>
                    ) : (
                      "Submit Response"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 pb-6 opacity-60">
          <Image
            src="/assets/AMP-TILES-LOGO.png"
            alt="AMP Tiles"
            width={64}
            height={24}
            className="h-auto w-14 object-contain grayscale"
          />
          <span className="text-xs text-neutral-400">· Secure quotation portal</span>
        </div>
      </div>
    </main>
  );
}
