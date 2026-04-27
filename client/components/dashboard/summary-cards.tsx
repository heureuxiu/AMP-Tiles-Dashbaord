"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";

// Generate sample data for each stat with realistic trend
const generateData = (baseValue: number, trend: "up" | "down") => {
  const data = [];
  
  // If baseValue is 0, show a flat line at low value
  if (baseValue === 0) {
    for (let i = 0; i < 15; i++) {
      data.push({ 
        index: i,
        value: 0.5 + Math.random() * 0.3 // Small random variation
      });
    }
    return data;
  }
  
  // For non-zero values, generate realistic trend
  let currentValue = baseValue * 0.65; // Start at 65% of current value
  
  for (let i = 0; i < 15; i++) {
    const randomChange = (Math.random() - 0.5) * (baseValue * 0.08); // 8% random variation
    const trendChange = trend === "up" ? baseValue * 0.025 : -baseValue * 0.025; // 2.5% trend
    currentValue += randomChange + trendChange;
    
    // Ensure we end near the actual value
    if (i === 14) {
      currentValue = baseValue + (Math.random() - 0.5) * (baseValue * 0.05);
    }
    
    data.push({ 
      index: i,
      value: Math.max(0.5, currentValue) // Minimum value for visibility
    });
  }
  
  return data;
};

type SummaryItem = {
  name: string;
  code: string;
  value: string;
  change: string;
  percentageChange: string;
  changeType: "positive" | "negative";
  data: Array<{ index: number; value: number }>;
};

type StockStats = {
  totalProducts?: number;
};

type QuotationStats = {
  total?: number;
};

type InvoiceStats = {
  totalInvoices?: number;
  total?: number;
};

type SupplierStats = {
  totalSuppliers?: number;
};

type PurchaseOrderStats = {
  totalPurchaseOrders?: number;
};

const sanitizeName = (name: string) => {
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "_")
    .toLowerCase();
};

export function SummaryCards() {
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [stockStatsResponse, quotationStatsResponse, invoiceStatsResponse, supplierStatsResponse, purchaseOrderStatsResponse] = await Promise.all([
        api.getStockStats(),
        api.getQuotationStats(),
        api.getInvoiceStats(),
        api.getSupplierStats(),
        api.getPurchaseOrderStats(),
      ]);

      const stockStats = (stockStatsResponse.success ? stockStatsResponse.stats : undefined) as StockStats | undefined;
      const quotationStats = (quotationStatsResponse.success ? quotationStatsResponse.stats : undefined) as QuotationStats | undefined;
      const invoiceStats = (invoiceStatsResponse.success ? invoiceStatsResponse.stats : undefined) as InvoiceStats | undefined;
      const supplierStats = (supplierStatsResponse.success ? supplierStatsResponse.stats : undefined) as SupplierStats | undefined;
      const purchaseOrderStats = (purchaseOrderStatsResponse.success ? purchaseOrderStatsResponse.stats : undefined) as PurchaseOrderStats | undefined;

      const totalProducts = stockStats?.totalProducts ?? 0;
      const totalSuppliers = supplierStats?.totalSuppliers ?? 0;

      // Fix: Backend returns 'total' not 'totalQuotations'
      const quotationsCount = quotationStats?.total ?? 0;
      const invoicesCount = invoiceStats?.totalInvoices ?? invoiceStats?.total ?? 0;
      const purchaseOrdersCount = purchaseOrderStats?.totalPurchaseOrders ?? 0;
      
      console.log('Dashboard Stats:', {
        products: totalProducts,
        suppliers: totalSuppliers,
        quotations: quotationsCount,
        invoices: invoicesCount,
        purchaseOrders: purchaseOrdersCount,
      });
      
      setSummary([
        {
          name: "Total Products",
          code: "PRD",
          value: totalProducts.toString(),
          change: "—",
          percentageChange: "—",
          changeType: totalProducts > 0 ? "positive" : "positive",
          data: generateData(totalProducts || 1, totalProducts > 0 ? "up" : "up"),
        },
        {
          name: "Total Suppliers",
          code: "SUP",
          value: totalSuppliers.toString(),
          change: "—",
          percentageChange: "—",
          changeType: totalSuppliers > 0 ? "positive" : "positive",
          data: generateData(totalSuppliers || 1, totalSuppliers > 0 ? "up" : "up"),
        },
        {
          name: "Quotations",
          code: "QTE",
          value: quotationsCount.toString(),
          change: "—",
          percentageChange: "—",
          changeType: quotationsCount > 0 ? "positive" : "positive",
          data: generateData(quotationsCount || 1, quotationsCount > 0 ? "up" : "up"),
        },
        {
          name: "Invoices",
          code: "INV",
          value: invoicesCount.toString(),
          change: "—",
          percentageChange: "—",
          changeType: invoicesCount > 0 ? "positive" : "positive",
          data: generateData(invoicesCount || 1, invoicesCount > 0 ? "up" : "up"),
        },
        {
          name: "Purchase Orders",
          code: "PO",
          value: purchaseOrdersCount.toString(),
          change: "—",
          percentageChange: "—",
          changeType: purchaseOrdersCount > 0 ? "positive" : "positive",
          data: generateData(purchaseOrdersCount || 1, purchaseOrdersCount > 0 ? "up" : "up"),
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Set default values on error
      setSummary([
        {
          name: "Total Products",
          code: "PRD",
          value: "0",
          change: "—",
          percentageChange: "—",
          changeType: "positive",
          data: generateData(1, "up"),
        },
        {
          name: "Total Suppliers",
          code: "SUP",
          value: "0",
          change: "—",
          percentageChange: "—",
          changeType: "positive",
          data: generateData(1, "up"),
        },
        {
          name: "Quotations",
          code: "QTE",
          value: "0",
          change: "—",
          percentageChange: "—",
          changeType: "positive",
          data: generateData(1, "up"),
        },
        {
          name: "Invoices",
          code: "INV",
          value: "0",
          change: "—",
          percentageChange: "—",
          changeType: "positive",
          data: generateData(1, "up"),
        },
        {
          name: "Purchase Orders",
          code: "PO",
          value: "0",
          change: "—",
          percentageChange: "—",
          changeType: "positive",
          data: generateData(1, "up"),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5 lg:gap-6">
      {isLoading ? (
        // Loading skeletons
        Array.from({ length: 5 }).map((_, index) => (
          <motion.div
            key={`skeleton-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5,
              delay: index * 0.1,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="w-full"
          >
            <Card className="h-full overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 lg:rounded-2xl">
              <CardContent className="p-3 pb-2.5 sm:p-4 sm:pb-3 lg:p-5 lg:pb-4">
                <div className="animate-pulse">
                  <div className="mb-1.5 sm:mb-2 lg:mb-3">
                    <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-700 sm:h-4 sm:w-24" />
                    <div className="mt-1 h-2 w-12 rounded bg-neutral-200 dark:bg-neutral-700 sm:w-16" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="h-7 w-12 rounded bg-neutral-200 dark:bg-neutral-700 sm:h-8 sm:w-16 lg:h-10 lg:w-20" />
                    <div className="flex flex-col items-end gap-1">
                      <div className="h-2.5 w-8 rounded bg-neutral-200 dark:bg-neutral-700 sm:h-3 sm:w-10" />
                      <div className="h-2 w-10 rounded bg-neutral-200 dark:bg-neutral-700 sm:w-12" />
                    </div>
                  </div>
                  <div className="mt-2 h-8 w-full rounded bg-neutral-200 dark:bg-neutral-700 sm:mt-3 sm:h-10 lg:mt-4 lg:h-14" />
                  <div className="mt-1.5 border-t border-neutral-100 pt-1.5 dark:border-neutral-700 sm:mt-2 sm:pt-2 lg:mt-3 lg:pt-3">
                    <div className="h-2 w-16 rounded bg-neutral-200 dark:bg-neutral-700 sm:w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      ) : (
        summary.map((item, index) => {
        const sanitizedName = sanitizeName(item.name);
        const gradientId = `gradient-${sanitizedName}`;

        const color =
          item.changeType === "positive"
            ? "hsl(142.1 76.2% 36.3%)"
            : "hsl(0 72.2% 50.6%)";

        return (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5,
              delay: index * 0.1,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            whileHover={{ 
              y: -6,
              transition: { 
                duration: 0.2,
                ease: "easeOut"
              }
            }}
            className="w-full"
          >
            <Card className="group h-full overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm transition-all duration-300 hover:border-neutral-300/60 hover:shadow-lg dark:border-neutral-700/60 dark:bg-neutral-800 dark:hover:border-neutral-600/60 lg:rounded-2xl">
              <CardContent className="p-3 pb-2.5 sm:p-4 sm:pb-3 lg:p-5 lg:pb-4">
                {/* Header */}
                <div className="mb-1.5 sm:mb-2 lg:mb-3">
                  <dt className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 sm:text-xs lg:text-sm">
                    {item.name}
                  </dt>
                  <span className="text-[9px] font-medium text-neutral-500 dark:text-neutral-400 sm:text-[10px] lg:text-xs">
                    {item.code}
                  </span>
                </div>

                {/* Value and Change */}
                <div className="flex items-baseline justify-between">
                  <dd
                    className={cn(
                      "text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl",
                      item.changeType === "positive"
                        ? "text-green-600 dark:text-green-500"
                        : "text-red-600 dark:text-red-500"
                    )}
                  >
                    {item.value}
                  </dd>
                  <dd className="flex flex-col items-end">
                    <span className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 sm:text-xs lg:text-sm">
                      {item.change}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-medium sm:text-[10px] lg:text-xs",
                        item.changeType === "positive"
                          ? "text-green-600 dark:text-green-500"
                          : "text-red-600 dark:text-red-500"
                      )}
                    >
                      {item.percentageChange}
                    </span>
                  </dd>
                </div>

                {/* Chart */}
                <div className="mt-2 h-10 w-full sm:mt-3 sm:h-12 lg:mt-4 lg:h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={item.data}
                      margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id={gradientId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={color}
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor={color}
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2.5}
                        fill={`url(#${gradientId})`}
                        fillOpacity={1}
                        className="transition-all duration-300 group-hover:stroke-3"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Vs Last Month */}
                <div className="mt-1.5 border-t border-neutral-100 pt-1.5 dark:border-neutral-700 sm:mt-2 sm:pt-2 lg:mt-3 lg:pt-3">
                  <p className="text-[9px] text-neutral-600 dark:text-neutral-400 sm:text-[10px] lg:text-xs">
                    vs last month
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })
      )}
    </div>
  );
}
