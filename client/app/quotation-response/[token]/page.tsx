"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, FileText, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type ResponseDecision = "accepted" | "rejected";

type QuotationItem = {
  _id?: string;
  productName?: string;
  size?: string;
  unitType?: string;
  quantity: number;
  rate: number;
  lineTotal: number;
  product?: {
    sku?: string;
    name?: string;
    size?: string;
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
    const subtotal = Number(quotation?.subtotal) || 0;
    const discount = Number(quotation?.discount) || 0;
    const tax = Number(quotation?.tax) || 0;
    const deliveryCost = Number(quotation?.deliveryCost) || 0;
    const grandTotal = Number(quotation?.grandTotal) || 0;

    return { subtotal, discount, tax, deliveryCost, grandTotal };
  }, [quotation]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);

  const formatDate = (value?: string) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const submitResponse = async () => {
    const trimmedRemarks = remarks.trim();
    if (!trimmedRemarks) {
      toast.error("Remarks are required");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.respondToQuotation(token, {
        decision,
        remarks: trimmedRemarks,
      });

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
      <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
        <div className="flex flex-col items-center gap-3 text-neutral-700">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
          <p className="text-sm font-medium">Loading quotation...</p>
        </div>
      </main>
    );
  }

  if (!quotation) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-neutral-300" />
          <h1 className="mt-4 text-xl font-semibold text-neutral-900">Quotation Not Found</h1>
          <p className="mt-2 text-sm text-neutral-600">This response link is invalid or no longer available.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-neutral-50 px-4 py-6 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">AMP Tiles Quotation</p>
              <h1 className="mt-1 text-2xl font-semibold text-neutral-950 sm:text-3xl">
                {quotation.quotationNumber}
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                Prepared for <span className="font-medium text-neutral-900">{quotation.customerName}</span>
              </p>
            </div>
            <Badge className="w-fit capitalize">{quotation.status}</Badge>
          </div>

          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-neutral-500">Quotation Date</p>
              <p className="mt-1 font-medium">{formatDate(quotation.quotationDate)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Valid Until</p>
              <p className="mt-1 font-medium">{formatDate(quotation.validUntil)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Grand Total</p>
              <p className="mt-1 text-lg font-semibold">{formatCurrency(totals.grandTotal)}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 p-5">
              <h2 className="text-lg font-semibold">Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Size</th>
                    <th className="px-5 py-3 text-right">Qty</th>
                    <th className="px-5 py-3 text-right">Rate</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={item._id || index} className="border-t border-neutral-100">
                      <td className="px-5 py-4">
                        <p className="font-medium">{item.productName || item.product?.name || "Product"}</p>
                        <p className="mt-1 text-xs text-neutral-500">{item.product?.sku || ""}</p>
                      </td>
                      <td className="px-5 py-4 text-neutral-700">{item.size || item.product?.size || "-"}</td>
                      <td className="px-5 py-4 text-right">
                        {item.quantity} {item.unitType || ""}
                      </td>
                      <td className="px-5 py-4 text-right">{formatCurrency(Number(item.rate) || 0)}</td>
                      <td className="px-5 py-4 text-right font-medium">
                        {formatCurrency(Number(item.lineTotal) || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Summary</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Discount</span>
                    <span className="font-medium">-{formatCurrency(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-600">GST</span>
                  <span className="font-medium">{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Delivery</span>
                  <span className="font-medium">{formatCurrency(totals.deliveryCost)}</span>
                </div>
                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">{formatCurrency(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Your Response</h2>

              {hasResponded ? (
                <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-center gap-2">
                    {quotation.status === "accepted" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <p className="font-medium capitalize">Quotation {quotation.status}</p>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">
                    {quotation.clientResponseRemarks || "No remarks provided."}
                  </p>
                  <p className="mt-3 text-xs text-neutral-500">
                    Submitted {formatDate(quotation.clientRespondedAt)}
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={decision === "accepted" ? "primary" : "outline"}
                      className="gap-2"
                      onClick={() => setDecision("accepted")}
                      disabled={!canRespond}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      type="button"
                      variant={decision === "rejected" ? "primary" : "outline"}
                      className="gap-2"
                      onClick={() => setDecision("rejected")}
                      disabled={!canRespond}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                  <textarea
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    disabled={!canRespond}
                    rows={5}
                    placeholder="Add remarks or reason..."
                    className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:bg-neutral-100"
                  />
                  {!canRespond && (
                    <p className="text-sm text-red-600">This quotation can no longer be responded to.</p>
                  )}
                  <Button
                    type="button"
                    className="w-full"
                    onClick={submitResponse}
                    disabled={!canRespond || isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Response"}
                  </Button>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
