"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CreateCustomerPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    abn: "",
    street: "",
    city: "",
    state: "",
    postcode: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
      const response = await api.createCustomer({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        abn: formData.abn || undefined,
        address: {
          street: formData.street || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          postcode: formData.postcode || undefined,
        },
        notes: formData.notes || undefined,
      });

      if (response.success) {
        toast.success("Customer added successfully", {
          description: `${formData.name} has been added to customers`,
        });
        router.push("/customers");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create customer";
      toast.error("Failed to create customer", { description: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Add Customer
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Add a new customer to your database
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
              <UserPlus className="h-5 w-5" style={{ color: "#8b5cf6" }} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white">
                Customer Information
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Enter customer details below
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customerCode">Customer Code (Auto Generated)</Label>
              <Input
                id="customerCode"
                type="text"
                readOnly
                value=""
                placeholder="Auto-generated when saved"
                className="bg-neutral-50 font-mono text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400"
              />
            </div>

            <div className="space-y-6 md:col-span-2">
              <h4 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Basic Information
              </h4>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Customer Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter customer name"
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="abn">ABN</Label>
              <Input
                id="abn"
                name="abn"
                type="text"
                value={formData.abn}
                onChange={handleChange}
                placeholder="Enter ABN"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-6 pt-4 md:col-span-2">
              <h4 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Address
              </h4>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                name="street"
                type="text"
                value={formData.street}
                onChange={handleChange}
                placeholder="Enter street address"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" type="text" value={formData.city} onChange={handleChange} placeholder="Enter city" disabled={isSaving} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" type="text" value={formData.state} onChange={handleChange} placeholder="Enter state" disabled={isSaving} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input id="postcode" name="postcode" type="text" value={formData.postcode} onChange={handleChange} placeholder="Enter postcode" disabled={isSaving} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Enter any additional notes about this customer"
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
