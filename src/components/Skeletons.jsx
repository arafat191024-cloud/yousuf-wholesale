function Pulse({ className }) {
  return <div className={`animate-pulse rounded-2xl bg-stone-200/80 ${className}`} />
}

export function CategorySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <Pulse className="h-56 w-full rounded-none" />
          <div className="space-y-3 px-5 py-6">
            <Pulse className="mx-auto h-5 w-2/3" />
            <Pulse className="mx-auto h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProductSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
          <Pulse className="mb-4 h-52 w-full" />
          <Pulse className="mb-3 h-4 w-24" />
          <Pulse className="mb-2 h-5 w-3/4" />
          <Pulse className="mb-6 h-3 w-full" />
          <Pulse className="h-11 w-full" />
        </div>
      ))}
    </div>
  )
}
