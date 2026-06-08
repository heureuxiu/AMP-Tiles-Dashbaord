"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Edit, Plus, Search, Trash2, UserRound, X } from "lucide-react";
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
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Customer = {
  _id: string;
  customerNumber: string;
  name: string;
  phone: string;
  email?: string;
  abn?: string;
  status: string;
};

type Stats = {
  total: number;
  active: number;
  inactive: number;
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0 });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await api.getCustomers();

      if (response.success && response.customers) {
        setCustomers(response.customers as Customer[]);
        if (response.stats) setStats(response.stats as Stats);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load customers";
      toast.error("Failed to load customers", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      searchQuery === "" ||
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.customerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.abn && customer.abn.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      const response = await api.deleteCustomer(customerToDelete._id);
      if (response.success) {
        toast.success("Customer deleted", {
          description: `${customerToDelete.name} has been removed`,
        });
        fetchCustomers();
      } else {
        toast.error("Failed to delete customer");
        throw new Error();
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "") {
        toast.error("Failed to delete customer", { description: error.message });
      }
      throw error;
    }
  };

  return (
    <div className="min-w-0 w-full space-y-4 p-3 sm:space-y-6 sm:p-6 lg:p-8">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            Customers
          </h1>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
            Manage your customer records
          </p>
        </div>
        <Button
          onClick={() => router.push("/customers/create")}
          className="w-full shrink-0 gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-w-0 overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:rounded-2xl"
      >
        <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
              style={{ backgroundColor: "#8b5cf615" }}
            >
              <UserRound className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#8b5cf6" }} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-neutral-900 dark:text-white sm:text-base">
                All Customers
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
                Complete list of customers
              </p>
            </div>
          </div>
        </div>

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
              placeholder="Search by customer name, phone, email, or ABN..."
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
              Showing {filteredCustomers.length} of {customers.length} customers
            </p>
          )}
        </motion.div>

        <div className="overflow-x-auto p-3 sm:p-6">
          <div className="inline-block min-w-full align-middle">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading customers...</p>
                </div>
              </div>
            ) : (
              <div className="[&>div]:rounded-lg [&>div]:border [&>div]:border-neutral-200/60 dark:[&>div]:border-neutral-700/60">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Customer Number</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>ABN</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-0">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <UserRound className="h-12 w-12 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
                            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                              {searchQuery ? "No customers found" : "No customers added yet"}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-500">
                              {searchQuery ? "Try adjusting your search" : "Add your first customer to get started"}
                            </p>
                            {!searchQuery && (
                              <Button
                                onClick={() => router.push("/customers/create")}
                                className="mt-2 flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                              >
                                <Plus className="h-4 w-4" />
                                Add Customer
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((customer, index) => (
                        <motion.tr
                          key={customer._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                        >
                          <TableCell className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
                            {customer.customerNumber}
                          </TableCell>
                          <TableCell className="font-medium text-neutral-900 dark:text-white">
                            {customer.name}
                          </TableCell>
                          <TableCell className="text-neutral-600 dark:text-neutral-400">
                            {customer.phone}
                          </TableCell>
                          <TableCell className="text-neutral-600 dark:text-neutral-400">
                            {customer.email || "N/A"}
                          </TableCell>
                          <TableCell className="text-neutral-600 dark:text-neutral-400">
                            {customer.abn || "N/A"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                customer.status === "active"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                  : "bg-neutral-100 text-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400"
                              }`}
                            >
                              {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="flex items-center gap-1">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/20"
                                onClick={() => router.push(`/customers/${customer._id}/edit`)}
                                aria-label={`Edit ${customer.name}`}
                                title="Edit Customer"
                              >
                                <Edit className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20"
                                onClick={() => {
                                  setCustomerToDelete(customer);
                                  setDeleteModalOpen(true);
                                }}
                                aria-label={`Delete ${customer.name}`}
                                title="Delete Customer"
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

        {!isLoading && customers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="border-t border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-6"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                <span>Total: <span className="font-bold text-neutral-900 dark:text-white">{stats.total}</span></span>
                <span>Active: <span className="font-bold text-green-600 dark:text-green-400">{stats.active}</span></span>
                <span>Inactive: <span className="font-bold text-neutral-600 dark:text-neutral-400">{stats.inactive}</span></span>
              </div>
              <span className="font-bold text-neutral-900 dark:text-white">
                Showing: {filteredCustomers.length} {searchQuery ? `of ${customers.length}` : ""} Customers
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

      <DeleteConfirmDialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setCustomerToDelete(null);
        }}
        title="Delete Customer?"
        description={
          customerToDelete
            ? `Are you sure you want to delete ${customerToDelete.name} (${customerToDelete.customerNumber})? This cannot be undone.`
            : ""
        }
        onConfirm={handleConfirmDeleteCustomer}
      />
    </div>
  );
}
