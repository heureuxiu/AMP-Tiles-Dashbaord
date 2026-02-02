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
    <motion.dl 
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {summary.map((item, index) => {
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
            transition={{ duration: 0.5 }}
            whileHover={{ 
              y: -4,
              transition: { duration: 0.2 }
            }}
          >
            <Card className="p-0 rounded-xl overflow-hidden border border-neutral-200 shadow-sm transition-all hover:shadow-md dark:border-neutral-700">
              <CardContent className="p-4 pb-2">
                <div>
                  <dt className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {item.name}{" "}
                    <span className="font-normal text-neutral-500 dark:text-neutral-400">
                      ({item.code})
                    </span>
                  </dt>
                  <div className="flex items-baseline justify-between mt-2">
                    <dd
                      className={cn(
                        item.changeType === "positive"
                          ? "text-green-600 dark:text-green-500"
                          : "text-red-600 dark:text-red-500",
                        "text-2xl font-semibold"
                      )}
                    >
                      {item.value}
                    </dd>
                    <dd className="flex items-center space-x-1 text-sm">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {item.change}
                      </span>
                      <span
                        className={cn(
                          item.changeType === "positive"
                            ? "text-green-600 dark:text-green-500"
                            : "text-red-600 dark:text-red-500",
                          "font-medium"
                        )}
                      >
                        ({item.percentageChange})
                      </span>
                    </dd>
                  </div>
                </div>

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
                            stopOpacity={0.3}
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
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                        fillOpacity={1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.dl>
  );
}
