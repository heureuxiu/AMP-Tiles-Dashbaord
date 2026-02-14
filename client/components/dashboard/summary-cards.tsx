"use client";

import { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";

// Generate sample data for each stat
const generateData = (baseValue: number, trend: "up" | "down") => {
  const data = [];
  let currentValue = baseValue * 0.7;
  
  for (let i = 0; i < 15; i++) {
    const randomChange = (Math.random() - 0.5) * (baseValue * 0.1);
    const trendChange = trend === "up" ? baseValue * 0.02 : -baseValue * 0.02;
    currentValue += randomChange + trendChange;
    data.push({ 
      index: i,
      value: Math.max(0, currentValue) 
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

const sanitizeName = (name: string) => {
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "_")
    .toLowerCase();
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
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
      const [stockStatsResponse, quotationStatsResponse, invoiceStatsResponse] = await Promise.all([
        api.getStockStats(),
        api.getQuotationStats(),
        api.getInvoiceStats(),
      ]);
      
      const totalProducts = stockStatsResponse.success && stockStatsResponse.stats ? stockStatsResponse.stats.totalProducts : 0;
      const totalStock = stockStatsResponse.success && stockStatsResponse.stats ? stockStatsResponse.stats.totalStock : 0;
      const quotationsCount = quotationStatsResponse.success && quotationStatsResponse.stats ? quotationStatsResponse.stats.totalQuotations || 0 : 0;
      const invoicesCount = invoiceStatsResponse.success && invoiceStatsResponse.stats ? invoiceStatsResponse.stats.totalInvoices || 0 : 0;
      
      setSummary([
        {
          name: "Total Products",
          code: "PRD",
          value: totalProducts.toString(),
          change: "—",
          percentageChange: "—",
          changeType: "positive",
          data: generateData(totalProducts || 1, "up"),
        },
        {
          name: "Stock Quantity",
          code: "STK",
          value: totalStock.toLocaleString(),
          change: "—",
          percentageChange: "—",
          changeType: "positive",
          data: generateData(totalStock || 1, "up"),
        },
        {
          name: "Quotations",
          code: "QTE",
          value: quotationsCount.toString(),
          change: "—",
          percentageChange: "—",
          changeType: "positive",
          data: generateData(quotationsCount || 1, "up"),
        },
        {
          name: "Invoices",
          code: "INV",
          value: invoicesCount.toString(),
          change: "—",
          percentageChange: "—",
          changeType: "positive",
          data: generateData(invoicesCount || 1, "up"),
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
          name: "Stock Quantity",
          code: "STK",
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
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid w-full max-w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      {isLoading ? (
        // Loading skeletons
        Array.from({ length: 4 }).map((_, index) => (
          <motion.div
            key={`skeleton-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5,
              delay: index * 0.1,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="w-full min-w-0"
          >
            <Card className="relative h-full overflow-hidden rounded-lg border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800 sm:rounded-xl lg:rounded-2xl">
              <CardContent className="p-3 pb-2.5 sm:p-4 sm:pb-3 lg:p-5 lg:pb-4">
                <div className="animate-pulse">
                  <div className="mb-1.5 sm:mb-2 lg:mb-3">
                    <div className="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-700 sm:h-4" />
                    <div className="mt-1 h-2 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="h-8 w-16 rounded bg-neutral-200 dark:bg-neutral-700 sm:h-10 lg:h-12" />
                    <div className="flex flex-col items-end gap-1">
                      <div className="h-3 w-10 rounded bg-neutral-200 dark:bg-neutral-700" />
                      <div className="h-2 w-12 rounded bg-neutral-200 dark:bg-neutral-700" />
                    </div>
                  </div>
                  <div className="mt-2 h-10 w-full rounded bg-neutral-200 dark:bg-neutral-700 sm:mt-3 sm:h-12 lg:mt-4 lg:h-16" />
                  <div className="mt-1.5 border-t border-neutral-100 pt-1.5 dark:border-neutral-700 sm:mt-2 sm:pt-2 lg:mt-3 lg:pt-3">
                    <div className="h-2 w-20 rounded bg-neutral-200 dark:bg-neutral-700" />
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
            className="w-full min-w-0"
          >
            <Card className="group relative h-full overflow-hidden rounded-lg border border-neutral-200/60 bg-white shadow-sm transition-all duration-300 hover:border-neutral-300/60 hover:shadow-lg dark:border-neutral-700/60 dark:bg-neutral-800 dark:hover:border-neutral-600/60 sm:rounded-xl lg:rounded-2xl">
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
