"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  currentCount: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

type PaginationItem = number | "...";

function getVisiblePages(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  currentCount,
  itemLabel,
  onPageChange,
  disabled = false,
}: PaginationControlsProps) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safePage = Math.min(Math.max(1, page || 1), safeTotalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(start + currentCount - 1, totalItems);
  const visiblePages = getVisiblePages(safePage, safeTotalPages);

  return (
    <div className="flex w-full flex-col gap-3 border-t border-neutral-200/60 p-3 dark:border-neutral-700/60 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 sm:text-sm">
        Showing {start}-{end} of {totalItems} {itemLabel}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safePage - 1)}
          disabled={disabled || safePage <= 1}
          className="h-8 gap-1 px-2 sm:px-3"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </Button>
        {visiblePages.map((item, index) =>
          item === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 min-w-8 items-center justify-center px-1 text-sm font-semibold text-neutral-400"
            >
              ...
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant={item === safePage ? "primary" : "outline"}
              size="sm"
              onClick={() => onPageChange(item)}
              disabled={disabled || item === safePage}
              className={`h-8 min-w-8 px-2 text-xs font-semibold ${
                item === safePage
                  ? "bg-neutral-900 text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-900 dark:hover:bg-white"
                  : ""
              }`}
              aria-current={item === safePage ? "page" : undefined}
            >
              {item}
            </Button>
          )
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safePage + 1)}
          disabled={disabled || safePage >= safeTotalPages}
          className="h-8 gap-1 px-2 sm:px-3"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
