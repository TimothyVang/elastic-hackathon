"use client";

import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Animated placeholder bar for loading states */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-lg bg-surface-overlay",
        className
      )}
      style={style}
    />
  );
}

/** Skeleton replacement for a StatCard */
export function StatCardSkeleton() {
  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

/** Skeleton replacement for a chart panel */
export function ChartSkeleton() {
  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${20 + Math.random() * 80}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Skeleton replacement for a table */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-surface-overlay border-b border-border-subtle px-4 py-3 flex gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-border-subtle">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for the alerts list on the dashboard */
export function AlertListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-surface-raised border border-border-subtle rounded-xl p-5">
      <Skeleton className="h-4 w-48 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg bg-surface-overlay/40"
          >
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
