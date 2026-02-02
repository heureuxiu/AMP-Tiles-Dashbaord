import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StockOverview } from "@/components/dashboard/stock-overview";

export default function DashboardPage() {
  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <RecentActivity />

      {/* Stock Overview */}
      <StockOverview />
    </div>
  );
}
