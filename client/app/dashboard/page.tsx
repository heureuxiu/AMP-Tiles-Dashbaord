import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StockOverview } from "@/components/dashboard/stock-overview";

export default function DashboardPage() {
  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      {/* Header */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
          Dashboard
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 sm:text-base">
          Welcome back! Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Quick Actions */}
      <QuickActions />

      {/* Stock Overview */}
      <StockOverview />

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
