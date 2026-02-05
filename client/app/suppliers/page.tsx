"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Edit, Search, X, Plus } from "lucide-react";
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

type Supplier = {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes?: string;
};

// Mock suppliers data
const initialSuppliers: Supplier[] = [
  {
    id: "SUP-001",
    name: "Tiles International Pty Ltd",
    phone: "+61 3 9999 1111",
    email: "contact@tilesintl.com.au",
    notes: "Premium tile supplier",
  },
  {
    id: "SUP-002",
    name: "Stone & Marble Wholesale",
    phone: "+61 3 9999 2222",
    email: "sales@stonemarble.com.au",
    notes: "Natural stone specialist",
  },
  {
    id: "SUP-003",
    name: "Ceramic Pro Supplies",
    phone: "+61 3 9999 3333",
    email: "info@ceramicpro.com.au",
  },
  {
    id: "SUP-004",
    name: "Porcelain World",
    phone: "+61 3 9999 4444",
    email: "orders@porcelainworld.com.au",
    notes: "Imported porcelain tiles",
  },
  {
    id: "SUP-005",
    name: "Australian Tile Distributors",
    phone: "+61 3 9999 5555",
    email: "sales@austile.com.au",
  },
];

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers] = useState<Supplier[]>(initialSuppliers);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      searchQuery === "" ||
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (id: string) => {
    router.push(`/suppliers/${id}/edit`);
  };

  const handleAddSupplier = () => {
    router.push("/suppliers/create");
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Suppliers
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Manage your supplier information
          </p>
        </div>
        <Button
          onClick={handleAddSupplier}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
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
        className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
      >
        {/* Header */}
        <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "#8b5cf615" }}
              >
                <Users className="h-5 w-5" style={{ color: "#8b5cf6" }} strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  All Suppliers
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Complete list of suppliers
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60"
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
        <div className="p-6">
          <div className="[&>div]:rounded-lg [&>div]:border [&>div]:border-neutral-200/60 dark:[&>div]:border-neutral-700/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
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
                      key={supplier.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                    >
                      <TableCell className="font-medium text-neutral-900 dark:text-white">
                        {supplier.name}
                      </TableCell>
                      <TableCell className="text-neutral-600 dark:text-neutral-400">
                        {supplier.phone}
                      </TableCell>
                      <TableCell className="text-neutral-600 dark:text-neutral-400">
                        {supplier.email}
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        {/* Edit Button */}
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/20"
                            onClick={() => handleEdit(supplier.id)}
                            aria-label={`Edit ${supplier.name}`}
                            title="Edit Supplier"
                          >
                            <Edit className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </Button>
                        </motion.div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Summary */}
        {suppliers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="border-t border-neutral-200/60 p-6 dark:border-neutral-700/60"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                Total Suppliers: <span className="font-bold text-neutral-900 dark:text-white">{suppliers.length}</span>
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                Showing: {filteredSuppliers.length}{" "}
                {searchQuery ? `of ${suppliers.length}` : ""} Suppliers
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
