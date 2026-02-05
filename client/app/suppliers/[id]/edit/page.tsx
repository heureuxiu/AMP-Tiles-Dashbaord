"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

// Mock data - replace with actual API call
const mockSuppliers: Record<string, any> = {
  "SUP-001": {
    id: "SUP-001",
    name: "Tiles International Pty Ltd",
    phone: "+61 3 9999 1111",
    email: "contact@tilesintl.com.au",
    notes: "Premium tile supplier",
  },
  "SUP-002": {
    id: "SUP-002",
    name: "Stone & Marble Wholesale",
    phone: "+61 3 9999 2222",
    email: "sales@stonemarble.com.au",
    notes: "Natural stone specialist",
  },
  "SUP-003": {
    id: "SUP-003",
    name: "Ceramic Pro Supplies",
    phone: "+61 3 9999 3333",
    email: "info@ceramicpro.com.au",
    notes: "",
  },
  "SUP-004": {
    id: "SUP-004",
    name: "Porcelain World",
    phone: "+61 3 9999 4444",
    email: "orders@porcelainworld.com.au",
    notes: "Imported porcelain tiles",
  },
  "SUP-005": {
    id: "SUP-005",
    name: "Australian Tile Distributors",
    phone: "+61 3 9999 5555",
    email: "sales@austile.com.au",
    notes: "",
  },
};

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  // Load supplier data
  useEffect(() => {
    // TODO: Replace with actual API call
    setTimeout(() => {
      const supplier = mockSuppliers[supplierId];
      if (supplier) {
        setFormData({
          name: supplier.name,
          phone: supplier.phone,
          email: supplier.email,
          notes: supplier.notes || "",
        });
      } else {
        toast.error("Supplier not found");
        router.push("/suppliers");
      }
      setIsLoading(false);
    }, 500);
  }, [supplierId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    // TODO: Implement actual API call
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Supplier updated successfully", {
        description: `${formData.name} has been updated`,
      });
      router.push("/suppliers");
    }, 1000);
  };

  const handleCancel = () => {
    router.push("/suppliers");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Loading supplier...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Edit Supplier
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Update supplier information
          </p>
        </div>
      </div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
      >
        {/* Header */}
        <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#8b5cf615" }}
            >
              <Edit className="h-5 w-5" style={{ color: "#8b5cf6" }} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white">
                Supplier Information
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Update supplier details below
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Supplier ID (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier ID</Label>
              <Input
                id="supplierId"
                type="text"
                value={supplierId}
                readOnly
                className="bg-neutral-50 dark:bg-neutral-900"
              />
            </div>

            {/* Supplier Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Supplier Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter supplier name"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Enter any additional notes about this supplier"
                rows={4}
                className="w-full rounded-md border border-gray-200 bg-slate-100 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/50 focus:border-amp-primary focus:bg-transparent focus:ring-2 focus:ring-amp-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
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
