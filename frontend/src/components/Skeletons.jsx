function SkeletonBlock({ className = "" }) {
  return <span aria-hidden="true" className={`skeleton-block ${className}`} />;
}

export function LocationCardSkeleton() {
  return (
    <article aria-hidden="true" className="surface-card overflow-hidden">
      <SkeletonBlock className="h-36 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-5 w-3/4" />
        <div className="space-y-2">
          <SkeletonBlock className="h-3.5 w-full" />
          <SkeletonBlock className="h-3.5 w-5/6" />
        </div>
        <SkeletonBlock className="mt-1 h-4 w-28" />
      </div>
    </article>
  );
}

export function SearchSuggestionSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-1 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-2">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <SkeletonBlock className="h-9 w-9 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-3.5 w-2/3" />
            <SkeletonBlock className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LocationDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading location details" aria-busy="true" className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <SkeletonBlock className="mb-4 h-4 w-28" />
      <div className="surface-card overflow-hidden md:grid md:grid-cols-2">
        <SkeletonBlock className="h-72 w-full rounded-none md:h-[34rem]" />
        <div className="space-y-5 p-6 sm:p-7">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-9 w-4/5" />
          <div className="space-y-2 pt-2">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-3/4" />
          </div>
          <div className="space-y-4 border-t border-white/10 pt-5">
            <div className="space-y-2"><SkeletonBlock className="h-4 w-28" /><SkeletonBlock className="h-4 w-36" /></div>
            <div className="space-y-2"><SkeletonBlock className="h-4 w-24" /><SkeletonBlock className="h-4 w-48" /></div>
          </div>
          <SkeletonBlock className="h-11 w-36 rounded-xl" />
        </div>
      </div>
      <MapLoadingSkeleton className="mt-7" />
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <article aria-hidden="true" className="surface-card space-y-4 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
        <SkeletonBlock className="h-4 w-20" />
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-3.5 w-full" />
        <SkeletonBlock className="h-3.5 w-5/6" />
      </div>
    </article>
  );
}

export function FavoriteCardSkeleton() {
  return (
    <article aria-hidden="true" className="surface-card flex min-w-0 gap-4 overflow-hidden p-3 sm:p-4">
      <SkeletonBlock className="h-24 w-24 shrink-0 rounded-xl sm:h-28 sm:w-28" />
      <div className="min-w-0 flex-1 space-y-3 py-1">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-5 w-3/4" />
        <SkeletonBlock className="h-3.5 w-full" />
        <SkeletonBlock className="h-9 w-28 rounded-lg" />
      </div>
    </article>
  );
}

export function MapLoadingSkeleton({ className = "" }) {
  return (
    <div role="status" aria-label="Loading campus map" aria-busy="true" className={`map-loading-skeleton map-card relative overflow-hidden rounded-2xl ${className}`}>
      <span aria-hidden="true" className="map-skeleton-road map-skeleton-road-one" />
      <span aria-hidden="true" className="map-skeleton-road map-skeleton-road-two" />
      <span aria-hidden="true" className="map-skeleton-road map-skeleton-road-three" />
      <span aria-hidden="true" className="map-skeleton-pin map-skeleton-pin-one" />
      <span aria-hidden="true" className="map-skeleton-pin map-skeleton-pin-two" />
      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/90 px-3 py-2 text-xs text-[var(--muted)] shadow-lg">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" /> Preparing campus map…
      </div>
    </div>
  );
}

export function AIResponseSkeleton() {
  return (
    <div role="status" aria-label="WayFinder is preparing a response" aria-busy="true" className="flex max-w-[85%] items-start gap-2">
      <span aria-hidden="true" className="mt-1 h-7 w-7 shrink-0 rounded-full bg-[var(--accent)]/15" />
      <div aria-hidden="true" className="surface-card w-full space-y-2 p-3">
        <SkeletonBlock className="h-3.5 w-full" />
        <SkeletonBlock className="h-3.5 w-4/5" />
        <SkeletonBlock className="h-3.5 w-2/3" />
      </div>
    </div>
  );
}

export { SkeletonBlock };
