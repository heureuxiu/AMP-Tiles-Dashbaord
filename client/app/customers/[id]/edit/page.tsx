"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Save, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

type Customer = {
  _id: string;
  customerNumber: string;
  name: string;
  phone: string;
  email?: string;
  abn?: string;
  status?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
  notes?: string;
};

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [customerNumber, setCustomerNumber] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    abn: "",
    status: "active",
    street: "",
    city: "",
    state: "",
    postcode: "",
    notes: "",
  });

  const fetchCustomer = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.getCustomer(customerId);

      if (response.success && response.customer) {
        const customer = response.customer as Customer;
        setCustomerNumber(customer.customerNumber || "");
        setFormData({
          name: customer.name || "",
          phone: customer.phone || "",
          email: customer.email || "",
          abn: customer.abn || "",
          status: customer.status || "active",
          street: customer.address?.street || "",
          city: customer.address?.city || "",
          state: customer.address?.state || "",
          postcode: customer.address?.postcode || "",
          notes: customer.notes || "",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load customer";
      toast.error("Failed to load customer", { description: errorMessage });
      router.push("/customers");
    } finally {
      setIsLoading(false);
    }
  }, [customerId, router]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    try {
      setIsSaving(true);
      const response = await api.updateCustomer(customerId, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        abn: formData.abn || undefined,
        status: formData.status,
        address: {
          street: formData.street || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          postcode: formData.postcode || undefined,
        },
        notes: formData.notes || undefined,
      });

      if (response.success) {
        toast.success("Customer updated successfully", {
          description: `${formData.name} has been updated`,
        });
        router.push("/customers");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update customer";
      toast.error("Failed to update customer", { description: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Edit Customer
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Update customer information
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
      >
        <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "#8b5cf615" }}>
              <UserRound className="h-5 w-5" style={{ color: "#8b5cf6" }} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white">
                Customer Information
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Edit customer details below
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customerCode">Customer Code</Label>
              <Input
                id="customerCode"
                type="text"
                readOnly
                value={customerNumber}
                className="bg-neutral-50 font-mono text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Customer Name <span className="text-red-500">*</span>
              </Label>
              <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} disabled={isSaving} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={isSaving} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={isSaving} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="abn">ABN</Label>
              <Input id="abn" name="abn" type="text" value={formData.abn} onChange={handleChange} disabled={isSaving} placeholder="Enter ABN" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isSaving}
                className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">Street</Label>
              <Input id="street" name="street" type="text" value={formData.street} onChange={handleChange} disabled={isSaving} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" type="text" value={formData.city} onChange={handleChange} disabled={isSaving} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" type="text" value={formData.state} onChange={handleChange} disabled={isSaving} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input id="postcode" name="postcode" type="text" value={formData.postcode} onChange={handleChange} disabled={isSaving} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                disabled={isSaving}
                className="w-full rounded-md border border-gray-200 bg-slate-100 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/50 focus:border-amp-primary focus:bg-transparent focus:ring-2 focus:ring-amp-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>

            <div className="flex gap-3 pt-4 md:col-span-2">
              <Button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700">
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Customer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/records/monthly-statements/${customerId}`)}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                View Monthly Records
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/customers")} disabled={isSaving} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
