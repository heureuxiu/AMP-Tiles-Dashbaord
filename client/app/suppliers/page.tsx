"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Edit, Search, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

type Supplier = {
  _id: string;
  supplierNumber: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  notes?: string;
};

type Stats = {
  total: number;
  active: number;
  inactive: number;
};

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await api.getSuppliers();
      
      if (response.success && response.suppliers) {
        setSuppliers(response.suppliers as Supplier[]);
        if (response.stats) {
          setStats(response.stats as Stats);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load suppliers";
      toast.error("Failed to load suppliers", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      searchQuery === "" ||
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.supplierNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.phone && supplier.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEdit = (id: string) => {
    router.push(`/suppliers/${id}/edit`);
  };

  const handleAddSupplier = () => {
    router.push("/suppliers/create");
  };

  const openDeleteModal = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    try {
      const response = await api.deleteSupplier(supplierToDelete._id);
      if (response.success) {
        toast.success("Supplier deleted", {
          description: `${supplierToDelete.name} has been removed`,
        });
        fetchSuppliers();
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

  return (
    <div className="min-w-0 w-full space-y-4 p-3 sm:space-y-6 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            Suppliers
          </h1>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
            Manage your supplier information
          </p>
        </div>
        <Button
          onClick={handleAddSupplier}
          className="w-full shrink-0 gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-w-0 overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:rounded-2xl"
      >
        {/* Header */}
        <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
              style={{ backgroundColor: "#8b5cf615" }}
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#8b5cf6" }} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-neutral-900 dark:text-white sm:text-base">
                All Suppliers
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                Complete list of suppliers
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by supplier name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Showing {filteredSuppliers.length} of {suppliers.length} suppliers
            </p>
          )}
        </motion.div>

        {/* Table Content */}
        <div className="overflow-x-auto p-3 sm:p-6">
          <div className="inline-block min-w-full align-middle">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading suppliers...</p>
              </div>
            </div>
          ) : (
            <div className="[&>div]:rounded-lg [&>div]:border [&>div]:border-neutral-200/60 dark:[&>div]:border-neutral-700/60">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Supplier Number</TableHead>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-0">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users
                            className="h-12 w-12 text-neutral-300 dark:text-neutral-600"
                            strokeWidth={1.5}
                          />
                          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            {searchQuery ? "No suppliers found" : "No suppliers added yet"}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500">
                            {searchQuery
                              ? "Try adjusting your search"
                              : "Add your first supplier to get started"}
                          </p>
                          {!searchQuery && (
                            <Button
                              onClick={handleAddSupplier}
                              className="mt-2 flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                            >
                              <Plus className="h-4 w-4" />
                              Add Supplier
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers.map((supplier, index) => (
                      <motion.tr
                        key={supplier._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                      >
                        <TableCell className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
                          {supplier.supplierNumber}
                        </TableCell>
                        <TableCell className="font-medium text-neutral-900 dark:text-white">
                          {supplier.name}
                        </TableCell>
                        <TableCell className="text-neutral-600 dark:text-neutral-400">
                          {supplier.phone}
                        </TableCell>
                        <TableCell className="text-neutral-600 dark:text-neutral-400">
                          {supplier.email || "N/A"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              supplier.status === "active"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                : "bg-neutral-100 text-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400"
                            }`}
                          >
                            {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          {/* Edit Button */}
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/20"
                              onClick={() => handleEdit(supplier._id)}
                              aria-label={`Edit ${supplier.name}`}
                              title="Edit Supplier"
                            >
                              <Edit className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </Button>
                          </motion.div>
                          {/* Delete Button */}
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20"
                              onClick={() => openDeleteModal(supplier)}
                              aria-label={`Delete ${supplier.name}`}
                              title="Delete Supplier"
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </motion.div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          </div>
        </div>

        {/* Footer Summary */}
        {!isLoading && suppliers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="border-t border-neutral-200/60 p-4 sm:p-6 dark:border-neutral-700/60"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                <span>
                  Total: <span className="font-bold text-neutral-900 dark:text-white">{stats.total}</span>
                </span>
                <span>
                  Active: <span className="font-bold text-green-600 dark:text-green-400">{stats.active}</span>
                </span>
                <span>
                  Inactive: <span className="font-bold text-neutral-600 dark:text-neutral-400">{stats.inactive}</span>
                </span>
              </div>
              <span className="font-bold text-neutral-900 dark:text-white">
                Showing: {filteredSuppliers.length}{" "}
                {searchQuery ? `of ${suppliers.length}` : ""} Suppliers
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

      <DeleteConfirmDialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setSupplierToDelete(null);
        }}
        title="Delete Supplier?"
        description={
          supplierToDelete
            ? `Are you sure you want to delete ${supplierToDelete.name} (${supplierToDelete.supplierNumber})? This cannot be undone.`
            : ""
        }
        onConfirm={handleConfirmDeleteSupplier}
      />
    </div>
  );
}
