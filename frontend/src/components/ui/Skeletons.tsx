// Skeleton components for loading states

// ============================================================================
// Base shimmer line
// ============================================================================
function ShimmerLine({ className = '' }: { className?: string }) {
  return <div className={`animate-shimmer rounded ${className}`} />;
}

// ============================================================================
// Loading Spinner
// ============================================================================
export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`min-h-[60vh] flex items-center justify-center ${className}`}>
      <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}

// ============================================================================
// Table Skeleton — rows × cols shimmer grid
// ============================================================================
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3 bg-surface-50 border-b border-surface-200/60">
        {Array.from({ length: cols }).map((_, i) => (
          <ShimmerLine key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-4 border-b border-surface-100 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <ShimmerLine
              key={c}
              className={`h-4 flex-1 ${c === 0 ? 'max-w-[200px]' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Card Skeleton — grid of shimmer cards (e.g. dashboard KPIs)
// ============================================================================
export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-surface-200/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <ShimmerLine className="w-11 h-11 rounded-xl" />
            <ShimmerLine className="w-12 h-4" />
          </div>
          <ShimmerLine className="h-7 w-2/3" />
          <ShimmerLine className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Form Skeleton — simulates a form with label/input pairs
// ============================================================================
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-200/60 p-6 space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <ShimmerLine className="h-3 w-24" />
          <ShimmerLine className="h-11 w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <ShimmerLine className="h-11 w-32 rounded-xl" />
        <ShimmerLine className="h-11 w-24 rounded-xl" />
      </div>
    </div>
  );
}

// ============================================================================
// List Skeleton — vertical list of shimmer items
// ============================================================================
export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-200/60 divide-y divide-surface-100">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <ShimmerLine className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <ShimmerLine className="h-4 w-3/4" />
            <ShimmerLine className="h-3 w-1/2" />
          </div>
          <ShimmerLine className="w-16 h-8 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}
