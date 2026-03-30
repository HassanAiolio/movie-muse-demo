export function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-card border border-border/50 shadow-lg shadow-black/20">
      {/* Poster area */}
      <div className="aspect-[2/3] bg-secondary relative overflow-hidden shimmer" />

      {/* Text area */}
      <div className="p-3 space-y-2.5">
        <div className="h-3.5 bg-secondary rounded-full w-4/5 relative overflow-hidden shimmer" />
        <div className="h-3 bg-secondary rounded-full w-1/2 relative overflow-hidden shimmer" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 w-14 bg-secondary rounded-full relative overflow-hidden shimmer" />
          <div className="h-5 w-16 bg-secondary rounded-full relative overflow-hidden shimmer" />
        </div>
      </div>
    </div>
  );
}
