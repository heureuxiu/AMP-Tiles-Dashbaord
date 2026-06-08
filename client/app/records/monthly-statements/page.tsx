"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, FileText, Search, UserRound } from "lucide-react";
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
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Customer = {
  _id: string;
  customerNumber?: string;
  name: string;
  phone?: string;
  email?: string;
  abn?: string;
  status?: string;
};

export default function MonthlyStatementsCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setIsLoading(true);
        const response = await api.getCustomers({ sortBy: "name", sortOrder: "asc" });
        if (response.success && response.customers) {
          setCustomers(response.customers as Customer[]);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load customers";
        toast.error("Failed to load customers", { description: errorMessage });
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(query) ||
        (customer.customerNumber || "").toLowerCase().includes(query) ||
        (customer.phone || "").toLowerCase().includes(query) ||
        (customer.email || "").toLowerCase().includes(query) ||
        (customer.abn || "").toLowerCase().includes(query)
      );
    });
  }, [customers, searchQuery]);

  return (
    <div className="min-w-0 space-y-5 p-3 sm:p-6 lg:p-8">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            Monthly Statements
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Select a customer to view monthly invoices, quotations, product totals, payments, and outstanding balance.
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
      >
        <div className="border-b border-neutral-200/60 p-4 dark:border-neutral-700/60 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
                style={{ backgroundColor: "#8b5cf615" }}
              >
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: "#8b5cf6" }} strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-semibold text-neutral-900 dark:text-white">Customer Statement Records</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Open any customer record individually.</p>
              </div>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search customer, phone, email, ABN..."
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto p-3 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>ABN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
                      <p className="text-sm text-neutral-500">Loading customers...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <UserRound className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
                    <p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      No customers found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer._id}>
                    <TableCell className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
                      {customer.customerNumber || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium text-neutral-900 dark:text-white">
                      {customer.name}
                    </TableCell>
                    <TableCell>{customer.phone || "N/A"}</TableCell>
                    <TableCell>{customer.email || "N/A"}</TableCell>
                    <TableCell>{customer.abn || "N/A"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          customer.status === "inactive"
                            ? "bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        }`}
                      >
                        {customer.status === "inactive" ? "Inactive" : "Active"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        onClick={() => router.push(`/records/monthly-statements/${customer._id}`)}
                        className="gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                      >
                        <Eye className="h-4 w-4" />
                        View Record
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
}


