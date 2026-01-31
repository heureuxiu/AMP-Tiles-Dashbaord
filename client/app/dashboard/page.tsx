export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Overview of your AMP Tiles Admin.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <div className="h-3 w-20 animate-pulse bg-neutral-200 dark:bg-neutral-600" />
            <div className="mt-2 h-5 w-14 animate-pulse bg-neutral-200 dark:bg-neutral-600" />
          </div>
        ))}
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-2">
        <div className="border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="h-64 animate-pulse bg-neutral-200 dark:bg-neutral-600" />
        </div>
        <div className="border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="h-64 animate-pulse bg-neutral-200 dark:bg-neutral-600" />
        </div>
      </div>
    </div>
  );
}
