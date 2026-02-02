"use client";

import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

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

const summary = [
  {
    name: "Total Products",
    code: "PRD",
    value: "156",
    change: "+18",
    percentageChange: "+13.1%",
    changeType: "positive" as const,
    data: generateData(156, "up"),
  },
  {
    name: "Stock Quantity",
    code: "STK",
    value: "2,847",
    change: "+219",
    percentageChange: "+8.3%",
    changeType: "positive" as const,
    data: generateData(2847, "up"),
  },
  {
    name: "Quotations",
    code: "QTE",
    value: "43",
    change: "+6",
    percentageChange: "+16.2%",
    changeType: "positive" as const,
    data: generateData(43, "up"),
  },
  {
    name: "Invoices",
    code: "INV",
    value: "28",
    change: "-1",
    percentageChange: "-3.4%",
    changeType: "negative" as const,
    data: generateData(28, "down"),
  },
];

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
  return (
    <motion.div 
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {summary.map((item) => {
        const sanitizedName = sanitizeName(item.name);
        const gradientId = `gradient-${sanitizedName}`;

        const color =
          item.changeType === "positive"
            ? "hsl(142.1 76.2% 36.3%)"
            : "hsl(0 72.2% 50.6%)";

        return (
          <motion.div
            key={item.name}
            variants={itemVariants}
            transition={{ 
              duration: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            whileHover={{ 
              y: -6,
              transition: { 
                duration: 0.2,
                ease: "easeOut"
              }
            }}
          >
            <Card className="group relative h-full overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm transition-all duration-300 hover:border-neutral-300/60 hover:shadow-lg dark:border-neutral-700/60 dark:bg-neutral-800 dark:hover:border-neutral-600/60">
              <CardContent className="p-5 pb-4">
                {/* Header */}
                <div className="mb-3">
                  <dt className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {item.name}
                  </dt>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {item.code}
                  </span>
                </div>

                {/* Value and Change */}
                <div className="flex items-baseline justify-between">
                  <dd
                    className={cn(
                      "text-3xl font-bold tracking-tight",
                      item.changeType === "positive"
                        ? "text-green-600 dark:text-green-500"
                        : "text-red-600 dark:text-red-500"
                    )}
                  >
                    {item.value}
                  </dd>
                  <dd className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {item.change}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium",
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
                <div className="mt-4 h-16 w-full">
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
                <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-700">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    vs last month
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
