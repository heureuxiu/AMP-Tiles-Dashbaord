import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StockOverview } from "@/components/dashboard/stock-overview";

export default function DashboardPage() {
  return (
    <div className="w-full space-y-6 p-4 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      {/* Header */}
      <header className="space-y-1.5 sm:space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl lg:text-4xl">
          Dashboard
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 sm:text-base lg:text-lg">
          Welcome back! Here&apos;s what&apos;s happening with your business today.
        </p>
      </header>

      {/* Summary Cards */}
      <section aria-label="Summary statistics" className="w-full">
        <SummaryCards />
      </section>

      {/* Quick Actions */}
      <section aria-label="Quick actions" className="w-full">
        <QuickActions />
      </section>

      {/* Stock Overview */}
      <section aria-label="Stock overview" className="w-full">
        <StockOverview />
      </section>

      {/* Recent Activity */}
      <section aria-label="Recent activity" className="w-full">
        <RecentActivity />
      </section>
    </div>
  );
}
