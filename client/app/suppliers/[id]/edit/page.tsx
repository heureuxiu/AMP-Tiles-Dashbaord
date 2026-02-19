"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit, Save, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplierNumber: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    website: "",
    abn: "",
    street: "",
    city: "",
    state: "",
    postcode: "",
    paymentTerms: "",
    status: "active",
    notes: "",
  });

  // Load supplier data
  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  const fetchSupplier = async () => {
    try {
      setIsLoading(true);
      const response = await api.getSupplier(supplierId);
      
      if (response.success && response.supplier) {
        const supplier = response.supplier as {
          supplierNumber?: string;
          name?: string;
          contactPerson?: string;
          phone?: string;
          email?: string;
          website?: string;
          abn?: string;
          address?: {
            street?: string;
            city?: string;
            state?: string;
            postcode?: string;
          };
          paymentTerms?: string;
          status?: string;
          notes?: string;
        };
        setFormData({
          supplierNumber: supplier.supplierNumber || "",
          name: supplier.name || "",
          contactPerson: supplier.contactPerson || "",
          phone: supplier.phone || "",
          email: supplier.email || "",
          website: supplier.website || "",
          abn: supplier.abn || "",
          street: supplier.address?.street || "",
          city: supplier.address?.city || "",
          state: supplier.address?.state || "",
          postcode: supplier.address?.postcode || "",
          paymentTerms: supplier.paymentTerms || "",
          status: supplier.status || "active",
          notes: supplier.notes || "",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load supplier";
      toast.error("Failed to load supplier", {
        description: errorMessage,
      });
      router.push("/suppliers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    try {
      setIsSaving(true);

      const supplierData = {
        name: formData.name,
        contactPerson: formData.contactPerson || undefined,
        phone: formData.phone,
        email: formData.email || undefined,
        website: formData.website || undefined,
        abn: formData.abn || undefined,
        address: {
          street: formData.street || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          postcode: formData.postcode || undefined,
        },
        paymentTerms: formData.paymentTerms || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
      };

      const response = await api.updateSupplier(supplierId, supplierData);

      if (response.success) {
        toast.success("Supplier updated successfully", {
          description: `${formData.name} has been updated`,
        });
        router.push("/suppliers");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update supplier";
      toast.error("Failed to update supplier", {
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await api.deleteSupplier(supplierId);
      if (response.success) {
        toast.success("Supplier deleted successfully");
        router.push("/suppliers");
      } else {
        toast.error("Failed to delete supplier");
        throw new Error();
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "") {
        toast.error("Failed to delete supplier", {
          description: error.message,
        });
      }
      throw error;
    }
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
          <div className="grid gap-6 md:grid-cols-2">
            {/* Supplier Number (Read-only) */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="supplierNumber">Supplier Number</Label>
              <Input
                id="supplierNumber"
                type="text"
                value={formData.supplierNumber}
                readOnly
                className="bg-neutral-50 dark:bg-neutral-900 font-mono"
              />
            </div>

            {/* Basic Information Section */}
            <div className="space-y-6 md:col-span-2">
              <h4 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Basic Information
              </h4>
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
                disabled={isSaving || isDeleting}
                required
              />
            </div>

            {/* Contact Person */}
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                type="text"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="Enter contact person name"
                disabled={isSaving || isDeleting}
              />
            </div>

            {/* Phone */}
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
                disabled={isSaving || isDeleting}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                disabled={isSaving || isDeleting}
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
                disabled={isSaving || isDeleting}
              />
            </div>

            {/* ABN */}
            <div className="space-y-2">
              <Label htmlFor="abn">ABN</Label>
              <Input
                id="abn"
                name="abn"
                type="text"
                value={formData.abn}
                onChange={handleChange}
                placeholder="Enter ABN"
                disabled={isSaving || isDeleting}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isSaving || isDeleting}
                className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Payment Terms */}
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                name="paymentTerms"
                type="text"
                value={formData.paymentTerms}
                onChange={handleChange}
                placeholder="e.g., Net 30"
                disabled={isSaving || isDeleting}
              />
            </div>

            {/* Address Section */}
            <div className="space-y-6 md:col-span-2 pt-4">
              <h4 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Address
              </h4>
            </div>

            {/* Street */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                name="street"
                type="text"
                value={formData.street}
                onChange={handleChange}
                placeholder="Enter street address"
                disabled={isSaving || isDeleting}
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
                disabled={isSaving || isDeleting}
              />
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                type="text"
                value={formData.state}
                onChange={handleChange}
                placeholder="Enter state"
                disabled={isSaving || isDeleting}
              />
            </div>

            {/* Postcode */}
            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                name="postcode"
                type="text"
                value={formData.postcode}
                onChange={handleChange}
                placeholder="Enter postcode"
                disabled={isSaving || isDeleting}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Enter any additional notes about this supplier"
                rows={4}
                disabled={isSaving || isDeleting}
                className="w-full rounded-md border border-gray-200 bg-slate-100 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/50 focus:border-amp-primary focus:bg-transparent focus:ring-2 focus:ring-amp-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-3 pt-4 md:col-span-2">
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSaving || isDeleting}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving || isDeleting}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteModalOpen(true)}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Supplier
              </Button>
            </div>
          </div>
        </form>
      </motion.div>

      <DeleteConfirmDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Supplier?"
        description={`Are you sure you want to delete ${formData.name}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
